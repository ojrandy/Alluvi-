"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition, type FormEvent } from "react";
import { Controller, FormProvider, useFieldArray, useForm, useFormContext, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, ExternalLink, Loader2, Plus, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import { Markdown } from "@/components/content/markdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { productFormSchema, slugify, type ProductFormInput, type ProductFormOutput } from "@/lib/validators/admin-products";
import { checkProductSlug, saveProduct } from "@/server/actions/products";
import { describe, Field, FieldError, inputClass, Section, textareaClass } from "./fields";
import { ImageManager } from "./image-manager";

type Picker = { products: { slug: string; name: string; isActive: boolean }[]; categories: string[] };

type Notice =
  | { tone: "success" | "error"; text: string; redirect?: { from: string; to: string } }
  | null;

/**
 * Create/edit form. `loadedStock`, `originalSlug` and `version` (updated_at) come from the server on
 * every render; Server Actions call refresh(), so they are already current when a save resolves.
 */
export function ProductForm({
  productId,
  initial,
  loadedStock,
  originalSlug: savedSlug,
  version,
  picker,
  createdNotice,
}: {
  productId?: string;
  initial: ProductFormInput;
  loadedStock?: number;
  originalSlug?: string;
  version?: number;
  picker: Picker;
  createdNotice?: boolean;
}) {
  const router = useRouter();
  const editing = !!productId;
  const uid = useId();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice>(createdNotice ? { tone: "success", text: "Product created. Keep editing, or go back to the list." } : null);
  const [slugTaken, setSlugTaken] = useState(false);
  const [slugTouched, setSlugTouched] = useState(editing);

  const form = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initial,
    // Validate on submit, then live on every change. Not "onTouched": RHF validates a field array
    // right after append(), so a new empty row would flash an error and shift the layout under the cursor.
    mode: "onSubmit",
    reValidateMode: "onChange",
  });
  const { register, control, handleSubmit, setValue, setError, getValues, reset, formState } = form;
  const { errors, isDirty } = formState;
  const [name, slug, isActive] = useWatch({ control, name: ["name", "slug", "isActive"] });

  // Cache Components keeps the previous route mounted but hidden (<Activity>), so /new would come back
  // still filled in with the product just created. Effect cleanups run when it is hidden: reset then.
  const created = useRef(false);
  useEffect(
    () => () => {
      if (!created.current) return;
      created.current = false;
      reset(initial);
      setNotice(null);
      setSlugTouched(false);
      setSlugTaken(false);
    },
    [initial, reset],
  );

  // The same applies to an edit page revisited later: the hidden form keeps its old values while the
  // product may have changed (e.g. hidden from the list). When the row's version changes and there are
  // no unsaved edits, take the server's values, so a later save can't silently undo that change.
  const appliedVersion = useRef(version);
  useEffect(() => {
    if (version === undefined || appliedVersion.current === version) return;
    appliedVersion.current = version;
    if (!isDirty) reset(initial);
  }, [version, initial, isDirty, reset]);

  // Leaving with unsaved edits asks first (browser dialog on reload / tab close).
  useEffect(() => {
    if (!isDirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => void handleSubmit(onValid, onInvalid)(e);
  const onInvalid = () => setNotice({ tone: "error", text: "Please fix the highlighted fields." });
  function onValid() {
    if (slugTaken) {
      setError("slug", { message: "Another product already uses this slug" }, { shouldFocus: true });
      return;
    }
    setNotice(null);
    const values = getValues();
    startTransition(async () => {
      const res = await saveProduct({ id: productId, loadedStock, values });
      if (!res.ok) {
        setNotice({ tone: "error", text: res.error });
        let focused = false;
        for (const [field, message] of Object.entries(res.fieldErrors ?? {})) {
          setError(field as FieldPath<ProductFormInput>, { message }, { shouldFocus: !focused });
          focused = true;
        }
        return;
      }
      if (!editing) {
        reset(values); // not dirty, so the navigation below doesn't warn
        created.current = true;
        router.push(`/admin/products/${res.data.id}?created=1`);
        return;
      }
      // Re-sync stock with the database (orders may have changed it while the form was open).
      reset({ ...values, slug: res.data.slug, stock: String(res.data.stock) });
      setNotice({ tone: "success", text: res.data.message, redirect: res.data.redirectSuggestion });
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  const slugChanged = editing && savedSlug !== undefined && slug.trim().toLowerCase() !== savedSlug;
  const slugError = errors.slug?.message ?? (slugTaken ? "Another product already uses this slug" : undefined);

  return (
    <FormProvider {...form}>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <div aria-live="polite" className="empty:hidden">
          {notice && (
            <FormAlert tone={notice.tone}>
              <p>{notice.text}</p>
              {notice.redirect && <RedirectSuggestion {...notice.redirect} />}
            </FormAlert>
          )}
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* ---------- main column ---------- */}
          <div className="flex min-w-0 flex-col gap-6">
            <Section title="Basics">
              <Field id={`${uid}-name`} label="Name" error={errors.name?.message}>
                <input
                  {...describe(`${uid}-name`, errors.name?.message)}
                  {...register("name", {
                    onChange: (e) => {
                      if (!slugTouched) {
                        setValue("slug", slugify(e.target.value), { shouldDirty: true });
                        setSlugTaken(false);
                      }
                    },
                  })}
                  maxLength={255}
                  autoComplete="off"
                  placeholder="e.g. GLOW 70mg"
                  className={inputClass}
                />
              </Field>

              <Field
                id={`${uid}-slug`}
                label="URL slug"
                error={slugError}
                hint={
                  <>
                    Shop URL: <span className="text-foreground">/product/{slug || "…"}</span>
                    {!editing && !slugTouched && " · follows the name until you edit it"}
                  </>
                }
              >
                <input
                  {...describe(`${uid}-slug`, slugError, true)}
                  {...register("slug", {
                    onChange: () => {
                      setSlugTouched(true);
                      setSlugTaken(false);
                    },
                    onBlur: async (e) => {
                      const v = String(e.target.value).trim().toLowerCase();
                      if (!v || v === savedSlug) return;
                      const { available } = await checkProductSlug(v, productId);
                      setSlugTaken(!available);
                    },
                  })}
                  maxLength={120}
                  autoComplete="off"
                  spellCheck={false}
                  className={inputClass}
                />
              </Field>
              {slugChanged && (
                <FormAlert tone="info" className="py-2.5">
                  This changes the live URL from <strong className="text-foreground">/product/{savedSlug}</strong>. Links to the old URL will show “not found” until a redirect is added; you
                  will get the redirect line to add after saving.
                </FormAlert>
              )}

              <Field
                id={`${uid}-short`}
                label="Short description"
                optional
                error={errors.shortDescription?.message}
                hint="One or two sentences. Used for search results and link previews."
              >
                <textarea
                  {...describe(`${uid}-short`, errors.shortDescription?.message, true)}
                  {...register("shortDescription")}
                  rows={3}
                  maxLength={500}
                  className={textareaClass}
                />
              </Field>
            </Section>

            <DescriptionSection uid={uid} />

            <Section title="Images" description="Shown in the product gallery, in this order.">
              <ImageManager productName={name || "Product image"} />
            </Section>

            <LabSection uid={uid} />
            <PackageContentsSection uid={uid} />

            <Section title="Compliance text" description="Shown on the product page. Leave empty to use the standard wording.">
              <Field
                id={`${uid}-disclaimer`}
                label="Disclaimer"
                optional
                error={errors.specs?.disclaimer?.message}
                hint="Empty = the standard “For laboratory research use only. Not for human consumption.” notice."
              >
                <textarea {...describe(`${uid}-disclaimer`, errors.specs?.disclaimer?.message, true)} {...register("specs.disclaimer")} rows={3} maxLength={2000} className={textareaClass} />
              </Field>
              <Field id={`${uid}-safety`} label="Safety note" optional error={errors.specs?.safetyNote?.message}>
                <textarea {...describe(`${uid}-safety`, errors.specs?.safetyNote?.message)} {...register("specs.safetyNote")} rows={3} maxLength={2000} className={textareaClass} />
              </Field>
            </Section>
          </div>

          {/* ---------- side column ---------- */}
          <div className="flex flex-col gap-6">
            <Section title="Visibility">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" {...register("isActive")} className="mt-0.5 size-4 shrink-0 accent-[var(--brand)]" />
                <span className="text-sm">
                  <span className="font-medium">Visible in the shop</span>
                  <span className="block text-xs text-muted-foreground">{isActive ? "Listed on /shop and orderable." : "Hidden: not listed and its page shows “not found”."}</span>
                </span>
              </label>
              {editing && isActive && savedSlug && (
                <a href={`/product/${savedSlug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  View in shop <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              )}
            </Section>

            <Section title="Pricing" description="In pounds (GBP). Checkout always uses these prices.">
              <MoneyField id={`${uid}-price`} label="Price" name="price" error={errors.price?.message} />
              <MoneyField
                id={`${uid}-compare`}
                label="Compare-at price"
                name="compareAt"
                optional
                error={errors.compareAt?.message}
                hint="Shown struck through next to the price. Leave empty for none."
              />
            </Section>

            <Section title="Inventory">
              <Field
                id={`${uid}-stock`}
                label="Stock"
                error={errors.stock?.message}
                hint={editing ? "Units available now. Orders placed while you edit are not overwritten unless you change this number." : "Units available. 0 shows “out of stock”."}
              >
                <input
                  {...describe(`${uid}-stock`, errors.stock?.message, true)}
                  {...register("stock")}
                  inputMode="numeric"
                  autoComplete="off"
                  className={cn(inputClass, "tabular-nums")}
                />
              </Field>
            </Section>

            <Section title="Organisation">
              <Field id={`${uid}-category`} label="Category" optional error={errors.category?.message}>
                <input {...describe(`${uid}-category`, errors.category?.message)} {...register("category")} list={`${uid}-categories`} maxLength={100} autoComplete="off" className={inputClass} />
                <datalist id={`${uid}-categories`}>
                  {picker.categories.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field id={`${uid}-badge`} label="Badge" optional error={errors.badge?.message} hint="Small label on the product card, e.g. New arrival.">
                <input {...describe(`${uid}-badge`, errors.badge?.message, true)} {...register("badge")} maxLength={50} autoComplete="off" className={inputClass} />
              </Field>
              <Field
                id={`${uid}-lab`}
                label="Janoshik verification link"
                optional
                error={errors.labReportUrl?.message}
                hint="The main lab-report link on the product page."
              >
                <input
                  {...describe(`${uid}-lab`, errors.labReportUrl?.message, true)}
                  {...register("labReportUrl")}
                  type="url"
                  inputMode="url"
                  placeholder="https://"
                  autoComplete="off"
                  spellCheck={false}
                  className={inputClass}
                />
              </Field>
            </Section>

            <RelatedSection uid={uid} picker={picker} />
          </div>
        </div>

        {/* ---------- sticky action bar ---------- */}
        {/* Sticky inside the content column (not fixed), so it never covers the sidebar. */}
        <div className="sticky bottom-0 z-30 -mx-4 -mb-6 border-t border-border bg-background/90 backdrop-blur-md sm:-mx-6 lg:-mx-8 lg:-mb-8">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <p className="hidden text-xs text-muted-foreground sm:block" aria-live="polite">
              {pending ? "Saving…" : isDirty ? "Unsaved changes" : editing ? "All changes saved" : ""}
            </p>
            <div className="flex w-full items-center justify-end gap-2 sm:w-auto">
              <Link
                href="/admin/products"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-4 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
              >
                {isDirty ? "Cancel" : "Back"}
              </Link>
              <Button type="submit" disabled={pending} className="h-10 flex-1 px-5 sm:flex-none">
                {pending && <Loader2 className="animate-spin" aria-hidden="true" />}
                {pending ? "Saving…" : editing ? "Save changes" : "Create product"}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </FormProvider>
  );
}

// ---------- pieces ----------

function MoneyField({
  id,
  label,
  name,
  optional,
  error,
  hint,
}: {
  id: string;
  label: string;
  name: "price" | "compareAt";
  optional?: boolean;
  error?: string;
  hint?: string;
}) {
  const { register } = useFormContextTyped();
  return (
    <Field id={id} label={label} optional={optional} error={error} hint={hint}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground" aria-hidden="true">
          £
        </span>
        <input {...describe(id, error, !!hint)} {...register(name)} inputMode="decimal" autoComplete="off" placeholder="0.00" className={cn(inputClass, "pl-7 tabular-nums")} />
      </div>
    </Field>
  );
}

function DescriptionSection({ uid }: { uid: string }) {
  const { register, control, formState } = useFormContextTyped();
  const [tab, setTab] = useState<"write" | "preview">("write");
  const description = useWatch({ control, name: "description" }) ?? "";
  const err = formState.errors.description?.message;
  const tabs = [
    { key: "write", label: "Write" },
    { key: "preview", label: "Preview" },
  ] as const;
  return (
    <Section
      title="Description"
      description="Markdown: ## Heading, **bold**, *italic*, - lists, [link](https://…)."
      action={
        <div role="tablist" aria-label="Description editor" className="inline-flex shrink-0 rounded-lg border border-border p-0.5">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${uid}-desc-tab-${t.key}`}
              aria-selected={tab === t.key}
              aria-controls={`${uid}-desc-panel`}
              onClick={() => setTab(t.key)}
              className={cn(
                "h-7 rounded-md px-3 text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                tab === t.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      }
    >
      <div id={`${uid}-desc-panel`} role="tabpanel" aria-labelledby={`${uid}-desc-tab-${tab}`}>
        {/* Kept mounted (hidden) in preview so RHF keeps the registered field. */}
        <div className={tab === "write" ? "space-y-1.5" : "hidden"}>
          <label htmlFor={`${uid}-desc`} className="sr-only">
            Description
          </label>
          <textarea {...describe(`${uid}-desc`, err)} {...register("description")} rows={12} maxLength={20000} className={cn(textareaClass, "min-h-64 font-mono text-[13px]")} />
          <FieldError id={`${uid}-desc-error`} message={err} />
        </div>
        {tab === "preview" && (
          <div className="min-h-64 rounded-lg border border-border bg-white/[0.02] px-4 py-3">
            {description.trim() ? (
              <Markdown source={description} className="text-sm text-muted-foreground" />
            ) : (
              <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </Section>
  );
}

function LabSection({ uid }: { uid: string }) {
  const { register, control, formState } = useFormContextTyped();
  const e = formState.errors.specs;
  const compounds = useFieldArray({ control, name: "specs.compounds" });
  const reports = useFieldArray({ control, name: "specs.labReports" });
  const facts = [
    { key: "batchNumber", label: "Batch number", placeholder: "e.g. AL-2405" },
    { key: "fillVolume", label: "Fill volume", placeholder: "e.g. 3 ml" },
    { key: "purity", label: "Purity", placeholder: "e.g. 99.2%" },
    { key: "dateTested", label: "Date tested", placeholder: "e.g. 14 May 2025" },
  ] as const;

  return (
    <Section title="Lab analysis" description="Shown in the product's lab-analysis panel. Copy values from the Janoshik report; leave empty to hide.">
      <div className="grid gap-4 sm:grid-cols-2">
        {facts.map((f) => (
          <Field key={f.key} id={`${uid}-${f.key}`} label={f.label} optional error={e?.[f.key]?.message}>
            <input {...describe(`${uid}-${f.key}`, e?.[f.key]?.message)} {...register(`specs.${f.key}`)} placeholder={f.placeholder} maxLength={100} autoComplete="off" className={inputClass} />
          </Field>
        ))}
      </div>

      <Rows
        title="Compounds"
        empty="No compounds listed."
        addLabel="Add compound"
        onAdd={() => compounds.append({ compound: "", concentration: "", verifiedContent: "" })}
        error={e?.compounds?.message ?? e?.compounds?.root?.message}
      >
        {compounds.fields.map((f, i) => {
          const re = e?.compounds?.[i];
          return (
            <RowShell key={f.id} onRemove={() => compounds.remove(i)} removeLabel={`Remove compound ${i + 1}`}>
              <div className="grid flex-1 gap-2 sm:grid-cols-3">
                <MiniInput id={`${uid}-cmp-${i}-name`} label="Compound" error={re?.compound?.message} {...register(`specs.compounds.${i}.compound`)} placeholder="Compound" />
                <MiniInput id={`${uid}-cmp-${i}-conc`} label="Concentration" error={re?.concentration?.message} {...register(`specs.compounds.${i}.concentration`)} placeholder="Concentration, e.g. 8.48 mg/ml" />
                <MiniInput id={`${uid}-cmp-${i}-ver`} label="Verified content" error={re?.verifiedContent?.message} {...register(`specs.compounds.${i}.verifiedContent`)} placeholder="Verified, e.g. 22.05 mg" />
              </div>
            </RowShell>
          );
        })}
      </Rows>

      <Rows
        title="Extra lab reports"
        empty="No extra reports."
        addLabel="Add report link"
        onAdd={() => reports.append({ label: "", url: "" })}
        error={e?.labReports?.message ?? e?.labReports?.root?.message}
      >
        {reports.fields.map((f, i) => {
          const re = e?.labReports?.[i];
          return (
            <RowShell key={f.id} onRemove={() => reports.remove(i)} removeLabel={`Remove report ${i + 1}`}>
              <div className="grid flex-1 gap-2 sm:grid-cols-[12rem_1fr]">
                <MiniInput id={`${uid}-rep-${i}-label`} label="Label" error={re?.label?.message} {...register(`specs.labReports.${i}.label`)} placeholder="Label, e.g. Endotoxin test" />
                <MiniInput id={`${uid}-rep-${i}-url`} label="Link" error={re?.url?.message} {...register(`specs.labReports.${i}.url`)} placeholder="https://" type="url" inputMode="url" />
              </div>
            </RowShell>
          );
        })}
      </Rows>
    </Section>
  );
}

function PackageContentsSection({ uid }: { uid: string }) {
  const { register, control, formState } = useFormContextTyped();
  const items = useFieldArray({ control, name: "specs.packageContents" });
  const e = formState.errors.specs?.packageContents;
  return (
    <Section title="Package contents" description="One line per item in the box.">
      <Rows title="Items" hideTitle empty="No items listed." addLabel="Add item" onAdd={() => items.append({ value: "" })} error={e?.message ?? e?.root?.message}>
        {items.fields.map((f, i) => (
          <RowShell key={f.id} onRemove={() => items.remove(i)} removeLabel={`Remove item ${i + 1}`}>
            <MiniInput id={`${uid}-pkg-${i}`} label={`Item ${i + 1}`} error={e?.[i]?.value?.message} {...register(`specs.packageContents.${i}.value`)} placeholder="e.g. 1 × pre-filled research pen" className="flex-1" />
          </RowShell>
        ))}
      </Rows>
    </Section>
  );
}

function RelatedSection({ uid, picker }: { uid: string; picker: Picker }) {
  const { control, formState } = useFormContextTyped();
  const err = formState.errors.specs?.relatedSlugs?.message;
  if (picker.products.length === 0) return null;
  return (
    <Section title="Related products" description="“Continue your research” on the product page. Up to 8.">
      <Controller
        control={control}
        name="specs.relatedSlugs"
        render={({ field }) => (
          <fieldset aria-describedby={err ? `${uid}-related-error` : undefined}>
            <legend className="sr-only">Related products</legend>
            <ul className="max-h-72 space-y-1 overflow-y-auto pr-1">
              {picker.products.map((p) => {
                const checked = field.value.includes(p.slug);
                return (
                  <li key={p.slug}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1.5 text-sm hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => field.onChange(checked ? field.value.filter((s) => s !== p.slug) : [...field.value, p.slug])}
                        onBlur={field.onBlur}
                        className="size-4 shrink-0 accent-[var(--brand)]"
                      />
                      <span className={cn("min-w-0 truncate", !p.isActive && "text-muted-foreground")}>
                        {p.name}
                        {!p.isActive && " (hidden)"}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </fieldset>
        )}
      />
      <FieldError id={`${uid}-related-error`} message={err} />
    </Section>
  );
}

// ---------- row editor building blocks ----------

function Rows({
  title,
  hideTitle,
  empty,
  addLabel,
  onAdd,
  error,
  children,
}: {
  title: string;
  hideTitle?: boolean;
  empty: string;
  addLabel: string;
  onAdd: () => void;
  error?: string;
  children: React.ReactNode[];
}) {
  return (
    <div className="space-y-2">
      {!hideTitle && <h3 className="text-sm font-medium">{title}</h3>}
      {children.length === 0 ? <p className="text-xs text-muted-foreground">{empty}</p> : <ul className="space-y-2">{children}</ul>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="button" variant="ghost" onClick={onAdd} className="h-8 px-2 text-brand hover:text-brand">
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
    </div>
  );
}

function RowShell({ onRemove, removeLabel, children }: { onRemove: () => void; removeLabel: string; children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      {children}
      <Button type="button" variant="ghost" size="icon" onClick={onRemove} aria-label={removeLabel} className="mt-1 size-8 shrink-0 text-muted-foreground hover:text-destructive">
        <Trash2 aria-hidden="true" />
      </Button>
    </li>
  );
}

function MiniInput({ id, label, error, className, ...props }: React.ComponentProps<"input"> & { id: string; label: string; error?: string }) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} autoComplete="off" maxLength={500} className={inputClass} {...props} />
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function RedirectSuggestion({ from, to }: { from: string; to: string }) {
  const line = `{ source: "${from}", destination: "${to}" },`;
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 space-y-1.5">
      <p>
        The URL changed, so <strong>{from}</strong> now shows “not found”. Ask your developer to add this line to the redirects in <code>next.config.ts</code>:
      </p>
      <div className="flex items-center gap-2">
        <code className="min-w-0 flex-1 overflow-x-auto rounded-md bg-black/40 px-2.5 py-1.5 text-xs whitespace-nowrap text-foreground">{line}</code>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="size-8 shrink-0"
          aria-label={copied ? "Copied" : "Copy redirect line"}
          onClick={() => {
            void navigator.clipboard?.writeText(line).then(() => setCopied(true));
          }}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </Button>
      </div>
    </div>
  );
}

/** useFormContext typed for this form's shape. */
function useFormContextTyped() {
  return useFormContext<ProductFormInput>();
}
