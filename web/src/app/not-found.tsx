import Link from "next/link";

export default function NotFound() {
  return (
    <main className="hero">
      <div className="w">
        <p className="crumb">404</p>
        <h1>No encontramos esa página.</h1>
        <p className="sub">
          <Link href="/">Volver al inicio</Link>
        </p>
      </div>
    </main>
  );
}
