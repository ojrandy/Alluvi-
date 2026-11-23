import { readUpload } from "@/server/storage";

/**
 * GET /uploads/<file>: serves product images uploaded in the admin from UPLOADS_DIR (see
 * src/server/storage.ts). File names are random and never reused, so responses are immutable.
 * next/image optimises these like any other local path.
 */
export async function GET(_request: Request, { params }: RouteContext<"/uploads/[file]">) {
  const { file } = await params;
  const found = await readUpload(file);
  if (!found) return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  return new Response(new Uint8Array(found.data), {
    headers: {
      "Content-Type": found.contentType,
      "Content-Length": String(found.data.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": found.mtime.toUTCString(),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
    },
  });
}
