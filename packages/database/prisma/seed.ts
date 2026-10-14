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
  imageKey?: keyof typeof PRODUCT_IMAGES;
};

// Fotos reales (Wikimedia Commons, licencia libre — sin API key) por marca/producto. Varios
// productos de la misma marca comparten imagen (ej. las 4 variantes de Brugal). Cuando no se
// encontró una foto real fiable sin mostrar otra marca o algo irrelevante (Bermúdez, Santa Rita),
// se deja sin `imageKey` a propósito: el UI ya cae a un emoji de placeholder en ese caso.
const PRODUCT_IMAGES = {
  brugal: "https://upload.wikimedia.org/wikipedia/commons/d/d8/Ron_Brugal.jpg",
  barcelo:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Ron_Barcel%C3%B3_A%C3%B1ejo.png/500px-Ron_Barcel%C3%B3_A%C3%B1ejo.png",
  matusalem:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Matusalem_Extra_Anejo.jpg/500px-Matusalem_Extra_Anejo.jpg",
  jwRed:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/dd/Johnnie_Walker_Red_Label.jpg/960px-Johnnie_Walker_Red_Label.jpg",
  jwBlack:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/Johnnie_Walker_Black_Label.jpg/960px-Johnnie_Walker_Black_Label.jpg",
  buchanans:
    "https://upload.wikimedia.org/wikipedia/commons/7/70/Bottle%2C_whisky_%28AM_1482-1%29.jpg",
  chivas:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f6/Chivas_regal_12yo.jpg/960px-Chivas_regal_12yo.jpg",
  absolut:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Absolut_Vodka_01.jpg/960px-Absolut_Vodka_01.jpg",
  smirnoff:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/de/Smirnoff_Red_Label_8213.jpg/960px-Smirnoff_Red_Label_8213.jpg",
  cuervo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Jose-Cuervo-logo.jpg",
  donJulio: "https://upload.wikimedia.org/wikipedia/commons/8/80/Tequila_Don_Julio.jpg",
  casillero:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/Casillero_del_Diablo_wine.jpg/960px-Casillero_del_Diablo_wine.jpg",
  trapiche:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a4/Trapiche_Oak_Cask_malbec.jpg/960px-Trapiche_Oak_Cask_malbec.jpg",
  freixenet:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/37/Freixenet_Cordon_Negro_Cava_%288600473487%29.jpg/960px-Freixenet_Cordon_Negro_Cava_%288600473487%29.jpg",
  martiniAsti:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/00/Martini_asti.jpg/960px-Martini_asti.jpg",
  presidente:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Presidente-Bier.jpg/960px-Presidente-Bier.jpg",
  bohemia:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1a/Bohemia_Clasica.JPG/960px-Bohemia_Clasica.JPG",
  corona:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/04/Corona_Extra_beer_bottle_%282019%29.png/500px-Corona_Extra_beer_bottle_%282019%29.png",
  heineken:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Heineken_beer_tray.JPG/960px-Heineken_beer_tray.JPG",
  marlboroRed:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Marlboro_red_pack_front_NZ.jpg/960px-Marlboro_red_pack_front_NZ.jpg",
  marlboroGold:
    "https://upload.wikimedia.org/wikipedia/commons/b/bf/Pack_de_20_Marlboro_Gold_KS.jpg",
  vape: "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/35/Vape_Pen_-_E-Cigarette_%2824982640784%29.jpg/960px-Vape_Pen_-_E-Cigarette_%2824982640784%29.jpg",
  iceBag:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Ice_cube_bag_01.jpg/960px-Ice_cube_bag_01.jpg",
  cocaCola:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e8/15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg/960px-15-09-26-RalfR-WLC-0098_-_Coca-Cola_glass_bottle_%28Germany%29.jpg",
  cocaColaZero:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Coca-Cola_Zero_bottle.JPG/960px-Coca-Cola_Zero_bottle.JPG",
  sprite:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/Sprite_Zero_Sugar_1.jpg/960px-Sprite_Zero_Sugar_1.jpg",
  canadaDry:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0b/Canada_Dry_ginger_ale_bottles.jpg/960px-Canada_Dry_ginger_ale_bottles.jpg",
  schweppes:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b3/Schweppes_Indian_Tonic_Water_%28front%29.jpg/960px-Schweppes_Indian_Tonic_Water_%28front%29.jpg",
  bottledWater:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Water_bottle_%2813779%29.jpg/960px-Water_bottle_%2813779%29.jpg",
  doritos:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Nachos-cheese.jpg/960px-Nachos-cheese.jpg",
  pringles:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Pringles_Paprika_reflection.JPG/960px-Pringles_Paprika_reflection.JPG",
  peanuts:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Peanuts_in_a_bowl..jpg/960px-Peanuts_in_a_bowl..jpg",
  chicharrones:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/Chicharon.jpg/960px-Chicharon.jpg",
  plantainChips:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/db/Baked_Plantain_Chips.jpg/960px-Baked_Plantain_Chips.jpg",
  plasticCups:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/02/File-White_plastic_drinking_cup%2C_3_12_oz_size-Printed_in_red_letters_on_both_sides-_LAMAR_BATH_HOUSE_%2806186cd5-edbb-4998-a360-bcf988fcd7c7%29.jpg/960px-File-White_plastic_drinking_cup%2C_3_12_oz_size-Printed_in_red_letters_on_both_sides-_LAMAR_BATH_HOUSE_%2806186cd5-edbb-4998-a360-bcf988fcd7c7%29.jpg",
  cooler:
    "https://upload.wikimedia.org/wikipedia/commons/4/47/Rubbermaid_DuraChill_Cooler_-_Ice_Chest_%282613253830%29.jpg",
  napkins: "https://upload.wikimedia.org/wikipedia/commons/1/14/Kleenex.jpg",
  balloons:
    "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Balloon_man.JPG/960px-Balloon_man.JPG",
} as const;

const PRODUCTS: SeedProduct[] = [
  // Ron
  {
    name: "Brugal Añejo 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 650,
    alcoholType: "ron",
    imageKey: "brugal",
  },
  {
    name: "Brugal Extra Viejo 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 950,
    alcoholType: "ron",
    imageKey: "brugal",
  },
  {
    name: "Brugal 1888 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 1850,
    alcoholType: "ron",
    imageKey: "brugal",
  },
  {
    name: "Brugal Leyenda 750ml",
    brand: "Brugal",
    category: "ron",
    basePrice: 3200,
    alcoholType: "ron",
    imageKey: "brugal",
  },
  {
    name: "Barceló Imperial 750ml",
    brand: "Barceló",
    category: "ron",
    basePrice: 1450,
    alcoholType: "ron",
    imageKey: "barcelo",
  },
  {
    name: "Barceló Gran Añejo 750ml",
    brand: "Barceló",
    category: "ron",
    basePrice: 780,
    alcoholType: "ron",
    imageKey: "barcelo",
  },
  {
    name: "Bermúdez 8 Años 750ml",
    brand: "Bermúdez",
    category: "ron",
    basePrice: 890,
    alcoholType: "ron",
    // Sin imageKey a propósito — ver comentario en PRODUCT_IMAGES.
  },
  {
    name: "Ron Matusalem Platino 750ml",
    brand: "Matusalem",
    category: "ron",
    basePrice: 720,
    alcoholType: "ron",
    imageKey: "matusalem",
  },

  // Whisky
  {
    name: "Johnnie Walker Red Label 750ml",
    brand: "Johnnie Walker",
    category: "whisky",
    basePrice: 1650,
    alcoholType: "whisky",
    imageKey: "jwRed",
  },
  {
    name: "Johnnie Walker Black Label 750ml",
    brand: "Johnnie Walker",
    category: "whisky",
    basePrice: 2950,
    alcoholType: "whisky",
    imageKey: "jwBlack",
  },
  {
    name: "Buchanan's Deluxe 750ml",
    brand: "Buchanan's",
    category: "whisky",
    basePrice: 2400,
    alcoholType: "whisky",
    imageKey: "buchanans",
  },
  {
    name: "Chivas Regal 12 750ml",
    brand: "Chivas Regal",
    category: "whisky",
    basePrice: 2750,
    alcoholType: "whisky",
    imageKey: "chivas",
  },

  // Vodka
  {
    name: "Absolut Blue 750ml",
    brand: "Absolut",
    category: "vodka",
    basePrice: 1350,
    alcoholType: "vodka",
    imageKey: "absolut",
  },
  {
    name: "Smirnoff Red 750ml",
    brand: "Smirnoff",
    category: "vodka",
    basePrice: 950,
    alcoholType: "vodka",
    imageKey: "smirnoff",
  },

  // Tequila
  {
    name: "Jose Cuervo Especial 750ml",
    brand: "Jose Cuervo",
    category: "tequila",
    basePrice: 1550,
    alcoholType: "tequila",
    imageKey: "cuervo",
  },
  {
    name: "Don Julio Blanco 750ml",
    brand: "Don Julio",
    category: "tequila",
    basePrice: 3400,
    alcoholType: "tequila",
    imageKey: "donJulio",
  },

  // Vinos
  {
    name: "Casillero del Diablo Cabernet Sauvignon 750ml",
    brand: "Casillero del Diablo",
    category: "vinos",
    basePrice: 890,
    alcoholType: "vino",
    imageKey: "casillero",
  },
  {
    name: "Santa Rita 120 Merlot 750ml",
    brand: "Santa Rita",
    category: "vinos",
    basePrice: 750,
    alcoholType: "vino",
    // Sin imageKey a propósito — ver comentario en PRODUCT_IMAGES.
  },
  {
    name: "Trapiche Malbec 750ml",
    brand: "Trapiche",
    category: "vinos",
    basePrice: 820,
    alcoholType: "vino",
    imageKey: "trapiche",
  },

  // Espumantes
  {
    name: "Freixenet Cordon Negro 750ml",
    brand: "Freixenet",
    category: "espumantes",
    basePrice: 1150,
    alcoholType: "espumante",
    imageKey: "freixenet",
  },
  {
    name: "Martini Asti 750ml",
    brand: "Martini",
    category: "espumantes",
    basePrice: 1350,
    alcoholType: "espumante",
    imageKey: "martiniAsti",
  },

  // Cervezas
  {
    name: "Presidente Botella 12oz (six pack)",
    brand: "Presidente",
    category: "cervezas",
    basePrice: 380,
    alcoholType: "cerveza",
    imageKey: "presidente",
  },
  {
    name: "Presidente Light 12oz (six pack)",
    brand: "Presidente",
    category: "cervezas",
    basePrice: 380,
    alcoholType: "cerveza",
    imageKey: "presidente",
  },
  {
    name: "Bohemia Botella 12oz (six pack)",
    brand: "Bohemia",
    category: "cervezas",
    basePrice: 420,
    alcoholType: "cerveza",
    imageKey: "bohemia",
  },
  {
    name: "Corona Extra 12oz (six pack)",
    brand: "Corona",
    category: "cervezas",
    basePrice: 590,
    alcoholType: "cerveza",
    imageKey: "corona",
  },
  {
    name: "Heineken Lata 12oz (six pack)",
    brand: "Heineken",
    category: "cervezas",
    basePrice: 620,
    alcoholType: "cerveza",
    imageKey: "heineken",
  },

  // Tabaco / vape
  {
    name: "Marlboro Red Cajetilla",
    brand: "Marlboro",
    category: "tabaco",
    basePrice: 320,
    nicotineProduct: true,
    imageKey: "marlboroRed",
  },
  {
    name: "Marlboro Gold Cajetilla",
    brand: "Marlboro",
    category: "tabaco",
    basePrice: 320,
    nicotineProduct: true,
    imageKey: "marlboroGold",
  },
  {
    name: "Vaper desechable sabor menta",
    brand: "Genérico",
    category: "vape",
    basePrice: 950,
    nicotineProduct: true,
    imageKey: "vape",
  },
  {
    name: "Vaper desechable sabor frutas",
    brand: "Genérico",
    category: "vape",
    basePrice: 950,
    nicotineProduct: true,
    imageKey: "vape",
  },

  // Hielo
  {
    name: "Bolsa de Hielo 5kg",
    brand: "DeUna",
    category: "hielo",
    basePrice: 150,
    imageKey: "iceBag",
  },
  {
    name: "Bolsa de Hielo 2kg",
    brand: "DeUna",
    category: "hielo",
    basePrice: 80,
    imageKey: "iceBag",
  },

  // Mixers
  {
    name: "Coca-Cola 2L",
    brand: "Coca-Cola",
    category: "mixers",
    basePrice: 130,
    imageKey: "cocaCola",
  },
  {
    name: "Coca-Cola Zero 2L",
    brand: "Coca-Cola",
    category: "mixers",
    basePrice: 130,
    imageKey: "cocaColaZero",
  },
  {
    name: "Sprite 2L",
    brand: "Sprite",
    category: "mixers",
    basePrice: 125,
    imageKey: "sprite",
  },
  {
    name: "Ginger Ale 1L",
    brand: "Canada Dry",
    category: "mixers",
    basePrice: 110,
    imageKey: "canadaDry",
  },
  {
    name: "Agua Tónica Schweppes 1L",
    brand: "Schweppes",
    category: "mixers",
    basePrice: 140,
    imageKey: "schweppes",
  },
  {
    name: "Agua Cristal 1L (six pack)",
    brand: "Cristal",
    category: "mixers",
    basePrice: 180,
    imageKey: "bottledWater",
  },

  // Snacks
  {
    name: "Doritos Nacho 145g",
    brand: "Doritos",
    category: "snacks",
    basePrice: 150,
    imageKey: "doritos",
  },
  {
    name: "Pringles Original 149g",
    brand: "Pringles",
    category: "snacks",
    basePrice: 280,
    imageKey: "pringles",
  },
  {
    name: "Maní Salado 200g",
    brand: "La Famosa",
    category: "snacks",
    basePrice: 110,
    imageKey: "peanuts",
  },
  {
    name: "Chicharrones de Cerdo 100g",
    brand: "La Famosa",
    category: "snacks",
    basePrice: 130,
    imageKey: "chicharrones",
  },
  {
    name: "Platanutres 150g",
    brand: "Yummies",
    category: "snacks",
    basePrice: 100,
    imageKey: "plantainChips",
  },

  // Fiestas
  {
    name: "Vasos Plásticos Desechables (paq. 25)",
    brand: "DeUna",
    category: "fiestas",
    basePrice: 150,
    imageKey: "plasticCups",
  },
  {
    name: "Hielera Portátil 24qt",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 1200,
    imageKey: "cooler",
  },
  {
    name: "Servilletas (paq. 100)",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 90,
    imageKey: "napkins",
  },
  {
    name: "Globos de Colores (paq. 50)",
    brand: "Genérico",
    category: "fiestas",
    basePrice: 120,
    imageKey: "balloons",
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

    const extraImages = Object.values(PRODUCT_IMAGES)
      .filter((url) => url !== (p.imageKey ? PRODUCT_IMAGES[p.imageKey] : ""))
      .slice(i % 4, (i % 4) + 2);
    const images = p.imageKey
      ? [PRODUCT_IMAGES[p.imageKey], ...extraImages]
      : extraImages;

    const product = await prisma.product.upsert({
      where: { slug },
      // `update` sí toca `images`: el seed corrió antes sin fotos, y necesitamos que una segunda
      // corrida se las agregue a los productos que ya existían (upsert con `update: {}` no lo
      // haría — se quedaría con el `images: []` original).
      update: { images },
      create: {
        slug,
        name: p.name,
        brand: p.brand,
        description: `${p.name} — disponible para delivery en Santo Domingo a través de DeUna.`,
        categoryId: categoryRecords.get(p.category)!,
        images,
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
  const demoCustomerPassword = await bcrypt.hash(DEMO_MERCHANT_PASSWORD, 10);
  const demoUser = await prisma.user.upsert({
    where: { email: "cliente-demo@deuna.do" },
    update: { passwordHash: demoCustomerPassword },
    create: {
      email: "cliente-demo@deuna.do",
      role: "CUSTOMER",
      passwordHash: demoCustomerPassword,
    },
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
  console.log(
    `Login de cliente: cliente-demo@deuna.do con contraseña "${DEMO_MERCHANT_PASSWORD}".`,
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
