"use client";

export type MerchantDocumentStatus = "verified" | "pending";

export type MerchantDocument = {
  id: string;
  label: string;
  required: boolean;
  fileName: string;
  status: MerchantDocumentStatus;
};

export type MerchantSettingsExtras = {
  description: string;
  storeType: string;
  rnc: string;
  coverUrl: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  website: string;
  reference: string;
  sector: string;
  city: string;
  zones: string[];
  minOrder: number;
  showPhone: boolean;
  allowNotes: boolean;
  showOutOfStock: boolean;
  vacationMode: boolean;
  notifyEmail: boolean;
  notifySms: boolean;
  notifyPush: boolean;
  acceptCash: boolean;
  acceptCard: boolean;
  ownerName: string;
  ownerCedula: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerPhotoUrl: string;
  registeredAt: string;
  whatsapp: string;
  supportEmail: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  representativePhone: string;
  documents: MerchantDocument[];
  notifyEmailAddress: string;
  notifySmsPhone: string;
  reportFrequency: "daily" | "weekly" | "monthly";
  quietStart: string;
  quietEnd: string;
  notifyTypes: Record<NotifyTypeId, NotifyTypePrefs>;
  acceptDeunaPay: boolean;
  acceptBank: boolean;
  prepMinutes: number;
  deliveryRadiusKm: number;
  acceptScheduled: boolean;
  requireManualConfirm: boolean;
  autoAccept: boolean;
  notifyWhatsapp: boolean;
  autoPrint: boolean;
  groupNearby: boolean;
  cancelWindowMinutes: number;
  demandMode: boolean;
  requestReceipt: boolean;
  reviewReceipts: boolean;
  cashNote: string;
  bankNote: string;
  orderZones: MerchantOrderZone[];
  customerMessages: Record<CustomerMessageId, CustomerMessage>;
  teamUsers: MerchantStaff[];
  teamActivity: StaffActivity[];
  language: "es";
  currency: "DOP";
  timezone: "America/Santo_Domingo";
  theme: "light" | "dark" | "system";
  accentColor: "coral" | "teal" | "blue" | "gold" | "green" | "purple";
  showInMarketplace: boolean;
  suggestRelated: boolean;
  allowCustomerChat: boolean;
  confirmationMessage: string;
  lowStockAlert: number;
  outOfStockBehavior: "mark" | "hide" | "suggest";
  showExactAddress: boolean;
  keepActivityLog: boolean;
};

export type StaffRole = "owner" | "admin" | "employee" | "accounting" | "readonly";
export type StaffStatus = "active" | "invited" | "disabled";

export type MerchantStaff = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  lastAccess: string;
  status: StaffStatus;
};

export type StaffActivity = {
  id: string;
  name: string;
  action: string;
  at: string;
  kind: "login" | "permissions" | "invite" | "disabled" | "created";
};

export const STAFF_ROLES: { id: StaffRole; label: string; hint: string }[] = [
  { id: "owner", label: "Propietario", hint: "Acceso total a todas las funciones." },
  { id: "admin", label: "Administrador", hint: "Gestión de pedidos, productos, inventario, finanzas y más." },
  { id: "employee", label: "Empleado", hint: "Gestión de pedidos y productos básico." },
  { id: "accounting", label: "Contabilidad", hint: "Acceso a reportes financieros y comprobantes." },
  { id: "readonly", label: "Solo lectura", hint: "Puede ver información, no realizar cambios." },
];

export type MerchantOrderZone = {
  id: string;
  name: string;
  coverage: string;
  fee: number;
  active: boolean;
};

export type CustomerMessageId = "confirmation" | "preparing" | "onTheWay" | "delivered";

export type CustomerMessage = {
  on: boolean;
  text: string;
};

export type NotifyChannel = "email" | "sms" | "push";
export type NotifyTypeId =
  | "newOrders"
  | "orderUpdates"
  | "orderIssues"
  | "stock"
  | "promos"
  | "reviews"
  | "reports"
  | "platform";

export type NotifyTypePrefs = Record<NotifyChannel, boolean>;

export const NOTIFY_TYPE_ROWS: {
  id: NotifyTypeId;
  label: string;
  hint: string;
  icon: "cart" | "box" | "alert" | "layers" | "tag" | "star" | "chart" | "gear";
}[] = [
  { id: "newOrders", label: "Nuevos pedidos", hint: "Recibe una notificación cada vez que recibas un nuevo pedido.", icon: "cart" },
  { id: "orderUpdates", label: "Actualizaciones de pedidos", hint: "Estado de tus pedidos (en preparación, en camino, entregado, etc.).", icon: "box" },
  { id: "orderIssues", label: "Problemas con pedidos", hint: "Pedido fallido de entrega o problemas de pago.", icon: "alert" },
  { id: "stock", label: "Stock y inventario", hint: "Alerta cuando un producto esté bajo o se agote.", icon: "layers" },
  { id: "promos", label: "Promociones", hint: "Resumen de rendimiento de tus promociones y sugerencias.", icon: "tag" },
  { id: "reviews", label: "Reseñas de clientes", hint: "Cuando un cliente califique tu tienda o productos.", icon: "star" },
  { id: "reports", label: "Reportes y resúmenes", hint: "Resumen diario o semanal de ventas, pedidos y rendimiento.", icon: "chart" },
  { id: "platform", label: "Actualizaciones de la plataforma", hint: "Noticias, nueva funcionalidad y mantenimiento de DeUna.", icon: "gear" },
];

const DEFAULT_NOTIFY_TYPES: Record<NotifyTypeId, NotifyTypePrefs> = {
  newOrders: { email: true, sms: true, push: false },
  orderUpdates: { email: true, sms: false, push: true },
  orderIssues: { email: true, sms: true, push: true },
  stock: { email: true, sms: false, push: false },
  promos: { email: true, sms: false, push: false },
  reviews: { email: true, sms: false, push: true },
  reports: { email: true, sms: false, push: false },
  platform: { email: true, sms: false, push: true },
};

export const DEFAULT_ORDER_ZONES: MerchantOrderZone[] = [
  { id: "naco", name: "Naco", coverage: "0 - 3 km", fee: 50, active: true },
  { id: "bella-vista", name: "Bella Vista", coverage: "0 - 3 km", fee: 50, active: true },
  { id: "piantini", name: "Piantini", coverage: "0 - 3 km", fee: 50, active: true },
  { id: "quisqueya", name: "Ensanche Quisqueya", coverage: "3 - 5 km", fee: 75, active: true },
  { id: "otras", name: "Otras zonas", coverage: "5 - 10 km", fee: 100, active: true },
];

function ownerNameFrom(email: string) {
  const local = email.split("@")[0] ?? "";
  const pretty = local.replace(/[-._]+/g, " ").trim();
  if (!pretty || pretty.length < 3) return "Carlos Méndez";
  return pretty.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function defaultTeamUsers(email: string, ownerName: string): MerchantStaff[] {
  const domain = email.split("@")[1] || "tienda.deuna.do";
  const now = Date.now();
  return [
    { id: "owner", name: ownerName || "Carlos Méndez", email: email || `carlos@${domain}`, role: "owner", lastAccess: new Date(now).toISOString(), status: "active" },
    { id: "laura", name: "Laura Rodríguez", email: `laura@${domain}`, role: "admin", lastAccess: new Date(now - 864e5).toISOString(), status: "active" },
    { id: "jose", name: "José Martínez", email: `jose@${domain}`, role: "employee", lastAccess: new Date(now - 2 * 864e5).toISOString(), status: "active" },
    { id: "ana", name: "Ana Pérez", email: `ana@${domain}`, role: "employee", lastAccess: new Date(now - 4 * 864e5).toISOString(), status: "invited" },
    { id: "diego", name: "Diego López", email: `diego@${domain}`, role: "accounting", lastAccess: new Date(now - 9 * 864e5).toISOString(), status: "disabled" },
  ];
}

export function defaultTeamActivity(): StaffActivity[] {
  const now = Date.now();
  return [
    { id: "a1", name: "Laura Rodríguez", action: "Inició sesión", at: new Date(now).toISOString(), kind: "login" },
    { id: "a2", name: "José Martínez", action: "Actualizó permisos de Ana Pérez", at: new Date(now - 864e5).toISOString(), kind: "permissions" },
    { id: "a3", name: "Ana Pérez", action: "Invitación enviada", at: new Date(now - 2 * 864e5).toISOString(), kind: "invite" },
    { id: "a4", name: "Diego López", action: "Usuario desactivado", at: new Date(now - 4 * 864e5).toISOString(), kind: "disabled" },
    { id: "a5", name: "Carlos Méndez", action: "Creó un nuevo usuario", at: new Date(now - 6 * 864e5).toISOString(), kind: "created" },
  ];
}

export const DEFAULT_CUSTOMER_MESSAGES: Record<CustomerMessageId, CustomerMessage> = {
  confirmation: { on: true, text: "Se muestra cuando el pedido es recibido." },
  preparing: { on: true, text: "Se muestra cuando el pedido está en preparación." },
  onTheWay: { on: true, text: "Se muestra cuando el pedido salió a entrega." },
  delivered: { on: true, text: "Se muestra cuando el pedido se entregó." },
};

const keyFor = (merchantId: string) => `deuna_merchant_settings_v1:${merchantId}`;

const DEFAULT_DOCUMENTS: MerchantDocument[] = [
  { id: "cedula", label: "Cédula del propietario", required: true, fileName: "cedula_propietario.jpg", status: "verified" },
  { id: "mercantil", label: "Registro Mercantil", required: true, fileName: "registro_mercantil.pdf", status: "verified" },
  { id: "rnc", label: "RNC", required: true, fileName: "rnc.pdf", status: "verified" },
  { id: "dgii", label: "Certificado DGII", required: false, fileName: "certificado_dgii.pdf", status: "pending" },
  { id: "licencia", label: "Licencia de funcionamiento", required: false, fileName: "licencia_funcionamiento.pdf", status: "verified" },
];

export function defaultSettingsExtras(
  name: string,
  seed: { email?: string; phone?: string; createdAt?: string } = {},
): MerchantSettingsExtras {
  const handle = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  const email = seed.email ?? "";
  const phone = seed.phone ?? "";
  return {
    description: "Tienda de bebidas, licores, cervezas, snacks y más. Entregas rápidas en tu zona.",
    storeType: "Licores y bebidas",
    rnc: "",
    coverUrl: "/hero-banner.jpg",
    instagram: `https://instagram.com/${handle}`,
    facebook: `https://facebook.com/${handle}`,
    tiktok: `https://tiktok.com/@${handle}`,
    website: handle ? `https://${handle}.com` : "",
    reference: "",
    sector: "",
    city: "Santo Domingo",
    zones: ["Distrito Nacional"],
    minOrder: 300,
    showPhone: true,
    allowNotes: true,
    showOutOfStock: false,
    vacationMode: false,
    notifyEmail: true,
    notifySms: true,
    notifyPush: false,
    acceptCash: true,
    acceptCard: true,
    ownerName: "",
    ownerCedula: "",
    ownerEmail: email,
    ownerPhone: phone,
    ownerPhotoUrl: "",
    registeredAt: seed.createdAt ?? "",
    whatsapp: phone,
    supportEmail: email,
    representativeName: "",
    representativeRole: "Propietario",
    representativeEmail: email,
    representativePhone: phone,
    documents: DEFAULT_DOCUMENTS,
    notifyEmailAddress: email,
    notifySmsPhone: phone,
    reportFrequency: "daily",
    quietStart: "08:00",
    quietEnd: "22:00",
    notifyTypes: DEFAULT_NOTIFY_TYPES,
    acceptDeunaPay: true,
    acceptBank: false,
    prepMinutes: 15,
    deliveryRadiusKm: 5,
    acceptScheduled: true,
    requireManualConfirm: false,
    autoAccept: false,
    notifyWhatsapp: true,
    autoPrint: true,
    groupNearby: true,
    cancelWindowMinutes: 5,
    demandMode: false,
    requestReceipt: true,
    reviewReceipts: true,
    cashNote: "El cliente paga al recibir el pedido.",
    bankNote: "Te enviaremos las instrucciones de transferencia al confirmar el pedido. No pedimos números de cuenta aquí.",
    orderZones: DEFAULT_ORDER_ZONES,
    customerMessages: DEFAULT_CUSTOMER_MESSAGES,
    teamUsers: defaultTeamUsers(email, ownerNameFrom(email)),
    teamActivity: defaultTeamActivity(),
    language: "es",
    currency: "DOP",
    timezone: "America/Santo_Domingo",
    theme: "light",
    accentColor: "coral",
    showInMarketplace: true,
    suggestRelated: true,
    allowCustomerChat: true,
    confirmationMessage: "Gracias por tu pedido. Estamos preparando tu orden y te avisaremos cuando esté en camino.",
    lowStockAlert: 10,
    outOfStockBehavior: "mark",
    showExactAddress: false,
    keepActivityLog: true,
  };
}

export function readSettingsExtras(
  merchantId: string,
  name: string,
  seed: { email?: string; phone?: string; createdAt?: string } = {},
): MerchantSettingsExtras {
  const defaults = defaultSettingsExtras(name, seed);
  if (typeof window === "undefined") return defaults;
  try {
    const raw = window.localStorage.getItem(keyFor(merchantId));
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<MerchantSettingsExtras>;
    return {
      ...defaults,
      ...parsed,
      documents: Array.isArray(parsed.documents) && parsed.documents.length ? parsed.documents : defaults.documents,
      notifyTypes: { ...defaults.notifyTypes, ...parsed.notifyTypes },
      orderZones: Array.isArray(parsed.orderZones) && parsed.orderZones.length ? parsed.orderZones : defaults.orderZones,
      customerMessages: { ...defaults.customerMessages, ...parsed.customerMessages },
      teamUsers: Array.isArray(parsed.teamUsers) && parsed.teamUsers.length ? parsed.teamUsers : defaults.teamUsers,
      teamActivity: Array.isArray(parsed.teamActivity) && parsed.teamActivity.length ? parsed.teamActivity : defaults.teamActivity,
    };
  } catch {
    return defaults;
  }
}

export function writeSettingsExtras(merchantId: string, value: MerchantSettingsExtras) {
  window.localStorage.setItem(keyFor(merchantId), JSON.stringify(value));
}
