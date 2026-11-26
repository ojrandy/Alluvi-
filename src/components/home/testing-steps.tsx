"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, ChevronUp, FileText } from "lucide-react";
import { T } from "@/components/i18n/t";
import { useT } from "@/lib/i18n/client";
import { cn } from "@/lib/utils";
import { site } from "@/lib/site";
import { LAB_LINK_PLACEHOLDER, labLink } from "@/lib/lab-links";
import { CERTIFICATES } from "@/lib/certificates";
import styles from "./testing-steps.module.css";

/** A Janoshik certificate issued for alluvihealthcare.co (see lib/certificates). */
type Report = { image: string; alt: string; url: string };
type Step = { number: string; title: string; description: string; report: Report | null };

/**
 * Copy verbatim from the live "Quality Assurance Protocol" section. Each step shows one of our
 * Janoshik certificates; `report: null` falls back to the "certificate pending" card.
 */
const STEPS: Step[] = [
  {
    number: "01",
    title: "Batch Production",
    description:
      "Research peptides are synthesised under controlled laboratory conditions, with weekly internal documented formulation testing.",
    report: CERTIFICATES["retatrutide-40mg"],
  },
  {
    number: "02",
    title: "Third-Party Lab Testing",
    description:
      "Alluvi randomly selects a batch of pens from thousands to be sent to Janoshik, a globally recognised laboratory, for fully independent verification. Janoshik then randomly selects one pen for testing.",
    report: CERTIFICATES["tirzepatide-40mg"],
  },
  {
    number: "03",
    title: "Purity & Potency Analysis",
    description: "Analytical testing confirms purity percentage and potency before any batch is approved for release.",
    report: CERTIFICATES["retatrutide-20mg"],
  },
  {
    number: "04",
    title: "Weekly Internal QC",
    description:
      "Weekly internal quality-control testing checks consistency and traceability across all research products.",
    report: CERTIFICATES["bpc-157-tb-500-40mg"],
  },
  {
    number: "05",
    title: "Verified & Released",
    description:
      "A certificate of analysis is recorded and released to the public, strictly for research and development use.",
    report: CERTIFICATES["glow-70mg"],
  },
];

const AUTOPLAY_MS = 5500;
const ANALYZE_MS = 2000;
const EASE = [0.22, 1, 0.36, 1] as const;

function ReportLink({ report }: { report: Report | null }) {
  if (!report || labLink(report.url) === LAB_LINK_PLACEHOLDER) {
    return (
      <Link href="/contact#certificates" className={styles.reportLink}>
        <FileText className="size-4" aria-hidden="true" />
        <T>Request Certificate of Analysis</T>
      </Link>
    );
  }
  return (
    <a href={report.url} target="_blank" rel="noopener noreferrer" className={styles.reportLink}>
      <FileText className="size-4" aria-hidden="true" />
      <T>View Janoshik Analytical Report</T>
      <span className="sr-only">
        {" "}
        <T>(opens in a new tab)</T>
      </span>
    </a>
  );
}

/** Stand-in for a certificate that the lab has not issued yet. Never shows a report we do not hold. */
function PendingCert({ step }: { step: Step }) {
  return (
    <div className={styles.pending}>
      <span className={styles.pendingIcon} aria-hidden="true">
        <FileText />
      </span>
      <p className={styles.pendingKicker}>
        <T>Certificate of Analysis</T>
      </p>
      <p className={styles.pendingDomain}>{site.canonicalDomain}</p>
      <p className={styles.pendingText}>
        <T>
          Independent Janoshik verification for this batch is in progress. The certificate and its verification link will be published here once issued.
        </T>
      </p>
      <dl className={styles.pendingMeta}>
        <div>
          <dt>
            <T>Document</T>
          </dt>
          <dd>{step.number} / 05</dd>
        </div>
        <div>
          <dt>
            <T>Laboratory</T>
          </dt>
          <dd>Janoshik</dd>
        </div>
      </dl>
      <span className={styles.pendingLines} aria-hidden="true">
        <i />
        <i />
        <i />
        <i />
      </span>
    </div>
  );
}

function ReportView({ step, sizes }: { step: Step; sizes: string }) {
  return step.report ? (
    <Image src={step.report.image} alt={step.report.alt} fill sizes={sizes} />
  ) : (
    <PendingCert step={step} />
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

function Status({ verified, pending }: { verified: boolean; pending: boolean }) {
  if (pending) {
    return (
      <div className={styles.status}>
        <span className={styles.pulse} aria-hidden="true" /> <T>Pending</T>
      </div>
    );
  }
  return (
    <div className={cn(styles.status, verified && styles.statusOk)}>
      {verified ? (
        <>
          <span aria-hidden="true">✓</span> <T>Verified</T>
        </>
      ) : (
        <>
          <span className={styles.pulse} aria-hidden="true" /> <T>Analyzing</T>
        </>
      )}
    </div>
  );
}

function VpBar({ step }: { step: Step }) {
  return (
    <div className={styles.vpBar}>
      <span className={styles.vpId}>{site.canonicalDomain} · <T>Certificate of Analysis</T>
      </span>
      <span className={styles.vpDoc}>DOC {step.number} / 05</span>
    </div>
  );
}

export function TestingSteps() {
  const reduce = useReducedMotion();
  const t = useT();
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
            <T>Quality Assurance Protocol</T>
          </span>
          <h2 id="qa-title" className={styles.heading}>
            <T>Independently verified.</T>
            <br />
            <span className={styles.headingAccent}>
              <T>Trusted through testing.</T>
            </span>
          </h2>
        </div>

        {/* desktop / tablet: rail + animated panel + certificate */}
        <div className={styles.grid}>
          <div className={styles.rail} role="group" aria-label={t("Protocol steps")}>
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
                aria-label={`${t("Step")} ${s.number}: ${t(s.title)}`}
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
                  <T>Step</T> {step.number} <i>/ 05</i>
                </span>
                <h3 className={styles.stepTitle}>
                  <T>{step.title}</T>
                </h3>
                <p className={styles.stepDesc}>
                  <T>{step.description}</T>
                </p>
                <ReportLink report={step.report} />
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
                  <ReportView step={s} sizes="(max-width: 1024px) 90vw, 450px" />
                </motion.div>
              ))}
              <Brackets />
              <Status verified={verifiedFor === active} pending={!step.report} />
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
                    <ReportView step={s} sizes="90vw" />
                  </div>
                  <Brackets />
                  <Status verified pending={!s.report} />
                </div>
              </div>
              <div className={styles.mbody}>
                <span className={styles.stepIndex}>
                  <T>Step</T> {s.number} <i>/ 05</i>
                </span>
                <h3 className={styles.stepTitle}>
                  <T>{s.title}</T>
                </h3>
                <p className={styles.stepDesc}>
                  <T>{s.description}</T>
                </p>
                <ReportLink report={s.report} />
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
        <button type="button" className={styles.navBtn} onClick={() => go(-1)} aria-label={t("Previous step")}>
          <ChevronUp aria-hidden="true" />
        </button>
        <button type="button" className={styles.navBtn} onClick={() => go(1)} aria-label={t("Next step")}>
          <ChevronDown aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}
