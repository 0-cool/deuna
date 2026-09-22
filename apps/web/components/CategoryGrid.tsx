import Link from "next/link";

interface CategoryTile {
  slug: string;
  label: string;
  emoji: string;
}

export function CategoryGrid({ categories }: { categories: CategoryTile[] }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      <h2 className="font-display text-2xl text-paper">Categorías</h2>
      <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        {categories.map((cat) => (
          <Link
            key={cat.slug}
            href={`/${cat.slug}`}
            className="flex flex-col items-center gap-2 rounded-card border border-ink-border bg-ink-soft px-3 py-5 text-center transition hover:border-teal hover:bg-ink"
          >
            <span className="text-2xl" aria-hidden>
              {cat.emoji}
            </span>
            <span className="text-sm text-paper/85">{cat.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
