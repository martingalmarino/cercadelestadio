"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./header-nav.module.css";

const links = [
  { href: "/#eventos", label: "Eventos" },
  { href: "/#estadios", label: "Estadios" },
  { href: "/#como-funciona", label: "Cómo funciona" },
] as const;

function current(href: string, pathname: string) {
  if (href === "/#eventos") {
    return pathname === "/" || pathname.startsWith("/evento");
  }
  if (href === "/#estadios") return pathname.startsWith("/estadio");
  return false;
}

export function HeaderNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      <nav className={styles.nav} aria-label="Principal">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={current(link.href, pathname) ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        type="button"
        className={styles.menu}
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen((value) => !value)}
      >
        Menú
      </button>
      {open ? (
        <ul id="menu-movil" className={styles.panel}>
          {links.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={current(link.href, pathname) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
