# Progreso

Estado vivo del proyecto. Se actualiza al cerrar cada paso.

## Instrucciones

- `AGENTS.md` es la instrucción del proyecto que lee Cursor.
- Reglas siempre activas: `.cursor/rules/progreso.mdc` y `.cursor/rules/arquitectura.mdc`.

## Rama `etapa-1`

Esqueleto Angular 22 zoneless más el modelo de CV y su JSON. Todavía no hay pantallas de edición. Master (`e06d276`) conserva el gestor anterior. Esta rama no está commiteada.

- Capas `domain`, `application`, `infrastructure` y `presentation`, con un README en cada una.
- `app.config.ts` enlaza el puerto `IdGenerator` con `CryptoIdGenerator`, fija `LOCALE_ID` en `es` y registra el locale español.
- Rutas vacías: `/documentos`, `/editor/:id`, `/exportar`. `/` redirige a documentos.
- ESLint `no-restricted-imports` impide saltarse las capas.
- Fuentes Source Sans 3 en `public/fonts/`. Conclusiones del spike en `docs/spike-pdf.md`. El directorio `spike/` se eliminó.

## Modelo y JSON

- Un solo tipo `Resume` para maestro y versión (`meta.kind`, `meta.derivedFrom`).
- `updatedAt` y `revision` cambian al reordenar u ocultar contenido. Renombrar y editar la postulación no los mueven.
- `deriveVersion` copia en profundidad, conserva los ids de secciones, ítems y viñetas, y pone un `meta.id` nuevo.
- JSON `schemaVersion` 1, indentado a 2 espacios, con orden de claves fijo. `migrate` acepta un documento sin `schemaVersion` y rechaza una versión futura.
- El formato está descrito en `docs/formato-json.md`.

## Comprobado

- `ng test --watch=false`: 17 pruebas. Incluyen las reglas de domain (sin Angular) y la ida y vuelta del JSON.
- `ng build`.
- `npm run lint`.
- En el navegador del IDE (Chromium), en la etapa anterior: `/` redirige a `/documentos`; `/documentos`, `/editor/demo` y `/exportar` muestran su título. Esta etapa no cambia pantallas.
- Firefox no se abrió. Node del entorno es v25; Angular avisa de que declara soporte para 22, 24 o 26 o superior.
