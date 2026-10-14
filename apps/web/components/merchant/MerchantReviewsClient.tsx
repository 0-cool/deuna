"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  readReviewOverrides,
  writeReviewOverrides,
  type ReviewOverride,
  type ReviewStatus,
} from "@/lib/merchant-review-storage";

export type ReviewRow = {
  id: string;
  customerName: string;
  productName: string;
  imageUrl: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: ReviewStatus;
};

const PAGE_SIZE = 8;

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function Stars({ value }: { value: number }) {
  return (
    <span className="text-gold" aria-label={`${value} de 5`}>
      {"★★★★★".slice(0, value)}
      <span className="text-ink/15">{"★★★★★".slice(value)}</span>
    </span>
  );
}

export function MerchantReviewsClient({
  merchantId,
  reviews,
}: {
  merchantId: string;
  reviews: ReviewRow[];
}) {
  const today = new Date();
  const [from, setFrom] = useState(new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(today.toISOString().slice(0, 10));
  const [tab, setTab] = useState<"all" | ReviewStatus | "replied">("all");
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState("");
  const [product, setProduct] = useState("");
  const [page, setPage] = useState(1);
  const [overrides, setOverrides] = useState<Record<string, ReviewOverride>>({});
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [tipsOpen, setTipsOpen] = useState(false);

  useEffect(() => {
    setOverrides(readReviewOverrides(merchantId));
  }, [merchantId]);

  const rows = useMemo(
    () =>
      reviews.map((review) => ({
        ...review,
        status: overrides[review.id]?.status ?? review.status,
        reply: overrides[review.id]?.reply ?? "",
      })),
    [reviews, overrides],
  );

  const ranged = rows.filter((row) => {
    const date = new Date(row.createdAt);
    return date >= new Date(`${from}T00:00:00`) && date <= new Date(`${to}T23:59:59`);
  });

  const filtered = ranged.filter((row) => {
    const q = query.trim().toLowerCase();
    const matchesQuery = !q || row.customerName.toLowerCase().includes(q) || row.productName.toLowerCase().includes(q) || row.comment.toLowerCase().includes(q);
    const matchesRating = !rating || String(row.rating) === rating;
    const matchesStatus = !status || row.status === status;
    const matchesProduct = !product || row.productName === product;
    const matchesTab =
      tab === "all" ||
      (tab === "replied" && Boolean(row.reply)) ||
      (tab !== "replied" && row.status === tab);
    return matchesQuery && matchesRating && matchesStatus && matchesProduct && matchesTab;
  });

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const products = Array.from(new Set(rows.map((row) => row.productName)));

  const avg = ranged.length ? ranged.reduce((sum, row) => sum + row.rating, 0) / ranged.length : 0;
  const recommend = ranged.length ? Math.round((ranged.filter((row) => row.rating >= 4).length / ranged.length) * 100) : 0;
  const unique = new Set(ranged.map((row) => row.customerName)).size;
  const dist = [5, 4, 3, 2, 1].map((star) => ({
    star,
    pct: ranged.length ? Math.round((ranged.filter((row) => row.rating === star).length / ranged.length) * 100) : 0,
  }));

  function persist(next: Record<string, ReviewOverride>) {
    setOverrides(next);
    writeReviewOverrides(merchantId, next);
  }

  function patch(id: string, partial: ReviewOverride) {
    persist({ ...overrides, [id]: { ...overrides[id], ...partial } });
  }

  const counts = {
    all: ranged.length,
    pending: ranged.filter((row) => row.status === "pending").length,
    replied: ranged.filter((row) => row.reply).length,
    reported: ranged.filter((row) => row.status === "reported").length,
  };

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">Inicio</Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Reseñas</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Reseñas de clientes</h1>
          <p className="mt-1 text-sm text-ink/50">Gestiona la opinión de tus clientes y mejora la experiencia en tu tienda.</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm" />
          <span className="text-ink/30">–</span>
          <input type="date" value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm" />
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Calificación promedio" value={avg.toFixed(1)} hint={`${ranged.length} reseñas`} extra={<Stars value={Math.round(avg)} />} />
        <Kpi label="Reseñas totales" value={String(ranged.length)} hint="En el periodo" />
        <Kpi label="Recomendación" value={`${recommend}%`} hint="Clientes con 4★ o más" />
        <Kpi label="Clientes únicos" value={String(unique)} hint="Que dejaron reseña" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-4 border-b border-ink/8 text-sm">
            {(
              [
                ["all", `Todas (${counts.all})`],
                ["pending", `Pendientes (${counts.pending})`],
                ["replied", `Respondidas (${counts.replied})`],
                ["reported", `Reportadas (${counts.reported})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => { setTab(id); setPage(1); }}
                className={tab === id ? "border-b-2 border-coral pb-2 font-medium text-coral" : "pb-2 text-ink/45 hover:text-ink"}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-3 lg:flex-row">
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Buscar reseñas por producto o cliente..."
              className="min-w-0 flex-1 rounded-full border border-ink/10 bg-[#F6F5F2] px-4 py-2.5 text-sm outline-none focus:border-teal"
            />
            <select value={rating} onChange={(event) => { setRating(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm">
              <option value="">Todas las calificaciones</option>
              {[5, 4, 3, 2, 1].map((star) => (
                <option key={star} value={star}>{star} estrellas</option>
              ))}
            </select>
            <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm">
              <option value="">Todos los estados</option>
              <option value="published">Publicada</option>
              <option value="pending">Pendiente</option>
              <option value="reported">Reportada</option>
            </select>
            <select value={product} onChange={(event) => { setProduct(event.target.value); setPage(1); }} className="rounded-full border border-ink/10 px-3 py-2 text-sm">
              <option value="">Todos los productos</option>
              {products.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                <tr>
                  <th className="pb-3 font-medium">Cliente</th>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Calificación</th>
                  <th className="pb-3 font-medium">Comentario</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-ink/40">No hay reseñas con esos filtros.</td>
                  </tr>
                ) : (
                  pageItems.map((row) => (
                    <tr key={row.id} className="border-t border-ink/6 align-top">
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-paper">
                            {initials(row.customerName)}
                          </span>
                          <div>
                            <p className="font-medium text-ink">{row.customerName}</p>
                            <p className="text-[11px] text-teal">Compra verificada</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                            {row.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : null}
                          </div>
                          <span className="max-w-[9rem] text-ink/70">{row.productName}</span>
                        </div>
                      </td>
                      <td className="py-3"><Stars value={row.rating} /></td>
                      <td className="py-3 max-w-[16rem] text-ink/60">
                        {row.comment}
                        {row.reply ? <p className="mt-1 text-xs text-teal">Tu respuesta: {row.reply}</p> : null}
                      </td>
                      <td className="py-3 text-xs text-ink/45">
                        {new Date(row.createdAt).toLocaleString("es-DO", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" })}
                      </td>
                      <td className="py-3">
                        <span className={row.status === "published" ? "text-xs font-medium text-teal" : row.status === "pending" ? "text-xs font-medium text-gold" : "text-xs font-medium text-coral"}>
                          {row.status === "published" ? "Publicada" : row.status === "pending" ? "Pendiente" : "Reportada"}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-col items-start gap-1">
                          <button type="button" onClick={() => { setReplyId(row.id); setReplyText(row.reply); }} className="text-xs font-medium text-coral hover:underline">
                            Responder
                          </button>
                          {row.status !== "reported" && (
                            <button type="button" onClick={() => patch(row.id, { status: "reported" })} className="text-xs text-ink/35 hover:text-ink">
                              Reportar
                            </button>
                          )}
                          {row.status === "pending" && (
                            <button type="button" onClick={() => patch(row.id, { status: "published" })} className="text-xs text-teal hover:underline">
                              Publicar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-ink/45">
            <p>
              Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} de {filtered.length} reseñas
            </p>
            <div className="flex gap-1">
              <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">‹</button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  className={item === currentPage ? "flex h-7 w-7 items-center justify-center rounded-lg bg-coral text-white" : "flex h-7 w-7 items-center justify-center rounded-lg hover:bg-ink/5"}
                >
                  {item}
                </button>
              ))}
              <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} className="rounded-lg px-2 py-1 hover:bg-ink/5">›</button>
            </div>
          </div>
        </section>

        <div className="space-y-4">
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <h2 className="font-medium text-ink">Distribución de calificaciones</h2>
            <ul className="mt-4 space-y-2">
              {dist.map((item) => (
                <li key={item.star} className="flex items-center gap-2 text-sm">
                  <span className="w-4 text-ink/50">{item.star}</span>
                  <div className="h-2 flex-1 rounded-full bg-ink/5">
                    <div className="h-2 rounded-full bg-gold" style={{ width: `${item.pct}%` }} />
                  </div>
                  <span className="w-10 text-right text-xs text-ink/40">{item.pct}%</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Reseñas recientes</h2>
            </div>
            <ul className="mt-4 space-y-3">
              {ranged.slice(0, 3).map((row) => (
                <li key={row.id} className="flex gap-3">
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                    {row.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={row.imageUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink">{row.customerName}</p>
                    <Stars value={row.rating} />
                    <p className="text-xs text-ink/50">{row.comment}</p>
                  </div>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-[#FFF8E8] p-5 shadow-sm">
            <p className="text-sm font-medium text-ink">Consejo</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/60">
              Responde reseñas de tus clientes. Las tiendas que responden venden hasta 35% más.
            </p>
            <button type="button" onClick={() => setTipsOpen(true)} className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark">
              Ver mejores prácticas
            </button>
          </article>
        </div>
      </div>

      {replyId && (
        <Modal title="Responder reseña" onClose={() => setReplyId(null)}>
          <textarea
            value={replyText}
            onChange={(event) => setReplyText(event.target.value)}
            rows={4}
            placeholder="Gracias por tu comentario..."
            className="w-full rounded-xl border border-ink/10 px-3 py-2 text-sm outline-none focus:border-teal"
          />
          <button
            type="button"
            onClick={() => {
              patch(replyId, { reply: replyText, status: "published" });
              setReplyId(null);
            }}
            className="mt-3 w-full rounded-full bg-coral py-2.5 text-sm font-semibold text-white"
          >
            Publicar respuesta
          </button>
        </Modal>
      )}

      {tipsOpen && (
        <Modal title="Mejores prácticas" onClose={() => setTipsOpen(false)}>
          <ul className="space-y-2 text-sm text-ink/65">
            <li>Responde en menos de 24 horas, sobre todo a 3★ o menos.</li>
            <li>Agradece lo concreto: frío, rapidez, empaque.</li>
            <li>Si hubo un problema, ofrece reponer el producto por DeUna.</li>
            <li>No pidas borrar reseñas: pide otra oportunidad en el siguiente pedido.</li>
          </ul>
        </Modal>
      )}
    </div>
  );
}

function Kpi({ label, value, hint, extra }: { label: string; value: string; hint: string; extra?: React.ReactNode }) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <p className="text-xs text-ink/45">{label}</p>
      <p className="mt-1 font-display text-3xl text-ink">{value}</p>
      {extra ? <div className="mt-1">{extra}</div> : null}
      <p className="mt-1 text-[11px] text-ink/40">{hint}</p>
    </article>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl text-ink">{title}</h2>
          <button type="button" onClick={onClose} className="text-ink/30 hover:text-ink">✕</button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
