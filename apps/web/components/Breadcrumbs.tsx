import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { href?: string; label: string }[];
}) {
  const crumbs = [{ href: "/", label: "Inicio" }, ...items];

  return (
    <nav aria-label="Migas de pan" className="mb-6 text-sm text-paper/50">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((item, index) => {
          const last = index === crumbs.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {index > 0 && <span aria-hidden>/</span>}
              {last || !item.href ? (
                <span className={last ? "text-paper/80" : undefined}>{item.label}</span>
              ) : (
                <Link href={item.href} className="hover:text-teal-light">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
