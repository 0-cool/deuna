"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { saveMerchantHoursAction, setMerchantOpenNowAction } from "@/app/merchant/actions";
import {
  TIME_OPTIONS,
  WEEK_DAYS,
  defaultWeekly,
  formatTime12,
  dayKeyFromDate,
  isWithinRange,
  type DayHours,
  type DayKey,
  type MerchantHoursState,
  type SpecialDay,
} from "@/lib/merchant-hours";

const PRESETS: { id: string; label: string; hint: string; from: string; to: string; icon: string }[] = [
  { id: "all", label: "Todo el día", hint: "Abierto de 9:00 a. m. a 11:00 p. m.", from: "09:00", to: "23:00", icon: "☀️" },
  { id: "late", label: "Horario extendido", hint: "Abierto de 8:00 a. m. a 12:00 a. m.", from: "08:00", to: "00:00", icon: "🌙" },
  { id: "std", label: "Horario estándar", hint: "Abierto de 9:00 a. m. a 10:00 p. m.", from: "09:00", to: "22:00", icon: "🌤️" },
  { id: "afternoon", label: "Solo tarde", hint: "Abierto de 12:00 p. m. a 11:00 p. m.", from: "12:00", to: "23:00", icon: "🌆" },
];

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
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

function TimeSelect({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-teal disabled:opacity-40"
    >
      {TIME_OPTIONS.map((option) => (
        <option key={option} value={option}>
          {formatTime12(option)}
        </option>
      ))}
    </select>
  );
}

export function MerchantHoursClient({
  locationId,
  storeSlug,
  isOpen,
  initialHours,
}: {
  locationId: string;
  storeSlug: string;
  isOpen: boolean;
  initialHours: MerchantHoursState;
}) {
  const [hours, setHours] = useState(initialHours);
  const [openNow, setOpenNow] = useState(isOpen);
  const [tab, setTab] = useState<"week" | "special" | "holidays" | "settings">("week");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const todayKey = dayKeyFromDate();
  const today = hours.weekly[todayKey];
  const todayLabel = new Date().toLocaleDateString("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const within = today.open && isWithinRange(today.from, today.to);
  const storeOpen = openNow && within && !hours.settings.pauseNewOrders;

  const upcomingHolidays = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return hours.holidays
      .filter((item) => new Date(`${item.date}T00:00:00`) >= now)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 4);
  }, [hours.holidays]);

  function updateDay(key: DayKey, partial: Partial<DayHours>) {
    setHours((current) => ({
      ...current,
      weekly: { ...current.weekly, [key]: { ...current.weekly[key], ...partial } },
    }));
  }

  function applyPreset(from: string, to: string) {
    const weekly = defaultWeekly();
    for (const day of WEEK_DAYS) {
      weekly[day.key] = { open: true, from, to };
    }
    setHours((current) => ({ ...current, weekly }));
    setNotice("Horario predefinido aplicado. Recuerda guardar.");
  }

  function copyPrevious(index: number) {
    if (index === 0) return;
    const prev = WEEK_DAYS[index - 1];
    const current = WEEK_DAYS[index];
    updateDay(current.key, hours.weekly[prev.key]);
  }

  function holidayLabel(item: SpecialDay) {
    if (!item.open) return "Cerrado";
    return "Horario especial";
  }

  async function persist(nextOpen = openNow, nextHours = hours) {
    setSaving(true);
    const form = new FormData();
    form.set("locationId", locationId);
    form.set("isOpen", nextOpen ? "1" : "0");
    form.set("hours", JSON.stringify(nextHours));
    await saveMerchantHoursAction(form);
    setSaving(false);
    setNotice("Horario actualizado en DeUna.");
  }

  async function toggleOpenNow(next: boolean) {
    setOpenNow(next);
    const form = new FormData();
    form.set("locationId", locationId);
    form.set("isOpen", next ? "1" : "0");
    await setMerchantOpenNowAction(form);
  }

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">
          Inicio
        </Link>
        <span className="px-1.5">›</span>
        <span className="text-ink/70">Horarios</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">Horarios</h1>
          <p className="mt-1 text-sm text-ink/50">
            Define los horarios de atención de tu tienda en DeUna para que los clientes sepan cuándo pueden pedir.
          </p>
        </div>
        <Link
          href={storeSlug ? `/tiendas/${storeSlug}` : "/tiendas"}
          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink hover:border-teal"
        >
          Ver mi tienda
        </Link>
      </div>

      {notice && <p className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">{notice}</p>}

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/8 bg-white px-5 py-4 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-teal/10 text-teal">⌂</span>
          <div>
            <p className="font-medium text-ink">
              {storeOpen ? "Tu tienda está abierta ahora" : "Tu tienda está cerrada ahora"}
            </p>
            <p className="text-sm text-ink/50">
              Hoy es {todayLabel}. Tu horario de atención es de {formatTime12(today.from)} a {formatTime12(today.to)}.
            </p>
          </div>
        </div>
        <select
          value={openNow ? "open" : "closed"}
          onChange={(event) => toggleOpenNow(event.target.value === "open")}
          className="rounded-full border border-ink/10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-teal"
        >
          <option value="open">Abierta</option>
          <option value="closed">Cerrada</option>
        </select>
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap gap-4 border-b border-ink/8 text-sm">
            {(
              [
                ["week", "Horario semanal"],
                ["special", "Horarios especiales"],
                ["holidays", "Días feriados"],
                ["settings", "Configuración"],
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

          {tab === "week" && (
            <div className="mt-5">
              <h2 className="font-medium text-ink">Horario de atención semanal</h2>
              <p className="mt-1 text-sm text-ink/45">Define los horarios en los que tu tienda estará disponible en DeUna.</p>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                    <tr>
                      <th className="pb-3 font-medium">Día</th>
                      <th className="pb-3 font-medium">Estado</th>
                      <th className="pb-3 font-medium">Horario de apertura</th>
                      <th className="pb-3 font-medium">Horario de cierre</th>
                      <th className="pb-3 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {WEEK_DAYS.map((day, index) => {
                      const row = hours.weekly[day.key];
                      return (
                        <tr key={day.key} className="border-t border-ink/6">
                          <td className="py-3 font-medium text-ink">{day.label}</td>
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Switch
                                on={row.open}
                                label={row.open ? "Cerrar este día" : "Abrir este día"}
                                onClick={() => updateDay(day.key, { open: !row.open })}
                              />
                              <span className={row.open ? "text-xs font-medium text-teal" : "text-xs text-ink/40"}>
                                {row.open ? "Abierto" : "Cerrado"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3">
                            <TimeSelect value={row.from} disabled={!row.open} onChange={(value) => updateDay(day.key, { from: value })} />
                          </td>
                          <td className="py-3">
                            <TimeSelect value={row.to} disabled={!row.open} onChange={(value) => updateDay(day.key, { to: value })} />
                          </td>
                          <td className="py-3">
                            <button
                              type="button"
                              onClick={() => copyPrevious(index)}
                              disabled={index === 0}
                              className="text-ink/30 hover:text-ink disabled:opacity-20"
                              aria-label="Copiar día anterior"
                            >
                              ⧉
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "special" && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-medium text-ink">Horarios especiales</h2>
                  <p className="text-sm text-ink/45">Fechas puntuales que reemplazan el horario semanal.</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setHours((current) => ({
                      ...current,
                      special: [
                        ...current.special,
                        {
                          id: `sp-${Date.now()}`,
                          date: new Date().toISOString().slice(0, 10),
                          name: "Horario especial",
                          open: true,
                          from: "10:00",
                          to: "18:00",
                        },
                      ],
                    }))
                  }
                  className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white"
                >
                  + Agregar fecha
                </button>
              </div>
              {hours.special.length === 0 ? (
                <p className="text-sm text-ink/40">No hay horarios especiales. Agrega un partido, un evento o un cierre puntual.</p>
              ) : (
                <ul className="space-y-3">
                  {hours.special.map((item) => (
                    <li key={item.id} className="grid gap-2 rounded-2xl border border-ink/8 p-3 sm:grid-cols-5 sm:items-center">
                      <input
                        type="date"
                        value={item.date}
                        onChange={(event) =>
                          setHours((current) => ({
                            ...current,
                            special: current.special.map((row) => (row.id === item.id ? { ...row, date: event.target.value } : row)),
                          }))
                        }
                        className="rounded-xl border border-ink/10 px-3 py-2 text-sm"
                      />
                      <input
                        value={item.name}
                        onChange={(event) =>
                          setHours((current) => ({
                            ...current,
                            special: current.special.map((row) => (row.id === item.id ? { ...row, name: event.target.value } : row)),
                          }))
                        }
                        className="rounded-xl border border-ink/10 px-3 py-2 text-sm sm:col-span-2"
                      />
                      <TimeSelect
                        value={item.from}
                        onChange={(value) =>
                          setHours((current) => ({
                            ...current,
                            special: current.special.map((row) => (row.id === item.id ? { ...row, from: value } : row)),
                          }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setHours((current) => ({
                            ...current,
                            special: current.special.filter((row) => row.id !== item.id),
                          }))
                        }
                        className="text-xs text-coral"
                      >
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {tab === "holidays" && (
            <div className="mt-5 space-y-3">
              <h2 className="font-medium text-ink">Días feriados</h2>
              <p className="text-sm text-ink/45">Marca si cierras o usas un horario especial en feriados de República Dominicana.</p>
              {hours.holidays.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/8 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink/40">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("es-DO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      on={item.open}
                      label="Abrir en feriado"
                      onClick={() =>
                        setHours((current) => ({
                          ...current,
                          holidays: current.holidays.map((row) => (row.id === item.id ? { ...row, open: !row.open } : row)),
                        }))
                      }
                    />
                    <span className="text-xs text-ink/50">{holidayLabel(item)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === "settings" && (
            <div className="mt-5 space-y-3">
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-ink/8 px-4 py-3">
                <span>
                  <p className="text-sm font-medium text-ink">Mostrar horario en la tienda</p>
                  <p className="text-xs text-ink/45">Los clientes verán cuándo estás abierto.</p>
                </span>
                <Switch
                  on={hours.settings.showHoursOnStore}
                  label="Mostrar horario"
                  onClick={() =>
                    setHours((current) => ({
                      ...current,
                      settings: { ...current.settings, showHoursOnStore: !current.settings.showHoursOnStore },
                    }))
                  }
                />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-ink/8 px-4 py-3">
                <span>
                  <p className="text-sm font-medium text-ink">Cerrar automáticamente fuera de horario</p>
                  <p className="text-xs text-ink/45">DeUna no tomará pedidos nuevos fuera de tu horario semanal.</p>
                </span>
                <Switch
                  on={hours.settings.autoCloseOutsideHours}
                  label="Cierre automático"
                  onClick={() =>
                    setHours((current) => ({
                      ...current,
                      settings: { ...current.settings, autoCloseOutsideHours: !current.settings.autoCloseOutsideHours },
                    }))
                  }
                />
              </label>
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-ink/8 px-4 py-3">
                <span>
                  <p className="text-sm font-medium text-ink">Pausar pedidos nuevos</p>
                  <p className="text-xs text-ink/45">Útil si hay mucha demanda o un problema en cocina.</p>
                </span>
                <Switch
                  on={hours.settings.pauseNewOrders}
                  label="Pausar pedidos"
                  onClick={() =>
                    setHours((current) => ({
                      ...current,
                      settings: { ...current.settings, pauseNewOrders: !current.settings.pauseNewOrders },
                    }))
                  }
                />
              </label>
            </div>
          )}
        </section>

        <div className="space-y-4">
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <h2 className="font-medium text-ink">Horarios predefinidos</h2>
            <p className="mt-1 text-xs text-ink/45">Aplica rápidamente un horario común a toda la semana.</p>
            <ul className="mt-4 space-y-3">
              {PRESETS.map((preset) => (
                <li key={preset.id} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {preset.icon} {preset.label}
                    </p>
                    <p className="text-xs text-ink/40">{preset.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => applyPreset(preset.from, preset.to)}
                    className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink hover:border-coral hover:text-coral"
                  >
                    Aplicar
                  </button>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Próximos días feriados</h2>
              <button type="button" onClick={() => setTab("holidays")} className="text-xs font-medium text-coral hover:underline">
                Ver todos
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {upcomingHolidays.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                  <div>
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-xs text-ink/40">
                      {new Date(`${item.date}T00:00:00`).toLocaleDateString("es-DO", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="text-xs text-ink/50">{holidayLabel(item)}</span>
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/8 bg-white px-5 py-4 shadow-sm">
        <p className="max-w-xl text-sm text-ink/50">
          Importante: los cambios de horarios se reflejan en DeUna. Asegúrate de mantener tu horario actualizado para ofrecer la mejor experiencia a tus clientes.
        </p>
        <button
          type="button"
          onClick={() => persist()}
          disabled={saving}
          className="rounded-full bg-coral px-5 py-2.5 text-sm font-semibold text-white hover:bg-coral-dark disabled:opacity-60"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </div>
  );
}
