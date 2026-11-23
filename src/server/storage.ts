import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_MAX_BYTES } from "@/lib/validators/admin-products";

/**
 * Product image storage (D2-4, ADR-017). Everything outside this file talks to `imageStorage`
 * only, so the local-disk driver can be swapped for S3/R2/etc. without touching the admin.
 *
 * Local driver: files go to UPLOADS_DIR (on Namecheap: ~/alluvi-uploads, OUTSIDE the deploy
 * directory, so a deploy never wipes them) and are served by src/app/uploads/[file]/route.ts at
 * /uploads/<file>. Not public/: a standalone build only serves files that existed at build time,
 * and the deploy replaces that folder.
 */

export type StoredImage = { url: string; bytes: number; contentType: string };

export interface ImageStorage {
  /** Validates the bytes (real image, size), stores them and returns the public URL. */
  save(data: Uint8Array, nameHint: string): Promise<StoredImage>;
  /** Removes an image this storage owns. URLs it does not own (e.g. /images/…) are ignored. */
  remove(url: string): Promise<void>;
  /** True when `url` points into this storage (only those may be removed). */
  owns(url: string): boolean;
}

export class InvalidImageError extends Error {}

export const UPLOADS_URL_PREFIX = "/uploads/";

/** Stored file names: `<slug-hint>-<16 hex>.<ext>`. Strict, so a URL can never escape the folder. */
export const UPLOAD_FILE_PATTERN = /^[a-z0-9-]{1,80}-[a-f0-9]{16}\.(png|jpg|webp|avif|gif)$/;

export const UPLOAD_CONTENT_TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
};

/**
 * File type from the bytes, never from the file name or the browser's Content-Type. SVG is
 * deliberately not accepted: it can carry script.
 */
export function sniffImageType(b: Uint8Array): keyof typeof UPLOAD_CONTENT_TYPES | null {
  const ascii = (from: number, to: number) => String.fromCharCode(...b.subarray(from, to));
  if (b.length < 12) return null;
  if (b[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 6) === "GIF87a" || ascii(0, 6) === "GIF89a") return "gif";
  if (ascii(4, 8) === "ftyp" && /^avi[fs]$/.test(ascii(8, 12))) return "avif";
  return null;
}

/** Runtime data, not a build input: every path call here carries turbopackIgnore so the standalone trace stays small. */
export function uploadsDir(): string {
  // Default for local dev: <project>/.uploads (git-ignored). Production sets an absolute path.
  return path.resolve(/*turbopackIgnore: true*/ process.env.UPLOADS_DIR || path.join(/*turbopackIgnore: true*/ process.cwd(), ".uploads"));
}

function hintToBase(nameHint: string): string {
  const base = nameHint
    .replace(/\.[^.]*$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  return base || "image";
}

class LocalDiskStorage implements ImageStorage {
  owns(url: string) {
    return url.startsWith(UPLOADS_URL_PREFIX) && UPLOAD_FILE_PATTERN.test(url.slice(UPLOADS_URL_PREFIX.length));
  }

  async save(data: Uint8Array, nameHint: string): Promise<StoredImage> {
    if (data.byteLength === 0) throw new InvalidImageError("The file is empty.");
    if (data.byteLength > UPLOAD_MAX_BYTES) throw new InvalidImageError("Images must be 5 MB or smaller.");
    const ext = sniffImageType(data);
    if (!ext) throw new InvalidImageError("Upload a PNG, JPG, WebP, AVIF or GIF image.");

    const dir = uploadsDir();
    await mkdir(dir, { recursive: true });
    const file = `${hintToBase(nameHint)}-${randomBytes(8).toString("hex")}.${ext}`;
    // Write to a temp name, then rename: a reader never sees a half-written file.
    const tmp = path.join(/*turbopackIgnore: true*/ dir, `.${file}.tmp`);
    await writeFile(tmp, data, { flag: "wx" });
    await rename(tmp, path.join(/*turbopackIgnore: true*/ dir, file));
    return { url: `${UPLOADS_URL_PREFIX}${file}`, bytes: data.byteLength, contentType: UPLOAD_CONTENT_TYPES[ext] };
  }

  async remove(url: string) {
    if (!this.owns(url)) return;
    try {
      await unlink(path.join(/*turbopackIgnore: true*/ uploadsDir(), url.slice(UPLOADS_URL_PREFIX.length)));
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
    }
  }
}

export const imageStorage: ImageStorage = new LocalDiskStorage();

/**
 * Read a stored upload for the /uploads route. Returns null for anything that is not a valid
 * stored file name (path traversal, dot files, temp files) or does not exist.
 */
export async function readUpload(file: string): Promise<{ data: Buffer; contentType: string; mtime: Date } | null> {
  if (!UPLOAD_FILE_PATTERN.test(file)) return null;
  const full = path.join(/*turbopackIgnore: true*/ uploadsDir(), file);
  try {
    const [data, info] = await Promise.all([readFile(full), stat(full)]);
    const ext = file.slice(file.lastIndexOf(".") + 1);
    return { data, contentType: UPLOAD_CONTENT_TYPES[ext], mtime: info.mtime };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}
