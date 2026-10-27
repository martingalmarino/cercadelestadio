import { affiliateHref } from "@/lib/affiliate";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "ghost";
type Size = "md" | "lg";

type VisualProps = {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
};

function classNames(variant: Variant = "primary", size: Size = "md", extra?: string) {
  return [styles.btn, styles[variant], size === "lg" ? styles.lg : "", extra]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  type = "button",
  ...props
}: VisualProps & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children">) {
  return (
    <button
      type={type}
      className={classNames(variant, size, className)}
      {...props}
    >
      {children}
    </button>
  );
}

type ButtonLinkProps = VisualProps &
  (
    | { href: string; affiliate?: false }
    | { affiliate: true; subId: string; query: string }
  );

export function ButtonLink(props: ButtonLinkProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classNameValue = classNames(variant, size, className);

  if (props.affiliate) {
    return (
      <a
        className={classNameValue}
        href={affiliateHref(props.subId, props.query)}
        rel="sponsored nofollow"
        target="_blank"
      >
        {children}
      </a>
    );
  }

  if (props.href.startsWith("http://") || props.href.startsWith("https://")) {
    return (
      <a className={classNameValue} href={props.href}>
        {children}
      </a>
    );
  }

  return (
    <Link className={classNameValue} href={props.href}>
      {children}
    </Link>
  );
}
