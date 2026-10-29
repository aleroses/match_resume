# Progreso

Estado vivo del proyecto. Se actualiza al cerrar cada paso.

## Instrucciones

- `AGENTS.md` es la instrucción del proyecto que lee Cursor.
- Reglas siempre activas: `.cursor/rules/progreso.mdc` y `.cursor/rules/arquitectura.mdc`.

## Rama `etapa-3`

Sin commit. Parte de `etapa-1` (`16cd097`, el modelo y el JSON). El esqueleto Angular 22 zoneless sigue. No hay editor de contenido, PDF ni importar/exportar.

- Capas `domain`, `application`, `infrastructure` y `presentation`. `app.config.ts` enlaza `IdGenerator`, `Clock`, `ResumeRepository` y los casos de uso.
- `LOCALE_ID` es `es`. Rutas: `/documentos` (panel), `/editor/:id` y `/exportar` siguen vacías. `/` redirige a documentos.
- ESLint `no-restricted-imports` impide saltarse las capas.
- Fuentes Source Sans 3 en `public/fonts/`. Conclusiones del spike en `docs/spike-pdf.md`.

## Modelo y JSON

- Un solo tipo `Resume` para maestro y versión (`meta.kind`, `meta.derivedFrom`).
- `updatedAt` y `revision` cambian si cambia el contenido. Renombrar y editar la postulación no los mueven. `withStoredTimestamps` aplica esa regla al guardar.
- `deriveVersion` copia en profundidad, conserva los ids de secciones, ítems y viñetas, y pone un `meta.id` nuevo.
- JSON `schemaVersion` 1, indentado a 2 espacios, con orden de claves fijo. El formato está en `docs/formato-json.md`.

## Documentos

- IndexedDB (`match-resume`, tabla `resumes`, clave `meta.id`). Al leer, Zod deja fuera un registro ilegible y devuelve su id. Un maestro ilegible impide crear otro.
- Al entrar en `/documentos` se abre o se crea un único maestro vacío en español.
- Cada tarjeta muestra nombre, tipo, empresa y puesto si la versión los tiene, y la fecha «Modificado» en español. La primera lleva «Más reciente».
- «Crear versión» en todas. «Eliminar» solo en versiones, con confirmación.
- Si `navigator.storage.persist()` no se concede, un aviso recuerda que el respaldo es exportar el JSON a GitHub.

## Comprobado

- `ng test --watch=false`: 24 pruebas. Incluyen el repositorio en memoria y Dexie con `fake-indexeddb`.
- `npm run lint` y `ng build`. El build de producción avisa de que el bundle inicial (783 kB, por Dexie) supera el aviso de 500 kB.
- En el navegador del IDE (Chromium): el maestro aparece con fecha e insignia y sin «Eliminar»; «Crear versión» añade una tarjeta que pasa a ser la más reciente; cancelar la confirmación la deja; aceptarla la borra y el maestro sigue tras recargar. El aviso de persistencia se muestra porque el navegador no la concedió. `/editor/demo` sigue mostrando su título.
- Firefox no se abrió. Node del entorno es v25; Angular avisa de que declara soporte para 22, 24 o 26 o superior.
