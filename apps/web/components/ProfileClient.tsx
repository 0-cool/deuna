"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDOP } from "@deuna/utils";
import type { NearbyMerchant, ProductSummary, SavedLocation, StoredCustomerOrder } from "@deuna/types";
import { getSavedLocations, getStoredOrders, hoursLeft } from "@/lib/customer-storage";
import { useCart } from "@/lib/cart-context";
import { ProfileOrders } from "./profile/ProfileOrders";
import { ProfileAddresses } from "./profile/ProfileAddresses";
import { ProfilePayments } from "./profile/ProfilePayments";
import { ProfileFavorites } from "./profile/ProfileFavorites";
import { ProfilePromos } from "./profile/ProfilePromos";
import { ProfileNotifications } from "./profile/ProfileNotifications";

type ProfileTab = "cuenta" | "pedidos" | "direcciones" | "pagos" | "favoritos" | "promos" | "avisos" | "carritos";

const TABS: { id: ProfileTab; label: string }[] = [
  { id: "cuenta", label: "Mi cuenta" },
  { id: "pedidos", label: "Mis pedidos" },
  { id: "direcciones", label: "Ubicaciones" },
  { id: "pagos", label: "Métodos de pago" },
  { id: "favoritos", label: "Favoritos" },
  { id: "promos", label: "Promociones" },
  { id: "avisos", label: "Notificaciones" },
  { id: "carritos", label: "Carritos guardados" },
];

export function ProfileClient({
  fullName,
  email,
  serverLocations,
  serverOrders = [],
  merchants = [],
  products = [],
  initialTab = "pedidos",
  logoutAction,
}: {
  fullName: string;
  email: string | null;
  serverLocations: SavedLocation[];
  serverOrders?: StoredCustomerOrder[];
  merchants?: NearbyMerchant[];
  products?: ProductSummary[];
  initialTab?: ProfileTab;
  logoutAction: () => Promise<void>;
}) {
  const [tab, setTab] = useState<ProfileTab>(initialTab);
  const [orders, setOrders] = useState<StoredCustomerOrder[]>(serverOrders);
  const [locations, setLocations] = useState<SavedLocation[]>(serverLocations);
  const { savedCarts, replaceWith, deleteSavedCart } = useCart();
  const router = useRouter();

  useEffect(() => {
    const localOrders = getStoredOrders();
    const byCode = new Map<string, StoredCustomerOrder>();
    for (const order of serverOrders) byCode.set(order.code, order);
    for (const order of localOrders) byCode.set(order.code, order);
    setOrders(
      Array.from(byCode.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    );
    const localLocations = getSavedLocations();
    const byId = new Map<string, SavedLocation>();
    for (const location of serverLocations) byId.set(location.id, location);
    for (const location of localLocations) byId.set(location.id, location);
    if (byId.size) setLocations(Array.from(byId.values()));
  }, [serverOrders, serverLocations]);

  function repeatOrder(order: StoredCustomerOrder) {
    replaceWith(order.items, order.deliveryFee);
    router.push("/carrito");
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <aside className="rounded-card border border-ink-border bg-ink-soft p-3">
        <p className="px-3 pt-2 text-xs uppercase tracking-wide text-paper/40">Perfil</p>
        <p className="truncate px-3 pt-1 font-medium text-paper">{fullName}</p>
        {email && <p className="truncate px-3 pb-3 text-xs text-paper/45">{email}</p>}
        <nav className="space-y-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex w-full rounded-lg px-3 py-2 text-left text-sm ${
                tab === item.id ? "bg-teal/15 font-medium text-teal-light" : "text-paper/70 hover:bg-ink"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <form action={logoutAction} className="mt-3 border-t border-ink-border pt-3">
          <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-sm text-paper/50 hover:text-coral">
            Cerrar sesión
          </button>
        </form>
      </aside>

      <div className="min-w-0">
        {tab === "pedidos" && <ProfileOrders orders={orders} onRepeat={repeatOrder} />}

        {tab === "cuenta" && (
          <section>
            <h1 className="font-display text-3xl text-paper">Mi cuenta</h1>
            <p className="mt-1 text-sm text-paper/55">Tus datos y accesos rápidos en DeUna.</p>
            <div className="mt-6 rounded-card border border-ink-border bg-ink-soft p-5">
              <p className="font-display text-2xl text-paper">{fullName}</p>
              {email && <p className="mt-1 text-sm text-paper/60">{email}</p>}
              <p className="mt-4 text-sm text-paper/55">
                {orders.length} {orders.length === 1 ? "pedido" : "pedidos"} · {locations.length}{" "}
                {locations.length === 1 ? "dirección" : "direcciones"}
              </p>
            </div>
          </section>
        )}

        {tab === "direcciones" && <ProfileAddresses locations={locations} onChange={setLocations} />}

        {tab === "pagos" && <ProfilePayments defaultHolderName={fullName} />}

        {tab === "favoritos" && <ProfileFavorites merchants={merchants} products={products} />}

        {tab === "promos" && <ProfilePromos />}

        {tab === "avisos" && <ProfileNotifications orders={orders} />}

        {tab === "carritos" && (
          <section>
            <h1 className="font-display text-3xl text-paper">Carritos guardados</h1>
            <p className="mt-1 text-sm text-paper/55">Caducan en 24 horas. Puedes retomarlos desde aquí.</p>
            {savedCarts.length === 0 ? (
              <p className="mt-5 text-sm text-paper/50">Todavía no tienes carritos guardados.</p>
            ) : (
              <ul className="mt-5 space-y-3">
                {savedCarts.map((cart) => (
                  <li key={cart.id} className="rounded-card border border-ink-border bg-ink-soft p-4">
                    <p className="font-medium text-paper">{cart.name}</p>
                    <p className="text-sm text-paper/60">
                      {cart.merchantName} · {cart.items.length} productos · {hoursLeft(cart.expiresAt).toFixed(0)} h restantes
                    </p>
                    <p className="mt-1 text-sm text-paper/50">
                      {formatDOP(cart.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          replaceWith(cart.items, cart.deliveryFee);
                          router.push("/carrito");
                        }}
                        className="rounded-full bg-teal px-4 py-2 text-sm text-paper"
                      >
                        Usar este carrito
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavedCart(cart.id)}
                        className="text-sm text-paper/40 hover:text-coral"
                      >
                        Eliminar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab !== "pedidos" &&
          tab !== "direcciones" &&
          tab !== "pagos" &&
          tab !== "favoritos" &&
          tab !== "promos" &&
          tab !== "avisos" && (
          <p className="mt-8 text-sm text-paper/40">
            ¿Buscas un pedido reciente?{" "}
            <button type="button" onClick={() => setTab("pedidos")} className="text-teal-light hover:underline">
              Ir a Mis pedidos
            </button>
            {" · "}
            <Link href="/tiendas" className="text-teal-light hover:underline">
              Explorar tiendas
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
