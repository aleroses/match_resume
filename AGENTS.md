# Gestor personal de CV compatible con ATS

Instrucciones del proyecto para Cursor. Hay que seguirlas en cada cambio.

## Qué es

Aplicación web de solo cliente, sin backend y sin cuentas, para mantener un CV maestro, derivar versiones por oferta (copias snapshot con `derivedFrom`) y exportar PDF con texto seleccionable. Los respaldos son archivos JSON y PDF que el usuario sube manualmente a GitHub. No hay API de GitHub.

## Stack

- Angular 22 (componentes standalone, signals, control flow `@if` / `@for`), sin Zone.js.
- TypeScript estricto. Sin NgRx. Sin librerías de UI.
- Zod, Dexie (IndexedDB), pdfmake, pdfjs-dist.
- Pruebas de domain y application con Vitest, en Node, sin navegador.
- Navegador principal: Firefox. También debe funcionar en Chromium. Windows y Linux.
- No usar File System Access API. Importar y exportar es descargar y volver a subir archivos.

## Producto

- UI en español. El contenido de cada CV es `es` o `en`.
- Un solo CV maestro. Las derivadas son copias independientes; no se re-sincronizan.
- `updatedAt` cambia solo si cambian `content` o `locale`. Renombrar, editar la oferta o recalcular la auditoría no lo cambia.
- La app no inventa experiencia, habilidades ni logros. No hay IA ni envío de datos a terceros.
- La auditoría ATS es orientativa. Nunca afirmar que garantiza pasar un ATS. No hay puntuación de “aprobado”.
- PDF de una columna, texto real, encabezados estándar, fechas y viñetas como texto, URL visibles. Fuentes TTF estáticas Source Sans 3 (OFL) con ñ y tildes, servidas desde `public/fonts/`, sin CDN.
- pdf.js usa el worker local (`pdfjs/pdf.worker.min.mjs`), nunca un CDN.

## Arquitectura

Carpetas: `src/app/{domain,application,infrastructure,presentation}`.

- **domain:** TypeScript puro. Sin Angular ni librerías externas.
- **application:** casos de uso y puertos (clases abstractas). Solo importa domain.
- **infrastructure:** Dexie, Zod, pdfmake, pdf.js y descarga de archivos. Implementa los puertos.
- **presentation:** componentes y un store con signals. Habla con casos de uso. No importa infrastructure.
- `src/app/app.config.ts` es el único sitio que enlaza cada puerto con su implementación.

ESLint `no-restricted-imports` debe fallar si una capa se salta ese límite. La configuración está en `eslint.config.mjs`.

## Registro de progreso

`docs/progreso.md` es el estado vivo: qué se hizo, qué funciona y cómo se comprobó. Al cerrar un paso, actualizar ese archivo en el mismo cambio. La regla `.cursor/rules/progreso.mdc` obliga a hacerlo.

## Angular, la primera vez que aparezca un concepto

Explicarlo en el mensaje al usuario, no como tutorial dentro de cada archivo:

- **Standalone:** el componente declara sus `imports`. No hay `NgModule`.
- **Signal:** valor que la plantilla vuelve a leer al cambiar.
- **`inject()` y providers:** `app.config.ts` registra la clase concreta; el componente pide el puerto o el store.
- **Control flow:** `@if` y `@for` en la plantilla.
- **Zoneless:** sin `zone.js`, la vista se actualiza por signals y por eventos de la plantilla.

## Commits

Commits pequeños. No hacer push salvo que el usuario lo pida.
