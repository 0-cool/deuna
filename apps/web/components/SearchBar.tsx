"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function SearchBar({ initialQuery = "", large = false }: { initialQuery?: string; large?: boolean }) {
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
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="¿Qué necesitas? Busca ron, cerveza, whisky..."
        className={
          large
            ? "w-full rounded-2xl border border-ink-border bg-ink-soft px-6 py-4 text-lg text-paper placeholder:text-paper/40 outline-none focus:border-teal"
            : "w-full rounded-full border border-ink-border bg-ink-soft px-4 py-2 text-sm text-paper placeholder:text-paper/40 outline-none focus:border-teal"
        }
      />
    </form>
  );
}
