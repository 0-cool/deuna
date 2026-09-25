"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CATEGORY_RULES, CATEGORY_SLUGS, type CategorySlug } from "@deuna/config";
import { formatDOP } from "@deuna/utils";
import {
  readMerchantCategoryPrefs,
  writeMerchantCategoryPrefs,
  type MerchantCategoryPref,
} from "@/lib/merchant-category-storage";

export type MerchantCategorySource = {
  slug: string;
  name: string;
  imageUrl: string;
  productCount: number;
  products: { id: string; name: string; brand: string; imageUrl: string; price: number }[];
};

const BLURBS: Record<string, string> = {
  cervezas: "Cervezas nacionales e importadas",
  ron: "Ron dominicano e internacional",
  whisky: "Whisky, bourbon y blends",
  vodka: "Vodka y destilados blancos",
  tequila: "Tequila y mezcal",
  vinos: "Vinos tintos, blancos y rosados",
  espumantes: "Espumantes y champagne",
  tabaco: "Cigarrillos y tabaco",
  vape: "Vapeadores y líquidos",
  hielo: "Bolsas y cubos de hielo",
  mixers: "Mixers, jugos y sodas",
  snacks: "Papas, chicharrones y más",
  fiestas: "Listo para fiestas y reuniones",
};

const PAGE_SIZE = 8;

type Row = {
  slug: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
  isActive: boolean;
  sortOrder: number;
  products: MerchantCategorySource["products"];
  added?: boolean;
};

function Switch({
  on,
  onClick,
  label,
}: {
  on: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={on ? "relative h-6 w-10 rounded-full bg-teal" : "relative h-6 w-10 rounded-full bg-ink/15"}
    >
      <span
        className={
          on
            ? "absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
            : "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
        }
      />
    </button>
  );
}

export function MerchantCategoriesClient({
  merchantId,
  categories,
}: {
  merchantId: string;
  categories: MerchantCategorySource[];
}) {
  const [prefs, setPrefs] = useState<Record<string, MerchantCategoryPref>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("name");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string | null>(categories[0]?.slug ?? null);
  const [tab, setTab] = useState<"info" | "products" | "look">("info");
  const [draft, setDraft] = useState({ name: "", description: "", imageUrl: "", isActive: true, sortOrder: 1 });
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setPrefs(readMerchantCategoryPrefs(merchantId));
  }, [merchantId]);

  function persist(next: Record<string, MerchantCategoryPref>) {
    setPrefs(next);
    writeMerchantCategoryPrefs(merchantId, next);
  }

  const rows = useMemo<Row[]>(() => {
    const extras = Object.values(prefs).filter(
      (pref) => pref.added && !categories.some((category) => category.slug === pref.slug),
    );
    const base = [
      ...categories.map((category, index) => ({
        slug: category.slug,
        name: category.name,
        description: BLURBS[category.slug] ?? `Productos de ${category.name.toLowerCase()}`,
        imageUrl: category.imageUrl,
        productCount: category.productCount,
        isActive: true,
        sortOrder: index + 1,
        products: category.products,
      })),
      ...extras.map((pref, index) => {
        const rule = CATEGORY_RULES[pref.slug as CategorySlug];
        return {
          slug: pref.slug,
          name: rule?.label ?? pref.name ?? pref.slug,
          description: BLURBS[pref.slug] ?? "",
          imageUrl: pref.imageUrl ?? "",
          productCount: 0,
          isActive: pref.isActive,
          sortOrder: categories.length + index + 1,
          products: [],
          added: true,
        };
      }),
    ];

    return base.map((row) => {
      const pref = prefs[row.slug];
      if (!pref) return row;
      return {
        ...row,
        name: pref.name || row.name,
        description: pref.description || row.description,
        imageUrl: pref.imageUrl || row.imageUrl,
        isActive: pref.isActive,
        sortOrder: pref.sortOrder || row.sortOrder,
        added: pref.added ?? row.added,
      };
    });
  }, [categories, prefs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const next = rows.filter((row) => {
      const matchesQuery =
        !q || row.name.toLowerCase().includes(q) || row.description.toLowerCase().includes(q);
      const matchesStatus =
        status === "all" || (status === "active" && row.isActive) || (status === "paused" && !row.isActive);
      return matchesQuery && matchesStatus;
    });
    next.sort((a, b) => {
      if (sort === "order") return a.sortOrder - b.sortOrder;
      if (sort === "products") return b.productCount - a.productCount;
      return a.name.localeCompare(b.name, "es");
    });
    return next;
  }, [rows, query, status, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const current = rows.find((row) => row.slug === selected) ?? null;
  const unused = CATEGORY_SLUGS.filter((slug) => !rows.some((row) => row.slug === slug));

  const activeCount = rows.filter((row) => row.isActive).length;
  const assigned = rows.reduce((sum, row) => sum + row.productCount, 0);
  const shown = rows.filter((row) => row.isActive && row.productCount > 0).length;

  useEffect(() => {
    if (!current) return;
    setDraft({
      name: current.name,
      description: current.description,
      imageUrl: current.imageUrl,
      isActive: current.isActive,
      sortOrder: current.sortOrder,
    });
    setTab("info");
  }, [current?.slug]);

  function patchPref(slug: string, partial: Partial<MerchantCategoryPref>) {
    const row = rows.find((item) => item.slug === slug);
    persist({
      ...prefs,
      [slug]: {
        slug,
        name: row?.name,
        description: row?.description,
        imageUrl: row?.imageUrl,
        isActive: row?.isActive ?? true,
        sortOrder: row?.sortOrder ?? 1,
        added: row?.added,
        ...prefs[slug],
        ...partial,
      },
    });
  }

  function openRow(slug: string) {
    setSelected(slug);
  }

  function move(slug: string, direction: -1 | 1) {
    const ordered = [...rows].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((row) => row.slug === slug);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ordered.length) return;
    const a = ordered[index];
    const b = ordered[target];
    persist({
      ...prefs,
      [a.slug]: {
        slug: a.slug,
        name: a.name,
        description: a.description,
        imageUrl: a.imageUrl,
        isActive: a.isActive,
        added: a.added,
        ...prefs[a.slug],
        sortOrder: b.sortOrder,
      },
      [b.slug]: {
        slug: b.slug,
        name: b.name,
        description: b.description,
        imageUrl: b.imageUrl,
        isActive: b.isActive,
        added: b.added,
        ...prefs[b.slug],
        sortOrder: a.sortOrder,
      },
    });
  }

  function saveDraft() {
    if (!current) return;
    patchPref(current.slug, draft);
    setNotice("Cambios guardados en tu tienda.");
  }

  function removeCategory() {
    if (!current) return;
    const confirmed = window.confirm(
      current.productCount > 0
        ? `¿Ocultar "${current.name}"? Los productos no se eliminan; solo deja de mostrarse como categoría en tu tienda.`
        : `¿Eliminar "${current.name}" de tu listado?`,
    );
    if (!confirmed) return;
    if (current.added && current.productCount === 0) {
      const next = { ...prefs };
      delete next[current.slug];
      persist(next);
    } else {
      patchPref(current.slug, { isActive: false });
    }
    setSelected(rows.find((row) => row.slug !== current.slug)?.slug ?? null);
    setNotice("Categoría actualizada.");
  }

  function addCategory(slug: CategorySlug) {
    persist({
      ...prefs,
      [slug]: {
        slug,
        name: CATEGORY_RULES[slug].label,
        description: BLURBS[slug],
        isActive: true,
        sortOrder: rows.length + 1,
        added: true,
      },
    });
    setSelected(slug);
    setAdding(false);
    setNotice("Categoría agregada a tu tienda.");
  }

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">
          Inicio
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Categorías</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Categorías</h1>
          <p className="mt-1 text-sm text-ink/50">
            Organiza tus productos en categorías para que los clientes los encuentren fácilmente.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="inline-flex items-center gap-2 rounded-full bg-coral px-4 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark"
        >
          + Agregar categoría
        </button>
      </div>

      {notice && <p className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">{notice}</p>}

      <section className="grid gap-3 sm:grid-cols-3">
        <Kpi label="Categorías activas" value={String(activeCount)} />
        <Kpi label="Productos asignados" value={String(assigned)} />
        <Kpi label="Mostrada en tienda" value={String(shown)} />
      </section>

      <div className={current ? "grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]" : ""}>
        <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <label className="relative block min-w-0 flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/30">⌕</span>
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
                placeholder="Buscar categorías..."
                className="w-full rounded-full border border-ink/10 bg-[#F6F5F2] py-2.5 pl-9 pr-4 text-sm text-ink outline-none placeholder:text-ink/35 focus:border-teal"
              />
            </label>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(1);
              }}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activas</option>
              <option value="paused">Pausadas</option>
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="rounded-full border border-ink/10 bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-teal"
            >
              <option value="name">Ordenar por: Nombre (A-Z)</option>
              <option value="order">Orden de tienda</option>
              <option value="products">Más productos</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                <tr>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium">Productos</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Orden</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-ink/40">
                      No hay categorías con esos filtros.
                    </td>
                  </tr>
                ) : (
                  pageItems.map((row) => (
                    <tr
                      key={row.slug}
                      className={
                        selected === row.slug
                          ? "border-t border-ink/6 bg-coral/5"
                          : "border-t border-ink/6 hover:bg-[#F6F5F2]/70"
                      }
                    >
                      <td className="py-3 pr-3">
                        <button type="button" onClick={() => openRow(row.slug)} className="flex items-center gap-3 text-left">
                          <div className="h-11 w-11 overflow-hidden rounded-xl bg-[#F6F5F2]">
                            {row.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg">
                                {CATEGORY_RULES[row.slug as CategorySlug]?.emoji ?? "📦"}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-ink">{row.name}</p>
                            <p className="text-xs text-ink/40">{row.description}</p>
                          </div>
                        </button>
                      </td>
                      <td className="py-3 text-ink/70">{row.productCount}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Switch
                            on={row.isActive}
                            label={row.isActive ? "Pausar categoría" : "Activar categoría"}
                            onClick={() => patchPref(row.slug, { isActive: !row.isActive })}
                          />
                          <span className={row.isActive ? "text-xs font-medium text-teal" : "text-xs text-ink/40"}>
                            {row.isActive ? "Activa" : "Pausada"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1">
                          <span className="w-5 text-sm text-ink">{row.sortOrder}</span>
                          <button type="button" onClick={() => move(row.slug, -1)} className="px-1 text-ink/35 hover:text-ink">
                            ↑
                          </button>
                          <button type="button" onClick={() => move(row.slug, 1)} className="px-1 text-ink/35 hover:text-ink">
                            ↓
                          </button>
                        </div>
                      </td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => openRow(row.slug)}
                          className="text-ink/40 hover:text-ink"
                          aria-label="Editar"
                        >
                          ✎
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/45">
            <p>
              Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} categorías
            </p>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">
                ‹
              </button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={
                    item === currentPage
                      ? "flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white"
                      : "flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ink/5"
                  }
                >
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">
                ›
              </button>
            </div>
          </div>
        </section>

        {current && (
          <aside className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-[#F6F5F2]">
                  {draft.imageUrl || current.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.imageUrl || current.imageUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      {CATEGORY_RULES[current.slug as CategorySlug]?.emoji ?? "📦"}
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-ink">{draft.name || current.name}</p>
                  <p className="text-xs text-ink/40">{draft.description || current.description}</p>
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} className="text-ink/30 hover:text-ink" aria-label="Cerrar">
                ✕
              </button>
            </div>

            <div className="mt-5 flex gap-4 border-b border-ink/8 text-sm">
              {(
                [
                  ["info", "Información"],
                  ["products", `Productos (${current.productCount})`],
                  ["look", "Apariencia"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={
                    tab === id
                      ? "border-b-2 border-coral pb-2 font-medium text-coral"
                      : "pb-2 text-ink/45 hover:text-ink"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "info" && (
              <div className="mt-4 space-y-3">
                <label className="block text-xs text-ink/50">
                  Nombre de la categoría
                  <input
                    value={draft.name}
                    onChange={(event) => setDraft((value) => ({ ...value, name: event.target.value }))}
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <label className="block text-xs text-ink/50">
                  Descripción
                  <textarea
                    value={draft.description}
                    onChange={(event) => setDraft((value) => ({ ...value, description: event.target.value }))}
                    rows={3}
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
                <div className="flex items-center justify-between rounded-xl bg-[#F6F5F2] px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Estado</p>
                    <p className="text-xs text-ink/40">Las categorías activas se muestran en tu tienda.</p>
                  </div>
                  <Switch
                    on={draft.isActive}
                    label="Cambiar estado"
                    onClick={() => setDraft((value) => ({ ...value, isActive: !value.isActive }))}
                  />
                </div>
                <label className="block text-xs text-ink/50">
                  Orden de visualización
                  <input
                    type="number"
                    min={1}
                    value={draft.sortOrder}
                    onChange={(event) => setDraft((value) => ({ ...value, sortOrder: Number(event.target.value) || 1 }))}
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
              </div>
            )}

            {tab === "products" && (
              <ul className="mt-4 space-y-3">
                {current.products.length === 0 ? (
                  <li className="text-sm text-ink/40">
                    Todavía no tienes productos en esta categoría.{" "}
                    <Link href="/merchant/productos/nuevo" className="text-coral hover:underline">
                      Agrega uno
                    </Link>
                    .
                  </li>
                ) : (
                  current.products.map((product) => (
                    <li key={product.id} className="flex items-center gap-3">
                      <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                        {product.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">{product.name}</p>
                        <p className="text-xs text-ink/40">{product.brand}</p>
                      </div>
                      <p className="text-xs text-ink/60">{formatDOP(product.price)}</p>
                    </li>
                  ))
                )}
              </ul>
            )}

            {tab === "look" && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-ink/45">Recomendado: 1200 × 800 px (JPG o PNG).</p>
                <div className="overflow-hidden rounded-2xl bg-[#F6F5F2]">
                  {draft.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.imageUrl} alt="" className="h-40 w-full object-cover" />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-4xl">
                      {CATEGORY_RULES[current.slug as CategorySlug]?.emoji ?? "📦"}
                    </div>
                  )}
                </div>
                <label className="block text-xs text-ink/50">
                  Imagen (URL)
                  <input
                    value={draft.imageUrl}
                    onChange={(event) => setDraft((value) => ({ ...value, imageUrl: event.target.value }))}
                    placeholder="https://..."
                    className="mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal"
                  />
                </label>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <button type="button" onClick={removeCategory} className="text-sm font-medium text-coral hover:underline">
                Eliminar categoría
              </button>
              <button
                type="button"
                onClick={saveDraft}
                className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
              >
                Guardar cambios
              </button>
            </div>
          </aside>
        )}
      </div>

      {adding && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={() => setAdding(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl text-ink">Agregar categoría</h2>
              <button type="button" onClick={() => setAdding(false)} className="text-ink/30 hover:text-ink">
                ✕
              </button>
            </div>
            <p className="mt-1 text-sm text-ink/50">
              Elige una categoría del catálogo DeUna para mostrarla en tu tienda.
            </p>
            {unused.length === 0 ? (
              <p className="mt-4 text-sm text-ink/40">Ya tienes todas las categorías del catálogo.</p>
            ) : (
              <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
                {unused.map((slug) => (
                  <li key={slug}>
                    <button
                      type="button"
                      onClick={() => addCategory(slug)}
                      className="flex w-full items-center justify-between rounded-xl border border-ink/8 px-3 py-2 text-left hover:bg-[#F6F5F2]"
                    >
                      <span>
                        {CATEGORY_RULES[slug].emoji} {CATEGORY_RULES[slug].label}
                      </span>
                      <span className="text-xs text-coral">Agregar</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
    </article>
  );
}
