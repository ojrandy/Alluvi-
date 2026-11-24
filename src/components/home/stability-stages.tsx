"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import { T } from "@/components/i18n/t";
import { LabReportLink } from "@/components/content/lab-report-link";
// Report links point at the certificate-request placeholder until our own Janoshik links are issued.
import { LAB_LINK_PLACEHOLDER } from "@/lib/lab-links";
import styles from "./stability-stages.module.css";

const STAGES = 2;

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <LabReportLink href={href} className="inline-flex min-h-6 items-center">
      {children}
    </LabReportLink>
  );
}

function Key({ children }: { children: ReactNode }) {
  return <strong className={styles.key}>{children}</strong>;
}

/**
 * Stage cards share one slot. While the section is pinned, scroll progress hands Stage 1 over to
 * Stage 2: each card's offset a = (x - i) clamped to [-1, 1] gives opacity 1-|a| and y = -a·100vh
 * (the live site's sticky-scroll handler, with x = progress / 0.75).
 */
function Stage({ index, x, children }: { index: number; x: MotionValue<number> | null; children: ReactNode }) {
  const offset = useTransform(() => (x ? Math.max(-1, Math.min(1, x.get() - index)) : 0));
  const opacity = useTransform(offset, (a) => 1 - Math.abs(a));
  const y = useTransform(offset, (a) => `${(-a * 100).toFixed(3)}vh`);
  const pointerEvents = useTransform(offset, (a) => (Math.abs(a) < 0.5 ? "auto" : "none"));
  return (
    <motion.div className={styles.item} style={x ? { opacity, y, pointerEvents } : undefined}>
      {children}
    </motion.div>
  );
}

export function StabilityStages() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const x = useTransform(scrollYProgress, (n) => Math.min(1, n / 0.75) * (STAGES - 1));
  const live = reduce ? null : x;

  return (
    <section id="features" className={styles.section} aria-labelledby="stability-title">
      <div ref={ref} className={styles.scroller}>
        <div className={styles.sticky}>
          <div className={styles.container}>
            <div className={styles.grid}>
              <div className={styles.intro}>
                <h2 id="stability-title" className={styles.title}>
                  <T>Alluvi Retatrutide 40mg Long Term Stability Test</T>
                </h2>
                <p className={styles.copy}>
                  <strong className={styles.subtitle}>
                    <T>56 Day Room Temperature, Purity and Degradation Test</T>
                  </strong>
                  <br />
                  <br />
                  <T>
                    Tracking the purity &amp; stability of a 40 mg Retatrutide filled Alluvi pen across a full 56 day hold, with independent Janoshik verification at each checkpoint.
                  </T>
                  <br />
                  <br />
                  <T>For laboratory research and development use only. Not for human or veterinary consumption.</T>
                </p>
              </div>

              <div className={styles.list}>
                <Stage index={0} x={live}>
                  <h3 className={styles.stageNo}>
                    <T>Stage 1</T>
                  </h3>
                  <p className={styles.copy}>
                    <T>
                      Exactly 40 mg Retatrutide 2.4ml filled into an Alluvi pen, held at room temperature for 22 days.
                    </T>
                    <br />
                    <strong className={styles.white}>
                      <T>Sent to Janoshik for independent testing on day 28.</T>
                    </strong>
                    <br />
                    <br />
                    <Key>
                      <T>Purity:</T>
                    </Key> 99.65%
                    <br />
                    <Key>
                      <T>Verified content:</T>
                    </Key> 38.40&nbsp;mg
                    <br />
                    <Key>
                      <T>Measured difference:</T>
                    </Key> 1.6&nbsp;mg / 4% <T>change</T>
                    <br />
                    <br />
                    <Ext href={LAB_LINK_PLACEHOLDER}>
                      <T>View Test Result</T>
                    </Ext>
                  </p>
                </Stage>
                <Stage index={1} x={live}>
                  <h3 className={styles.stageNo}>
                    <T>Stage 2</T>
                  </h3>
                  <p className={styles.copy}>
                    <T>Further 33 day room temperature hold in Janoshik custody.</T>
                    <br />
                    <br />
                    <Key>
                      <T>Result:</T>
                    </Key>
                    <br />
                    <Key>
                      <T>Purity:</T>
                    </Key> 98.32% / 38.37&nbsp;mg Retatrutide
                    <br />
                    <Key>
                      <T>pH:</T>
                    </Key> 7.66
                    <br />
                    <Key>
                      <T>Total change:</T>
                    </Key> 0.03&nbsp;mg / 0.07% <T>change</T>
                    <br />
                    <Key>
                      <T>Purity change:</T>
                    </Key> 1.33%
                    <br />
                    <br />
                    <Key>
                      <T>Total days room temp storage:</T>
                    </Key> 56 <T>days</T>
                    <br />
                    <strong className={styles.white}>40mg&gt;38.37mg&gt;1.63mg/4.07%</strong>
                    <br />
                    <br />
                    <Ext href={LAB_LINK_PLACEHOLDER}>
                      <T>Link to Degradation test</T>
                    </Ext>
                    <br />
                    <Ext href={LAB_LINK_PLACEHOLDER}>
                      <T>Link to pH test</T>
                    </Ext>
                  </p>
                </Stage>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
