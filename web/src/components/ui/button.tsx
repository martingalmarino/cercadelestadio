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

type ButtonLinkProps = VisualProps & {
  href: string;
  sponsored?: boolean;
};

export function ButtonLink({
  variant = "primary",
  size = "md",
  className,
  children,
  href,
  sponsored = false,
}: ButtonLinkProps) {
  const classNameValue = classNames(variant, size, className);

  if (sponsored || href.startsWith("http://") || href.startsWith("https://")) {
    return (
      <a
        className={classNameValue}
        href={href}
        rel={sponsored ? "sponsored nofollow" : undefined}
        target={sponsored ? "_blank" : undefined}
      >
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
