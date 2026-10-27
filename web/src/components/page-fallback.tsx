import frame from "@/components/hero-frame.module.css";

export function PageFallback() {
  return (
    <section className={`${frame.hero} inverse`} aria-busy="true">
      <div className="container">
        <p className="label">Cargando</p>
        <h1 className={frame.venueTitle}>Un momento.</h1>
      </div>
    </section>
  );
}
