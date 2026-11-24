"use client";

import Image from "next/image";
import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Archive, ExternalLink, ImageOff, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
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

const LOW_STOCK = 5;

type Change =
  | { type: "active"; id: string; isActive: boolean }
  | { type: "move"; id: string; direction: "up" | "down" }
  | { type: "remove"; id: string; archive: boolean };

/** The same change the server will make, applied locally so the UI answers in the same frame. */
function applyChange(rows: AdminProductRow[], c: Change): AdminProductRow[] {
  switch (c.type) {
    case "active":
      return rows.map((r) => (r.id === c.id ? { ...r, isActive: c.isActive } : r));
    case "move": {
      const i = rows.findIndex((r) => r.id === c.id);
      const j = c.direction === "up" ? i - 1 : i + 1;
      if (i === -1 || j < 0 || j >= rows.length) return rows;
      const next = [...rows];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    }
    case "remove":
      return c.archive ? rows.map((r) => (r.id === c.id ? { ...r, isActive: false } : r)) : rows.filter((r) => r.id !== c.id);
  }
}

type Result = { ok: true; data: { message: string } } | { ok: false; error: string };

/**
 * /admin/products rows. Table from lg up, stacked cards below. Every mutation is optimistic
 * (useOptimistic): the row changes on click, the Server Action re-checks the admin session and
 * calls refresh(), and the server's rows replace the optimistic ones when the transition settles.
 * A rejected action simply settles back to the server's rows, and the reason is shown as a toast.
 */
export function ProductsList({ rows }: { rows: AdminProductRow[] }) {
  const [view, apply] = useOptimistic(rows, applyChange);
  const [, startTransition] = useTransition();
  const [confirm, setConfirm] = useState<AdminProductRow | null>(null);

  const run = (change: Change, fn: () => Promise<Result>) => {
    startTransition(async () => {
      apply(change);
      try {
        const res = await fn();
        if (res.ok) toast.success(res.data.message);
        else toast.error(res.error);
      } catch {
        toast.error("Couldn't reach the server. Check your connection and try again.");
      }
    });
  };

  const actions = {
    toggle: (p: AdminProductRow) => run({ type: "active", id: p.id, isActive: !p.isActive }, () => setProductActive({ id: p.id, isActive: !p.isActive })),
    move: (p: AdminProductRow, direction: "up" | "down") => run({ type: "move", id: p.id, direction }, () => moveProduct({ id: p.id, direction })),
    remove: (p: AdminProductRow) => run({ type: "remove", id: p.id, archive: p.orderCount > 0 }, () => deleteProduct({ id: p.id })),
  };

  return (
    <>
      {/* lg+: table (the sidebar leaves too little room at md) */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Products, in shop order</caption>
          <thead>
            <tr className="border-b border-border bg-surface text-left text-xs text-muted-foreground">
              <th scope="col" className="w-24 py-2.5 pl-5 font-medium">
                Position
              </th>
              <th scope="col" className="py-2.5 pr-4 font-medium">
                Product
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                Price
              </th>
              <th scope="col" className="py-2.5 pr-4 text-right font-medium">
                Stock
              </th>
              <th scope="col" className="py-2.5 pr-4 font-medium">
                In shop
              </th>
              <th scope="col" className="py-2.5 pr-5 text-right font-medium">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {view.map((p, i) => (
              <tr key={p.id} className={cn("transition-colors hover:bg-surface", !p.isActive && "text-muted-foreground")}>
                <td className="py-3 pl-5">
                  <MoveButtons p={p} first={i === 0} last={i === view.length - 1} onMove={actions.move} />
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
                  <ActiveSwitch p={p} onToggle={actions.toggle} />
                </td>
                <td className="py-3 pr-5">
                  <RowActions p={p} onDelete={() => setConfirm(p)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones: cards */}
      <ul className="divide-y divide-border lg:hidden">
        {view.map((p, i) => (
          <li key={p.id} className="space-y-3 px-4 py-4">
            <ProductCell p={p} />
            <div className="flex items-center justify-between gap-3 text-sm">
              <Price p={p} />
              <Stock stock={p.stock} labelled />
            </div>
            <div className="flex items-center justify-between gap-2">
              <ActiveSwitch p={p} onToggle={actions.toggle} />
              <div className="flex items-center gap-1">
                <MoveButtons p={p} first={i === 0} last={i === view.length - 1} onMove={actions.move} />
                <RowActions p={p} onDelete={() => setConfirm(p)} />
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
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border bg-surface-raised">
        {p.image ? (
          <Image src={p.image.url} alt="" fill sizes="48px" className={cn("object-cover transition-opacity", !p.isActive && "opacity-50")} />
        ) : (
          <ImageOff className="absolute inset-0 m-auto size-4 text-muted-foreground" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0">
        <Link href={`/admin/products/${p.id}`} className="block truncate font-semibold text-foreground hover:text-brand-ink">
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
      <span className="font-semibold text-foreground">{formatGBP(p.pricePence)}</span>
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
  if (stock === 0 || stock <= LOW_STOCK) {
    return (
      <span
        className={cn(
          "inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold tabular-nums",
          stock === 0 ? "bg-destructive/10 text-destructive" : "bg-warning/10 text-warning",
        )}
      >
        {stock === 0 ? "Out of stock" : `${stock} left`}
      </span>
    );
  }
  return (
    <span className="text-sm font-medium text-foreground tabular-nums">
      {stock.toLocaleString("en-GB")}
      {labelled ? " in stock" : ""}
    </span>
  );
}

function ActiveSwitch({ p, onToggle }: { p: AdminProductRow; onToggle: (p: AdminProductRow) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={p.isActive}
      aria-label={`Show “${p.name}” in the shop`}
      onClick={() => onToggle(p)}
      className="group inline-flex items-center gap-2 rounded-full text-xs font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        aria-hidden="true"
        className={cn(
          "relative inline-flex h-[22px] w-10 shrink-0 items-center rounded-full transition-colors duration-150",
          p.isActive ? "bg-brand" : "bg-input",
        )}
      >
        <span
          className={cn(
            "absolute size-[18px] rounded-full bg-card shadow-[0_1px_2px_rgb(16_24_40/0.2)] transition-transform duration-150 motion-reduce:transition-none",
            p.isActive ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </span>
      <span className={cn("w-12 text-left", p.isActive ? "text-foreground" : "text-muted-foreground")}>{p.isActive ? "Visible" : "Hidden"}</span>
    </button>
  );
}

function MoveButtons({
  p,
  first,
  last,
  onMove,
}: {
  p: AdminProductRow;
  first: boolean;
  last: boolean;
  onMove: (p: AdminProductRow, d: "up" | "down") => void;
}) {
  // Moves are queued: Server Actions run one at a time, each swapping with the current neighbour.
  return (
    <div className="flex items-center gap-0.5">
      {(["up", "down"] as const).map((d) => {
        const Icon = d === "up" ? ArrowUp : ArrowDown;
        return (
          <Button
            key={d}
            type="button"
            variant="ghost"
            size="icon"
            disabled={d === "up" ? first : last}
            onClick={() => onMove(p, d)}
            aria-label={`Move “${p.name}” ${d}`}
            className="size-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon aria-hidden="true" />
          </Button>
        );
      })}
    </div>
  );
}

function RowActions({ p, onDelete }: { p: AdminProductRow; onDelete: () => void }) {
  const archiveOnly = p.orderCount > 0;
  const iconBtn =
    "grid size-8 place-items-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex items-center justify-end gap-0.5">
      {p.isActive && (
        <a href={`/product/${p.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`View “${p.name}” in the shop (opens in a new tab)`} className={iconBtn}>
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      )}
      <Link href={`/admin/products/${p.id}`} aria-label={`Edit “${p.name}”`} className={iconBtn}>
        <Pencil className="size-4" aria-hidden="true" />
      </Link>
      {/* An already-archived product with orders has nothing left to do here. */}
      {!(archiveOnly && !p.isActive) && (
        <button type="button" onClick={onDelete} aria-label={archiveOnly ? `Archive “${p.name}”` : `Delete “${p.name}”`} className={cn(iconBtn, "hover:bg-destructive/10 hover:text-destructive")}>
          {archiveOnly ? <Archive className="size-4" aria-hidden="true" /> : <Trash2 className="size-4" aria-hidden="true" />}
        </button>
      )}
    </div>
  );
}
