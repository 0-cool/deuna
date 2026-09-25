"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DEFAULT_DELIVERY_ZONES } from "@deuna/config";
import { saveMerchantSettingsAction } from "@/app/merchant/actions";
import { MerchantPrefsTab } from "@/components/merchant/MerchantPrefsTab";
import { MerchantUsersTab } from "@/components/merchant/MerchantUsersTab";
import {
  NOTIFY_TYPE_ROWS,
  readSettingsExtras,
  writeSettingsExtras,
  type CustomerMessageId,
  type MerchantOrderZone,
  type MerchantSettingsExtras,
  type NotifyChannel,
  type NotifyTypeId,
} from "@/lib/merchant-settings-storage";

export type MerchantSettingsCore = {
  name: string;
  slug: string;
  logoUrl: string;
  status: string;
  email: string;
  phone: string;
  createdAt: string;
  locationId: string;
  address: string;
  latitude: number;
  longitude: number;
  zoneName: string;
  isOpen: boolean;
};

const TABS = [
  { id: "info", label: "Información de la tienda" },
  { id: "profile", label: "Perfil y documentos" },
  { id: "alerts", label: "Notificaciones" },
  { id: "orders", label: "Pedidos y pagos" },
  { id: "apps", label: "Integraciones" },
  { id: "users", label: "Usuarios" },
  { id: "prefs", label: "Preferencias" },
] as const;

function Switch({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={on ? "relative h-6 w-10 shrink-0 rounded-full bg-teal" : "relative h-6 w-10 shrink-0 rounded-full bg-ink/15"}
    >
      <span className={on ? "absolute left-5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm" : "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm"} />
    </button>
  );
}

const inputClass = "mt-1 w-full rounded-xl border border-ink/10 px-3 py-2 text-sm text-ink outline-none focus:border-teal";

export function MerchantSettingsClient({
  merchantId,
  core,
}: {
  merchantId: string;
  core: MerchantSettingsCore;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("info");
  const [name, setName] = useState(core.name);
  const [phone, setPhone] = useState(core.phone);
  const [address, setAddress] = useState(core.address);
  const [logoUrl, setLogoUrl] = useState(core.logoUrl);
  const [active, setActive] = useState(core.status === "ACTIVE");
  const [isOpen, setIsOpen] = useState(core.isOpen);
  const [extras, setExtras] = useState<MerchantSettingsExtras | null>(null);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [editingNotifyEmail, setEditingNotifyEmail] = useState(false);
  const [editingNotifyPhone, setEditingNotifyPhone] = useState(false);
  const [testType, setTestType] = useState<NotifyTypeId>("newOrders");
  const [testSentAt, setTestSentAt] = useState<string | null>(null);
  const [testSending, setTestSending] = useState(false);
  const [payConfig, setPayConfig] = useState<"cash" | "card" | "deuna" | "bank" | null>(null);
  const [zoneDraft, setZoneDraft] = useState<MerchantOrderZone | null>(null);
  const [messageEdit, setMessageEdit] = useState<CustomerMessageId | null>(null);
  const [inviteFocus, setInviteFocus] = useState(0);

  useEffect(() => {
    setExtras(readSettingsExtras(merchantId, core.name, {
      email: core.email,
      phone: core.phone,
      createdAt: core.createdAt,
    }));
  }, [merchantId, core.name, core.email, core.phone, core.createdAt]);

  function patch(partial: Partial<MerchantSettingsExtras>) {
    setExtras((current) => {
      if (!current) return current;
      const next = { ...current, ...partial };
      writeSettingsExtras(merchantId, next);
      return next;
    });
  }

  function patchNotifyType(id: NotifyTypeId, channel: NotifyChannel) {
    if (!extras) return;
    patch({
      notifyTypes: {
        ...extras.notifyTypes,
        [id]: { ...extras.notifyTypes[id], [channel]: !extras.notifyTypes[id][channel] },
      },
    });
  }

  function cancel() {
    setName(core.name);
    setPhone(core.phone);
    setAddress(core.address);
    setLogoUrl(core.logoUrl);
    setActive(core.status === "ACTIVE");
    setIsOpen(core.isOpen);
    setExtras(readSettingsExtras(merchantId, core.name, {
      email: core.email,
      phone: core.phone,
      createdAt: core.createdAt,
    }));
    setNotice("");
  }

  async function save() {
    if (!extras) return;
    setSaving(true);
    const form = new FormData();
    form.set("name", name);
    form.set("logoUrl", logoUrl);
    form.set("address", address);
    form.set("phone", phone);
    form.set("locationId", core.locationId);
    form.set("isOpen", isOpen ? "1" : "0");
    form.set("active", extras.showInMarketplace && active && !extras.vacationMode ? "1" : "0");
    await saveMerchantSettingsAction(form);
    writeSettingsExtras(merchantId, extras);
    setActive(extras.showInMarketplace && !extras.vacationMode);
    setSaving(false);
    setNotice("Cambios guardados en DeUna.");
  }

  if (!extras) return null;

  const mapSrc = `https://www.openstreetmap.org/export/embed.html?bbox=${core.longitude - 0.02}%2C${core.latitude - 0.015}%2C${core.longitude + 0.02}%2C${core.latitude + 0.015}&layer=mapnik&marker=${core.latitude}%2C${core.longitude}`;

  return (
    <div className="space-y-5">
      <nav className="text-xs text-ink/40">
        <Link href="/merchant" className="hover:text-ink">Inicio</Link>
        <span className="px-1.5">›</span>
        <button type="button" onClick={() => setTab("info")} className={tab === "info" ? "text-ink/70" : "hover:text-ink"}>
          Configuración
        </button>
        {tab === "profile" && (
          <>
            <span className="px-1.5">›</span>
            <span className="text-ink/70">Perfil y documentos</span>
          </>
        )}
        {tab === "alerts" && (
          <>
            <span className="px-1.5">›</span>
            <span className="text-ink/70">Notificaciones</span>
          </>
        )}
        {tab === "orders" && (
          <>
            <span className="px-1.5">›</span>
            <span className="text-ink/70">Pedidos y pagos</span>
          </>
        )}
        {tab === "users" && (
          <>
            <span className="px-1.5">›</span>
            <span className="text-ink/70">Usuarios</span>
          </>
        )}
        {tab === "prefs" && (
          <>
            <span className="px-1.5">›</span>
            <span className="text-ink/70">Preferencias</span>
          </>
        )}
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-ink">
            {tab === "alerts" ? "Notificaciones" : tab === "orders" ? "Pedidos y pagos" : tab === "users" ? "Usuarios" : tab === "prefs" ? "Preferencias" : "Configuración"}
          </h1>
          <p className="mt-1 text-sm text-ink/50">
            {tab === "alerts"
              ? "Elige qué notificaciones recibir y por qué canales."
              : tab === "orders"
                ? "Configura cómo recibes, gestionas y cobras los pedidos de tu tienda."
                : tab === "users"
                  ? "Administra quién puede acceder a tu tienda y qué puede hacer en DeUna."
                  : tab === "prefs"
                    ? "Personaliza cómo funciona tu tienda en DeUna."
                    : "Administra la información de tu tienda, preferencias y ajustes en DeUna."}
          </p>
        </div>
        {tab === "users" ? (
          <button
            type="button"
            onClick={() => setInviteFocus((value) => value + 1)}
            className="rounded-full bg-coral px-4 py-2 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            + Agregar usuario
          </button>
        ) : (
          <Link href={core.slug ? `/tiendas/${core.slug}` : "/tiendas"} className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium text-ink hover:border-teal">
            Ver mi tienda
          </Link>
        )}
      </div>

      {notice && <p className="rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-teal">{notice}</p>}

      <div className="flex flex-wrap gap-4 border-b border-ink/8 text-sm">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={tab === item.id ? "border-b-2 border-coral pb-2 font-medium text-coral" : "pb-2 text-ink/45 hover:text-ink"}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "info" && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_320px_280px]">
          <div className="space-y-4">
            <Card title="Información básica" action={<SaveButton saving={saving} onClick={save} />}>
              <p className="text-xs text-ink/45">Esta información se mostrará en tu tienda dentro de DeUna.</p>
              <label className="mt-3 block text-xs text-ink/50">
                Nombre de la tienda *
                <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
              </label>
              <label className="mt-3 block text-xs text-ink/50">
                Descripción
                <textarea
                  value={extras.description}
                  maxLength={300}
                  onChange={(event) => patch({ description: event.target.value })}
                  rows={3}
                  className={inputClass}
                />
                <span className="mt-1 block text-right text-[11px] text-ink/35">{extras.description.length}/300</span>
              </label>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50">
                  Teléfono *
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+1 809 555 1234" className={inputClass} />
                </label>
                <label className="text-xs text-ink/50">
                  Correo electrónico *
                  <input value={core.email} readOnly className={`${inputClass} bg-[#F6F5F2]`} />
                </label>
                <label className="text-xs text-ink/50">
                  Tipo de tienda *
                  <select value={extras.storeType} onChange={(event) => patch({ storeType: event.target.value })} className={inputClass}>
                    <option>Licores y bebidas</option>
                    <option>Mini market</option>
                    <option>Hielo y snacks</option>
                    <option>Tienda de conveniencia</option>
                  </select>
                </label>
                <label className="text-xs text-ink/50">
                  RNC / Cédula
                  <input value={extras.rnc} onChange={(event) => patch({ rnc: event.target.value })} placeholder="1-31-45678-9" className={inputClass} />
                </label>
              </div>
            </Card>

            <Card title="Dirección de la tienda">
              <p className="text-xs text-ink/45">Esta es la ubicación donde se preparan los pedidos.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50 sm:col-span-1">
                  Dirección *
                  <input value={address} onChange={(event) => setAddress(event.target.value)} className={inputClass} />
                </label>
                <label className="text-xs text-ink/50">
                  Referencia adicional
                  <input value={extras.reference} onChange={(event) => patch({ reference: event.target.value })} className={inputClass} />
                </label>
                <label className="text-xs text-ink/50">
                  Sector
                  <input value={extras.sector} onChange={(event) => patch({ sector: event.target.value })} className={inputClass} />
                </label>
                <label className="text-xs text-ink/50">
                  Ciudad
                  <input value={extras.city} onChange={(event) => patch({ city: event.target.value })} className={inputClass} />
                </label>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl border border-ink/8">
                <iframe title="Mapa de la tienda" src={mapSrc} className="h-48 w-full border-0" />
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Logo y portada">
              <p className="text-xs text-ink/45">Usa imágenes atractivas para destacar tu tienda.</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-full bg-[#F6F5F2]">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={logoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-xl text-ink/30">{name.slice(0, 1)}</div>
                  )}
                </div>
                <label className="text-xs text-ink/50">
                  Logo (URL)
                  <input value={logoUrl} onChange={(event) => setLogoUrl(event.target.value)} className={inputClass} />
                </label>
              </div>
              <div className="mt-3 overflow-hidden rounded-2xl bg-[#F6F5F2]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={extras.coverUrl || "/hero-banner.jpg"} alt="" className="h-28 w-full object-cover" />
              </div>
              <label className="mt-2 block text-xs text-ink/50">
                Imagen de portada (URL)
                <input value={extras.coverUrl} onChange={(event) => patch({ coverUrl: event.target.value })} className={inputClass} />
              </label>
            </Card>

            <Card title="Zona de entrega">
              <p className="text-xs text-ink/45">Define las zonas donde puedes recibir y entregar pedidos.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {DEFAULT_DELIVERY_ZONES.map((zone) => {
                  const on = extras.zones.includes(zone.name);
                  return (
                    <button
                      key={zone.id}
                      type="button"
                      onClick={() =>
                        patch({
                          zones: on ? extras.zones.filter((item) => item !== zone.name) : [...extras.zones, zone.name],
                        })
                      }
                      className={on ? "rounded-full bg-coral/10 px-3 py-1 text-xs font-medium text-coral" : "rounded-full border border-ink/10 px-3 py-1 text-xs text-ink/50"}
                    >
                      {zone.name}
                      {on ? " ×" : ""}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-xs text-ink/40">Zona actual en DeUna: {core.zoneName}.</p>
              <label className="mt-3 block text-xs text-ink/50">
                Pedido mínimo
                <input
                  type="number"
                  min={0}
                  value={extras.minOrder}
                  onChange={(event) => patch({ minOrder: Number(event.target.value) || 0 })}
                  className={inputClass}
                />
              </label>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="Estado de la tienda">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Tienda activa</p>
                  <p className="text-xs text-ink/45">Tu tienda está disponible para recibir pedidos.</p>
                </div>
                <Switch on={active} label="Activar tienda" onClick={() => setActive((value) => !value)} />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Abierta ahora</p>
                  <p className="text-xs text-ink/45">Los clientes ven si estás recibiendo pedidos hoy.</p>
                </div>
                <Switch on={isOpen} label="Abrir ahora" onClick={() => setIsOpen((value) => !value)} />
              </div>
            </Card>

            <Card title="Enlaces y redes sociales">
              <label className="block text-xs text-ink/50">Instagram<input value={extras.instagram} onChange={(event) => patch({ instagram: event.target.value })} className={inputClass} /></label>
              <label className="mt-2 block text-xs text-ink/50">Facebook<input value={extras.facebook} onChange={(event) => patch({ facebook: event.target.value })} className={inputClass} /></label>
              <label className="mt-2 block text-xs text-ink/50">TikTok<input value={extras.tiktok} onChange={(event) => patch({ tiktok: event.target.value })} className={inputClass} /></label>
              <label className="mt-2 block text-xs text-ink/50">Sitio web<input value={extras.website} onChange={(event) => patch({ website: event.target.value })} className={inputClass} /></label>
            </Card>

            <Card title="Configuración adicional">
              <ToggleRow label="Mostrar mi número de teléfono" hint="Los clientes pueden contactarte desde tu tienda." on={extras.showPhone} onClick={() => patch({ showPhone: !extras.showPhone })} />
              <ToggleRow label="Permitir notas en el pedido" hint="Los clientes pueden agregar indicaciones especiales." on={extras.allowNotes} onClick={() => patch({ allowNotes: !extras.allowNotes })} />
              <ToggleRow label="Mostrar productos fuera de stock" hint="Se verán como agotados, no se pueden comprar." on={extras.showOutOfStock} onClick={() => patch({ showOutOfStock: !extras.showOutOfStock })} />
              <ToggleRow label="Modo vacaciones" hint="Pausa tu tienda temporalmente." on={extras.vacationMode} onClick={() => patch({ vacationMode: !extras.vacationMode })} />
            </Card>
          </div>
        </div>
      )}

      {tab === "profile" && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <Card title="Información del propietario">
              <p className="text-xs text-ink/45">Esta información se usa para la verificación de tu cuenta.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50">
                  Nombre completo *
                  <input
                    value={extras.ownerName}
                    onChange={(event) => patch({ ownerName: event.target.value })}
                    placeholder="Nombre y apellido"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Cédula / RNC *
                  <input
                    value={extras.ownerCedula}
                    onChange={(event) => patch({ ownerCedula: event.target.value })}
                    placeholder="001-1234567-8"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Correo electrónico *
                  <IconField icon="mail">
                    <input
                      value={extras.ownerEmail}
                      onChange={(event) => patch({ ownerEmail: event.target.value })}
                      placeholder="tucorreo@tienda.com"
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
                <label className="text-xs text-ink/50">
                  Teléfono *
                  <IconField icon="phone">
                    <input
                      value={extras.ownerPhone}
                      onChange={(event) => patch({ ownerPhone: event.target.value })}
                      placeholder="+1 809 555 1234"
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
              </div>
            </Card>

            <Card title="Foto de perfil del propietario">
              <p className="text-xs text-ink/45">Esta foto se usa para fines de verificación.</p>
              <div className="mt-4 flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E8E4F8] text-lg font-semibold text-[#5B4B8A]">
                  {extras.ownerPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={extras.ownerPhotoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(extras.ownerName || name)
                  )}
                </div>
                <div>
                  <label className="inline-flex cursor-pointer rounded-full border border-ink/10 px-4 py-2 text-xs font-medium text-ink hover:border-teal">
                    Cambiar foto
                    <input
                      type="file"
                      accept="image/jpeg,image/png"
                      className="sr-only"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file || file.size > 2 * 1024 * 1024) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === "string") patch({ ownerPhotoUrl: reader.result });
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <p className="mt-2 text-[11px] text-ink/40">JPG o PNG. Máx. 2 MB.</p>
                </div>
              </div>
            </Card>

            <Card title="Información de la empresa">
              <p className="text-xs text-ink/45">Datos legales de tu negocio.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50">
                  Nombre comercial *
                  <input value={name} onChange={(event) => setName(event.target.value)} className={inputClass} />
                </label>
                <label className="text-xs text-ink/50">
                  RNC *
                  <input
                    value={extras.rnc}
                    onChange={(event) => patch({ rnc: event.target.value })}
                    placeholder="1-31-45678-9"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Tipo de negocio *
                  <select value={extras.storeType} onChange={(event) => patch({ storeType: event.target.value })} className={inputClass}>
                    <option>Licores y bebidas</option>
                    <option>Mini market</option>
                    <option>Hielo y snacks</option>
                    <option>Tienda de conveniencia</option>
                  </select>
                </label>
                <label className="text-xs text-ink/50">
                  Fecha de registro
                  <IconField icon="calendar">
                    <input
                      type="date"
                      value={extras.registeredAt || core.createdAt}
                      onChange={(event) => patch({ registeredAt: event.target.value })}
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
              </div>
            </Card>

            <Card title="Documentos requeridos">
              <p className="text-xs text-ink/45">Sube los documentos para verificar tu tienda en DeUna.</p>
              <p className="mt-1 text-[11px] text-ink/35">Solo se guarda el nombre del archivo en este dispositivo. DeUna no almacena documentos de identidad.</p>
              <ul className="mt-3 divide-y divide-ink/6">
                {extras.documents.map((doc) => (
                  <DocumentRow
                    key={doc.id}
                    doc={doc}
                    onFile={(fileName) =>
                      patch({
                        documents: extras.documents.map((item) =>
                          item.id === doc.id ? { ...item, fileName, status: "pending" } : item,
                        ),
                      })
                    }
                  />
                ))}
              </ul>
            </Card>

            <Card title="Información de contacto">
              <p className="text-xs text-ink/45">Estos datos se muestran en tu página de tienda.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50">
                  Teléfono de la tienda *
                  <IconField icon="phone">
                    <input value={phone} onChange={(event) => setPhone(event.target.value)} className={`${inputClass} pl-9`} />
                  </IconField>
                </label>
                <label className="text-xs text-ink/50">
                  WhatsApp
                  <IconField icon="whatsapp">
                    <input
                      value={extras.whatsapp}
                      onChange={(event) => patch({ whatsapp: event.target.value })}
                      placeholder="+1 809 555 1234"
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
                <label className="text-xs text-ink/50">
                  Correo de soporte
                  <IconField icon="mail">
                    <input
                      value={extras.supportEmail}
                      onChange={(event) => patch({ supportEmail: event.target.value })}
                      placeholder="soporte@tienda.com"
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
                <label className="text-xs text-ink/50">
                  Sitio web
                  <IconField icon="web">
                    <input
                      value={extras.website}
                      onChange={(event) => patch({ website: event.target.value })}
                      placeholder="https://"
                      className={`${inputClass} pl-9`}
                    />
                  </IconField>
                </label>
                <label className="text-xs text-ink/50 sm:col-span-2">
                  Dirección principal *
                  <div className="mt-1 flex gap-2">
                    <IconField icon="pin" className="flex-1">
                      <input value={address} onChange={(event) => setAddress(event.target.value)} className={`${inputClass} pl-9`} />
                    </IconField>
                    <button
                      type="button"
                      onClick={() => setTab("info")}
                      className="shrink-0 rounded-xl border border-ink/10 px-3 py-2 text-xs font-medium text-ink hover:border-teal"
                    >
                      Editar en mapa
                    </button>
                  </div>
                </label>
              </div>
            </Card>

            <Card title="Representante autorizado">
              <p className="text-xs text-ink/45">Persona de contacto para gestiones con DeUna.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="text-xs text-ink/50">
                  Nombre completo *
                  <input
                    value={extras.representativeName}
                    onChange={(event) => patch({ representativeName: event.target.value })}
                    placeholder={extras.ownerName || "Nombre y apellido"}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Cargo
                  <input
                    value={extras.representativeRole}
                    onChange={(event) => patch({ representativeRole: event.target.value })}
                    placeholder="Propietario"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Correo electrónico *
                  <input
                    value={extras.representativeEmail}
                    onChange={(event) => patch({ representativeEmail: event.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-ink/50">
                  Teléfono *
                  <input
                    value={extras.representativePhone}
                    onChange={(event) => patch({ representativePhone: event.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>
            </Card>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-xs rounded-2xl bg-[#FFF4F2] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-coral shadow-sm">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="8" r="3" />
                  <path d="M6 19a6 6 0 0 1 12 0" />
                </svg>
              </div>
              <p className="font-display text-lg text-ink">Completa tu perfil</p>
              <p className="mt-1 text-xs leading-relaxed text-ink/55">
                Sube tus documentos y verifica tu tienda para ganar más visibilidad en DeUna.
              </p>
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark"
              >
                Ver guía
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={cancel} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-medium text-ink hover:border-teal">
                Cancelar
              </button>
              <SaveButton saving={saving} onClick={save} />
            </div>
          </div>

          {guideOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuideOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">Guía para verificar tu tienda</h3>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  <li>1. Completa los datos del propietario y de la empresa.</li>
                  <li>2. Adjunta cédula, RNC, registro mercantil y licencia.</li>
                  <li>3. Confirma el representante autorizado para gestiones con DeUna.</li>
                  <li>4. Guarda los cambios. El equipo revisará tu perfil.</li>
                </ol>
                <button
                  type="button"
                  onClick={() => setGuideOpen(false)}
                  className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white"
                >
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
            <div className="space-y-4">
              <Card title="Canales de notificación">
                <p className="text-xs text-ink/45">Activa los canales donde quieres recibir notificaciones.</p>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <ChannelCard
                    icon="mail"
                    title="Email"
                    hint="Recibe notificaciones en tu correo electrónico."
                    on={extras.notifyEmail}
                    onToggle={() => patch({ notifyEmail: !extras.notifyEmail })}
                  >
                    {editingNotifyEmail ? (
                      <input
                        value={extras.notifyEmailAddress || core.email}
                        onChange={(event) => patch({ notifyEmailAddress: event.target.value })}
                        onBlur={() => setEditingNotifyEmail(false)}
                        className={inputClass}
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="truncate text-sm text-ink">{extras.notifyEmailAddress || core.email || "Sin correo"}</p>
                        <button type="button" onClick={() => setEditingNotifyEmail(true)} className="mt-3 w-full rounded-xl border border-ink/10 px-3 py-2 text-xs font-medium text-ink hover:border-teal">
                          Cambiar correo
                        </button>
                      </>
                    )}
                  </ChannelCard>
                  <ChannelCard
                    icon="phone"
                    title="SMS"
                    hint="Recibe alertas importantes en tu celular."
                    on={extras.notifySms}
                    onToggle={() => patch({ notifySms: !extras.notifySms })}
                  >
                    {editingNotifyPhone ? (
                      <input
                        value={extras.notifySmsPhone || phone}
                        onChange={(event) => patch({ notifySmsPhone: event.target.value })}
                        onBlur={() => setEditingNotifyPhone(false)}
                        className={inputClass}
                        autoFocus
                      />
                    ) : (
                      <>
                        <p className="truncate text-sm text-ink">{extras.notifySmsPhone || phone || "Sin número"}</p>
                        <button type="button" onClick={() => setEditingNotifyPhone(true)} className="mt-3 w-full rounded-xl border border-ink/10 px-3 py-2 text-xs font-medium text-ink hover:border-teal">
                          Cambiar número
                        </button>
                      </>
                    )}
                  </ChannelCard>
                  <ChannelCard
                    icon="bell"
                    title="Notificaciones push"
                    hint="Recibe notificaciones en la app o navegador."
                    on={extras.notifyPush}
                    onToggle={() => patch({ notifyPush: !extras.notifyPush })}
                  >
                    {extras.notifyPush ? (
                      <p className="text-xs text-teal">Las alertas llegarán aunque no estés en el panel.</p>
                    ) : (
                      <p className="rounded-xl border border-gold/30 bg-[#FFF8E6] px-3 py-2 text-[11px] leading-relaxed text-ink/70">
                        Activa las notificaciones push para recibir alertas en tiempo real aunque no estés en la plataforma.
                      </p>
                    )}
                  </ChannelCard>
                </div>
              </Card>

              <Card
                title="Tipos de notificaciones"
                action={
                  <div className="hidden items-center gap-4 text-[11px] text-ink/40 sm:flex">
                    <span className="flex items-center gap-1"><TypeIcon name="mail" /> Email</span>
                    <span className="flex items-center gap-1"><TypeIcon name="phone" /> SMS</span>
                    <span className="flex items-center gap-1"><TypeIcon name="bell" /> Push</span>
                  </div>
                }
              >
                <p className="text-xs text-ink/45">Selecciona qué notificaciones quieres recibir por cada canal.</p>
                <ul className="mt-3 divide-y divide-ink/6">
                  {NOTIFY_TYPE_ROWS.map((row) => {
                    const prefs = extras.notifyTypes[row.id] ?? { email: true, sms: false, push: false };
                    return (
                      <li key={row.id} className="grid items-center gap-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto]">
                        <div className="flex items-start gap-3">
                          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F6F5F2] text-ink/45">
                            <TypeIcon name={row.icon} />
                          </span>
                          <div>
                            <p className="text-sm font-medium text-ink">{row.label}</p>
                            <p className="text-xs text-ink/40">{row.hint}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-4 pl-11 sm:pl-0">
                          <span className={extras.notifyEmail ? "" : "pointer-events-none opacity-35"}>
                            <Switch
                              on={prefs.email}
                              label={`${row.label} por email`}
                              onClick={() => patchNotifyType(row.id, "email")}
                            />
                          </span>
                          <span className={extras.notifySms ? "" : "pointer-events-none opacity-35"}>
                            <Switch
                              on={prefs.sms}
                              label={`${row.label} por SMS`}
                              onClick={() => patchNotifyType(row.id, "sms")}
                            />
                          </span>
                          <span className={extras.notifyPush ? "" : "pointer-events-none opacity-35"}>
                            <Switch
                              on={prefs.push}
                              label={`${row.label} por push`}
                              onClick={() => patchNotifyType(row.id, "push")}
                            />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Probar notificaciones">
                <p className="text-xs text-ink/45">Envía una notificación de prueba para verificar que está funcionando.</p>
                <label className="mt-3 block text-xs text-ink/50">
                  Tipo de notificación
                  <select
                    value={testType}
                    onChange={(event) => setTestType(event.target.value as NotifyTypeId)}
                    className={inputClass}
                  >
                    {NOTIFY_TYPE_ROWS.map((row) => (
                      <option key={row.id} value={row.id}>{row.label}</option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  disabled={testSending}
                  onClick={() => {
                    setTestSending(true);
                    window.setTimeout(() => {
                      setTestSending(false);
                      setTestSentAt(new Date().toISOString());
                    }, 600);
                  }}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-coral px-4 py-2.5 text-xs font-semibold text-white hover:bg-coral-dark disabled:opacity-60"
                >
                  <TypeIcon name="send" />
                  {testSending ? "Enviando…" : "Enviar prueba"}
                </button>
                {testSentAt && (
                  <p className="mt-3 flex items-start gap-2 text-xs text-teal">
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal" />
                    Notificación de prueba enviada · hace {minutesAgo(testSentAt)}
                  </p>
                )}
              </Card>

              <Card title="Frecuencia de reportes">
                <p className="text-xs text-ink/45">Recibe resúmenes automáticos del rendimiento de tu tienda.</p>
                <div className="mt-3 space-y-2">
                  {(
                    [
                      { id: "daily", label: "Diario", hint: "Resumen de ventas, pedidos y actividad." },
                      { id: "weekly", label: "Semanal", hint: "Resumen de cada lunes." },
                      { id: "monthly", label: "Mensual", hint: "Resumen el primer día de cada mes." },
                    ] as const
                  ).map((option) => (
                    <label key={option.id} className="flex cursor-pointer items-start gap-3 rounded-xl px-1 py-2">
                      <input
                        type="radio"
                        name="reportFrequency"
                        checked={extras.reportFrequency === option.id}
                        onChange={() => patch({ reportFrequency: option.id })}
                        className="mt-0.5 accent-coral"
                      />
                      <span>
                        <span className="block text-sm text-ink">{option.label}</span>
                        <span className="block text-xs text-ink/40">{option.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </Card>

              <Card title="Horario de notificaciones">
                <p className="text-xs text-ink/45">Define el horario en que quieres recibir notificaciones no críticas.</p>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <label className="text-xs text-ink/50">
                    Hora de inicio
                    <select value={extras.quietStart} onChange={(event) => patch({ quietStart: event.target.value })} className={inputClass}>
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>{formatHourLabel(hour)}</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-ink/50">
                    Hora de fin
                    <select value={extras.quietEnd} onChange={(event) => patch({ quietEnd: event.target.value })} className={inputClass}>
                      {HOUR_OPTIONS.map((hour) => (
                        <option key={hour} value={hour}>{formatHourLabel(hour)}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-ink/40">
                  Las notificaciones críticas (nuevos pedidos, problemas de pago, etc.) se envían independientemente del horario.
                </p>
              </Card>
            </div>
          </div>

          <div className="max-w-xs rounded-2xl bg-[#FFF4F2] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-coral shadow-sm">
              <TypeIcon name="bell" />
            </div>
            <p className="font-display text-lg text-ink">Mantente siempre informado</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              Configura tus notificaciones y no te pierdas nada importante de tu tienda.
            </p>
            <button
              type="button"
              onClick={() => setGuideOpen(true)}
              className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark"
            >
              Ver guía
            </button>
          </div>

          {guideOpen && tab === "alerts" && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuideOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">Cómo configurar tus avisos</h3>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  <li>1. Activa email, SMS o push según cómo quieras enterarte.</li>
                  <li>2. Elige los tipos de aviso por canal: pedidos, stock, reseñas y más.</li>
                  <li>3. Define la frecuencia de reportes y el horario de avisos no críticos.</li>
                  <li>4. Envía una prueba para confirmar que el canal funciona.</li>
                </ol>
                <button type="button" onClick={() => setGuideOpen(false)} className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">
                  Entendido
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "orders" && (
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.95fr)_280px]">
            <div className="space-y-4">
              <Card title="Métodos de pago">
                <p className="text-xs text-ink/45">Selecciona los métodos de pago que aceptas en tu tienda.</p>
                <div className="mt-3 divide-y divide-ink/6">
                  {[
                    { id: "cash" as const, label: "Efectivo", hint: "Los clientes pagan al recibir el pedido.", on: extras.acceptCash, recommended: true, tone: "bg-[#E7F6EE] text-[#1F8A4C]", toggle: () => patch({ acceptCash: !extras.acceptCash }) },
                    { id: "card" as const, label: "Tarjeta de crédito/débito", hint: "Pagos en línea con tarjeta.", on: extras.acceptCard, recommended: false, tone: "bg-[#E8F1FF] text-[#3B6FCF]", toggle: () => patch({ acceptCard: !extras.acceptCard }) },
                    { id: "deuna" as const, label: "DeUna Pay", hint: "Pago rápido dentro de la plataforma.", on: extras.acceptDeunaPay, recommended: false, tone: "bg-[#FFE8E5] text-coral", toggle: () => patch({ acceptDeunaPay: !extras.acceptDeunaPay }) },
                    { id: "bank" as const, label: "Transferencia bancaria", hint: "El cliente paga por transferencia.", on: extras.acceptBank, recommended: false, tone: "bg-[#F3F1EC] text-ink/50", toggle: () => patch({ acceptBank: !extras.acceptBank }) },
                  ].map((method) => (
                    <div key={method.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${method.tone}`}>
                        <PayIcon name={method.id} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">
                          {method.label}
                          {method.recommended && (
                            <span className="ml-2 rounded-full bg-teal/10 px-2 py-0.5 text-[10px] font-semibold text-teal">Recomendado</span>
                          )}
                        </p>
                        <p className="text-xs text-ink/40">{method.hint}</p>
                      </div>
                      <Switch on={method.on} onClick={method.toggle} label={method.label} />
                      <button
                        type="button"
                        onClick={() => setPayConfig(method.id)}
                        className="text-xs font-medium text-ink/50 hover:text-teal"
                      >
                        Configurar
                      </button>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                title="Zonas de entrega"
                action={
                  <button
                    type="button"
                    onClick={() => setZoneDraft({ id: "", name: "", coverage: "0 - 3 km", fee: 50, active: true })}
                    className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink hover:border-teal"
                  >
                    + Agregar zona
                  </button>
                }
              >
                <p className="text-xs text-ink/45">Define las zonas donde puedes recibir y entregar pedidos.</p>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="text-[11px] uppercase tracking-wide text-ink/35">
                      <tr>
                        <th className="pb-2 font-medium">Zona</th>
                        <th className="pb-2 font-medium">Cobertura</th>
                        <th className="pb-2 font-medium">Tarifa</th>
                        <th className="pb-2 font-medium">Estado</th>
                        <th className="pb-2 font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/6">
                      {extras.orderZones.map((zone) => (
                        <tr key={zone.id}>
                          <td className="py-2.5 font-medium text-ink">{zone.name}</td>
                          <td className="py-2.5 text-ink/55">{zone.coverage}</td>
                          <td className="py-2.5 text-ink/55">RD$ {zone.fee}</td>
                          <td className="py-2.5">
                            <span className={zone.active ? "text-xs font-medium text-teal" : "text-xs font-medium text-ink/35"}>
                              {zone.active ? "Activa" : "Pausada"}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="flex items-center gap-2">
                              <button type="button" onClick={() => setZoneDraft(zone)} className="text-ink/35 hover:text-ink" aria-label={`Editar ${zone.name}`}>
                                <PayIcon name="edit" />
                              </button>
                              <button
                                type="button"
                                onClick={() => patch({ orderZones: extras.orderZones.filter((item) => item.id !== zone.id) })}
                                className="text-ink/35 hover:text-coral"
                                aria-label={`Eliminar ${zone.name}`}
                              >
                                <PayIcon name="trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>

              <Card title="Políticas de cancelación">
                <p className="text-xs text-ink/45">Define cuándo un pedido puede ser cancelado y reembolsado.</p>
                <label className="mt-3 block text-xs text-ink/50">
                  Permitir cancelación
                  <select
                    value={extras.cancelWindowMinutes}
                    onChange={(event) => patch({ cancelWindowMinutes: Number(event.target.value) })}
                    className={inputClass}
                  >
                    <option value={0}>No permitir cancelación después de aceptar</option>
                    <option value={5}>Permitir cancelación dentro de los primeros 5 minutos</option>
                    <option value={10}>Permitir cancelación dentro de los primeros 10 minutos</option>
                    <option value={15}>Permitir cancelación dentro de los primeros 15 minutos</option>
                  </select>
                </label>
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Configuración de pedidos">
                <p className="text-xs text-ink/45">Define cómo quieres recibir y gestionar tus pedidos.</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-xs text-ink/50">
                    Tiempo de preparación
                    <select
                      value={extras.prepMinutes}
                      onChange={(event) => patch({ prepMinutes: Number(event.target.value) })}
                      className={inputClass}
                    >
                      {[10, 15, 20, 30, 45].map((mins) => (
                        <option key={mins} value={mins}>{mins} minutos</option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-ink/50">
                    Pedido mínimo
                    <input
                      type="number"
                      min={0}
                      value={extras.minOrder}
                      onChange={(event) => patch({ minOrder: Number(event.target.value) || 0 })}
                      className={inputClass}
                    />
                  </label>
                  <label className="text-xs text-ink/50 sm:col-span-2">
                    Radio de entrega
                    <select
                      value={extras.deliveryRadiusKm}
                      onChange={(event) => patch({ deliveryRadiusKm: Number(event.target.value) })}
                      className={inputClass}
                    >
                      {[3, 5, 8, 10, 15].map((km) => (
                        <option key={km} value={km}>{km} km</option>
                      ))}
                    </select>
                  </label>
                </div>
                <ToggleRow
                  label="Aceptar pedidos programados"
                  hint="Permite que los clientes programen sus pedidos para más tarde."
                  on={extras.acceptScheduled}
                  onClick={() => patch({ acceptScheduled: !extras.acceptScheduled })}
                />
                <ToggleRow
                  label="Requerir confirmación manual"
                  hint="Revisa y confirma cada pedido antes de que se prepare."
                  on={extras.requireManualConfirm}
                  onClick={() => patch({ requireManualConfirm: !extras.requireManualConfirm })}
                />
              </Card>

              <Card title="Gestión de pedidos">
                <p className="text-xs text-ink/45">Configura el flujo y comportamiento de los pedidos.</p>
                <ToggleRow label="Autoaceptar pedidos" hint="Los pedidos se aceptan automáticamente." on={extras.autoAccept} onClick={() => patch({ autoAccept: !extras.autoAccept })} />
                <ToggleRow label="Notificar nuevos pedidos por WhatsApp" hint="Recibe una alerta en tu WhatsApp." on={extras.notifyWhatsapp} onClick={() => patch({ notifyWhatsapp: !extras.notifyWhatsapp })} />
                <ToggleRow label="Imprimir automáticamente" hint="Imprime el ticket al aceptar un pedido." on={extras.autoPrint} onClick={() => patch({ autoPrint: !extras.autoPrint })} />
                <ToggleRow label="Agrupar pedidos cercanos" hint="Agrupa pedidos cercanos en una misma ruta." on={extras.groupNearby} onClick={() => patch({ groupNearby: !extras.groupNearby })} />
                <ToggleRow label="Permitir instrucciones especiales" hint="Los clientes pueden agregar una nota al pedido." on={extras.allowNotes} onClick={() => patch({ allowNotes: !extras.allowNotes })} />
              </Card>

              <Card title="Ajustes avanzados">
                <p className="text-xs text-ink/45">Opciones adicionales de configuración.</p>
                <ToggleRow
                  label="Activar modo de alta demanda"
                  hint="Aumenta el tiempo de preparación automáticamente en horas pico."
                  on={extras.demandMode}
                  onClick={() => patch({ demandMode: !extras.demandMode })}
                />
              </Card>
            </div>

            <div className="space-y-4">
              <Card title="Estado de la tienda para pedidos">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-ink">Recibir pedidos</p>
                    <p className="text-xs text-ink/45">Tu tienda está recibiendo pedidos en este momento.</p>
                  </div>
                  <Switch
                    on={isOpen}
                    label="Recibir pedidos"
                    onClick={() => {
                      const next = !isOpen;
                      setIsOpen(next);
                      const form = new FormData();
                      form.set("name", name);
                      form.set("logoUrl", logoUrl);
                      form.set("address", address);
                      form.set("phone", phone);
                      form.set("locationId", core.locationId);
                      form.set("isOpen", next ? "1" : "0");
                      form.set("active", active && !extras.vacationMode ? "1" : "0");
                      void saveMerchantSettingsAction(form);
                    }}
                  />
                </div>
              </Card>

              <Card title="Mensajes al cliente">
                <p className="text-xs text-ink/45">Personaliza los mensajes que verán tus clientes durante el proceso de compra.</p>
                <ul className="mt-3 space-y-2">
                  {(
                    [
                      { id: "confirmation" as const, label: "Mensaje de confirmación", tone: "text-teal" },
                      { id: "preparing" as const, label: "Mensaje en preparación", tone: "text-gold" },
                      { id: "onTheWay" as const, label: "Mensaje en camino", tone: "text-[#3B6FCF]" },
                      { id: "delivered" as const, label: "Mensaje entregado", tone: "text-ink/50" },
                    ]
                  ).map((item) => {
                    const message = extras.customerMessages[item.id];
                    return (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => setMessageEdit(messageEdit === item.id ? null : item.id)}
                          className="flex w-full items-start gap-2 rounded-xl px-1 py-1 text-left hover:bg-[#F6F5F2]"
                        >
                          <span className={`mt-0.5 ${item.tone}`}><PayIcon name={item.id} /></span>
                          <span>
                            <span className="block text-sm text-ink">{item.label}</span>
                            <span className="block text-xs text-ink/40">{message.text}</span>
                          </span>
                        </button>
                        {messageEdit === item.id && (
                          <textarea
                            value={message.text}
                            rows={2}
                            onChange={(event) =>
                              patch({
                                customerMessages: {
                                  ...extras.customerMessages,
                                  [item.id]: { ...message, text: event.target.value },
                                },
                              })
                            }
                            className={inputClass}
                          />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <Card title="Historial y comprobantes">
                <p className="text-xs text-ink/45">Configura cómo manejar los comprobantes de pago.</p>
                <ToggleRow
                  label="Solicitar comprobante de pago"
                  hint="Pide comprobante cuando el cliente pague por transferencia."
                  on={extras.requestReceipt}
                  onClick={() => patch({ requestReceipt: !extras.requestReceipt })}
                />
                <ToggleRow
                  label="Revisar comprobantes manualmente"
                  hint="Cada comprobante debe ser verificado."
                  on={extras.reviewReceipts}
                  onClick={() => patch({ reviewReceipts: !extras.reviewReceipts })}
                />
              </Card>
            </div>
          </div>

          <div className="max-w-xs rounded-2xl bg-[#FFF4F2] p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-coral shadow-sm">
              <PayIcon name="deuna" />
            </div>
            <p className="font-display text-lg text-ink">Optimiza tus pedidos</p>
            <p className="mt-1 text-xs leading-relaxed text-ink/55">
              Configura tus métodos de pago y personaliza la gestión de pedidos en DeUna.
            </p>
            <button type="button" onClick={() => setGuideOpen(true)} className="mt-4 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark">
              Ver guía
            </button>
          </div>

          {guideOpen && tab === "orders" && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuideOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">Cómo configurar pedidos y pagos</h3>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  <li>1. Activa los métodos que aceptas. La tarjeta se cobra por DeUna, sin guardar números.</li>
                  <li>2. Define zonas, tarifas y el pedido mínimo.</li>
                  <li>3. Ajusta el flujo: confirmación, impresión y notas del cliente.</li>
                  <li>4. Personaliza los mensajes que ve el cliente en cada estado.</li>
                </ol>
                <button type="button" onClick={() => setGuideOpen(false)} className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">
                  Entendido
                </button>
              </div>
            </div>
          )}

          {payConfig && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setPayConfig(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">
                  {payConfig === "cash" ? "Efectivo" : payConfig === "card" ? "Tarjeta" : payConfig === "deuna" ? "DeUna Pay" : "Transferencia"}
                </h3>
                {payConfig === "cash" && (
                  <label className="mt-3 block text-xs text-ink/50">
                    Instrucción para el cliente
                    <textarea value={extras.cashNote} onChange={(event) => patch({ cashNote: event.target.value })} rows={3} className={inputClass} />
                  </label>
                )}
                {payConfig === "card" && (
                  <p className="mt-3 text-sm text-ink/60">
                    Los cobros con tarjeta se procesan por DeUna. No pedimos ni guardamos número de tarjeta, fecha ni CVV.
                  </p>
                )}
                {payConfig === "deuna" && (
                  <p className="mt-3 text-sm text-ink/60">
                    DeUna Pay usa el saldo y los métodos ya guardados en la cuenta del cliente. No hay claves que configurar aquí.
                  </p>
                )}
                {payConfig === "bank" && (
                  <label className="mt-3 block text-xs text-ink/50">
                    Instrucciones para el cliente
                    <textarea value={extras.bankNote} onChange={(event) => patch({ bankNote: event.target.value })} rows={3} className={inputClass} />
                    <span className="mt-1 block text-[11px] text-ink/35">No escribas números de cuenta completos. DeUna te pedirá el comprobante.</span>
                  </label>
                )}
                <button type="button" onClick={() => setPayConfig(null)} className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">
                  Listo
                </button>
              </div>
            </div>
          )}

          {zoneDraft && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setZoneDraft(null)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">{zoneDraft.id ? "Editar zona" : "Agregar zona"}</h3>
                <label className="mt-3 block text-xs text-ink/50">
                  Nombre
                  <input value={zoneDraft.name} onChange={(event) => setZoneDraft({ ...zoneDraft, name: event.target.value })} className={inputClass} />
                </label>
                <label className="mt-3 block text-xs text-ink/50">
                  Cobertura
                  <input value={zoneDraft.coverage} onChange={(event) => setZoneDraft({ ...zoneDraft, coverage: event.target.value })} className={inputClass} />
                </label>
                <label className="mt-3 block text-xs text-ink/50">
                  Tarifa (RD$)
                  <input
                    type="number"
                    min={0}
                    value={zoneDraft.fee}
                    onChange={(event) => setZoneDraft({ ...zoneDraft, fee: Number(event.target.value) || 0 })}
                    className={inputClass}
                  />
                </label>
                <div className="mt-3">
                  <ToggleRow
                    label="Zona activa"
                    hint="Los clientes de esta zona pueden pedir."
                    on={zoneDraft.active}
                    onClick={() => setZoneDraft({ ...zoneDraft, active: !zoneDraft.active })}
                  />
                </div>
                <div className="mt-5 flex justify-end gap-2">
                  <button type="button" onClick={() => setZoneDraft(null)} className="rounded-full border border-ink/10 px-4 py-2 text-xs font-medium text-ink">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!zoneDraft.name.trim()) return;
                      const id = zoneDraft.id || zoneDraft.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
                      const next = { ...zoneDraft, id, name: zoneDraft.name.trim() };
                      const exists = extras.orderZones.some((item) => item.id === id);
                      patch({
                        orderZones: exists
                          ? extras.orderZones.map((item) => (item.id === id ? next : item))
                          : [...extras.orderZones, next],
                      });
                      setZoneDraft(null);
                    }}
                    className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white"
                  >
                    Guardar zona
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "apps" && (
        <Card title="Integraciones">
          <p className="text-sm text-ink/55">WhatsApp Business, Google y Facebook Ads estarán disponibles pronto. No pedimos claves de APIs aquí.</p>
          <div className="mt-4 space-y-2">
            {["WhatsApp Business", "Google Business", "Meta Ads"].map((item) => (
              <div key={item} className="flex items-center justify-between rounded-xl border border-ink/8 px-4 py-3">
                <p className="text-sm text-ink">{item}</p>
                <span className="text-xs text-ink/40">Pronto</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "users" && (
        <>
          <MerchantUsersTab extras={extras} patch={patch} inviteFocus={inviteFocus} onGuide={() => setGuideOpen(true)} />
          {guideOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuideOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">Cómo gestionar tu equipo</h3>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  <li>1. Invita por correo y asigna un rol: administrador, empleado, contabilidad o solo lectura.</li>
                  <li>2. El propietario no se puede quitar. El resto se puede editar, desactivar o reenviar.</li>
                  <li>3. Las invitaciones se guardan en este dispositivo; aún no crean una sesión real en DeUna.</li>
                </ol>
                <button type="button" onClick={() => setGuideOpen(false)} className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">
                  Entendido
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {tab === "prefs" && (
        <>
          <MerchantPrefsTab extras={extras} patch={patch} saving={saving} onSave={save} onGuide={() => setGuideOpen(true)} />
          {guideOpen && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onClick={() => setGuideOpen(false)}>
              <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
                <h3 className="font-display text-xl text-ink">Cómo personalizar tu tienda</h3>
                <ol className="mt-4 space-y-3 text-sm text-ink/70">
                  <li>1. El idioma y la moneda de DeUna en República Dominicana son español y RD$.</li>
                  <li>2. Los pedidos, el inventario y la visibilidad se sincronizan con los otros tabs.</li>
                  <li>3. El color y el tema se guardan aquí. El panel sigue en modo claro por ahora.</li>
                </ol>
                <button type="button" onClick={() => setGuideOpen(false)} className="mt-5 rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white">
                  Entendido
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-ink/8 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-medium text-ink">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function ToggleRow({ label, hint, on, onClick }: { label: string; hint: string; on: boolean; onClick: () => void }) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-ink/6 py-3 first:border-t-0 first:pt-0">
      <div>
        <p className="text-sm text-ink">{label}</p>
        <p className="text-xs text-ink/40">{hint}</p>
      </div>
      <Switch on={on} onClick={onClick} label={label} />
    </div>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="rounded-full bg-coral px-4 py-2 text-xs font-semibold text-white hover:bg-coral-dark disabled:opacity-60">
      {saving ? "Guardando…" : "Guardar cambios"}
    </button>
  );
}

function initials(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || "TU").toUpperCase();
}

function IconField({
  icon,
  className = "",
  children,
}: {
  icon: "mail" | "phone" | "whatsapp" | "web" | "pin" | "calendar";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`relative ${className}`}>
      <span className="pointer-events-none absolute left-3 top-[1.35rem] -translate-y-1/2 text-ink/30">
        <FieldIcon name={icon} />
      </span>
      {children}
    </div>
  );
}

function FieldIcon({ name }: { name: "mail" | "phone" | "whatsapp" | "web" | "pin" | "calendar" }) {
  const className = "h-4 w-4";
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3A16 16 0 0 1 6.5 3.5Z" />
      </svg>
    );
  }
  if (name === "whatsapp") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 20a8 8 0 1 0-6.7-3.7L4 20l3.8-1.2A8 8 0 0 0 12 20Z" />
      </svg>
    );
  }
  if (name === "web") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M4 12h16M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16" />
      </svg>
    );
  }
  if (name === "pin") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 21s7-5.2 7-11a7 7 0 1 0-14 0c0 5.8 7 11 7 11Z" />
        <circle cx="12" cy="10" r="2.2" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  );
}

function DocumentRow({
  doc,
  onFile,
}: {
  doc: { id: string; label: string; required: boolean; fileName: string; status: "verified" | "pending" };
  onFile: (fileName: string) => void;
}) {
  const tone =
    doc.id === "cedula"
      ? "bg-[#E8F1FF] text-[#3B6FCF]"
      : doc.id === "dgii"
        ? "bg-[#FFF4D6] text-[#C49200]"
        : doc.id === "licencia"
          ? "bg-[#E7F6EE] text-[#1F8A4C]"
          : "bg-[#F3F1EC] text-ink/50";

  return (
    <li className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tone}`}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M7 3h7l5 5v13H7z" />
          <path d="M14 3v5h5" />
        </svg>
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-ink">
          {doc.label}
          {doc.required ? " *" : ""}
        </p>
        <p className="truncate text-xs text-ink/40">{doc.fileName || "Sin archivo"}</p>
      </div>
      {doc.status === "verified" ? (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-teal">
          <span className="h-1.5 w-1.5 rounded-full bg-teal" />
          Verificado
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-gold">
          <span className="h-1.5 w-1.5 rounded-full bg-gold" />
          Pendiente
        </span>
      )}
      {doc.status === "pending" ? (
        <label className="cursor-pointer rounded-full border border-ink/10 px-3 py-1 text-xs font-medium text-ink hover:border-teal">
          Subir
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFile(file.name);
            }}
          />
        </label>
      ) : (
        <span className="px-1 text-ink/25">···</span>
      )}
    </li>
  );
}

const HOUR_OPTIONS = Array.from({ length: 18 }, (_, index) => `${String(index + 6).padStart(2, "0")}:00`);

function formatHourLabel(value: string) {
  const hour = Number(value.slice(0, 2));
  const suffix = hour >= 12 ? "p. m." : "a. m.";
  return `${hour % 12 || 12}:00 ${suffix}`;
}

function minutesAgo(iso: string) {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  return mins === 1 ? "1 minuto" : `${mins} minutos`;
}

function ChannelCard({
  icon,
  title,
  hint,
  on,
  onToggle,
  children,
}: {
  icon: "mail" | "phone" | "bell";
  title: string;
  hint: string;
  on: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-ink/8 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F5F2] text-ink/45">
            <TypeIcon name={icon} />
          </span>
          <div>
            <p className="text-sm font-medium text-ink">{title}</p>
            <p className="mt-0.5 text-xs text-ink/40">{hint}</p>
          </div>
        </div>
        <Switch on={on} onClick={onToggle} label={title} />
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function TypeIcon({
  name,
}: {
  name: "mail" | "phone" | "bell" | "cart" | "box" | "alert" | "layers" | "tag" | "star" | "chart" | "gear" | "send";
}) {
  const className = "h-4 w-4";
  if (name === "mail") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (name === "phone") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="8" y="2" width="8" height="20" rx="2" />
        <path d="M11 18h2" />
      </svg>
    );
  }
  if (name === "bell") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 17h12l-1.2-2.2V10a4.8 4.8 0 1 0-9.6 0v4.8L6 17Z" />
        <path d="M10 17a2 2 0 0 0 4 0" />
      </svg>
    );
  }
  if (name === "cart") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 5h2l2 11h10l2-8H8" />
        <circle cx="10" cy="19" r="1.2" />
        <circle cx="17" cy="19" r="1.2" />
      </svg>
    );
  }
  if (name === "box") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 8h16v11H4zM4 8l8-4 8 4M12 4v15" />
      </svg>
    );
  }
  if (name === "alert") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 4 9 16H3z" />
        <path d="M12 10v4M12 16.5v.5" />
      </svg>
    );
  }
  if (name === "layers") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m4 8 8-4 8 4-8 4-8-4Z" />
        <path d="m4 12 8 4 8-4M4 16l8 4 8-4" />
      </svg>
    );
  }
  if (name === "tag") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12V4h8l10 10-8 8z" />
        <circle cx="8" cy="8" r="1" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="m12 3 2.4 6.5H21l-5.2 4 2 6.5L12 16.6 6.2 20l2-6.5L3 9.5h6.6z" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5M4 19h16M8 15v-4M12 15V8M16 15v-6" />
      </svg>
    );
  }
  if (name === "send") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 12 20 4l-6 16-2-7z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2M12 19v2M4.2 6.2l1.4 1.4M18.4 16.4l1.4 1.4M3 12h2M19 12h2M4.2 17.8l1.4-1.4M18.4 7.6l1.4-1.4" />
    </svg>
  );
}

function PayIcon({
  name,
}: {
  name: "cash" | "card" | "deuna" | "bank" | "edit" | "trash" | "confirmation" | "preparing" | "onTheWay" | "delivered";
}) {
  const className = "h-4 w-4";
  if (name === "cash") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }
  if (name === "card") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M3 10h18" />
      </svg>
    );
  }
  if (name === "deuna") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    );
  }
  if (name === "bank") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 9h16L12 4 4 9Z" />
        <path d="M6 10v7M10 10v7M14 10v7M18 10v7M4 18h16" />
      </svg>
    );
  }
  if (name === "edit") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 20h4l10-10-4-4L4 16z" />
        <path d="m13 7 4 4" />
      </svg>
    );
  }
  if (name === "trash") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 7h14M9 7V5h6v2M8 7l1 12h6l1-12" />
      </svg>
    );
  }
  if (name === "confirmation") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.5 2.5 4.5-5" />
      </svg>
    );
  }
  if (name === "preparing") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M7 11h10l-1 8H8z" />
        <path d="M9 11V8a3 3 0 0 1 6 0v3" />
      </svg>
    );
  }
  if (name === "onTheWay") {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 16h13V8H3z" />
        <path d="M16 11h3l2 3v2h-5" />
        <circle cx="7" cy="17" r="1.5" />
        <circle cx="17" cy="17" r="1.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 8h16v11H4zM4 8l8-4 8 4" />
    </svg>
  );
}
