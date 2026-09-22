import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantOrders } from "@/lib/merchant-data";
import { formatDOP } from "@deuna/utils";
import {
  acceptOrderAction,
  rejectOrderAction,
  markPreparingAction,
  markReadyAction,
} from "../../actions";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  ORDER_PLACED: "Nuevo",
  MERCHANT_ACCEPTED: "Aceptado",
  PREPARING: "Preparando",
  READY_FOR_PICKUP: "Listo para recoger",
  DRIVER_ASSIGNED: "Delivery asignado",
  PICKED_UP: "Recogido",
  ON_THE_WAY: "En camino",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
};

export default async function MerchantOrdersPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const orders = await getMerchantOrders(merchant.id);

  return (
    <div>
      <h1 className="font-display text-2xl text-paper">Pedidos</h1>

      {orders.length === 0 ? (
        <p className="mt-8 text-paper/60">
          Todavía no has recibido pedidos. Cuando el checkout de clientes esté conectado a la
          base de datos, aparecerán aquí automáticamente.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-card border border-ink-border bg-ink-soft p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-paper">{order.code}</p>
                  <p className="text-sm text-paper/60">
                    {order.customerName} · {order.address}
                  </p>
                </div>
                <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper/80">
                  {STATUS_LABELS[order.status] ?? order.status}
                </span>
              </div>

              <ul className="mt-3 flex flex-col gap-1 text-sm text-paper/70">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity}× {item.productName}
                  </li>
                ))}
              </ul>

              <p className="mt-3 font-display text-lg text-paper">{formatDOP(order.total)}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                {order.status === "ORDER_PLACED" && (
                  <>
                    <form action={acceptOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light">
                        Aceptar
                      </button>
                    </form>
                    <form action={rejectOrderAction}>
                      <input type="hidden" name="orderId" value={order.id} />
                      <button className="rounded-lg border border-coral/50 px-4 py-2 text-sm font-medium text-coral hover:bg-coral/10">
                        Rechazar
                      </button>
                    </form>
                  </>
                )}

                {order.status === "MERCHANT_ACCEPTED" && (
                  <form action={markPreparingAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light">
                      Marcar preparando
                    </button>
                  </form>
                )}

                {order.status === "PREPARING" && (
                  <form action={markReadyAction}>
                    <input type="hidden" name="orderId" value={order.id} />
                    <button className="rounded-lg bg-teal px-4 py-2 text-sm font-medium text-paper hover:bg-teal-light">
                      Marcar listo para recoger
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}