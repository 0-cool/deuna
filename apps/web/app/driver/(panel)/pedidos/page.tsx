import { getCurrentDriver } from "@/lib/auth";
import {
  getAvailablePickups,
  getDriverActiveOrders,
  getDriverHistory,
} from "@/lib/driver-data";
import { formatDOP } from "@deuna/utils";
import {
  claimOrderAction,
  markPickedUpAction,
  markOnTheWayAction,
  markDeliveredAction,
} from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  DRIVER_ASSIGNED: "Asignado a ti",
  PICKED_UP: "Recogido",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
};

export default async function DriverOrdersPage() {
  const driver = await getCurrentDriver();
  if (!driver) return null;

  const [available, active, history] = await Promise.all([
    getAvailablePickups(),
    getDriverActiveOrders(driver.id),
    getDriverHistory(driver.id),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl text-paper">Pedidos</h1>
        <p className="mt-1 text-sm text-paper/60">
          Toma pedidos disponibles, avanza los que ya llevas en curso y revisa tu historial.
        </p>
      </div>

      <section>
        <h2 className="font-display text-lg text-paper">Disponibles para tomar</h2>
        {available.length === 0 ? (
          <p className="mt-3 text-sm text-paper/50">
            No hay pedidos listos para recoger en este momento.
          </p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {available.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-ink-border bg-ink-soft p-4"
              >
                <div>
                  <p className="font-medium text-paper">
                    {order.code} · {order.merchantName}
                  </p>
                  <p className="text-sm text-paper/60">Recoger en: {order.pickupAddress}</p>
                  <p className="text-sm text-paper/60">Entregar en: {order.dropoffAddress}</p>
                  <p className="mt-1 text-xs text-paper/40">
                    {order.itemCount} artículo(s) · {formatDOP(order.total)}
                  </p>
                </div>
                <form action={claimOrderAction}>
                  <input type="hidden" name="orderId" value={order.id} />
                  <button className="whitespace-nowrap rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light">
                    Tomar pedido
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-paper">En curso</h2>
        {active.length === 0 ? (
          <p className="mt-3 text-sm text-paper/50">No tienes pedidos en curso.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-3">
            {active.map((order) => (
              <div key={order.id} className="rounded-card border border-ink-border bg-ink-soft p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-paper">
                      {order.code} · {order.merchantName}
                    </p>
                    <p className="text-sm text-paper/60">Recoger en: {order.pickupAddress}</p>
                    <p className="text-sm text-paper/60">
                      Entregar a {order.customerName}: {order.dropoffAddress}
                    </p>
                    <p className="mt-1 text-xs text-paper/40">
                      {order.itemCount} artículo(s) · {formatDOP(order.total)}
                    </p>
                  </div>
                  <span className="whitespace-nowrap rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper/80">
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.status === "DRIVER_ASSIGNED" && (
                    <form action={markPickedUpAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light">
                        Marcar recogido
                      </button>
                    </form>
                  )}
                  {order.status === "PICKED_UP" && (
                    <form action={markOnTheWayAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light">
                        Marcar en camino
                      </button>
                    </form>
                  )}
                  {order.status === "ON_THE_WAY" && (
                    <form action={markDeliveredAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper transition hover:bg-teal-light">
                        Marcar entregado
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-lg text-paper">Historial</h2>
        {history.length === 0 ? (
          <p className="mt-3 text-sm text-paper/50">Todavía no has completado entregas.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {history.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-card border border-ink-border bg-ink-soft px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-paper">
                    {order.code} · {order.merchantName}
                  </p>
                  <p className="text-xs text-paper/50">{order.dropoffAddress}</p>
                </div>
                <p className="text-sm text-paper/70">{formatDOP(order.total)}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
