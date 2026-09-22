import { getCurrentDriver } from "@/lib/auth";
import { getDriverStats } from "@/lib/driver-data";
import { updateDriverProfileAction } from "../actions";

export const dynamic = "force-dynamic";

const VEHICLE_LABELS: Record<string, string> = {
  MOTORCYCLE: "🏍️ Motocicleta",
  CAR: "🚗 Carro",
  BICYCLE: "🚲 Bicicleta",
  ON_FOOT: "🚶 A pie",
};

const NOTICE_LABELS: Record<string, string> = {
  updated: "Perfil actualizado.",
};

export default async function DriverProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const driver = await getCurrentDriver();
  if (!driver) return null;

  const { notice } = await searchParams;
  const noticeLabel = notice ? NOTICE_LABELS[notice] : undefined;
  const stats = await getDriverStats(driver.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-paper">Mi perfil</h1>
      <p className="mt-1 text-sm text-paper/60">
        Esta información la ven los clientes cuando te asignan un pedido.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-4 sm:max-w-md">
        <div
          className={
            stats.activeCount > 0
              ? "rounded-card border border-coral/40 bg-coral/10 p-5"
              : "rounded-card border border-ink-border bg-ink-soft p-5"
          }
        >
          <p className="text-sm text-paper/60">En curso</p>
          <p className="mt-2 font-display text-2xl text-paper">{stats.activeCount}</p>
        </div>
        <div className="rounded-card border border-ink-border bg-ink-soft p-5">
          <p className="text-sm text-paper/60">Entregados hoy</p>
          <p className="mt-2 font-display text-2xl text-paper">{stats.deliveredTodayCount}</p>
        </div>
      </div>

      {noticeLabel && (
        <p className="mt-4 rounded-card border border-teal/40 bg-teal/10 px-4 py-3 text-sm text-teal-light">
          {noticeLabel}
        </p>
      )}

      <p className="mt-6 text-sm text-paper/60">
        Toma y da seguimiento a tus entregas en{" "}
        <a href="/driver/pedidos" className="text-teal-light hover:underline">
          Pedidos
        </a>
        .
      </p>

      <div className="mt-6 flex items-center gap-4 rounded-card border border-ink-border bg-ink-soft p-5">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-2xl">
          {driver.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={driver.photoUrl}
              alt={driver.fullName}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden>🛵</span>
          )}
        </div>
        <div>
          <p className="font-display text-lg text-paper">{driver.fullName}</p>
          <p className="text-sm text-paper/60">
            ⭐ {driver.rating.toFixed(1)} · {VEHICLE_LABELS[driver.vehicleType]}
          </p>
          <p className="mt-1 text-xs">
            {driver.isActive ? (
              <span className="text-teal-light">● Disponible ahora</span>
            ) : (
              <span className="text-paper/40">● No disponible</span>
            )}
          </p>
        </div>
      </div>

      <form action={updateDriverProfileAction} className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="text-xs text-paper/60">
          Nombre completo
          <input
            name="fullName"
            defaultValue={driver.fullName}
            required
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="text-xs text-paper/60">
          Teléfono
          <input
            name="phone"
            defaultValue={driver.phone}
            required
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="text-xs text-paper/60">
          Tipo de vehículo
          <select
            name="vehicleType"
            defaultValue={driver.vehicleType}
            required
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          >
            {Object.entries(VEHICLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-xs text-paper/60">
          Placa (opcional)
          <input
            name="vehiclePlate"
            defaultValue={driver.vehiclePlate ?? ""}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="text-xs text-paper/60 sm:col-span-2">
          Foto (URL, opcional)
          <input
            name="photoUrl"
            type="url"
            defaultValue={driver.photoUrl ?? ""}
            className="mt-1 block w-full rounded-lg border border-ink-border bg-ink-soft px-3 py-2 text-sm text-paper outline-none focus:border-teal"
          />
        </label>

        <label className="flex items-center gap-2 text-xs text-paper/60">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={driver.isActive}
            className="h-4 w-4"
          />
          Disponible para recibir pedidos ahora
        </label>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-teal px-5 py-2.5 text-sm font-medium text-paper transition hover:bg-teal-light"
          >
            Guardar cambios
          </button>
        </div>
      </form>

      <p className="mt-4 text-xs text-paper/40">
        Tu calificación (⭐ {driver.rating.toFixed(1)}) se calcula a partir de las reseñas de tus
        entregas y no se edita aquí.
      </p>
    </div>
  );
}
