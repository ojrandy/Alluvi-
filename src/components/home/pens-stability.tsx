"use client";

import { useRef } from "react";
import { useInView } from "motion/react";
import { cn } from "@/lib/utils";
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
          Stability Record — RT·56
        </span>
        <h2 id="pens-title" className={styles.heading}>
          What Makes Alluvi Pens Better?
        </h2>
        <p className={styles.lead}>
          Alluvi peptides from Alluvi Labs creates its own solution process designed to keep Alluvi APIs in the right
          environment from start to finish.
        </p>
        <p className={styles.body}>
          That means stronger support for purity, target pH, and consistent peptide content, once in an Alluvi pen,
          under the harshest storage conditions.
        </p>
        <p className={styles.statement}>
          While others say 28 days in the fridge then throw it away,{" "}
          <span className={styles.em}>Alluvi put it to the test.</span>
        </p>
        <div className={styles.record}>
          <div className={styles.recordHead}>
            <span>Room-temperature hold</span>
            <span>Janoshik · Independent</span>
          </div>
          <div className={styles.figure}>
            <span className={styles.num}>56</span>
            <span className={styles.numCap}>
              Days held at
              <br />
              room temperature
            </span>
          </div>
          <div className={styles.barWrap} aria-hidden="true">
            <div className={styles.bar}>
              <span className={styles.barFill} />
              <span className={cn(styles.node, styles.nodeStart)} />
              <span className={cn(styles.node, styles.nodeEnd)} />
            </div>
            <div className={styles.barCaps}>
              <span>Day 0</span>
              <span>Day 56</span>
            </div>
          </div>
          <p className={styles.recordText}>
            A 40 mg Retatrutide Alluvi pen was held at room temperature for 56 days and independently tested through
            Janoshik.
          </p>
          <dl className={styles.readouts}>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>Purity</dt>
              <dd className={styles.readoutV}>Strong</dd>
            </div>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>Content</dt>
              <dd className={styles.readoutV}>Stable</dd>
            </div>
            <div className={styles.readout}>
              <dt className={styles.readoutK}>pH</dt>
              <dd className={styles.readoutV}>Within range</dd>
            </div>
          </dl>
        </div>
        <p className={styles.close}>
          This is why vials and Temu version peptide brands don&apos;t come close. Don&apos;t put your health at risk to
          save some quid.
        </p>
      </div>
    </section>
  );
}
