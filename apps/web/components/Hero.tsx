import Link from "next/link";
import { SearchBar } from "./SearchBar";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-ink-border">
      <div
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-teal/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 h-56 w-56 rounded-full bg-coral/10 blur-3xl"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <p className="text-sm font-medium uppercase tracking-wide text-teal-light">
          Delivery en Santo Domingo
        </p>
        <h1 className="mt-3 max-w-2xl font-display text-4xl leading-tight text-paper sm:text-6xl">
          Tú pide.
          <br />
          Nosotros resolvemos.
        </h1>
        <p className="mt-5 max-w-lg text-lg text-paper/70">
          Ron, cerveza, hielo y todo lo que necesitas para hoy, de las tiendas más cercanas a
          ti — comparado por precio y tiempo de entrega, en minutos.
        </p>

        <div className="mt-8 max-w-xl">
          <SearchBar large />
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/buscar"
            className="rounded-full bg-teal px-6 py-3 font-medium text-paper transition hover:bg-teal-light"
          >
            Pedir ahora
          </Link>
          <Link
            href="/tiendas"
            className="rounded-full border border-ink-border px-6 py-3 font-medium text-paper/90 transition hover:border-teal"
          >
            Explorar tiendas
          </Link>
        </div>
      </div>
    </section>
  );
}
