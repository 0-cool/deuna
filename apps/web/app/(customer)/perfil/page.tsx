import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { getCustomerOrders, getNearbyMerchants, getPopularProducts } from "@/lib/data";
import { ProfileClient } from "@/components/ProfileClient";
import { customerLogoutAction } from "../cuenta/actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/perfil");
  const { tab } = await searchParams;
  const allowed = ["cuenta", "pedidos", "direcciones", "pagos", "favoritos", "promos", "avisos", "carritos"] as const;
  const initialTab = allowed.includes(tab as (typeof allowed)[number])
    ? (tab as (typeof allowed)[number])
    : "pedidos";

  const [serverOrders, merchants, products] = await Promise.all([
    customer.customerProfile ? getCustomerOrders(customer.customerProfile.id) : Promise.resolve([]),
    getNearbyMerchants(8),
    getPopularProducts(16),
  ]);

  const serverLocations = customer.addresses.map((address) => ({
    id: address.id,
    label: address.label ?? "Guardada",
    line1: address.line1,
    reference: address.reference,
    city: address.city,
    zoneId: "dn",
    lat: address.latitude,
    lng: address.longitude,
    isDefault: address.isDefault,
  }));

  return (
    <section className="mx-auto max-w-[1440px] px-4 py-6 lg:px-8 lg:py-8">
      <ProfileClient
        fullName={customer.customerProfile?.fullName ?? "Cliente"}
        email={customer.email}
        serverLocations={serverLocations}
        serverOrders={serverOrders}
        merchants={merchants}
        products={products}
        initialTab={initialTab}
        logoutAction={customerLogoutAction}
      />
    </section>
  );
}
