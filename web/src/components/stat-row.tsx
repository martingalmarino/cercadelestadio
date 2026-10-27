import type { ReactNode } from "react";
import styles from "./stat-row.module.css";

export type Stat = {
  label: string;
  value: ReactNode;
};

export function StatRow({ items }: { items: Stat[] }) {
  return (
    <div className={styles.stats}>
      {items.map((item) => (
        <div key={item.label}>
          <span className={styles.label}>{item.label}</span>
          <b className={styles.value}>{item.value}</b>
        </div>
      ))}
    </div>
  );
}
