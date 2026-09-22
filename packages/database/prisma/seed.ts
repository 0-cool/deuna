import { PrismaClient, MerchantStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { CATEGORY_RULES, DEFAULT_DELIVERY_ZONES } from "@deuna/config";

const prisma = new PrismaClient();

// Contraseña de demo para TODOS los usuarios merchant/driver del seed — solo para desarrollo local.
const DEMO_MERCHANT_PASSWORD = "deuna123";
const DEMO_DRIVER_PASSWORD = "deuna123";

// ---------- Datos ficticios de merchants (NUNCA marcas reales como merchant) ----------
const MERCHANTS = [
  {
    name: "DeUna Liquor",
    slug: "deuna-liquor",
    rating: 4.8,
    zone: "dn",
    location: {
      latitude: 18.4726,
      longitude: -69.8901,
      address: "Piantini, Distrito Nacional",
    },
  },
  {
    name: "Santo Domingo Drinks",
    slug: "santo-domingo-drinks",
    rating: 4.6,
    zone: "sde",
    location: {
      latitude: 18.4861,
      longitude: -69.8312,
      address: "Los Mina, Santo Domingo Este",
    },
  },
  {
    name: "La Bodega RD",
    slug: "la-bodega-rd",
    rating: 4.8,
    zone: "dn",
    location: {
      latitude: 18.4655,
      longitude: -69.9312,
      address: "Bella Vista, Distrito Nacional",
    },
  },
  {
    name: "Bottle House",
    slug: "bottle-house",
    rating: 4.5,
    zone: "sdo",
    location: {
      latitude: 18.4801,
      longitude: -70.0021,
      address: "Los Alcarrizos, Santo Domingo Oeste",
    },
  },
  {
    name: "Zona Drink",
    slug: "zona-drink",
    rating: 4.7,
    zone: "sdn",
    location: {
      latitude: 18.5385,
      longitude: -69.9012,
      address: "Villa Mella, Santo Domingo Norte",
    },
  },
];

// ---------- Datos ficticios de drivers (repartidores) ----------
const DRIVERS = [
  {
    slug: "carlos-perez",
    fullName: "Carlos Pérez",
    phone: "809-555-0101",
    vehicleType: "MOTORCYCLE" as const,
    vehiclePlate: "A123456",
    rating: 4.9,
  },
  {
    slug: "maria-santos",
    fullName: "María Santos",
    phone: "809-555-0102",
    vehicleType: "MOTORCYCLE" as const,
    vehiclePlate: "A234567",
    rating: 4.7,
  },
  {
    slug: "luis-ramirez",
    fullName: "Luis Ramírez",
    phone: "809-555-0103",
    vehicleType: "CAR" as const,
    vehiclePlate: "G345678",
    rating: 4.8,
  },
];

// ---------- Catálogo maestro (marcas reales usadas solo como datos demo del producto,
// nunca como nombre de un merchant ficticio) ----------
type SeedProduct = {
  name: string;
  brand: string;
  category: keyof typeof CATEGORY_RULES;
  basePrice: number;
  alcoholType?: string;
  nicotineProduct?: boolean;
};

const PRODUCTS: SeedProduct[] = [
  // Ron
  {
    name: "Brugal Añejo 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 650,
    alcoholType: "ron",
  },
  {
    name: "Brugal Extra Viejo 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 950,
    alcoholType: "ron",
  },
  {
    name: "Brugal 1888 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 1850,
    alcoholType: "ron",
  },
  {
    name: "Brugal Leyenda 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 3200,
    alcoholType: "ron",
  },
  {
    name: "Barceló Imperial 750ml",
    brand: "Barceló",
    category: "ron",
    basePrice: 1450,
    alcoholType: "ron",
  },
  {
    name: "Barceló Gran Añejo 750ml",
    brand: "Barceló",
    category: "ron",
    basePrice: 780,
    alcoholType: "ron",
  },
  {
    name: "Bermúdez 8 Años 750ml",
    brand: "Bermúdez",
    category: "ron",
    basePrice: 890,
    alcoholType: "ron",
  },
  {
    name: "Ron Matusalem Platino 750ml",
    brand: "Matusalem",
    category: "ron",
    basePrice: 720,
    alcoholType: "ron",
  },

  // Whisky
  {
    name: "Johnnie Walker Red Label 750ml",
    brand: "Johnnie Walker",
    category: "whisky",
    basePrice: 1650,
    alcoholType: "whisky",
  },
  {
    name: "Johnnie Walker Black Label 750ml",
    brand: "Johnnie Walker",
    category: "whisky",
    basePrice: 2950,
    alcoholType: "whisky",
  },
  {
    name: "Buchanan's Deluxe 750ml",
    brand: "Buchanan's",
    category: "whisky",
    basePrice: 2400,
    alcoholType: "whisky",
  },
  {
    name: "Chivas Regal 12 750ml",
    brand: "Chivas Regal",
    category: "whisky",
    basePrice: 2750,
    alcoholType: "whisky",
  },

  // Vodka
  {
    name: "Absolut Blue 750ml",
    brand: "Absolut",
    category: "vodka",
    basePrice: 1350,
    alcoholType: "vodka",
  },
  {
    name: "Smirnoff Red 750ml",
    brand: "Smirnoff",
    category: "vodka",
    basePrice: 950,
    alcoholType: "vodka",
  },

  // Tequila
  {
    name: "Jose Cuervo Especial 750ml",
    brand: "Jose Cuervo",
    category: "tequila",
    basePrice: 1550,
    alcoholType: "tequila",
  },
  {
    name: "Don Julio Blanco 750ml",
    brand: "Don Julio",
    category: "tequila",
    basePrice: 3400,
    alcoholType: "tequila",
  },

  // Vinos
  {
    name: "Casillero del Diablo Cabernet Sauvignon 750ml",
    brand: "Casillero del Diablo",
    category: "vinos",
    basePrice: 890,
    alcoholType: "vino",
  },
  {
    name: "Santa Rita 120 Merlot 750ml",
    brand: "Santa Rita",
    category: "vinos",
    basePrice: 750,
    alcoholType: "vino",
  },
  {
    name: "Trapiche Malbec 750ml",
    brand: "Trapiche",
    category: "vinos",
    basePrice: 820,
    alcoholType: "vino",
  },

  // Espumantes
  {
    name: "Freixenet Cordon Negro 750ml",
    brand: "Freixenet",
    category: "espumantes",
    basePrice: 1150,
    alcoholType: "espumante",
  },
  {
    name: "Martini Asti 750ml",
    brand: "Martini",
    category: "espumantes",
    basePrice: 1350,
    alcoholType: "espumante",
  },

  // Cervezas
  {
    name: "Presidente Botella 12oz (six pack)",
    brand: "Presidente",
    category: "cervezas",
    basePrice: 380,
    alcoholType: "cerveza",
  },
  {
    name: "Presidente Light 12oz (six pack)",
    brand: "Presidente",
    category: "cervezas",
    basePrice: 380,
    alcoholType: "cerveza",
  },
  {
    name: "Bohemia Botella 12oz (six pack)",
    brand: "Bohemia",
    category: "cervezas",
    basePrice: 420,
    alcoholType: "cerveza",
  },
  {
    name: "Corona Extra 12oz (six pack)",
    brand: "Corona",
    category: "cervezas",
    basePrice: 590,
    alcoholType: "cerveza",
  },
  {
    name: "Heineken Lata 12oz (six pack)",
    brand: "Heineken",
    category: "cervezas",
    basePrice: 620,
    alcoholType: "cerveza",
  },

  // Tabaco / vape
  {
    name: "Marlboro Red Cajetilla",
    brand: "Marlboro",
    category: "tabaco",
    basePrice: 320,
    nicotineProduct: true,
  },
  {
    name: "Marlboro Gold Cajetilla",
    brand: "Marlboro",
    category: "tabaco",
    basePrice: 320,
    nicotineProduct: true,
  },
  {
    name: "Vaper desechable sabor menta",
    brand: "Genérico",
    category: "vape",
    basePrice: 950,
    nicotineProduct: true,
  },
  {
    name: "Vaper desechable sabor frutas",
    brand: "Genérico",
    category: "vape",
    basePrice: 950,
    nicotineProduct: true,
  },

  // Hielo
  {
    name: "Bolsa de Hielo 5kg",
    brand: "DeUna",
    category: "hielo",
    basePrice: 150,
  },
  {
    name: "Bolsa de Hielo 2kg",
    brand: "DeUna",
    category: "hielo",
    basePrice: 80,
  },

  // Mixers
  {
    name: "Coca-Cola 2L",
    brand: "Coca-Cola",
    category: "mixers",
    basePrice: 130,
  },
  {
    name: "Coca-Cola Zero 2L",
    brand: "Coca-Cola",
    category: "mixers",
    basePrice: 130,
  },
  { name: "Sprite 2L", brand: "Sprite", category: "mixers", basePrice: 125 },
  {
    name: "Ginger Ale 1L",
    brand: "Canada Dry",
    category: "mixers",
    basePrice: 110,
  },
  {
    name: "Agua Tónica Schweppes 1L",
    brand: "Schweppes",
    category: "mixers",
    basePrice: 140,
  },
  {
    name: "Agua Cristal 1L (six pack)",
    brand: "Cristal",
    category: "mixers",
    basePrice: 180,
  },

  // Snacks
  {
    name: "Doritos Nacho 145g",
    brand: "Doritos",
    category: "snacks",
    basePrice: 150,
  },
  {
    name: "Pringles Original 149g",
    brand: "Pringles",
    category: "snacks",
    basePrice: 280,
  },
  {
    name: "Maní Salado 200g",
    brand: "La Famosa",
    category: "snacks",
    basePrice: 110,
  },
  {
    name: "Chicharrones de Cerdo 100g",
    brand: "La Famosa",
    category: "snacks",
    basePrice: 130,
  },
  {
    name: "Platanutres 150g",
    brand: "Yummies",
    category: "snacks",
    basePrice: 100,
  },

  // Fiestas
  {
    name: "Vasos Plásticos Desechables (paq. 25)",
    brand: "DeUna",
    category: "fiestas",
    basePrice: 150,
  },
  {
    name: "Hielera Portátil 24qt",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 1200,
  },
  {
    name: "Servilletas (paq. 100)",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 90,
  },
  {
    name: "Globos de Colores (paq. 50)",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 120,
  },
];

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Selección determinística (sin Math.random) de qué merchants venden cada producto,
// para que el seed sea reproducible: distribuye por índice del producto.
function pickMerchantIndexes(
  productIndex: number,
  merchantCount: number,
): number[] {
  const count = 2 + (productIndex % 3); // 2 a 4 merchants por producto
  const indexes = new Set<number>();
  for (let i = 0; i < count; i++) {
    indexes.add((productIndex + i * 2) % merchantCount);
  }
  return Array.from(indexes);
}

function priceVariationFor(merchantOffset: number): number {
  // pequeñas variaciones de precio determinísticas por merchant (-8% a +8%)
  const variations = [-0.08, -0.03, 0.0, 0.04, 0.08];
  return 1 + variations[merchantOffset % variations.length];
}

async function main() {
  console.log("Seeding DeUna...");

  // Zonas de delivery
  const zoneRecords = new Map<string, string>();
  for (const zone of DEFAULT_DELIVERY_ZONES) {
    const created = await prisma.deliveryZone.upsert({
      where: { id: zone.id },
      update: {},
      create: {
        id: zone.id,
        name: zone.name,
        baseFee: zone.baseFee,
        pricePerKm: zone.pricePerKm,
        estimatedMinutes: zone.estimatedMinutes,
      },
    });
    zoneRecords.set(zone.id, created.id);
  }

  // Categorías
  const categoryRecords = new Map<string, string>();
  for (const rule of Object.values(CATEGORY_RULES)) {
    const created = await prisma.category.upsert({
      where: { slug: rule.slug },
      update: {},
      create: {
        slug: rule.slug,
        name: rule.label,
        emoji: rule.emoji,
        requiresAgeVerification: rule.requiresAgeVerification,
      },
    });
    categoryRecords.set(rule.slug, created.id);
  }

  // Merchants (usuario + perfil de merchant + ubicación)
  const passwordHash = await bcrypt.hash(DEMO_MERCHANT_PASSWORD, 10);
  const merchantRecords: { id: string; slug: string }[] = [];
  for (const m of MERCHANTS) {
    const user = await prisma.user.upsert({
      where: { email: `${m.slug}@merchants.deuna.do` },
      update: { passwordHash },
      create: {
        email: `${m.slug}@merchants.deuna.do`,
        role: "MERCHANT",
        passwordHash,
      },
    });

    const merchant = await prisma.merchant.upsert({
      where: { slug: m.slug },
      update: {},
      create: {
        userId: user.id,
        name: m.name,
        slug: m.slug,
        rating: m.rating,
        status: MerchantStatus.ACTIVE,
      },
    });

    await prisma.merchantLocation.upsert({
      where: { id: `${m.slug}-main` },
      update: {},
      create: {
        id: `${m.slug}-main`,
        merchantId: merchant.id,
        latitude: m.location.latitude,
        longitude: m.location.longitude,
        address: m.location.address,
        deliveryZoneId: zoneRecords.get(m.zone),
        isOpen: true,
      },
    });

    merchantRecords.push({ id: merchant.id, slug: merchant.slug });
  }

  // Drivers (usuario + perfil de driver)
  const driverPasswordHash = await bcrypt.hash(DEMO_DRIVER_PASSWORD, 10);
  for (const d of DRIVERS) {
    const user = await prisma.user.upsert({
      where: { email: `${d.slug}@drivers.deuna.do` },
      update: { passwordHash: driverPasswordHash },
      create: {
        email: `${d.slug}@drivers.deuna.do`,
        role: "DRIVER",
        passwordHash: driverPasswordHash,
      },
    });

    await prisma.driver.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        fullName: d.fullName,
        phone: d.phone,
        vehicleType: d.vehicleType,
        vehiclePlate: d.vehiclePlate,
        rating: d.rating,
        isActive: true,
      },
    });
  }

  console.log(`Drivers creados: ${DRIVERS.length}.`);

  // Productos + ofertas por merchant
  let offerCount = 0;
  const offersByMerchant = new Map<
    string,
    { offerId: string; price: number; productName: string }[]
  >();
  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i];
    const slug = slugify(`${p.brand}-${p.name}`);
    const rule = CATEGORY_RULES[p.category];

    const product = await prisma.product.upsert({
      where: { slug },
      update: {},
      create: {
        slug,
        name: p.name,
        brand: p.brand,
        description: `${p.name} — disponible para delivery en Santo Domingo a través de DeUna.`,
        categoryId: categoryRecords.get(p.category)!,
        images: [],
        ageRestricted: rule.requiresAgeVerification,
        requiresAgeVerification: rule.requiresAgeVerification,
        alcoholType: p.alcoholType ?? null,
        nicotineProduct: p.nicotineProduct ?? false,
      },
    });

    const merchantIdxs = pickMerchantIndexes(i, merchantRecords.length);
    for (let offset = 0; offset < merchantIdxs.length; offset++) {
      const merchant = merchantRecords[merchantIdxs[offset]];
      const price = Math.round(p.basePrice * priceVariationFor(offset));

      const offer = await prisma.productOffer.upsert({
        where: {
          productId_merchantId: {
            productId: product.id,
            merchantId: merchant.id,
          },
        },
        update: {},
        create: {
          productId: product.id,
          merchantId: merchant.id,
          price,
          isAvailable: true,
          availableForDelivery: true,
        },
      });

      await prisma.inventory.upsert({
        where: { productOfferId: offer.id },
        update: {},
        create: {
          productOfferId: offer.id,
          quantity: 10 + ((i + offset) % 40),
          lowStockAlert: 5,
        },
      });

      const list = offersByMerchant.get(merchant.id) ?? [];
      list.push({ offerId: offer.id, price, productName: p.name });
      offersByMerchant.set(merchant.id, list);

      offerCount++;
    }
  }

  console.log(
    `Listo: ${MERCHANTS.length} merchants, ${PRODUCTS.length} productos, ${offerCount} ofertas.`,
  );

  // ---------- Cliente y pedidos de demostración (para poder probar el panel de merchant) ----------
  const demoUser = await prisma.user.upsert({
    where: { email: "cliente-demo@deuna.do" },
    update: {},
    create: { email: "cliente-demo@deuna.do", role: "CUSTOMER" },
  });

  const demoProfile = await prisma.customerProfile.upsert({
    where: { userId: demoUser.id },
    update: {},
    create: { userId: demoUser.id, fullName: "Cliente Demo" },
  });

  let demoAddress = await prisma.address.findFirst({
    where: { userId: demoUser.id },
  });
  if (!demoAddress) {
    demoAddress = await prisma.address.create({
      data: {
        userId: demoUser.id,
        label: "Casa",
        latitude: 18.4655,
        longitude: -69.9312,
        line1: "Calle Principal #12, Bella Vista",
        city: "Santo Domingo",
        province: "Distrito Nacional",
        isDefault: true,
      },
    });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const yesterday = new Date(startOfToday);
  yesterday.setDate(yesterday.getDate() - 1);

  // Combinación de estado + qué tan viejo es el pedido, para dejar el panel de merchant listo
  // para probar cada acción (aceptar/rechazar/preparar/listo) y ver estadísticas del día.
  const DEMO_ORDER_PLAN: { status: OrderStatus; createdAt: Date }[] = [
    { status: "ORDER_PLACED", createdAt: startOfToday },
    { status: "MERCHANT_ACCEPTED", createdAt: startOfToday },
    { status: "PREPARING", createdAt: startOfToday },
    { status: "DELIVERED", createdAt: startOfToday },
    { status: "DELIVERED", createdAt: yesterday },
    { status: "CANCELLED", createdAt: startOfToday },
  ];

  let orderCounter = 10001;
  let demoOrderCount = 0;

  for (const merchant of merchantRecords) {
    const offers = offersByMerchant.get(merchant.id) ?? [];
    if (offers.length === 0) continue;

    for (let planIndex = 0; planIndex < DEMO_ORDER_PLAN.length; planIndex++) {
      const plan = DEMO_ORDER_PLAN[planIndex];
      const code = `DU-${orderCounter++}`;

      const existing = await prisma.order.findUnique({ where: { code } });
      if (existing) continue;

      // Selecciona 1 o 2 productos de ese merchant para el pedido de demo.
      const item1 = offers[planIndex % offers.length];
      const item2 = offers[(planIndex + 1) % offers.length];
      const lineItems =
        item1.offerId === item2.offerId
          ? [{ ...item1, quantity: 2 }]
          : [
              { ...item1, quantity: 1 },
              { ...item2, quantity: 1 },
            ];

      const subtotal = lineItems.reduce(
        (sum, li) => sum + li.price * li.quantity,
        0,
      );
      const deliveryFee = 150;
      const serviceFee = Math.round(subtotal * 0.025);
      const total = subtotal + deliveryFee + serviceFee;

      await prisma.order.create({
        data: {
          code,
          customerProfileId: demoProfile.id,
          merchantId: merchant.id,
          addressId: demoAddress.id,
          status: plan.status,
          subtotal,
          deliveryFee,
          serviceFee,
          total,
          createdAt: plan.createdAt,
          updatedAt: plan.createdAt,
          items: {
            create: lineItems.map((li) => ({
              productOfferId: li.offerId,
              productName: li.productName,
              unitPrice: li.price,
              quantity: li.quantity,
            })),
          },
        },
      });

      demoOrderCount++;
    }
  }

  console.log(`Pedidos de demo creados: ${demoOrderCount}.`);
  console.log(
    `Login de merchant: cualquier correo @merchants.deuna.do (ej. deuna-liquor@merchants.deuna.do) con contraseña "${DEMO_MERCHANT_PASSWORD}".`,
  );
  console.log(
    `Login de driver: cualquier correo @drivers.deuna.do (ej. carlos-perez@drivers.deuna.do) con contraseña "${DEMO_DRIVER_PASSWORD}".`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
