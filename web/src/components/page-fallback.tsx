export function PageFallback() {
  return (
    <section className="hero" aria-busy="true">
      <div className="w">
        <p className="crumb">Cargando</p>
        <h1>Un momento.</h1>
      </div>
    </section>
  );
}
