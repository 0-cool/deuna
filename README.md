# DeUna

**Tú pide. Nosotros resolvemos.**

Marketplace de delivery para productos de consumo adulto (alcohol, tabaco/vape donde la ley lo permite,
hielo, mixers, snacks y básicos para fiestas) en República Dominicana. Este repo contiene el MVP web.

> ⚠️ Antes de operar: la verificación de edad, la documentación exigible a comercios de alcohol/tabaco/vape
> y el tratamiento fiscal de comisiones **requieren revisión legal local**. El código deja estos puntos
> configurables a propósito — ver `packages/config` y el documento de especificación técnica.

## Qué incluye esta primera pasada

Esta es la Fase 1 de la implementación (estructura del proyecto + schema de base de datos + experiencia
customer). Merchant dashboard, Admin y autenticación real quedan para la siguiente pasada — se dejaron
rutas y modelos de datos preparados para no tener que rediseñar el schema después.

- ✅ Estructura de monorepo (`/apps`, `/packages`)
- ✅ Prisma schema completo (todas las entidades del documento de arquitectura)
- ✅ Seed data realista de República Dominicana (5 merchants, productos, zonas de delivery)
- ✅ Experiencia customer: home, búsqueda con tolerancia a errores, detalle de producto con
  comparación de merchants, carrito, checkout (UI, sin proveedor de pago real todavía), tracking de pedido
- ✅ Age gate / arquitectura de verificación de edad (declarativa en esta fase — ver nota legal)
- ⏳ Merchant dashboard, Admin dashboard, autenticación real, API routes conectadas a Postgres real: siguiente pasada

## Estructura

```
/apps
  /web        Next.js 14 (App Router) — toda la UI del MVP
  /api        Reservado para un servicio API standalone cuando las apps móviles lo requieran.
              En el MVP la lógica vive en Next.js Route Handlers (apps/web/app/api) para no
              duplicar infraestructura antes de tiempo; ambos consumen los mismos packages.

/packages
  /database   Prisma schema, migraciones y seed. Fuente única de verdad del modelo de datos.
  /types      Tipos y enums compartidos entre web/api (y futuras apps móviles).
  /config     Valores por defecto de comisiones, fees y reglas de age verification por categoría.
              En producción estos valores viven en la base de datos y se editan desde Admin;
              aquí solo están los defaults de seed/desarrollo.
  /ui         Componentes de UI reutilizables sin lógica de negocio.
  /utils      Helpers puros (formateo de moneda RD$, cálculo de distancia, slugify, etc.)
```

## Requisitos

- Node.js ≥ 18.18
- PostgreSQL ≥ 14 (local o remoto)

## Cómo correrlo localmente

```bash
npm install

# 1. Configura la base de datos
cp packages/database/.env.example packages/database/.env
# edita DATABASE_URL con tu conexión de Postgres

# 2. Crea las tablas y carga datos de ejemplo
npm run db:migrate
npm run db:seed

# 3. Levanta la web
npm run dev
```

La web queda en `http://localhost:3000`.

> Nota: `npm run db:generate` descarga el motor de Prisma la primera vez (necesita acceso a
> internet normal). Ya validamos que el proyecto compila y bundlea sin errores; ese único paso
> no se pudo ejecutar en el entorno donde se generó este código porque no tenía salida a
> internet general — en tu máquina funcionará sin problema.

## Principios de diseño técnico (resumen del spec)

- `Product` (catálogo maestro) vs `ProductOffer` (precio/inventario por merchant) están separados a propósito:
  el mismo producto puede tener varios precios según el comercio.
- Ninguna comisión, delivery fee o regla de age verification está hardcodeada — todo es configuración
  (`packages/config` en dev, tablas de Admin en producción).
- `PaymentProvider`, `MapProvider` y `NotificationChannel` son interfaces: el dominio nunca depende
  directamente de Azul, Google Maps o un proveedor de SMS específico.
- El checkout del MVP asume un solo merchant por pedido; el modelo de datos ya soporta dividir un
  carrito multi-merchant en varias órdenes cuando se necesite.
