import type { ReactNode } from "react";
import styles from "./tag.module.css";

export function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "ok";
}) {
  return (
    <span className={tone === "ok" ? `${styles.tag} ${styles.ok}` : styles.tag}>
      {children}
    </span>
  );
}
