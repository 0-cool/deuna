import { loginAction } from "./actions";

export default async function MerchantLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <section className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <p className="font-display text-2xl text-paper">
        De<span className="text-teal-light">Una</span>
      </p>
      <p className="mt-1 text-sm font-medium uppercase tracking-wide text-teal-light">
        Panel de comercios
      </p>
      <h1 className="mt-3 font-display text-2xl text-paper">Inicia sesión en tu tienda</h1>

      <form action={loginAction} className="mt-6 flex flex-col gap-4">
        <label className="text-sm text-paper/80">
          Correo
          <input
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-paper outline-none focus:border-teal"
          />
        </label>
        <label className="text-sm text-paper/80">
          Contraseña
          <input
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-paper outline-none focus:border-teal"
          />
        </label>

        {error && <p className="text-sm text-coral">Correo o contraseña incorrectos.</p>}

        <button
          type="submit"
          className="rounded-full bg-teal px-4 py-3 font-medium text-paper transition hover:bg-teal-light"
        >
          Entrar
        </button>
      </form>

      <p className="mt-6 text-xs text-paper/40">
        Demo: usa el correo de cualquier merchant del seed (ej.{" "}
        <code>deuna-liquor@merchants.deuna.do</code>) con la contraseña{" "}
        <code>deuna123</code>.
      </p>
    </section>
  );
}