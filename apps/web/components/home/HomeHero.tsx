import { SearchBar } from "../SearchBar";

export function HomeHero() {
  return (
    <section className="relative overflow-hidden rounded-card border border-ink-border">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/hero-banner.jpg?v=2')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/40 via-transparent to-ink/20" />

      <div className="relative flex min-h-[420px] items-center px-6 py-12 sm:min-h-[480px] sm:px-10 lg:min-h-[520px] lg:px-14">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-teal-light">
            <span aria-hidden>📍</span>
            Delivery en Santo Domingo
          </p>
          <h1 className="mt-4 font-display text-5xl leading-[0.95] text-paper sm:text-6xl lg:text-7xl">
            Tú pide.
            <br />
            <span className="text-teal-light">Nosotros resolvemos.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-paper/75 sm:text-lg">
            Ron, cerveza, hielo y todo lo que te hace falta para la noche, de las tiendas más
            cercanas — comparado por precio y tiempo.
          </p>
          <div className="mt-8 max-w-lg">
            <SearchBar withButton />
          </div>
        </div>
      </div>
    </section>
  );
}
