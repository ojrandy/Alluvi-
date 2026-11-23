"use client";

import Image from "next/image";
import { useId, useRef, useState, type DragEvent } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, ImagePlus, Link2, Loader2, Star, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { IMAGE_PATH_PATTERN, UPLOAD_ACCEPT, UPLOAD_MAX_BYTES, type ProductFormInput } from "@/lib/validators/admin-products";
import { FieldError, inputClass } from "./fields";

const MAX_IMAGES = 12;

/**
 * Product images: upload (button or drop) to /api/admin/uploads, or paste a path to an image that
 * already lives on this site (/images/… from the recovered catalogue). The first image is the
 * shop-card / social image. Nothing reaches product_images until the product form is saved.
 */
export function ImageManager({ productName }: { productName: string }) {
  const { control, register, formState } = useFormContext<ProductFormInput>();
  const { fields, append, remove, move } = useFieldArray({ control, name: "images" });
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [pasted, setPasted] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const id = useId();
  const errs = formState.errors.images;
  const full = fields.length + uploading >= MAX_IMAGES;

  async function upload(files: File[]) {
    setError(null);
    const room = MAX_IMAGES - fields.length - uploading;
    if (files.length > room) setError(`Only ${MAX_IMAGES} images per product. ${room > 0 ? `Added the first ${room}.` : ""}`);
    const accepted = files.slice(0, Math.max(0, room));
    const problems: string[] = [];
    await Promise.all(
      accepted.map(async (file) => {
        // Quick checks for a friendly message; the server sniffs the bytes and enforces the limit.
        if (!UPLOAD_ACCEPT.split(",").includes(file.type)) return problems.push(`${file.name}: use PNG, JPG, WebP, AVIF or GIF.`);
        if (file.size > UPLOAD_MAX_BYTES) return problems.push(`${file.name}: larger than 5 MB.`);
        setUploading((n) => n + 1);
        try {
          const body = new FormData();
          body.append("file", file);
          const res = await fetch("/api/admin/uploads", { method: "POST", body });
          const json = (await res.json().catch(() => null)) as { ok: boolean; url?: string; error?: string } | null;
          if (!res.ok || !json?.ok || !json.url) problems.push(`${file.name}: ${json?.error ?? "upload failed."}`);
          else append({ url: json.url, alt: productName }, { shouldFocus: false });
        } catch {
          problems.push(`${file.name}: network error, try again.`);
        } finally {
          setUploading((n) => n - 1);
        }
      }),
    );
    if (problems.length) setError(problems.join(" "));
  }

  function addPasted() {
    setError(null);
    let v = pasted.trim();
    // Accept a full link to this site (e.g. copied from the shop) and keep just the path.
    try {
      const u = new URL(v, window.location.origin);
      if (u.origin === window.location.origin || /(^|\.)alluvi\.(store|bz|org)$/.test(u.hostname)) v = u.pathname;
    } catch {
      /* not a URL: validated below */
    }
    if (!IMAGE_PATH_PATTERN.test(v)) {
      setError("Paste a path to an image on this site, e.g. /images/glow.png. To use an image from elsewhere, download it and upload it here.");
      return;
    }
    if (fields.some((f) => f.url === v)) {
      setError("That image is already in the list.");
      return;
    }
    append({ url: v, alt: productName }, { shouldFocus: false });
    setPasted("");
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!full) void upload([...e.dataTransfer.files]);
  };

  return (
    <div className="space-y-4">
      {fields.length > 0 && (
        <ul className="space-y-2">
          {fields.map((f, i) => {
            const altId = `${id}-alt-${i}`;
            const fe = errs?.[i];
            return (
              <li key={f.id} className="flex gap-3 rounded-xl border border-border bg-white/[0.02] p-2.5">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-raised sm:size-20">
                  <Image src={f.url} alt="" fill sizes="80px" className="object-cover" />
                  {i === 0 && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                      <Star className="size-2.5 fill-current" aria-hidden="true" />
                      Main
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-xs text-muted-foreground" title={f.url}>
                    {f.url}
                  </p>
                  <label htmlFor={altId} className="sr-only">
                    Alt text for image {i + 1}
                  </label>
                  <input
                    id={altId}
                    {...register(`images.${i}.alt`)}
                    placeholder="Alt text: what the image shows"
                    maxLength={255}
                    aria-invalid={fe?.alt || fe?.url ? true : undefined}
                    aria-describedby={fe?.alt || fe?.url ? `${altId}-error` : undefined}
                    className={cn(inputClass, "h-9")}
                  />
                  <FieldError id={`${altId}-error`} message={fe?.url?.message ?? fe?.alt?.message} />
                </div>
                <div className="flex shrink-0 flex-col items-center justify-between sm:flex-row sm:items-start sm:gap-0.5">
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={`Move image ${i + 1} up`}>
                    <ArrowUp aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-8 text-muted-foreground"
                    disabled={i === fields.length - 1}
                    onClick={() => move(i, i + 1)}
                    aria-label={`Move image ${i + 1} down`}
                  >
                    <ArrowDown aria-hidden="true" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive" onClick={() => remove(i)} aria-label={`Remove image ${i + 1}`}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!full) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition-colors",
          dragging ? "border-brand bg-brand-soft" : "border-border",
          full && "opacity-50",
        )}
      >
        {uploading > 0 ? <Loader2 className="size-5 animate-spin text-brand" aria-hidden="true" /> : <UploadCloud className="size-5 text-muted-foreground" aria-hidden="true" />}
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {uploading > 0 ? `Uploading ${uploading} ${uploading === 1 ? "image" : "images"}…` : full ? `${MAX_IMAGES} images max.` : "Drop images here, or"}
        </p>
        <input
          ref={fileInput}
          type="file"
          accept={UPLOAD_ACCEPT}
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            e.target.value = "";
            if (files.length) void upload(files);
          }}
        />
        <Button type="button" variant="outline" disabled={full} onClick={() => fileInput.current?.click()} className="h-9">
          <ImagePlus aria-hidden="true" />
          Choose images
        </Button>
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP, AVIF or GIF, up to 5 MB each. The first image is the main one.</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor={`${id}-paste`} className="text-sm font-medium">
          Or use an image already on the site
        </label>
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id={`${id}-paste`}
              value={pasted}
              onChange={(e) => setPasted(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPasted();
                }
              }}
              placeholder="/images/glow.png"
              autoComplete="off"
              spellCheck={false}
              disabled={full}
              className={cn(inputClass, "pl-9")}
            />
          </div>
          <Button type="button" variant="outline" className="h-10 shrink-0 px-4" disabled={!pasted.trim() || full} onClick={addPasted}>
            Add
          </Button>
        </div>
      </div>

      <div aria-live="polite" className="empty:hidden">
        {(error || errs?.message || errs?.root?.message) && <FieldError id={`${id}-error`} message={error ?? errs?.message ?? errs?.root?.message} />}
      </div>
    </div>
  );
}
