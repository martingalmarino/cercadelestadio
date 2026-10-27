import frame from "@/components/hero-frame.module.css";
import { ArrowLink } from "@/components/ui/text-link";

export default function NotFound() {
  return (
    <main className={`${frame.hero} inverse`}>
      <div className="container">
        <p className="label">404</p>
        <h1 className={frame.venueTitle}>No encontramos esa página.</h1>
        <p className={frame.back}>
          <ArrowLink href="/">Volver al inicio</ArrowLink>
        </p>
      </div>
    </main>
  );
}
