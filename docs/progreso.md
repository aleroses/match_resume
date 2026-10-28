# Progreso

Estado vivo del proyecto. Se actualiza al cerrar cada paso.

## Instrucciones

- `AGENTS.md` es la instrucción del proyecto que lee Cursor.
- Reglas siempre activas: `.cursor/rules/progreso.mdc` y `.cursor/rules/arquitectura.mdc`.

## Aplicación

- Angular 22 zoneless, capas domain / application / infrastructure / presentation, enlace de puertos solo en `app.config.ts`.
- Un CV maestro en IndexedDB, copias con `derivedFrom`, `updatedAt` solo si cambian contenido o idioma.
- PDF de una columna con Source Sans 3. La revisión ATS dice que es orientativa y no garantiza pasar un filtro.
- Respaldo: descarga de `cv-respaldo.json` e importación con `<input type="file">`.

## Comprobado

- `ng test --watch=false`: 17 pruebas.
- `npm run check:pdf`: el PDF generado conserva «ñ» y tildes y el texto se puede extraer.
- `npm run lint` y `ng build`.
- En el navegador del IDE (Chromium): alta del maestro, guardado, segundo guardado sin mover `updatedAt`, renombrar sin mover `updatedAt`, revisión ATS con el aviso de que no garantiza pasar un ATS, y copia «Oferta ejemplo» con el mismo contenido.
- Firefox no se abrió en esta sesión. Node del entorno es v25; Angular avisa de que declara soporte para 22, 24 o 26 o superior.
