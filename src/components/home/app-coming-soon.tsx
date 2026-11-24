"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from "motion/react";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";
import { useT } from "@/lib/i18n/client";
import styles from "./app-coming-soon.module.css";

/** IX2 "Fade In & Move On Scroll" (a-12): opacity 0 → 1, y 25px → 0, 1s ease, 0.1s delay. */
const fadeMove: Variants = {
  hidden: { opacity: 0, y: 25 },
  shown: { opacity: 1, y: 0, transition: { duration: 1, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] } },
};

function Phone({ alt }: { alt: string }) {
  return (
    <div className={styles.handHolder}>
      <Image
        src="/images/Iphone-In-Hand_1Iphone In Hand.webp"
        alt=""
        width={848}
        height={1309}
        sizes="(max-width: 479px) 300px, 400px"
        className={styles.hand}
      />
      <div className={styles.appScreen}>
        <div className="relative size-full">
          <Image src="/images/sevenseven.webp" alt={alt} fill sizes="240px" />
        </div>
      </div>
    </div>
  );
}

/**
 * "The Alluvi research and development App is Coming Soon", then a pinned phone where a white
 * "light mode" layer wipes up from the bottom as you scroll (live: dark-and-light-mode switch).
 */
export function AppComingSoon() {
  const pinRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useT();
  const { scrollYProgress } = useScroll({ target: pinRef, offset: ["start start", "end end"] });
  // White covers the full viewport by 85% of the pinned range (IX2 a-29 keyframes 0% → 85%).
  const clipPath = useTransform(scrollYProgress, [0, 0.85], ["inset(100% 0 0 0)", "inset(0% 0 0 0)"]);
  const reveal = reduce ? {} : { initial: "hidden", whileInView: "shown", viewport: { once: true, amount: 0.3 } };

  return (
    <section id="App-coming-soon" className={styles.section} aria-labelledby="app-title">
      <div className={styles.head}>
        <motion.h2 id="app-title" className={styles.title} variants={fadeMove} {...reveal}>
          <T>The Alluvi research and development App is Coming Soon</T>
        </motion.h2>
        <motion.p className={styles.lede} variants={fadeMove} {...reveal}>
          <T>Start your free trial soon and see how easy it is to track, manage, and optimize your time.</T>
        </motion.p>
        <motion.div className={styles.badges} variants={fadeMove} {...reveal}>
          {/* The app is not released yet, so the store badges are not links. */}
          <Image
            src="/images/App-Store-badge.svg"
            alt={t("Download on the App Store (coming soon)")}
            width={242}
            height={69}
            className={styles.badge}
            unoptimized
          />
          <Image
            src="/images/Mobile-App-Store-Badge.svg"
            alt={t("Get it on Google Play (coming soon)")}
            width={242}
            height={69}
            className={styles.badge}
            unoptimized
          />
        </motion.div>
      </div>

      <div ref={pinRef} className={styles.pin}>
        <div className={styles.pinInner}>
          <div className={styles.layer}>
            <Phone alt={t("Alluvi research app home screen, dark mode")} />
          </div>
          <motion.div
            className={cn(styles.layer, styles.light)}
            style={reduce ? undefined : { clipPath }}
            aria-hidden="true"
          >
            <Phone alt="" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
