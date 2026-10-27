import type { ReactNode } from "react";
import styles from "./row-list.module.css";

export function RowList({
  children,
  label,
}: {
  children: ReactNode;
  label?: string;
}) {
  return (
    <div className={styles.list} role="list" aria-label={label}>
      {children}
    </div>
  );
}
