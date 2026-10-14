export function MerchantComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-8 shadow-sm">
      <h1 className="font-display text-3xl text-ink">{title}</h1>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink/55">{description}</p>
      <p className="mt-6 text-sm text-ink/40">Esta sección se conectará en la siguiente etapa del panel.</p>
    </section>
  );
}
