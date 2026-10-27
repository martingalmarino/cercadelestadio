import Link from "next/link";
import { HeaderNav } from "@/components/header-nav";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link className={styles.logo} href="/">
          <span>CDE</span>
          cercadelestadio
        </Link>
        <HeaderNav />
      </div>
    </header>
  );
}
