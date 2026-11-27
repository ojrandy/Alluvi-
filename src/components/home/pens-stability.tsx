"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";
import { T } from "@/components/i18n/t";
import styles from "./pens-stability.module.css";

/** "What Makes Alluvi Pens Better?" — copy verbatim from the live site. Reveals once 20% in view. */
export function PensStability() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className={cn(styles.section, inView && styles.in)} aria-labelledby="pens-title">
      <span className={styles.grid} aria-hidden="true" />
      <span className={styles.glow} aria-hidden="true" />
      <div className={styles.inner}>
        <span className={styles.kicker}>
          <i className={styles.kickerDot} aria-hidden="true" />
          <T>Stability Record — RT·56</T>
        </span>
        <h2 id="pens-title" className={styles.heading}>
          <T>What Makes Alluvi Pens Better?</T>
        </h2>
        <p className={styles.lead}>
          <T>
            Alluvi peptides from Alluvi Labs creates its own solution process designed to keep Alluvi APIs in the right environment from start to finish.
          </T>
        </p>
        <p className={styles.body}>
          <T>
            That means stronger support for purity, target pH, and consistent peptide content, once in an Alluvi pen, under the harshest storage conditions.
          </T>
        </p>
        <p className={styles.statement}>
          <T>While others assume 28 days refrigerated is the limit,</T>{" "}
          <span className={styles.em}>
            <T>Alluvi put it to the test.</T>
          </span>
        </p>
        <div className={styles.record}>
          <div className={styles.recordHead}>
            <span>
              <T>Room-temperature hold</T>
            </span>
            <span>
              <T>Janoshik · Independent</T>
            </span>
          </div>
          <div className={styles.figure}>
            <span className={styles.num}>56</span>
            <span className={styles.numCap}>
              <T>Days held at</T>
              <br />
              <T>room temperature</T>
            </span>
          </div>
          <div className={styles.barWrap} aria-hidden="true">
            <div className={styles.bar}>
              <span className={styles.barFill} />
              <span className={cn(styles.node, styles.nodeStart)} />
              <span className={cn(styles.node, styles.nodeEnd)} />
            </div>
            <div className={styles.barCaps}>
              <span>
                <T>Day 0</T>
              </span>
              <span>
                <T>Day 56</T>
              </span>
            </div>
          </div>
          <p className={styles.recordText}>
            <T>
              A 40 mg Retatrutide Alluvi pen was held at room temperature for 56 days and independently tested through Janoshik.
            </T>
          </p>
          <dl className={styles.readouts}>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>
                <T>Purity</T>
              </dt>
              <dd className={styles.readoutV}>
                <T>Strong</T>
              </dd>
            </div>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>
                <T>Content</T>
              </dt>
              <dd className={styles.readoutV}>
                <T>Stable</T>
              </dd>
            </div>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>pH</dt>
              <dd className={styles.readoutV}>
                <T>Within range</T>
              </dd>
            </div>
          </dl>
        </div>
        <p className={styles.close}>
          <T>{"This is why vials and Temu version peptide brands don't come close. Don't put your research at risk to save some quid."}</T>
        </p>
      </div>
    </section>
  );
}
