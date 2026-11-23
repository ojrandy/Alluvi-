"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Archive, ExternalLink, ImageOff, Loader2, Pencil, Trash2 } from "lucide-react";
import { FormAlert } from "@/components/account/form-alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { formatGBP } from "@/lib/money";
import { cn } from "@/lib/utils";
import { deleteProduct, moveProduct, setProductActive } from "@/server/actions/products";
import type { AdminProductRow } from "@/server/queries/admin-products";

type Status = { tone: "success" | "error"; text: string } | null;

const LOW_STOCK = 5;

/**
 * /admin/products rows. Table from md up, stacked cards below (390px). Each mutation goes through a
 * Server Action that re-checks the admin session; the server's answer is announced in one live region.
 */
export function ProductsList({ rows }: { rows: AdminProductRow[] }) {
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState<string | null>(null); // `${id}:${what}`
  const [, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<AdminProductRow | null>(null);

  const run = (key: string, fn: () => Promise<{ ok: true; data: { message: string } } | { ok: false; error: string }>) => {
    setBusy(key);
    startTransition(async () => {
      const res = await fn();
      setStatus(res.ok ? { tone: "success", text: res.data.message } : { tone: "error", text: res.error });
      setBusy(null);
    });
  };

  const actions = {
    toggle: (p: AdminProductRow) => run(`${p.id}:active`, () => setProductActive({ id: p.id, isActive: !p.isActive })),
    move: (p: AdminProductRow, direction: "up" | "down") => run(`${p.id}:${direction}`, () => moveProduct({ id: p.id, direction })),
    remove: (p: AdminProductRow) => run(`${p.id}:delete`, () => deleteProduct({ id: p.id })),
  };

  return (
    <>
      <div aria-live="polite" className="px-4 empty:hidden sm:px-5 [&:not(:empty)]:pt-4">
        {status && (
          <FormAlert tone={status.tone} className="py-2.5">
            {status.text}
          </FormAlert>
        )}
      </div>

      {/* lg+: table (the sidebar leaves too little room at md) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Products, in shop order</caption>
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium text-muted-foreground">
              <th scope="col" className="w-20 py-3 pl-5 font-medium">
                Order
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                Product
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">
                Price
              </th>
              <th scope="col" className="py-3 pr-4 text-right font-medium">
                Stock
              </th>
              <th scope="col" className="py-3 pr-4 font-medium">
                In shop
              </th>
              <th scope="col" className="py-3 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p, i) => (
              <tr key={p.id} className={cn("transition-colors hover:bg-white/[0.02]", !p.isActive && "text-muted-foreground")}>
                <td className="py-3 pl-5">
                  <MoveButtons p={p} first={i === 0} last={i === rows.length - 1} busy={busy} onMove={actions.move} />
                </td>
                <td className="py-3 pr-4">
                  <ProductCell p={p} />
                </td>
                <td className="py-3 pr-4 text-right tabular-nums">
                  <Price p={p} />
                </td>
                <td className="py-3 pr-4 text-right">
                  <Stock stock={p.stock} />
                </td>
                <td className="py-3 pr-4">
                  <ActiveSwitch p={p} busy={busy === `${p.id}:active`} onToggle={actions.toggle} />
                </td>
                <td className="py-3 pr-5">
                  <RowActions p={p} busy={busy === `${p.id}:delete`} onDelete={() => setConfirm(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones: cards */}
      <ul className="divide-y divide-border lg:hidden">
        {rows.map((p, i) => (
          <li key={p.id} className="space-y-3 px-4 py-4">
            <ProductCell p={p} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <Price p={p} />
              <Stock stock={p.stock} labelled />
            </div>
            <div className="flex items-center justify-between gap-2">
              <ActiveSwitch p={p} busy={busy === `${p.id}:active`} onToggle={actions.toggle} />
              <div className="flex items-center gap-1">
                <MoveButtons p={p} first={i === 0} last={i === rows.length - 1} busy={busy} onMove={actions.move} />
                <RowActions p={p} busy={busy === `${p.id}:delete`} onDelete={() => setConfirm(p)} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <AlertDialog open={!!confirm} onOpenChange={(open) => !open && setConfirm(null)}>
        <AlertDialogContent>
          {confirm && (
            <>
              <AlertDialogHeader>
                <AlertDialogTitle>{confirm.orderCount > 0 ? `Archive “${confirm.name}”?` : `Delete “${confirm.name}”?`}</AlertDialogTitle>
                <AlertDialogDescription>
                  {confirm.orderCount > 0
                    ? `It appears in ${confirm.orderCount} ${confirm.orderCount === 1 ? "order" : "orders"}, so it can't be deleted. Archiving hides it from the shop and keeps order history intact. You can make it active again at any time.`
                    : "It has never been ordered, so it will be removed permanently with its images. /product/" + confirm.slug + " will stop working. This can't be undone."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => actions.remove(confirm)}>
                  {confirm.orderCount > 0 ? "Archive product" : "Delete product"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ProductCell({ p }: { p: AdminProductRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="relative size-12 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-raised">
        {p.image ? (
          <Image src={p.image.url} alt="" fill sizes="48px" className={cn("object-cover", !p.isActive && "opacity-50")} />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <Link href={`/admin/products/${p.id}`} className="block truncate font-medium text-foreground hover:text-brand">
          {p.name}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          /{p.slug}
          {p.category && ` · ${p.category}`}
          {!p.isActive && p.orderCount > 0 && " · archived"}
        </p>
      </div>
    </div>
  );
}

function Price({ p }: { p: AdminProductRow }) {
  return (
    <span className="tabular-nums">
      <span className="font-medium text-foreground">{formatGBP(p.pricePence)}</span>
      {p.compareAtPence && (
        <s className="ml-1.5 text-xs text-muted-foreground">
          <span className="sr-only">was </span>
          {formatGBP(p.compareAtPence)}
        </s>
      )}
    </span>
  );
}

function Stock({ stock, labelled }: { stock: number; labelled?: boolean }) {
  const tone = stock === 0 ? "text-destructive" : stock <= LOW_STOCK ? "text-warning" : "text-foreground";
  return (
    <span className={cn("text-sm font-medium tabular-nums", tone)}>
      {stock === 0 ? "Out of stock" : stock <= LOW_STOCK ? `${stock} left` : `${stock.toLocaleString("en-GB")}${labelled ? " in stock" : ""}`}
    </span>
  );
}

function ActiveSwitch({ p, busy, onToggle }: { p: AdminProductRow; busy: boolean; onToggle: (p: AdminProductRow) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={p.isActive}
      aria-label={`Show “${p.name}” in the shop`}
      disabled={busy}
      onClick={() => onToggle(p)}
      className="group inline-flex items-center gap-2 rounded-full text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          p.isActive ? "border-brand bg-brand" : "border-border bg-white/[0.06]",
        )}
      >
        <span
          className={cn(
            "absolute size-3.5 rounded-full transition-transform motion-reduce:transition-none",
            p.isActive ? "translate-x-[18px] bg-brand-foreground" : "translate-x-[2px] bg-muted-foreground",
          )}
        />
      </span>
      <span className={p.isActive ? "text-foreground" : "text-muted-foreground"}>{busy ? "Saving…" : p.isActive ? "Visible" : "Hidden"}</span>
    </button>
  );
}

function MoveButtons({
  p,
  first,
  last,
  busy,
  onMove,
}: {
  p: AdminProductRow;
  first: boolean;
  last: boolean;
  busy: string | null;
  onMove: (p: AdminProductRow, d: "up" | "down") => void;
}) {
  // One reorder at a time: each move renumbers the whole list.
  const anyBusy = !!busy && (busy.endsWith(":up") || busy.endsWith(":down"));
  return (
    <div className="flex items-center gap-0.5">
      {(["up", "down"] as const).map((d) => {
        const Icon = d === "up" ? ArrowUp : ArrowDown;
        const pending = busy === `${p.id}:${d}`;
        return (
          <Button
            key={d}
            type="button"
            variant="ghost"
            size="icon"
            disabled={(d === "up" ? first : last) || anyBusy}
            onClick={() => onMove(p, d)}
            aria-label={`Move “${p.name}” ${d}`}
            className="size-8 text-muted-foreground"
          >
            {pending ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Icon aria-hidden="true" />}
          </Button>
        );
      })}
    </div>
  );
}

function RowActions({ p, busy, onDelete }: { p: AdminProductRow; busy: boolean; onDelete: () => void }) {
  const archiveOnly = p.orderCount > 0;
  return (
    <div className="flex items-center justify-end gap-0.5">
      {p.isActive && (
        <a
          href={`/product/${p.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`View “${p.name}” in the shop (opens in a new tab)`}
          className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
      <Link
        href={`/admin/products/${p.id}`}
        aria-label={`Edit “${p.name}”`}
        className="grid size-8 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Pencil className="size-4" aria-hidden="true" />
      </Link>
      {/* An already-archived product with orders has nothing left to do here. */}
      {!(archiveOnly && !p.isActive) && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={busy}
          onClick={onDelete}
          aria-label={archiveOnly ? `Archive “${p.name}”` : `Delete “${p.name}”`}
          className="size-8 text-muted-foreground hover:text-destructive"
        >
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : archiveOnly ? <Archive aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        </Button>
      )}
    </div>
  );
}
