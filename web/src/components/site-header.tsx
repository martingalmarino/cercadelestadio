import Link from "next/link";

const links = [
  { href: "/#estadios", label: "Estadios" },
  { href: "/#eventos", label: "Eventos" },
  { href: "/#ciudades", label: "Ciudades" },
  { href: "/#como-funciona", label: "Cómo funciona" },
] as const;

export function SiteHeader() {
  return (
    <header className="top">
      <div className="w">
        <Link className="logo" href="/">
          <span>CDE</span>
          cercadelestadio
        </Link>
        <nav aria-label="Principal">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}