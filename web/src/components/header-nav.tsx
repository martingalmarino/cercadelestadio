"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const [openPath, setOpenPath] = useState(pathname);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  if (pathname !== openPath) {
    setOpenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const y = window.scrollY;
    const { body } = document;
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const button = buttonRef.current;
      const panel = panelRef.current;
      if (!button || !panel) return;
      const items = [button, ...panel.querySelectorAll<HTMLAnchorElement>("a")];
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;
      const inside = active === button || panel.contains(active);
      if (event.shiftKey && (active === first || !inside)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !inside)) {
        event.preventDefault();
        first.focus();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node) || root.contains(event.target)) return;
      setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      body.style.position = "";
      body.style.top = "";
      body.style.left = "";
      body.style.right = "";
      body.style.width = "";
      window.scrollTo(0, y);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const onChange = () => {
      if (!query.matches) setOpen(false);
    };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return (
    <div className={styles.root} ref={rootRef}>
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
        ref={buttonRef}
        type="button"
        className={styles.menu}
        aria-expanded={open}
        aria-controls="menu-movil"
        onClick={() => setOpen((value) => !value)}
      >
        Menú
      </button>
      {open ? (
        <ul id="menu-movil" className={styles.panel} ref={panelRef}>
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
    </div>
  );
}
