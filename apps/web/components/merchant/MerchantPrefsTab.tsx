"use client";

import type { MerchantSettingsExtras } from "@/lib/merchant-settings-storage";

const inputClass = "mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal";

const ACCENTS: { id: MerchantSettingsExtras["accentColor"]; hex: string }[] = [
  { id: "coral", hex: "#FF5C4D" },
  { id: "teal", hex: "#0E7C7B" },
  { id: "blue", hex: "#3B6FCF" },
  { id: "gold", hex: "#F2B705" },
  { id: "green", hex: "#1F8A4C" },
  { id: "purple", hex: "#7B5EA7" },
];

export function MerchantPrefsTab({
  extras,
  patch,
  saving,
  onSave,
  onGuide,
}: {
  extras: MerchantSettingsExtras;
  patch: (partial: Partial<MerchantSettingsExtras>) => void;
  saving: boolean;
  onSave: () => void;
  onGuide: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card icon="globe" title="Idioma y región" hint="Define el idioma, moneda y zona horaria de tu tienda.">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="text-xs text-ink/50">
              Idioma de la tienda
              <select value={extras.language} onChange={(event) => patch({ language: event.target.value as "es" })} className={inputClass}>
                <option value="es">Español</option>
              </select>
            </label>
            <label className="text-xs text-ink/50">
              Moneda
              <select value={extras.currency} onChange={(event) => patch({ currency: event.target.value as "DOP" })} className={inputClass}>
                <option value="DOP">RD$ (DOP)</option>
              </select>
            </label>
            <label className="text-xs text-ink/50">
              Zona horaria
              <select
                value={extras.timezone}
                onChange={(event) => patch({ timezone: event.target.value as "America/Santo_Domingo" })}
                className={inputClass}
              >
                <option value="America/Santo_Domingo">(GMT-04:00) Santo Domingo</option>
              </select>
            </label>
          </div>
        </Card>

        <Card icon="palette" title="Apariencia del panel" hint="Personaliza la apariencia de tu panel de administración.">
          <p className="text-xs text-ink/50">Tema</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {(
              [
                { id: "light", label: "Claro", icon: "sun" },
                { id: "dark", label: "Oscuro", icon: "moon" },
                { id: "system", label: "Sistema", icon: "monitor" },
              ] as const
            ).map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => patch({ theme: theme.id })}
                className={
                  extras.theme === theme.id
                    ? "flex items-center justify-center gap-2 rounded-xl border border-coral bg-[#FFF4F2] px-3 py-2 text-sm font-medium text-ink"
                    : "flex items-center justify-center gap-2 rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink/60 hover:border-teal"
                }
              >
                <PrefIcon name={theme.icon} />
                {theme.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs text-ink/50">Color principal</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((color) => (
              <button
                key={color.id}
                type="button"
                aria-label={`Color ${color.id}`}
                onClick={() => patch({ accentColor: color.id })}
                className="h-7 w-7 rounded-full"
                style={{
                  background: color.hex,
                  boxShadow: extras.accentColor === color.id ? `0 0 0 3px #fff, 0 0 0 5px ${color.hex}` : undefined,
                }}
              />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-ink/35">El tema oscuro se guardará aquí. El panel de DeUna sigue en modo claro por ahora.</p>
        </Card>

        <Card icon="store" title="Configuración de tienda" hint="Ajusta opciones generales de funcionamiento.">
          <Toggle label="Mostrar mi tienda en DeUna" hint="Tu tienda está visible para clientes en la plataforma." on={extras.showInMarketplace} onClick={() => patch({ showInMarketplace: !extras.showInMarketplace })} />
          <Toggle label="Permitir pedidos programados" hint="Los clientes pueden programar pedidos para más tarde." on={extras.acceptScheduled} onClick={() => patch({ acceptScheduled: !extras.acceptScheduled })} />
          <Toggle label="Mostrar productos sin inventario" hint="Los productos agotados se ven en tu tienda." on={extras.showOutOfStock} onClick={() => patch({ showOutOfStock: !extras.showOutOfStock })} />
          <Toggle label="Sugerir productos relacionados" hint="Muestra productos similares a tus clientes." on={extras.suggestRelated} onClick={() => patch({ suggestRelated: !extras.suggestRelated })} />
          <Toggle label="Permitir mensajes de clientes" hint="Los clientes pueden enviarte mensajes desde la app." on={extras.allowCustomerChat} onClick={() => patch({ allowCustomerChat: !extras.allowCustomerChat })} />
        </Card>

        <Card icon="box" title="Preferencias de pedidos" hint="Define cómo quieres recibir y gestionar los pedidos.">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs text-ink/50">
              Tiempo por defecto de preparación
              <select value={extras.prepMinutes} onChange={(event) => patch({ prepMinutes: Number(event.target.value) })} className={inputClass}>
                {[10, 15, 20, 30, 45].map((mins) => (
                  <option key={mins} value={mins}>{mins} minutos</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/50">
              Pedido mínimo por defecto
              <select value={extras.minOrder} onChange={(event) => patch({ minOrder: Number(event.target.value) })} className={inputClass}>
                {Array.from(new Set([0, 200, 300, 400, 500, extras.minOrder])).sort((a, b) => a - b).map((amount) => (
                  <option key={amount} value={amount}>RD$ {amount}</option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/50">
              Radio de entrega por defecto
              <select value={extras.deliveryRadiusKm} onChange={(event) => patch({ deliveryRadiusKm: Number(event.target.value) })} className={inputClass}>
                {[3, 5, 8, 10, 15].map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Toggle label="Agrupar pedidos cercanos" hint="Junta pedidos de una misma zona." on={extras.groupNearby} onClick={() => patch({ groupNearby: !extras.groupNearby })} />
            </div>
          </div>
        </Card>

        <Card icon="chat" title="Comunicación con clientes" hint="Define tu tono y respuesta automática.">
          <label className="block text-xs text-ink/50">
            Mensaje automático de confirmación
            <textarea
              value={extras.confirmationMessage}
              maxLength={300}
              rows={4}
              onChange={(event) => patch({ confirmationMessage: event.target.value })}
              className={inputClass}
            />
            <span className="mt-1 block text-right text-[11px] text-ink/35">{extras.confirmationMessage.length}/300</span>
          </label>
        </Card>

        <div className="space-y-4">
          <Card icon="bag" title="Preferencias de inventario" hint="Configura alertas y comportamiento de inventario.">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs text-ink/50">
                Alerta de stock bajo
                <input
                  type="number"
                  min={0}
                  value={extras.lowStockAlert}
                  onChange={(event) => patch({ lowStockAlert: Number(event.target.value) || 0 })}
                  className={inputClass}
                />
                <span className="mt-1 block text-[11px] text-ink/35">Recibe una notificación cuando un producto tenga esta cantidad.</span>
              </label>
              <label className="text-xs text-ink/50">
                Comportamiento al agotarse
                <select
                  value={extras.outOfStockBehavior}
                  onChange={(event) => patch({ outOfStockBehavior: event.target.value as MerchantSettingsExtras["outOfStockBehavior"] })}
                  className={inputClass}
                >
                  <option value="mark">Marcar como agotado</option>
                  <option value="hide">Ocultar el producto</option>
                  <option value="suggest">Sugerir un reemplazo</option>
                </select>
              </label>
            </div>
          </Card>

          <Card icon="lock" title="Privacidad y seguridad" hint="Ajusta opciones de privacidad y visibilidad.">
            <Toggle label="Mostrar mi número de teléfono" hint="Los clientes pueden contactarte desde tu perfil de tienda." on={extras.showPhone} onClick={() => patch({ showPhone: !extras.showPhone })} />
            <Toggle label="Permitir que el cliente vea mi dirección exacta" hint="Si está apagado, solo verán el sector." on={extras.showExactAddress} onClick={() => patch({ showExactAddress: !extras.showExactAddress })} />
            <Toggle label="Guardar historial de actividad" hint="Conserva un registro de acciones importantes en tu tienda." on={extras.keepActivityLog} onClick={() => patch({ keepActivityLog: !extras.keepActivityLog })} />
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={onSave} disabled={saving} className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-xs rounded-2xl bg-[#FFF4F2] p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-coral shadow-sm">
          <PrefIcon name="spark" />
        </div>
        <p className="font-display text-lg text-ink">Personaliza tu tienda</p>
        <p className="mt-1 text-xs leading-relaxed text-ink/55">
          Ajusta tus preferencias y adapta DeUna a las necesidades de tu negocio.
        </p>
        <button type="button" onClick={onGuide} className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark">
          Ver guía
        </button>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  hint,
  children,
}: {
  icon: "globe" | "palette" | "store" | "box" | "chat" | "bag" | "lock";
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F3EEF8] text-[#7B5EA7]">
          <PrefIcon name={icon} />
        </span>
        <div>
          <h2 className="font-medium text-ink">{title}</h2>
          <p className="text-xs text-ink/45">{hint}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-ink/6 py-3 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-ink/40">{hint}</p>
      </div>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={on ? "relative h-6 w-10 shrink-0 rounded-full bg-teal" : "relative h-6 w-10 shrink-0 rounded-full bg-ink/15"}
      >
        <span className={on ? "absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" : "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"} />
      </button>
    </div>
  );
}

function PrefIcon({
  name,
}: {
  name: "globe" | "palette" | "store" | "box" | "chat" | "bag" | "lock" | "sun" | "moon" | "monitor" | "spark";
}) {
  const className = "h-4 w-4";
  if (name === "globe") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="8" /><path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" /></svg>;
  if (name === "palette") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 4a8 8 0 1 0 0 16h2a2 2 0 0 0 0-4h-1" /><circle cx="8" cy="10" r="1" /><circle cx="10.5" cy="7.5" r="1" /><circle cx="14" cy="8" r="1" /></svg>;
  if (name === "store") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 10 6 5h12l2 5M5 10v9h14v-9M9 19v-5h6v5" /></svg>;
  if (name === "box") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 8h16v11H4zM4 8l8-4 8 4M12 4v15" /></svg>;
  if (name === "chat") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M5 6h14v10H8l-3 3z" /></svg>;
  if (name === "bag") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 8h12l-1 12H7zM9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  if (name === "lock") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M9 10V7a3 3 0 0 1 6 0v3" /></svg>;
  if (name === "sun") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3.5" /><path d="M12 3v2M12 19v2M4.2 6.2l1.4 1.4M18.4 16.4l1.4 1.4M3 12h2M19 12h2M4.2 17.8l1.4-1.4M18.4 7.6l1.4-1.4" /></svg>;
  if (name === "moon") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 3a8 8 0 1 0 5 13 7 7 0 0 1-5-13Z" /></svg>;
  if (name === "monitor") return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="12" rx="2" /><path d="M8 21h8M12 17v4" /></svg>;
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v4M12 17v4M5 8l2.5 2.5M16.5 13.5 19 16M3 12h4M17 12h4M5 16l2.5-2.5M16.5 10.5 19 8" /></svg>;
}
