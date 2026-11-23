import type { NextRequest } from "next/server";
import { UPLOAD_MAX_BYTES } from "@/lib/validators/admin-products";
import { verifySession } from "@/server/auth";
import { imageStorage, InvalidImageError } from "@/server/storage";

/**
 * POST /api/admin/uploads (multipart, field "file") → { ok, url }. Admin only.
 *
 * A route handler rather than a Server Action: Server Actions have a 1 MB body limit, and raising
 * it globally would also raise it for the public checkout/login actions. The handler re-checks the
 * full session (proxy.ts is optimistic) and, because route handlers get no built-in CSRF check
 * like Server Actions do, rejects cross-site requests by Origin / Sec-Fetch-Site.
 */
export async function POST(request: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };
  if (!(await verifySession())) {
    return Response.json({ ok: false, error: "Your session has expired. Sign in again." }, { status: 401, headers: noStore });
  }
  if (!isSameOrigin(request)) {
    return Response.json({ ok: false, error: "Cross-site upload refused." }, { status: 403, headers: noStore });
  }

  // Cheap early reject before buffering the body (multipart adds a little overhead to the file).
  const declared = Number(request.headers.get("content-length") ?? "0");
  if (declared > UPLOAD_MAX_BYTES + 64 * 1024) {
    return Response.json({ ok: false, error: "Images must be 5 MB or smaller." }, { status: 413, headers: noStore });
  }

  let file: FormDataEntryValue | null;
  try {
    file = (await request.formData()).get("file");
  } catch {
    return Response.json({ ok: false, error: "Upload a single image file." }, { status: 400, headers: noStore });
  }
  if (!(file instanceof File)) {
    return Response.json({ ok: false, error: "Upload a single image file." }, { status: 400, headers: noStore });
  }
  if (file.size > UPLOAD_MAX_BYTES) {
    return Response.json({ ok: false, error: "Images must be 5 MB or smaller." }, { status: 413, headers: noStore });
  }

  try {
    const stored = await imageStorage.save(new Uint8Array(await file.arrayBuffer()), file.name);
    return Response.json({ ok: true, url: stored.url }, { status: 201, headers: noStore });
  } catch (err) {
    if (err instanceof InvalidImageError) {
      return Response.json({ ok: false, error: err.message }, { status: 415, headers: noStore });
    }
    console.error(`[uploads] save failed: ${(err as NodeJS.ErrnoException).code ?? "UNKNOWN"}`);
    return Response.json({ ok: false, error: "The image couldn't be saved. Please try again." }, { status: 500, headers: noStore });
  }
}

function isSameOrigin(request: NextRequest): boolean {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = request.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    return new URL(origin).host === (request.headers.get("x-forwarded-host") ?? request.headers.get("host"));
  } catch {
    return false;
  }
}
