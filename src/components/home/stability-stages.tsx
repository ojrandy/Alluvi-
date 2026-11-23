"use client";

import { useRef, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from "motion/react";
import styles from "./stability-stages.module.css";

const STAGES = 2;

function Ext({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center">
      {children}
    </a>
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
                  Alluvi Retatrutide 40mg Long Term Stability Test
                </h2>
                <p className={styles.copy}>
                  <strong className={styles.subtitle}>56 Day Room Temperature, Purity and Degradation Test</strong>
                  <br />
                  <br />
                  Tracking the purity &amp; stability of a 40&nbsp;mg Retatrutide filled Alluvi pen across a full 56 day
                  hold, with independent Janoshik verification at each checkpoint.
                  <br />
                  <br />
                  For laboratory research and development use only. Not for human or veterinary consumption.
                </p>
              </div>

              <div className={styles.list}>
                <Stage index={0} x={live}>
                  <h3 className={styles.stageNo}>Stage 1</h3>
                  <p className={styles.copy}>
                    Exactly 40&nbsp;mg Retatrutide 2.4ml filled into an Alluvi pen, held at room temperature for 22
                    days.
                    <br />
                    <strong className={styles.white}>Sent to Janoshik for independent testing on day 28.</strong>
                    <br />
                    <br />
                    <Key>Purity:</Key> 99.65%
                    <br />
                    <Key>Verified content:</Key> 38.40&nbsp;mg
                    <br />
                    <Key>Measured difference:</Key> 1.6&nbsp;mg / 4% change
                    <br />
                    <br />
                    <Ext href="https://verify.janoshik.com/tests/239742-ALLUVI_RETATRUTIDE_40MG_KIT_EM6LUXF19LHZ">
                      View Test Result
                    </Ext>
                  </p>
                </Stage>
                <Stage index={1} x={live}>
                  <h3 className={styles.stageNo}>Stage 2</h3>
                  <p className={styles.copy}>
                    Further 33 day room temperature hold in Janoshik custody.
                    <br />
                    <br />
                    <Key>Result:</Key>
                    <br />
                    <Key>Purity:</Key> 98.32% / 38.37&nbsp;mg Retatrutide
                    <br />
                    <Key>pH:</Key> 7.66
                    <br />
                    <Key>Total change:</Key> 0.03&nbsp;mg / 0.07% change
                    <br />
                    <Key>Purity change:</Key> 1.33%
                    <br />
                    <br />
                    <Key>Total days room temp storage:</Key> 56 days
                    <br />
                    <strong className={styles.white}>40mg&gt;38.37mg&gt;1.63mg/4.07%</strong>
                    <br />
                    <br />
                    <Ext href="https://verify.janoshik.com/tests/165632_3JXHCZ6NJHGX">Link to Degradation test</Ext>
                    <br />
                    <Ext href="https://verify.janoshik.com/tests/165637_1XWECMUZPLPE">Link to pH test</Ext>
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
