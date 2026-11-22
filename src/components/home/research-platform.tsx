import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import styles from "./research-platform.module.css";

function Pill({ children }: { children: string }) {
  return (
    <span className={styles.pill}>
      <i className={styles.pillDot} aria-hidden="true" />
      {children}
    </span>
  );
}

/** "More than peptides. A Complete Research Platform." — copy verbatim from the live site. */
export function ResearchPlatform() {
  return (
    <section id="sign-up" className={styles.aps} aria-labelledby="platform-title">
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <div className={styles.layout}>
          <header className={styles.head}>
            <span className={styles.eyebrow}>
              <i className={styles.eyebrowDot} aria-hidden="true" />
              More than peptides.
            </span>
            <h2 id="platform-title" className={styles.title}>
              A Complete Research Platform.
            </h2>
            <p className={styles.desc}>
              From research-grade compounds to structured data collection and nutritional analysis – Alluvi provides an
              integrated system designed for controlled research and development programs.
              <br />
              Not for human or veterinary consumption.
            </p>
          </header>

          <article className={cn(styles.card, styles.big)}>
            <div className={styles.caption}>
              <h3 className={styles.cardTitle}>Smart Tracking</h3>
              <p className={styles.cardDesc}>
                Log every research observation with structured data capture built for controlled R&amp;D programs.
              </p>
            </div>
            <div className={styles.visual}>
              <div className={styles.device}>
                <Image
                  src="/images/iphone-frame.webp"
                  alt=""
                  width={800}
                  height={1627}
                  sizes="288px"
                  className={styles.deviceFrame}
                />
                <div className={styles.deviceScreen}>
                  <Image src="/images/threethree.png" alt="Alluvi research dashboard" fill sizes="260px" />
                </div>
              </div>
            </div>
            <Pill>Smart Tracking</Pill>
          </article>

          <article className={cn(styles.card, styles.a, styles.media)}>
            <div className={styles.caption}>
              <h3 className={styles.cardTitle}>Consistency Is Key</h3>
              <p className={styles.cardDesc}>Stay on track with monthly research supply boxes.</p>
            </div>
            <div className={styles.visual}>
              <Image
                src="/images/fivefive.webp"
                alt="Alluvi monthly research supply box"
                width={1140}
                height={514}
                sizes="(max-width: 600px) 80vw, 300px"
                className={styles.mediaImg}
              />
            </div>
            <Pill>Scheduled Supply</Pill>
          </article>

          <article className={cn(styles.card, styles.b, styles.media)}>
            <div className={styles.caption}>
              <h3 className={styles.cardTitle}>Precision Pens</h3>
              <p className={styles.cardDesc}>
                Pre-filled Retatrutide systems – sleek, pre-measured, and designed for evaluation in controlled
                research settings only.
              </p>
            </div>
            <div className={styles.visual}>
              <Image
                src="/images/foutfour.webp"
                alt="Alluvi precision dosing pen"
                width={1080}
                height={277}
                sizes="(max-width: 600px) 80vw, 300px"
                className={styles.mediaImg}
              />
            </div>
            <Pill>Precision Pens</Pill>
          </article>

          <div className={styles.footer}>
            <p className={styles.footerSub}>
              From compound
              <br />
              to data.
            </p>
            <p className={styles.footerDesc}>
              Research-grade compounds, structured data capture, scheduled supply, and precision dosing devices — one
              connected system for controlled R&amp;D programs.
            </p>
            <Link href="/shop" className={styles.cta}>
              Shop research peptides
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path
                  d="M2 8h11M9 3.5 13.5 8 9 12.5"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
        <p className={styles.disclaimer}>
          For laboratory research and development use only — not for human or veterinary consumption.
        </p>
      </div>
    </section>
  );
}
