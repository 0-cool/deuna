# packages/ui (reservado)

Los componentes del MVP viven en `apps/web/components` porque solo hay una app consumiéndolos.
Cuando exista una segunda superficie que los necesite (por ejemplo, un panel admin separado o
una app móvil con React Native/Expo compartiendo componentes web), mover aquí los componentes
puramente presentacionales (sin `use client` de Next.js específico ni lógica de datos) y
publicarlos como `@deuna/ui`.

No se crea contenido aquí todavía para no duplicar componentes sin un segundo consumidor real
(sección 51 del documento de arquitectura: no construir funcionalidades futuras innecesariamente).
