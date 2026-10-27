import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./text-link.module.css";

type LinkProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

function join(base: string, extra?: string) {
  return extra ? `${base} ${extra}` : base;
}

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function TextLink({ href, children, className }: LinkProps) {
  const classNameValue = join(styles.text, className);
  if (isExternal(href)) {
    return (
      <a className={classNameValue} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={classNameValue} href={href}>
      {children}
    </Link>
  );
}

export function ArrowLink({ href, children, className }: LinkProps) {
  const classNameValue = join(styles.arrow, className);
  if (isExternal(href)) {
    return (
      <a className={classNameValue} href={href}>
        {children}
      </a>
    );
  }
  return (
    <Link className={classNameValue} href={href}>
      {children}
    </Link>
  );
}

export function ArrowLabel({ children }: { children: ReactNode }) {
  return <span className={styles.arrow}>{children}</span>;
}
