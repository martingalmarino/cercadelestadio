import type { ReactNode } from "react";
import styles from "./stat-row.module.css";

export type Stat = {
  label: string;
  value: ReactNode;
  tight?: boolean;
};

export function StatRow({ items }: { items: Stat[] }) {
  return (
    <div className={styles.stats} data-count={items.length}>
      {items.map((item) => (
        <div key={item.label}>
          <span className={styles.label}>{item.label}</span>
          <b className={item.tight ? `${styles.value} ${styles.tight}` : styles.value}>
            {item.value}
          </b>
        </div>
      ))}
    </div>
  );
}
