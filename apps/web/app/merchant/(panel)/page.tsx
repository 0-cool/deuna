import Link from "next/link";
import { getCurrentMerchant } from "@/lib/auth";
import { getMerchantDashboard } from "@/lib/merchant-data";
import { HourlyBarChart, SalesLineChart } from "@/components/merchant/MerchantCharts";
import { formatDOP } from "@deuna/utils";

export const dynamic = "force-dynamic";

const ORDER_LABELS: Record<string, { label: string; className: string }> = {
  ORDER_PLACED: { label: "Nuevo", className: "bg-gold/15 text-ink" },
  MERCHANT_ACCEPTED: { label: "Aceptado", className: "bg-teal/10 text-teal" },
  PREPARING: { label: "En preparación", className: "bg-coral/10 text-coral" },
  READY_FOR_PICKUP: { label: "Listo", className: "bg-gold/15 text-ink" },
  DRIVER_ASSIGNED: { label: "Asignado", className: "bg-teal/10 text-teal" },
  PICKED_UP: { label: "Recogido", className: "bg-teal/10 text-teal" },
  ON_THE_WAY: { label: "En camino", className: "bg-coral/10 text-coral" },
  DELIVERED: { label: "Entregado", className: "bg-teal/10 text-teal" },
  CANCELLED: { label: "Cancelado", className: "bg-ink/5 text-ink/45" },
};

const PROMO_LABELS: Record<string, string> = {
  PERCENTAGE: "Descuento porcentual",
  FIXED_AMOUNT: "Monto fijo",
  FREE_DELIVERY: "Envío gratis",
  BUY_X_GET_Y: "2x1 o combo",
};

function Delta({ value }: { value: number }) {
  if (value === 0) return <span className="text-xs text-ink/35">Sin cambio</span>;
  const up = value > 0;
  return (
    <span className={up ? "text-xs font-medium text-teal" : "text-xs font-medium text-coral"}>
      {up ? "↑" : "↓"} {Math.abs(value)}% vs. periodo anterior
    </span>
  );
}

function KpiCard({
  icon,
  label,
  value,
  hint,
  delta,
}: {
  icon: string;
  label: string;
  value: string;
  hint?: string;
  delta?: number;
}) {
  return (
    <article className="rounded-2xl border border-ink/8 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-ink/45">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#F6F5F2] text-sm">
          {icon}
        </span>
        <p className="text-xs font-medium">{label}</p>
      </div>
      <p className="mt-3 font-display text-2xl text-ink">{value}</p>
      <div className="mt-1">
        {hint ? <span className="text-xs text-ink/45">{hint}</span> : <Delta value={delta ?? 0} />}
      </div>
    </article>
  );
}

export default async function MerchantDashboardPage() {
  const merchant = await getCurrentMerchant();
  if (!merchant) return null;

  const data = await getMerchantDashboard(merchant.id);
  const firstName = merchant.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-ink sm:text-4xl">¡Hola, {firstName}!</h1>
          <p className="mt-1 text-sm text-ink/50">
            Gestiona tus productos, pedidos y el rendimiento de tu tienda en DeUna.
          </p>
        </div>
        <p className="rounded-full border border-ink/10 bg-white px-3 py-1 text-xs text-ink/45">
          Últimos 7 días
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          icon="🛒"
          label="Ventas de hoy"
          value={formatDOP(data.kpis.revenueToday)}
          delta={data.kpis.revenueTodayDelta}
        />
        <KpiCard
          icon="📦"
          label="Pedidos activos"
          value={String(data.kpis.pendingOrders)}
          hint={`${data.kpis.preparingOrders} en preparación`}
        />
        <KpiCard
          icon="🧊"
          label="Productos publicados"
          value={String(data.kpis.publishedProducts)}
          hint={`${data.kpis.newProductsThisWeek} nuevos esta semana`}
        />
        <KpiCard
          icon="%"
          label="Tasa de conversión"
          value={`${data.kpis.conversion}%`}
          delta={data.kpis.conversionDelta}
        />
        <KpiCard
          icon="💵"
          label="Ingreso semanal"
          value={formatDOP(data.kpis.weeklyRevenue)}
          delta={data.kpis.weeklyDelta}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr_0.9fr]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium text-ink">Ventas de los últimos 7 días</h2>
              <p className="mt-1 font-display text-2xl text-ink">{formatDOP(data.kpis.weeklyRevenue)}</p>
              <Delta value={data.kpis.weeklyDelta} />
            </div>
          </div>
          <div className="mt-4">
            <SalesLineChart points={data.salesByDay} />
          </div>
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-medium text-ink">Pedidos por hora (hoy)</h2>
              <p className="mt-1 font-display text-2xl text-ink">{data.kpis.ordersToday} pedidos</p>
            </div>
            <span className="text-xs text-ink/35">Hoy</span>
          </div>
          <div className="mt-4">
            <HourlyBarChart points={data.ordersByHour} />
          </div>
        </article>

        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-ink">{merchant.name}</p>
              <p className="text-xs text-ink/40">
                {data.store.isOpen ? "Abierta" : "Cerrada"} · tienda en línea activa
              </p>
            </div>
            <span
              className={
                data.store.isOpen
                  ? "rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal"
                  : "rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-ink/45"
              }
            >
              {data.store.isOpen ? "Abierta" : "Cerrada"}
            </span>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-ink/40">Horario de atención</dt>
              <dd className="text-right text-ink">Lun–Dom · 8:00 a. m. – 12:00 a. m.</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/40">Radio de delivery</dt>
              <dd className="text-ink">Hasta 5 km</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-ink/40">Zonas de entrega</dt>
              <dd className="text-right text-ink">{data.store.zoneName}</dd>
            </div>
          </dl>
          <Link
            href="/merchant/tienda"
            className="mt-5 block text-center text-sm font-medium text-coral hover:underline"
          >
            Editar información de la tienda
          </Link>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-medium text-ink">Productos</h2>
              <p className="text-xs text-ink/40">Administra tu catálogo en DeUna.</p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/merchant/productos/nuevo"
                className="rounded-full bg-coral px-3 py-1.5 text-xs font-semibold text-white hover:bg-coral-dark"
              >
                + Agregar producto
              </Link>
              <Link
                href="/merchant/productos"
                className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/60 hover:text-ink"
              >
                Ver todos
              </Link>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                <tr>
                  <th className="pb-3 font-medium">Producto</th>
                  <th className="pb-3 font-medium">Categoría</th>
                  <th className="pb-3 font-medium">Precio</th>
                  <th className="pb-3 font-medium">Stock</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {data.products.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-ink/40">
                      Todavía no tienes productos cargados.
                    </td>
                  </tr>
                ) : (
                  data.products.map((product) => (
                    <tr key={product.id} className="border-t border-ink/6">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                            {product.imageUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={product.imageUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-ink/30">
                                {product.productName.slice(0, 1)}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-ink">{product.productName}</p>
                            <p className="text-xs text-ink/40">{product.brand}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-ink/60">{product.categoryName}</td>
                      <td className="py-3 text-ink">{formatDOP(product.price)}</td>
                      <td className="py-3 text-ink">{product.quantity}</td>
                      <td className="py-3">
                        <span
                          className={
                            product.isAvailable
                              ? "inline-flex items-center gap-1 text-xs font-medium text-teal"
                              : "inline-flex items-center gap-1 text-xs font-medium text-ink/40"
                          }
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {product.isAvailable ? "Publicado" : "Oculto"}
                        </span>
                      </td>
                      <td className="py-3">
                        <Link
                          href={`/merchant/productos/${product.id}/editar`}
                          className="text-xs font-medium text-coral hover:underline"
                        >
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </article>

        <div className="space-y-4">
          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Alertas de inventario</h2>
              <Link href="/merchant/inventario" className="text-xs font-medium text-coral hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {data.lowStock.length === 0 ? (
                <li className="text-sm text-ink/40">Todo el inventario está en buen nivel.</li>
              ) : (
                data.lowStock.map((item) => (
                  <li key={item.id} className="flex items-center gap-3">
                    <div className="h-10 w-10 overflow-hidden rounded-lg bg-[#F6F5F2]">
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{item.productName}</p>
                      <p className="text-xs text-coral">Stock: {item.quantity} unidades</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Pedidos recientes</h2>
              <Link href="/merchant/pedidos" className="text-xs font-medium text-coral hover:underline">
                Ver todos
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {data.recentOrders.length === 0 ? (
                <li className="text-sm text-ink/40">Todavía no hay pedidos.</li>
              ) : (
                data.recentOrders.map((order) => {
                  const status = ORDER_LABELS[order.status] ?? {
                    label: order.status,
                    className: "bg-ink/5 text-ink/50",
                  };
                  return (
                    <li key={order.id} className="flex items-center justify-between gap-3 text-sm">
                      <div>
                        <p className="font-medium text-ink">{order.code}</p>
                        <p className="text-xs text-ink/40">
                          {order.createdAt.toLocaleString("es-DO", {
                            day: "numeric",
                            month: "short",
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <p className="font-medium text-ink">{formatDOP(order.total)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </article>

          <article className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="font-medium text-ink">Promociones activas</h2>
              <Link href="/merchant/promociones" className="text-xs font-medium text-coral hover:underline">
                Ver todas
              </Link>
            </div>
            <ul className="mt-4 space-y-3">
              {data.promotions.length === 0 ? (
                <li className="text-sm text-ink/40">
                  No hay promociones activas.{" "}
                  <Link href="/merchant/promociones" className="text-coral hover:underline">
                    Crea una
                  </Link>
                  .
                </li>
              ) : (
                data.promotions.map((promo) => (
                  <li key={promo.id} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{PROMO_LABELS[promo.type] ?? promo.type}</p>
                      <p className="text-xs text-ink/40">
                        Válido hasta {promo.endDate.toLocaleDateString("es-DO")}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal">
                      Activa
                    </span>
                  </li>
                ))
              )}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
