import type { Badge, TimelineStep } from "@/lib/types";
import styles from "./timeline.module.css";

function BadgeMark({ badge }: { badge: Badge }) {
  return <span className={`${styles.badge} ${styles[badge.tone]}`}>{badge.label}</span>;
}

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className={styles.line}>
      {steps.map((step) => (
        <div
          className={step.highlight ? `${styles.step} ${styles.highlight}` : styles.step}
          key={`${step.label}-${step.title}`}
        >
          <div className={styles.time}>{step.label}</div>
          <div className={styles.rail} />
          <div className={styles.body}>
            {step.badges && !step.segments
              ? step.badges.map((badge) => <BadgeMark badge={badge} key={badge.label} />)
              : null}
            {step.title ? <b>{step.title}</b> : null}
            <div className={step.title ? styles.detail : `${styles.detail} ${styles.gap}`}>
              {step.segments
                ? step.segments.map((segment, index) =>
                    segment.badge ? (
                      <BadgeMark badge={segment.badge} key={`${segment.badge.label}-${index}`} />
                    ) : (
                      <span key={`${segment.text}-${index}`}>{segment.text}</span>
                    ),
                  )
                : step.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
