import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantDashboardStats } from "@/lib/merchant-data";
import { formatDOP } from "@deuna/utils";

export const dynamic = "force-dynamic";

export default async function MerchantDashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null; // el layout ya redirige, esto es solo para TypeScript

  const stats = await getMerchantDashboardStats(merchant.id);

  const cards = [
    { label: "Pedidos hoy", value: String(stats.ordersToday) },
    { label: "Ventas hoy", value: formatDOP(stats.revenueToday) },
    { label: "Ticket promedio", value: formatDOP(stats.averageOrderToday) },
    { label: "Pedidos pendientes", value: String(stats.pendingOrders), highlight: stats.pendingOrders > 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-paper">Hoy</h1>
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className={
              card.highlight
                ? "rounded-card border border-coral/40 bg-coral/10 p-5"
                : "rounded-card border border-ink-border bg-ink-soft p-5"
            }
          >
            <p className="text-sm text-paper/60">{card.label}</p>
            <p className="mt-2 font-display text-2xl text-paper">{card.value}</p>
          </div>
        ))}
      </div>

      {stats.pendingOrders > 0 && (
        <p className="mt-6 text-sm text-paper/60">
          Tienes {stats.pendingOrders}{" "}
          {stats.pendingOrders === 1 ? "pedido esperando" : "pedidos esperando"} tu acción —
          revísalos en{" "}
          <a href="/merchant/pedidos" className="text-teal-light hover:underline">
            Pedidos
          </a>
          .
        </p>
      )}
    </div>
  );
}