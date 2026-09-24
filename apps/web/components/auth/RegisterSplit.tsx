"use client";

import Link from "next/link";
import { useState } from "react";
import { customerRegisterAction } from "@/app/(customer)/cuenta/actions";

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 19.2c1.4-3.2 4-4.8 7-4.8s5.6 1.6 7 4.8" />
    </svg>
  );
}

function IconMail() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="M4 7l8 6 8-6" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M7 3.8h3.4l1.2 3-2 1.2a12 12 0 0 0 6.4 6.4l1.2-2 3 1.2v3.4A1.8 1.8 0 0 1 18.4 19 14.2 14.2 0 0 1 5 5.6 1.8 1.8 0 0 1 7 3.8Z" />
    </svg>
  );
}

const inputClass =
  "w-full rounded-full border border-ink-border bg-ink-soft py-3 pl-11 pr-4 text-sm text-paper outline-none placeholder:text-paper/35 focus:border-teal";

export function RegisterSplit({ error }: { error?: string }) {
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
              Tus bebidas, snacks y mucho más, en la puerta de tu casa.
            </p>
            <ul className="mt-8 flex flex-wrap gap-5 text-sm text-paper/75">
              <li>🛵 Entrega rápida en minutos</li>
              <li>🏪 Miles de opciones y tiendas</li>
              <li>🛡️ Pagos seguros y confiables</li>
            </ul>
          </div>
          <ul className="flex flex-wrap gap-6 text-sm text-paper/55">
            <li>Cervezas nacionales e importadas</li>
            <li>Snacks y marcas favoritas</li>
            <li>Licores, whisky, ron y más</li>
            <li>Hielo siempre listo</li>
          </ul>
        </div>
      </section>

      <section className="flex min-h-full flex-col overflow-y-auto bg-ink px-6 py-8 sm:px-10">
        <div className="mb-8 flex items-center justify-between gap-3 lg:justify-end">
          <Link href="/" className="font-display text-2xl text-paper lg:hidden">
            De<span className="text-teal">Una</span>
          </Link>
          <p className="text-sm text-paper/55">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-teal-light hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-8">
          <h2 className="font-display text-4xl text-paper">Crea tu cuenta en DeUna</h2>
          <p className="mt-2 text-sm text-paper/55">
            Regístrate y disfruta de una experiencia más rápida, personalizada y con promociones exclusivas.
          </p>

          <form action={customerRegisterAction} className="mt-8 flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="relative block text-sm text-paper/80">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper/35">
                  <IconUser />
                </span>
                <input name="firstName" required placeholder="Nombre" className={inputClass} />
              </label>
              <label className="relative block text-sm text-paper/80">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper/35">
                  <IconUser />
                </span>
                <input name="lastName" required placeholder="Apellidos" className={inputClass} />
              </label>
            </div>

            <label className="relative flex items-center rounded-full border border-ink-border bg-ink-soft focus-within:border-teal">
              <span className="pointer-events-none absolute left-4 text-paper/35">
                <IconPhone />
              </span>
              <span className="ml-11 flex items-center gap-1.5 border-r border-ink-border pr-3 text-sm text-paper/70">
                <span aria-hidden>🇩🇴</span>
                +1
              </span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="Número de teléfono"
                className="w-full rounded-r-full bg-transparent py-3 pl-3 pr-4 text-sm text-paper outline-none placeholder:text-paper/35"
              />
            </label>

            <label className="relative block text-sm text-paper/80">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper/35">
                <IconMail />
              </span>
              <input name="email" type="email" required placeholder="Correo electrónico" className={inputClass} />
            </label>

            <div>
              <label className="relative block text-sm text-paper/80">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-paper/35">
                  <IconLock />
                </span>
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  minLength={6}
                  required
                  placeholder="Contraseña"
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-paper/45 hover:text-paper"
                >
                  {showPassword ? "Ocultar" : "Ver"}
                </button>
              </label>
              <p className="mt-1.5 px-1 text-xs text-paper/40">Mínimo 6 caracteres.</p>
            </div>

            <label className="flex items-start gap-2.5 text-sm leading-snug text-paper/70">
              <input name="acceptedTerms" type="checkbox" required className="mt-0.5 accent-teal" />
              <span>
                Acepto los <span className="font-medium text-paper">Términos y Condiciones</span> y la{" "}
                <span className="font-medium text-paper">Política de Privacidad</span>.
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm leading-snug text-paper/70">
              <input name="marketing" type="checkbox" className="mt-0.5 accent-teal" />
              Quiero recibir promociones, descuentos y novedades de DeUna.
            </label>

            {error === "exists" && <p className="text-sm text-coral">Ese correo ya está registrado.</p>}
            {error === "invalid" && (
              <p className="text-sm text-coral">Completa los datos, acepta los términos y usa 6+ caracteres.</p>
            )}

            <button
              type="submit"
              className="rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-light"
            >
              Crear cuenta
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
        </div>
      </section>
    </div>
  );
}
