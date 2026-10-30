# Progreso

Estado vivo del proyecto. Se actualiza al cerrar cada paso.

## Instrucciones

- `AGENTS.md` es la instrucción del proyecto que lee Cursor.
- Reglas siempre activas: `.cursor/rules/progreso.mdc`, `.cursor/rules/arquitectura.mdc` y `.cursor/rules/guia-de-uso.mdc`.

## Rama `etapa-5a1`

Parte de `master` (`02a836c`, editor de contenido). Sin commit. Hay editor en `/editor/:id`. No hay PDF ni vista previa.

- El arranque no llama a `navigator.storage.persist()`. En `/documentos` el aviso del JSON está siempre, con el botón «Proteger los datos del navegador». El botón actualiza `persistenceDenied` y, si se concede, `persistenceGranted` lo oculta.
- Un maestro virgen (`revision` 1 y el mismo contenido que `emptyMaster`) se sustituye al confirmar un maestro de otro id: se borra el vacío y se adopta el id del archivo. Si el local ya tiene contenido, sigue el rechazo. Un segundo maestro del mismo archivo se rechaza.
- El nombre `match-resume-respaldo-YYYY-MM-DD.json` usa el día local. `exportedAt` dentro del paquete sigue en UTC.
- Los respaldos van a `data/`, configurando la carpeta de descargas. La app no escribe archivos por sí sola.
- Capas y enlace en `app.config.ts`. ESLint `no-restricted-imports` sigue impidiendo saltarse las capas. La presentación no importa infraestructura.
- Fuentes Source Sans 3 en `public/fonts/`. Conclusiones del spike en `docs/spike-pdf.md`.

## Modelo y JSON

- Un solo tipo `Resume` para maestro y versión. El paquete no añade campos al CV.
- `updatedAt` y `revision` cambian si cambia el contenido. Renombrar y editar la postulación no los mueven. Importar guarda el documento del archivo tal cual, sin pasar por esa regla.
- JSON `schemaVersion` 1. Exportar todo escribe un paquete `bundleVersion` 1 con `exportedAt` y `documents`. El formato está en `docs/formato-json.md`. El uso, en `docs/guia-de-uso.md`.

## Documentos

- IndexedDB (`match-resume`, tabla `resumes`, clave `meta.id`). Al entrar en `/documentos` se abre o se crea un único maestro vacío en español.
- Cada tarjeta tiene «Editar», «Exportar», «Crear versión» y, si es una versión, «Eliminar». Arriba están «Exportar todo» e «Importar».
- Importar suma. Primero se valida el archivo entero; si un documento no vale, no se escribe nada y el aviso dice cuál. Después se muestra el plan. Confirmar escribe. Cancelar no.
- Un id nuevo se añade. Uno idéntico se ignora. Si el archivo es más reciente, confirmar lo reemplaza. Si el local es más reciente, o la fecha coincide y no son iguales, se conserva el local salvo que en ese documento se elija el importado. Un maestro con otro id se rechaza si el local ya no está virgen. Si lo está, confirmar borra el vacío y guarda el del archivo.
- En un navegador sin datos, entrar en `/documentos` crea un maestro vacío. Importar el paquete y confirmar lo sustituye por el del respaldo, y las versiones conservan su `derivedFrom`.
- El aviso «N documentos sin respaldar» cuenta los CV con `updatedAt` posterior al último «Exportar todo». Si nunca se ha exportado todo, cuentan todos. Exportar uno solo no mueve esa fecha.
- El aviso «El navegador puede borrar estos datos. El respaldo es exportar el JSON a GitHub.» está siempre en documentos. `persist()` solo corre al pulsar «Proteger los datos del navegador».

## Editor

- `/editor/:id` carga el CV con `GetResume`. Si no está, o no se puede leer, un mensaje y un enlace a documentos. No hay formulario.
- Formularios reactivos: nombre, datos básicos, idioma y secciones (ítems y viñetas). En una versión, también la oferta. Añadir, quitar, subir, bajar y la visibilidad pasan por las reglas de dominio. Los ids nuevos salen de `IdGenerator`. El `at` de esas reglas es el `updatedAt` ya guardado; el reloj lo sella `SaveResume`.
- «Modificado» es la fecha guardada. Se mueve si cambia el texto, el idioma, el orden, la visibilidad o las fechas. El nombre y la oferta no la mueven. Una fecha que no es `YYYY-MM`, o un fin anterior al inicio, no deja guardar. Un correo con forma rara avisa y sí deja guardar.
- «Cambios sin guardar» compara el borrador con lo guardado. Al salir, `canDeactivate` pregunta con `window.confirm`.

## Guía

- `docs/guia-de-uso.md` describe la app de hoy: arranque, documentos, versiones, el editor, respaldo en `data/` con git, importar y recuperar un maestro vacío desde un paquete.
- `.cursor/rules/guia-de-uso.mdc` obliga a actualizar esa guía cuando cambie lo que se ve.

## Comprobado

- `ng test --watch=false`: 59 pruebas. Incluyen el maestro virgen, el rechazo si ya hay contenido, `derivedFrom` de las versiones, la ida y vuelta tras abrir un almacén vacío, el día local del paquete, añadir y quitar bloques, `GetResume` y el paquete Zod.
- `npm run lint` y `ng build`. El build de producción avisa de que el bundle inicial supera el aviso de 500 kB.
- En Chromium, `/documentos` pinta la lista con el aviso del JSON y «Proteger los datos del navegador» mientras sigue cargando, sin llamar a `persist()`. Al pulsar el botón sí se llama. Si el navegador no concede, el botón sigue. Si concede, el botón desaparece y la frase del JSON se queda. El maestro de esa comprobación sigue vacío, «Modificado: 29 oct 2026, 20:24», y el aviso en «1 documento sin respaldar».
- En Chromium, el editor: «Editar» abre el maestro; guardar un resumen mueve «Modificado» y guardarlo otra vez no; en una versión, cambiar solo la empresa o el nombre deja la fecha quieta; una fecha «marzo» y un fin anterior al inicio desactivan «Guardar» y lo dicen en la pantalla; un correo con forma rara avisa y deja guardar; cancelar «Hay cambios sin guardar. ¿Salir de todas formas?» se queda en el editor y aceptar vuelve a documentos; `/editor/no-esta` dice «No está ese CV.». Las versiones de esa prueba se borraron. El resumen de prueba del maestro se dejó vacío, así que su «Modificado» quedó en 29 oct 2026, 20:24. El aviso sigue en «1 documento sin respaldar».
- En el navegador del IDE (Chromium), el importar: el maestro muestra «1 documento sin respaldar»; exportar uno baja `cv-<slug>-<8 del id>.json`; exportar todo baja el paquete, guarda la fecha y quita el aviso; crear una versión lo vuelve a mostrar; borrar esa versión e importar el paquete propone añadirla e ignorar el maestro; cancelar no escribe; confirmar la añade con su fecha original; repetir el archivo ignora los dos; un nombre distinto con la misma fecha pide elección y, si se elige el importado, reemplaza sin mover `updatedAt`; un documento malo nombra la posición y no toca el almacén; un segundo maestro se rechaza en el plan. La versión de prueba se borró y se limpió la fecha de respaldo de esa comprobación, así que el aviso volvió a «1 documento sin respaldar».
- Firefox no se abrió. Ahí falta mirar que la página no se quede en blanco al entrar, que el permiso de almacenamiento solo salga al pulsar «Proteger los datos del navegador», que la descarga caiga en `data/` y que el selector de archivo abra y, si se cancela, no cambie nada.
- Node del entorno es v25; Angular avisa de que declara soporte para 22, 24 o 26 o superior.
