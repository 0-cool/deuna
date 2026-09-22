# apps/api (reservado)

En el MVP, la lógica de negocio vive en Next.js Route Handlers y Server Components dentro de
`apps/web`, que ya consumen `packages/database`, `packages/types` y `packages/config` — la
misma fuente de verdad que usará este servicio.

Este directorio queda reservado para cuando exista una app móvil (iOS/Android) que necesite un
API HTTP standalone en vez de Server Components. Cuando llegue ese momento:

1. Mover los Route Handlers relevantes de `apps/web/app/api/*` aquí (o a un framework como
   Express/Fastify/NestJS, según lo que se decida entonces).
2. Reutilizar `packages/database`, `packages/types` y `packages/config` sin cambios — es
   justamente para esto que la lógica de dominio no vive dentro de componentes de UI.
3. Actualizar `apps/web` para que consuma este API en vez de llamar a Prisma directamente.

No crear un servidor vacío "por si acaso" antes de que una app móvil lo necesite de verdad —
sección 51 del documento de arquitectura: no construir funcionalidades futuras innecesariamente.
