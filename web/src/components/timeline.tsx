import type { TimelineStep } from "@/lib/types";

export function Timeline({ steps }: { steps: TimelineStep[] }) {
  return (
    <div className="line">
      {steps.map((step) => (
        <div className={step.highlight ? "st k" : "st"} key={`${step.label}-${step.title}`}>
          <div className="t">{step.label}</div>
          <div className="rail" />
          <div className="x">
            {step.badges && !step.segments
              ? step.badges.map((badge) => (
                  <span className={`badge ${badge.tone}`} key={badge.label}>
                    {badge.label}
                  </span>
                ))
              : null}
            {step.title ? <b>{step.title}</b> : null}
            <div className={step.title ? "mut" : "mut gap"}>
              {step.segments
                ? step.segments.map((segment, index) =>
                    segment.badge ? (
                      <span
                        className={`badge ${segment.badge.tone}`}
                        key={`${segment.badge.label}-${index}`}
                      >
                        {segment.badge.label}
                      </span>
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
