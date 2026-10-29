# Progreso

Estado vivo del proyecto. Se actualiza al cerrar cada paso.

## Instrucciones

- `AGENTS.md` es la instrucción del proyecto que lee Cursor.
- Reglas siempre activas: `.cursor/rules/progreso.mdc` y `.cursor/rules/arquitectura.mdc`.

## Rama `etapa-4`

Parte de `etapa-3` (`b392995`, IndexedDB y el panel). Sin commit. No hay editor de contenido ni PDF.

- Capas y enlace en `app.config.ts`, ahora también `FileGateway`, `ResumeArchive`, `BackupReminderStore` y los casos de exportar e importar.
- ESLint `no-restricted-imports` sigue impidiendo saltarse las capas. La presentación no importa infraestructura.
- Fuentes Source Sans 3 en `public/fonts/`. Conclusiones del spike en `docs/spike-pdf.md`.

## Modelo y JSON

- Un solo tipo `Resume` para maestro y versión. El paquete no añade campos al CV.
- `updatedAt` y `revision` cambian si cambia el contenido. Renombrar y editar la postulación no los mueven. Importar guarda el documento del archivo tal cual, sin pasar por esa regla.
- JSON `schemaVersion` 1. Exportar todo escribe un paquete `bundleVersion` 1 con `exportedAt` y `documents`. El formato está en `docs/formato-json.md`.

## Documentos

- IndexedDB (`match-resume`, tabla `resumes`, clave `meta.id`). Al entrar en `/documentos` se abre o se crea un único maestro vacío en español.
- Cada tarjeta tiene «Exportar», «Crear versión» y, si es una versión, «Eliminar». Arriba están «Exportar todo» e «Importar».
- Importar suma. Primero se valida el archivo entero; si un documento no vale, no se escribe nada y el aviso dice cuál. Después se muestra el plan. Confirmar escribe. Cancelar no.
- Un id nuevo se añade. Uno idéntico se ignora. Si el archivo es más reciente, confirmar lo reemplaza. Si el local es más reciente, o la fecha coincide y no son iguales, se conserva el local salvo que en ese documento se elija el importado. Un maestro con otro id se rechaza y el resto del archivo puede entrar.
- En un navegador sin datos, el maestro que crea la página al entrar bloquea el maestro de un respaldo si el id es distinto. La prueba de ida y vuelta usa un almacén vacío y no crea ese maestro antes.
- El aviso «N documentos sin respaldar» cuenta los CV con `updatedAt` posterior al último «Exportar todo». Si nunca se ha exportado todo, cuentan todos. Exportar uno solo no mueve esa fecha.
- Si `navigator.storage.persist()` no se concede, otro aviso recuerda que el respaldo es exportar el JSON a GitHub.

## Comprobado

- `ng test --watch=false`: 47 pruebas. Incluyen la clasificación, el repositorio en memoria y el paquete Zod.
- `npm run lint` y `ng build`. El build de producción avisa de que el bundle inicial supera el aviso de 500 kB.
- En el navegador del IDE (Chromium): el maestro muestra «1 documento sin respaldar»; exportar uno baja `cv-<slug>-<8 del id>.json`; exportar todo baja el paquete, guarda la fecha y quita el aviso; crear una versión lo vuelve a mostrar; borrar esa versión e importar el paquete propone añadirla e ignorar el maestro; cancelar no escribe; confirmar la añade con su fecha original; repetir el archivo ignora los dos; un nombre distinto con la misma fecha pide elección y, si se elige el importado, reemplaza sin mover `updatedAt`; un documento malo nombra la posición y no toca el almacén; un segundo maestro se rechaza en el plan. La versión de prueba se borró y se limpió la fecha de respaldo de esa comprobación, así que el aviso volvió a «1 documento sin respaldar».
- Firefox no se abrió. Ahí falta mirar que la descarga caiga en la carpeta elegida y que el selector de archivo abra y, si se cancela, no cambie nada.
- Node del entorno es v25; Angular avisa de que declara soporte para 22, 24 o 26 o superior.
