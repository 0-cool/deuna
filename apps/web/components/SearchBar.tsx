"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar({
  initialQuery = "",
  large = false,
  withButton = false,
}: {
  initialQuery?: string;
  large?: boolean;
  withButton?: boolean;
}) {
  const [value, setValue] = useState(initialQuery);
  const router = useRouter();

  useEffect(() => {
    const handle = setTimeout(() => {
      if (value.trim().length >= 2) {
        router.push(`/buscar?q=${encodeURIComponent(value.trim())}`);
      }
    }, 350);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (value.trim()) router.push(`/buscar?q=${encodeURIComponent(value.trim())}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={
        withButton
          ? "flex w-full overflow-hidden rounded-2xl border border-ink-border bg-ink-soft focus-within:border-teal"
          : "relative w-full"
      }
    >
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="¿Qué necesitas? Busca ron, cerveza, whisky…"
        className={
          withButton
            ? "min-w-0 flex-1 bg-transparent px-5 py-4 text-base text-paper placeholder:text-paper/40 outline-none"
            : large
              ? "w-full rounded-2xl border border-ink-border bg-ink-soft px-6 py-4 text-lg text-paper placeholder:text-paper/40 outline-none focus:border-teal"
              : "w-full rounded-full border border-ink-border bg-ink-soft px-4 py-2 text-sm text-paper placeholder:text-paper/40 outline-none focus:border-teal"
        }
      />
      {withButton && (
        <button
          type="submit"
          className="m-1.5 rounded-xl bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-light"
        >
          Buscar
        </button>
      )}
    </form>
  );
}
