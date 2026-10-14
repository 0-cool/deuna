"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthModal } from "@/lib/auth-modal";
import {
  customerLoginInPlaceAction,
  customerRegisterInPlaceAction,
} from "@/app/(customer)/cuenta/actions";

const inputClass =
  "mt-1 w-full rounded-full border border-ink-border bg-ink-soft px-4 py-3 text-paper outline-none placeholder:text-paper/35 focus:border-teal";

export function AuthModal() {
  const { open, view, openLogin, openRegister, close } = useAuthModal();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!open) return null;

  function switchTo(next: "login" | "register") {
    setError(null);
    setShowPassword(false);
    if (next === "login") openLogin();
    else openRegister();
  }

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const result = await customerLoginInPlaceAction(new FormData(e.currentTarget));
    setPending(false);
    if (result.error) {
      setError("Correo o contraseña incorrectos.");
      return;
    }
    close();
    router.refresh();
  }

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    if (!(new FormData(form).get("acceptedTerms") === "on")) {
      setError("Acepta los términos para crear tu cuenta.");
      return;
    }
    setPending(true);
    const result = await customerRegisterInPlaceAction(new FormData(form));
    setPending(false);
    if (result.error === "exists") {
      setError("Ese correo ya está registrado.");
      return;
    }
    if (result.error) {
      setError("Completa los datos, acepta los términos y usa 6+ caracteres.");
      return;
    }
    close();
    router.refresh();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="grid h-[90vh] max-h-[90vh] w-[90%] max-w-[90%] overflow-hidden rounded-3xl border border-ink-border bg-ink shadow-2xl lg:grid-cols-2"
        onClick={(e) => e.stopPropagation()}
      >
        <section className="relative hidden h-full min-h-0 overflow-hidden lg:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/login-banner.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/25" />
          <div className="relative flex h-full flex-col justify-between px-8 py-8 xl:px-12">
            <p className="font-display text-3xl text-paper">
              De<span className="text-teal">Una</span>
            </p>
            <div className="max-w-xl">
              <h1 className="font-display text-4xl leading-tight text-paper xl:text-5xl">
                Todo lo que necesitas, más cerca de ti
              </h1>
              <p className="mt-4 text-base text-paper/70">
                {view === "login"
                  ? "Tus tiendas, licores, hielo y snacks favoritos, en la puerta de tu casa."
                  : "Tus bebidas, snacks y mucho más, en la puerta de tu casa."}
              </p>
              <ul className="mt-6 flex flex-wrap gap-4 text-sm text-paper/75">
                <li>🛵 Entrega rápida en minutos</li>
                <li>🏪 Miles de opciones</li>
                <li>🛡️ Pagos seguros y confiables</li>
              </ul>
            </div>
            <ul className="flex flex-wrap gap-5 text-sm text-paper/55">
              <li>Tiendas cerca de ti</li>
              <li>Licores, cervezas y hielo</li>
              <li>Todo en un solo lugar</li>
            </ul>
          </div>
        </section>

        <section className="relative h-full min-h-0 overflow-y-auto overscroll-contain px-6 py-6 sm:px-8 sm:py-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <p className="font-display text-2xl text-paper lg:invisible">
            De<span className="text-teal">Una</span>
          </p>
          <div className="flex items-center gap-4">
            {view === "login" ? (
              <p className="hidden text-sm text-paper/55 sm:block">
                ¿No tienes cuenta?{" "}
                <button type="button" onClick={() => switchTo("register")} className="font-medium text-teal-light hover:underline">
                  Crear cuenta
                </button>
              </p>
            ) : (
              <p className="hidden text-sm text-paper/55 sm:block">
                ¿Ya tienes cuenta?{" "}
                <button type="button" onClick={() => switchTo("login")} className="font-medium text-teal-light hover:underline">
                  Iniciar sesión
                </button>
              </p>
            )}
            <button
              type="button"
              onClick={close}
              className="text-sm text-paper/40 hover:text-paper"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>

        {view === "login" ? (
          <>
            <h2 className="font-display text-3xl text-paper">Bienvenido a DeUna</h2>
            <p className="mt-2 text-sm text-paper/55">
              Inicia sesión para continuar y disfrutar de todos nuestros servicios y promociones.
            </p>

            <form onSubmit={handleLogin} className="mt-6 flex flex-col gap-4">
              <label className="text-sm text-paper/80">
                Correo electrónico
                <input name="email" type="email" required placeholder="tu@correo.com" className={inputClass} />
              </label>
              <label className="text-sm text-paper/80">
                Contraseña
                <span className="relative mt-1 block">
                  <input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Tu contraseña"
                    className={`${inputClass} mt-0 pr-16`}
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
              {error && <p className="text-sm text-coral">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-light disabled:opacity-60"
              >
                {pending ? "Entrando…" : "Iniciar sesión"}
              </button>
            </form>

            <SocialSoon />

            <p className="mt-6 text-sm text-paper/55 sm:hidden">
              ¿No tienes cuenta?{" "}
              <button type="button" onClick={() => switchTo("register")} className="font-medium text-teal-light hover:underline">
                Crear cuenta
              </button>
            </p>
            <p className="mt-3 text-xs text-paper/40">
              Tus datos están protegidos. Demo: <code>cliente-demo@deuna.do</code> / <code>deuna123</code>
            </p>
          </>
        ) : (
          <>
            <h2 className="font-display text-3xl text-paper">Crea tu cuenta en DeUna</h2>
            <p className="mt-2 text-sm text-paper/55">
              Regístrate y disfruta de una experiencia más rápida, personalizada y con promociones exclusivas.
            </p>

            <form onSubmit={handleRegister} className="mt-6 flex flex-col gap-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-paper/80">
                  Nombre
                  <input name="firstName" required placeholder="Nombre" className={inputClass} />
                </label>
                <label className="text-sm text-paper/80">
                  Apellidos
                  <input name="lastName" required placeholder="Apellidos" className={inputClass} />
                </label>
              </div>
              <label className="relative flex items-center rounded-full border border-ink-border bg-ink-soft focus-within:border-teal">
                <span className="ml-4 flex items-center gap-1.5 border-r border-ink-border pr-3 text-sm text-paper/70">
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
              <label className="text-sm text-paper/80">
                Correo electrónico
                <input name="email" type="email" required placeholder="tu@correo.com" className={inputClass} />
              </label>
              <div>
                <label className="text-sm text-paper/80">
                  Contraseña
                  <span className="relative mt-1 block">
                    <input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      minLength={6}
                      required
                      placeholder="Contraseña"
                      className={`${inputClass} mt-0 pr-16`}
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
              {error && <p className="text-sm text-coral">{error}</p>}
              <button
                type="submit"
                disabled={pending}
                className="rounded-full bg-teal py-3 font-medium text-paper transition hover:bg-teal-light disabled:opacity-60"
              >
                {pending ? "Creando…" : "Crear cuenta"}
              </button>
            </form>

            <SocialSoon />

            <p className="mt-6 text-sm text-paper/55 sm:hidden">
              ¿Ya tienes cuenta?{" "}
              <button type="button" onClick={() => switchTo("login")} className="font-medium text-teal-light hover:underline">
                Iniciar sesión
              </button>
            </p>
          </>
        )}
        </section>
      </div>
    </div>
  );
}

function SocialSoon() {
  return (
    <>
      <div className="my-5 flex items-center gap-3 text-xs text-paper/35">
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
    </>
  );
}

export function AuthEntryButton({
  className,
  children,
  mode = "login",
}: {
  className?: string;
  children?: React.ReactNode;
  mode?: "login" | "register";
}) {
  const { openLogin, openRegister } = useAuthModal();

  return (
    <button
      type="button"
      onClick={mode === "register" ? openRegister : openLogin}
      className={
        className ??
        "flex items-center gap-2 rounded-full border border-ink-border bg-ink-soft px-4 py-2 text-sm font-medium text-paper transition hover:border-teal"
      }
    >
      {children ?? (mode === "register" ? "Registrarse" : "Entrar")}
    </button>
  );
}
