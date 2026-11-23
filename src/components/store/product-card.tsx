import Image from "next/image";
import Link from "next/link";
import { formatPriceLabel } from "@/lib/money";
import { cn } from "@/lib/utils";
import type { ProductCard as ProductCardData } from "@/server/queries/products";
import { AddToCartButton } from "./add-to-cart";

type Props = {
  product: ProductCardData;
  priority?: boolean;
  headingLevel?: "h2" | "h3";
  /** Small label above the name (live related-products tiles show "Compound"). */
  eyebrow?: string;
};

/**
 * Shop/related card, modelled on the live shop tile (image, "NEW ARRIVAL" pill, centred name,
 * "£ 120 GBP"). The whole card is one link via a stretched ::after; the cart button sits above it.
 */
export function ProductCard({ product: p, priority = false, headingLevel: H = "h3", eyebrow }: Props) {
  const href = `/product/${p.slug}`;
  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-white/15 hover:shadow-lift focus-within:border-white/15",
        !p.inStock && "opacity-90",
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-surface-raised">
        {p.image && (
          <Image
            src={p.image.url}
            alt={p.image.alt}
            fill
            priority={priority}
            sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transition-none"
          />
        )}
        <div className="absolute top-3 left-3 flex gap-2">
          {p.badge && (
            <span className="rounded-full bg-brand px-2.5 py-1 text-[0.65rem] font-extrabold tracking-wider text-brand-foreground uppercase">
              {p.badge}
            </span>
          )}
          {!p.inStock && (
            <span className="rounded-full bg-black/70 px-2.5 py-1 text-[0.65rem] font-bold tracking-wider text-foreground uppercase backdrop-blur">
              Out of stock
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-2 px-5 pt-5 pb-5 text-center">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <H className="text-lg leading-snug font-semibold tracking-tight text-balance">
          <Link href={href} className="outline-none after:absolute after:inset-0 after:rounded-3xl after:content-[''] focus-visible:after:outline-2 focus-visible:after:outline-ring">
            {p.name}
          </Link>
        </H>
        <p className="flex items-baseline gap-2 text-base font-medium">
          {p.compareAtPence && p.compareAtPence > p.pricePence && (
            <s className="text-sm text-muted-foreground">
              <span className="sr-only">Was </span>
              {formatPriceLabel(p.compareAtPence)}
            </s>
          )}
          <span>
            {p.compareAtPence && p.compareAtPence > p.pricePence && <span className="sr-only">Now </span>}
            {formatPriceLabel(p.pricePence)}
          </span>
        </p>
        <div className="relative z-10 mt-auto w-full pt-3">
          <AddToCartButton
            product={{
              productId: p.id,
              slug: p.slug,
              name: p.name,
              image: p.image?.url ?? null,
              pricePence: p.pricePence,
              stock: p.stock,
            }}
          />
        </div>
      </div>
    </article>
  );
}
