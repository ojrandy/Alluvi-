"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./testing-steps.module.css";

/** Copy verbatim from the live "Quality Assurance Protocol" section. */
const STEPS = [
  {
    number: "01",
    title: "Batch Production",
    description:
      "Research peptides are synthesised under controlled laboratory conditions, with weekly internal documented formulation testing.",
    image: "/images/reta40jn-239742.png",
    alt: "Janoshik certificate of analysis — Alluvi Retatrutide 40mg",
    reportUrl: "https://verify.janoshik.com/tests/239742-ALLUVI_RETATRUTIDE_40MG_KIT_EM6LUXF19LHZ",
  },
  {
    number: "02",
    title: "Third-Party Lab Testing",
    description:
      "Alluvi randomly selects a batch of pens from thousands to be sent to Janoshik, a globally recognised laboratory, for fully independent verification. Janoshik then randomly selects one pen for testing.",
    image: "/images/tirz40jn-239744.png",
    alt: "Janoshik certificate of analysis — Alluvi Tirzepatide",
    reportUrl: "https://verify.janoshik.com/tests/239744-ALLUVI_TIRZEPATIDE_40MG_KIT_S7637Z45SNLZ",
  },
  {
    number: "03",
    title: "Purity & Potency Analysis",
    description: "Analytical testing confirms purity percentage and potency before any batch is approved for release.",
    image: "/images/reta20jn-239743.png",
    alt: "Janoshik certificate of analysis — Alluvi Retatrutide 20mg",
    reportUrl: "https://verify.janoshik.com/tests/239743-ALLUVI_RETATRUTIDE_20MG_KIT_1IUIK66E23KN",
  },
  {
    number: "04",
    title: "Weekly Internal QC",
    description:
      "Weekly internal quality-control testing checks consistency and traceability across all research products.",
    image: "/images/glowjn.png",
    alt: "Janoshik certificate of analysis — Alluvi Glow",
    reportUrl: "https://verify.janoshik.com/tests/163217-ALLUVI_GLOW_70MG_KIT_DCL3AJSE4JQP",
  },
  {
    number: "05",
    title: "Verified & Released",
    description:
      "A certificate of analysis is recorded and released to the public, strictly for research and development use.",
    image: "/images/bpcjn.png",
    alt: "Janoshik certificate of analysis — Alluvi BPC-157 & TB-500",
    reportUrl: "https://verify.janoshik.com/tests/163218-ALLUVI_BPC157_TB500_40MG_KIT_EAI125ZEF8TB",
  },
] as const;

type Step = (typeof STEPS)[number];

const AUTOPLAY_MS = 5500;
const ANALYZE_MS = 2000;
const EASE = [0.22, 1, 0.36, 1] as const;

function ReportLink({ url }: { url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.reportLink}>
      <FileText className="size-4" aria-hidden="true" />
      View Janoshik Analytical Report
    </a>
  );
}

function Brackets() {
  return (
    <>
      <span className={styles.vpGlow} aria-hidden="true" />
      <span className={cn(styles.bracket, styles.tl)} aria-hidden="true" />
      <span className={cn(styles.bracket, styles.tr)} aria-hidden="true" />
      <span className={cn(styles.bracket, styles.bl)} aria-hidden="true" />
      <span className={cn(styles.bracket, styles.br)} aria-hidden="true" />
    </>
  );
}

function Status({ verified }: { verified: boolean }) {
  return (
    <div className={cn(styles.status, verified && styles.statusOk)}>
      {verified ? (
        <>
          <span aria-hidden="true">✓</span> Verified
        </>
      ) : (
        <>
          <span className={styles.pulse} aria-hidden="true" /> Analyzing
        </>
      )}
    </div>
  );
}

function VpBar({ step }: { step: Step }) {
  return (
    <div className={styles.vpBar}>
      <span className={styles.vpId}>Janoshik · Certificate of Analysis</span>
      <span className={styles.vpDoc}>DOC {step.number} / 05</span>
    </div>
  );
}

export function TestingSteps() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [verifiedFor, setVerifiedFor] = useState(-1);
  const [slide, setSlide] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const count = STEPS.length;

  // Autoplay (paused on hover/focus, off under reduced motion).
  useEffect(() => {
    if (reduce || paused) return;
    const t = window.setTimeout(() => setActive((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearTimeout(t);
  }, [active, paused, reduce, count]);

  // "Analyzing" → "Verified" two seconds after each step change.
  useEffect(() => {
    const t = window.setTimeout(() => setVerifiedFor(active), reduce ? 0 : ANALYZE_MS);
    return () => window.clearTimeout(t);
  }, [active, reduce]);

  const go = (delta: number) => setActive((i) => (i + delta + count) % count);
  const step = STEPS[active];
  const progress = count > 1 ? active / (count - 1) : 0;

  const onSliderScroll = () => {
    const el = sliderRef.current;
    if (!el) return;
    setSlide(Math.round(el.scrollLeft / el.clientWidth));
  };

  return (
    <section
      id="integration"
      className={styles.section}
      aria-labelledby="qa-title"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}
    >
      <span className={styles.bgGrid} aria-hidden="true" />
      <span className={styles.bgGlow} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.head}>
          <span className={styles.eyebrow}>
            <i className={styles.eyebrowTick} aria-hidden="true" />
            Quality Assurance Protocol
          </span>
          <h2 id="qa-title" className={styles.heading}>
            Independently verified.
            <br />
            <span className={styles.headingAccent}>Trusted through testing.</span>
          </h2>
        </div>

        {/* desktop / tablet: rail + animated panel + certificate */}
        <div className={styles.grid}>
          <div className={styles.rail} role="group" aria-label="Protocol steps">
            <div className={styles.railTrack} aria-hidden="true">
              <motion.div
                className={styles.railFill}
                initial={false}
                animate={{ scaleY: progress }}
                transition={{ duration: 0.5, ease: EASE }}
              />
            </div>
            {STEPS.map((s, i) => (
              <button
                key={s.number}
                type="button"
                className={cn(styles.node, i === active && styles.nodeActive, i < active && styles.nodeDone)}
                aria-label={`Step ${s.number}: ${s.title}`}
                aria-current={i === active ? "step" : undefined}
                onClick={() => setActive(i)}
              >
                <span aria-hidden="true">{i < active ? "✓" : s.number}</span>
              </button>
            ))}
          </div>

          <div className={styles.panel}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.number}
                className={styles.panelContent}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: reduce ? 0 : 0.42, ease: EASE }}
              >
                <motion.span
                  className={styles.ghostNum}
                  aria-hidden="true"
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
                >
                  {step.number}
                </motion.span>
                <span className={styles.stepIndex}>
                  Step {step.number} <i>/ 05</i>
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
                <ReportLink url={step.reportUrl} />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className={styles.viewport}>
            <VpBar step={step} />
            <div className={styles.vpScreen}>
              {STEPS.map((s, i) => (
                <motion.div
                  key={s.number}
                  className={styles.vpImg}
                  initial={false}
                  animate={{ opacity: i === active ? 1 : 0, scale: i === active ? 1 : 1.05 }}
                  transition={{ duration: reduce ? 0 : 0.6, ease: EASE }}
                  aria-hidden={i !== active}
                >
                  <Image src={s.image} alt={s.alt} fill sizes="(max-width: 1024px) 90vw, 450px" />
                </motion.div>
              ))}
              <Brackets />
              <Status verified={verifiedFor === active} />
            </div>
          </div>
        </div>

        {/* mobile: swipeable certificates */}
        <div ref={sliderRef} className={styles.mslider} role="list" onScroll={onSliderScroll}>
          {STEPS.map((s) => (
            <div key={s.number} className={styles.mslide} role="listitem">
              <div className={styles.viewport}>
                <VpBar step={s} />
                <div className={styles.vpScreen}>
                  <div className={styles.vpImg}>
                    <Image src={s.image} alt={s.alt} fill sizes="90vw" />
                  </div>
                  <Brackets />
                  <Status verified />
                </div>
              </div>
              <div className={styles.mbody}>
                <span className={styles.stepIndex}>
                  Step {s.number} <i>/ 05</i>
                </span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.description}</p>
                <ReportLink url={s.reportUrl} />
              </div>
            </div>
          ))}
        </div>
        <div className={styles.dots} aria-hidden="true">
          {STEPS.map((s, i) => (
            <span key={s.number} className={cn(styles.dot, i === slide && styles.dotActive)} />
          ))}
        </div>
      </div>

      <div className={styles.nav}>
        <button type="button" className={styles.navBtn} onClick={() => go(-1)} aria-label="Previous step">
          <ChevronUp aria-hidden="true" />
        </button>
        <button type="button" className={styles.navBtn} onClick={() => go(1)} aria-label="Next step">
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
