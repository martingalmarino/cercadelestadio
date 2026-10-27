import type { ReactNode } from "react";
import styles from "./section-intro.module.css";

export function Note({ children }: { children: ReactNode }) {
  return <p className={styles.note}>{children}</p>;
}

export function SectionIntro({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={styles.intro}>
      <p>{children}</p>
      {action}
    </div>
  );
}
