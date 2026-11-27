"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { T } from "@/components/i18n/t";
import { useT } from "@/lib/i18n/client";
import styles from "./hero.module.css";

/**
 * Home hero: heading + lede, then the giant "Alluvi | Labs" wordmark that splits apart while a phone
 * in hand scrolls through three app screens.
 *
 * Scroll choreography is the live Webflow interaction "Product Demo - On Desktop" (IX2 a-68):
 * progress runs from the demo's top entering the viewport to its bottom leaving it.
 */
export function HomeHero() {
  const demoRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const t = useT();

  const { scrollYProgress } = useScroll({ target: demoRef, offset: ["start end", "end start"] });
  // IX2 "smoothing: 50": a light spring so the scrub trails the wheel slightly, like the live site.
  const p = useSpring(scrollYProgress, { stiffness: 260, damping: 40, mass: 0.4, restDelta: 0.0005 });

  const leftX = useTransform(p, [0.2, 0.29, 0.65, 1], [0, -150, -120, 0]);
  const rightX = useTransform(p, [0.2, 0.29, 0.65, 1], [0, 150, 120, 0]);
  const wordsOpacity = useTransform(p, [0.65, 0.7, 0.9, 0.95], [1, 0, 0, 1]);
  const lockY = useTransform(p, [0.24, 0.42], ["0%", "-100%"]);
  const scanX = useTransform(p, [0.42, 0.57], ["0%", "-10%"]);
  const dashX = useTransform(p, [0.42, 0.57], ["100%", "0%"]);

  const live = !reduce;

  return (
    <section className={styles.hero} aria-labelledby="home-hero-title">
      <div className={styles.intro}>
        <h1 id="home-hero-title" className={styles.heading}>
          <strong>
            <T>Advancing discovery through</T>{" "}
          </strong>
          <span className={styles.headingAccent}>Alluvi</span> <T>research</T>
        </h1>
        <p className={styles.lede}>
          <T>Alluvi Labs develops and evaluates</T>
          <br />
          <T>premium research peptides</T>
          <br />
          <br />
          <T>All products are produced exclusively</T>
          <br />
          <T>for controlled research and development purposes, guided by science.</T>
          <br />
          <T>Not for human or veterinary consumption.</T>
          <br />
          <br />
          <span className={styles.ctaRow}>
            <Link href="/shop" className={styles.ctaLink}>
              <T>Browse Research Peptides</T>
            </Link>
            <span className={styles.ctaSep} aria-hidden="true">
              |
            </span>
            <Link href="/about" className={styles.ctaLink}>
              <T>Learn About Alluvi</T>
            </Link>
          </span>
        </p>
      </div>

      <div className={styles.stage}>
        <div className={styles.wordsSticky}>
          <motion.p className={styles.words} style={live ? { opacity: wordsOpacity } : undefined}>
            <motion.span className={styles.wordHalf} style={live ? { x: leftX } : undefined}>
              <span className={styles.wordLeft}>Alluvi</span>
            </motion.span>
            <motion.span className={styles.wordHalf} style={live ? { x: rightX } : undefined}>
              <span className={styles.wordRight}> Labs</span>
            </motion.span>
          </motion.p>
        </div>

        <div ref={demoRef} className={styles.demo}>
          <div className={styles.demoSticky}>
            <div className={styles.phoneFrame}>
              <div className={styles.phoneHolder}>
                <Image
                  src="/images/Holding-iPhone_1-p-1600.png"
                  alt={t("Alluvi research app on iPhone")}
                  width={1600}
                  height={2168}
                  sizes="66vh"
                  // Above the fold and the likely desktop LCP element: never lazy (SEO audit D01, M6).
                  preload
                  className={styles.hand}
                />
                <div className={styles.screen}>
                  <motion.div className={styles.screenImg} style={live ? { x: scanX } : undefined}>
                    <Image src="/images/nineninenine.webp" alt="" fill sizes="28vh" className={styles.screenImg} />
                  </motion.div>
                  <motion.div
                    className={`${styles.screenImg} ${styles.screenDash}`}
                    style={live ? { x: dashX } : undefined}
                  >
                    <Image src="/images/threethree.png" alt="" fill sizes="28vh" className={styles.screenImg} />
                  </motion.div>
                  <motion.div className={styles.screenImg} style={live ? { y: lockY } : undefined}>
                    <Image src="/images/oneone.jpg" alt="" fill sizes="28vh" className={styles.screenImg} />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
