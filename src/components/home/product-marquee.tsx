import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatPriceLabel } from "@/lib/money";
import type { ProductCard } from "@/server/queries/products";
import { T } from "@/components/i18n/t";
import styles from "./product-marquee.module.css";

const COPIES = 3;

/**
 * Infinite product slider (pure CSS, pauses on hover/focus). The track holds three copies for a
 * seamless loop; only the first copy is exposed to keyboard and screen readers.
 */
export function ProductMarquee({ products }: { products: ProductCard[] }) {
  return (
    <section className={styles.section} aria-labelledby="home-products-title">
      <header className={styles.header}>
        <h2 id="home-products-title" className={styles.title}>
          <T>Engineered for</T> <br /> <T>research precision.</T>
        </h2>
      </header>

      <div className={styles.viewport}>
        <ul className={styles.track} role="list">
          {Array.from({ length: COPIES }, (_, copy) =>
            products.map((p) => (
              <li key={`${p.id}-${copy}`} className="contents" aria-hidden={copy > 0 || undefined}>
                <Link
                  href={`/product/${p.slug}`}
                  tabIndex={copy > 0 ? -1 : undefined}
                  className={cn(styles.card, !p.inStock && styles.outOfStock)}
                >
                  <div className={styles.media}>
                    {p.image && (
                      <Image src={p.image.url} alt={p.image.alt} fill sizes="360px" className={styles.image} />
                    )}
                    <span className={styles.watermark} aria-hidden="true">
                      www.alluvihealthcare.co
                    </span>
                  </div>
                  <div className={styles.body}>
                    {/* Loop copies are decorative: a <p> keeps the outline to one heading per product. */}
                    {copy === 0 ? (
                      <h3 className={styles.name}>{p.name}</h3>
                    ) : (
                      <p className={styles.name}>{p.name}</p>
                    )}
                    <p className={styles.price}>{formatPriceLabel(p.pricePence)}</p>
                    {!p.inStock && <span className={styles.stock}>
                        <T>Out of stock</T>
                      </span>}
                  </div>
                </Link>
              </li>
            )),
          )}
        </ul>
      </div>

      <p className={styles.disclaimer}>
        <T>For laboratory research use only. Not for human consumption.</T>
      </p>
    </section>
  );
}
