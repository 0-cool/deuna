"use client";

import Link from "next/link";
import { useState } from "react";
import { customerLoginAction } from "@/app/(customer)/cuenta/actions";

export function LoginSplit({ error, next }: { error?: string; next: string }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="fixed inset-0 z-40 grid bg-ink lg:grid-cols-2">
      <section className="relative hidden min-h-full overflow-hidden lg:block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/login-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" />
        <div className="relative flex h-full flex-col justify-between px-10 py-10 xl:px-14">
          <Link href="/" className="font-display text-3xl text-paper">
            De<span className="text-teal">Una</span>
          </Link>
          <div className="max-w-xl">
            <h1 className="font-display text-5xl leading-tight text-paper xl:text-6xl">
              Todo lo que necesitas, más cerca de ti
            </h1>
            <p className="mt-4 text-lg text-paper/70">
              Tus tiendas, licores, hielo y snacks favoritos, en la puerta de tu casa.
            </p>
            <ul className="mt-8 flex flex-wrap gap-5 text-sm text-paper/75">
              <li>🛵 Entrega rápida en minutos</li>
              <li>🏪 Miles de opciones</li>
              <li>🛡️ Pagos seguros y confiables</li>
            </ul>
          </div>
          <ul className="flex flex-wrap gap-6 text-sm text-paper/55">
            <li>Tiendas cerca de ti</li>
            <li>Licores, cervezas y hielo</li>
            <li>Todo en un solo lugar</li>
          </ul>
        </div>
      </section>

      <section className="flex min-h-full flex-col overflow-y-auto bg-ink px-6 py-8 sm:px-10">
        <div className="mb-8 flex items-center justify-between gap-3 lg:justify-end">
          <Link href="/" className="font-display text-2xl text-paper lg:hidden">
            De<span className="text-teal">Una</span>
          </Link>
          <p className="text-sm text-paper/55">
            ¿No tienes cuenta?{" "}
            <Link href="/registro" className="font-medium text-teal-light hover:underline">
              Crear cuenta
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <h2 className="font-display text-4xl text-paper">Bienvenido a DeUna</h2>
          <p className="mt-2 text-sm text-paper/55">
            Inicia sesión para continuar y disfrutar de todos nuestros servicios y promociones.
          </p>

          <form action={customerLoginAction} className="mt-8 flex flex-col gap-4">
            <input type="hidden" name="next" value={next} />
            <label className="text-sm text-paper/80">
              Correo electrónico
              <input
                name="email"
                type="email"
                required
                placeholder="tu@correo.com"
                className="mt-1 w-full rounded-full border border-ink-border bg-ink-soft px-4 py-3 text-paper outline-none focus:border-teal"
              />
            </label>
            <label className="text-sm text-paper/80">
              Contraseña
              <span className="relative mt-1 block">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Tu contraseña"
                  className="w-full rounded-full border border-ink-border bg-ink-soft px-4 py-3 pr-12 text-paper outline-none focus:border-teal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-paper/45 hover:text-paper"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </span>
            </label>
            <p className="text-right text-xs text-paper/45">
              ¿Olvidaste tu contraseña? Escribe a{" "}
              <a href="mailto:ayuda@deuna.do" className="text-teal-light hover:underline">
                ayuda@deuna.do
              </a>
            </p>
            {error && <p className="text-sm text-coral">Correo o contraseña incorrectos.</p>}
            <button
              type="submit"
              className="rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-light"
            >
              Iniciar sesión
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs text-paper/35">
            <span className="h-px flex-1 bg-ink-border" />
            o
            <span className="h-px flex-1 bg-ink-border" />
          </div>

          <div className="space-y-2">
            {["Google", "Apple", "Facebook"].map((provider) => (
              <button
                key={provider}
                type="button"
                disabled
                className="w-full rounded-full border border-ink-border bg-ink-soft py-3 text-sm text-paper/40"
              >
                Continuar con {provider} · pronto
              </button>
            ))}
          </div>

          <p className="mt-8 text-xs text-paper/40">
            Tus datos están protegidos. Demo: <code>cliente-demo@deuna.do</code> / <code>deuna123</code>
          </p>
        </div>
      </section>
    </div>
  );
}
