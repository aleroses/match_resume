# Guía de uso

Para volver a usar esta app dentro de meses, sin acordarme de nada. Describe solo lo que hace hoy.

## 1. Qué es y qué no es

Es una página que corre en el navegador. No hay cuentas ni servidor. Los CV se guardan en IndexedDB de ese navegador, en la base `match-resume`. Si el navegador borra esos datos, se pierden salvo que haya un JSON fuera.

El respaldo es descargar esos JSON y subirlos a git a mano. La app no habla con GitHub.

La interfaz está en español. El texto del CV se escribe en `/editor/:id`, desde «Editar» en cada tarjeta. No hay PDF. `/exportar` solo muestra un título. Exportar e importar están en `/documentos`.

## 2. Cómo arrancarla

En la raíz del repositorio:

```bash
npm install
npm start
```

`npm start` ejecuta `ng serve`. Abrir `http://localhost:4200/`. Esa dirección redirige a `/documentos`.

Para generar el build:

```bash
npm run build
```

Los archivos quedan en `dist/match-resume/browser`. Para servir ese build con lo que ya trae el proyecto:

```bash
npx ng serve --configuration production
```

También escucha en `http://localhost:4200/`. No hay otro comando de servidor estático.

## 3. La pantalla Documentos

Al entrar, si todavía no hay un CV maestro, la app crea uno vacío. Se llama «CV maestro» y la tarjeta dice «Maestro».

Una versión es otra tarjeta. Dice «Versión». Es una copia hecha en un momento, con otro id. No es el mismo documento con otro nombre.

«Más reciente» es una insignia en la primera tarjeta. La lista ordena por la fecha de modificación, de la más nueva a la más vieja. Si dos tienen la misma fecha, queda antes el id menor. No es un dato guardado en el CV.

«Modificado» es esa fecha, en español, día, mes abreviado, año y hora. Ejemplo visto: «28 oct 2026, 22:36».

«1 documento sin respaldar», o «N documentos sin respaldar» si son varios, cuenta los CV modificados después del último «Exportar todo». Si nunca se ha pulsado «Exportar todo» en ese navegador, cuentan todos los que hay.

Si el navegador no deja marcar el almacenamiento como persistente, aparece: «El navegador puede borrar estos datos. El respaldo es exportar el JSON a GitHub.»

Si una versión tiene empresa o puesto, la tarjeta los muestra. Eso se escribe en el editor, y solo en una versión.

## 4. Crear y borrar versiones

«Crear versión» está en cada tarjeta. Crea una copia independiente. Después, cambiar una no cambia la otra: no se vuelven a sincronizar. La copia nueva pasa a ser la más reciente, porque su fecha es el momento de crearla. La fecha del documento de origen no se mueve.

«Eliminar» solo sale en las versiones. Pregunta «¿Eliminar esta versión?». Si se cancela, la versión sigue. El maestro no tiene ese botón. No se puede borrar.

Editar una versión no cambia el maestro, ni al revés.

## 5. Editar

«Editar» abre `/editor/:id`. Si ese id no está, o el CV no se puede leer, la pantalla dice el motivo y enlaza con documentos. No muestra el formulario.

Ahí se cambia el nombre, los datos básicos (nombre, titular, correo, teléfono, URL, ubicación y resumen), el idioma del texto (español o inglés) y las secciones. Cada sección tiene título. Cada ítem tiene título, organización, ubicación, inicio y fin en `YYYY-MM`, o «Actual» si sigue abierto, y viñetas. Se pueden añadir, eliminar, subir, bajar y marcar como visibles.

Si el CV es una versión, también están la empresa, el puesto, el estado (borrador, enviada o cerrada), el texto de la oferta y el nombre del PDF. El maestro no muestra esa oferta.

«Guardar» escribe en el navegador. «Modificado» es la fecha ya guardada. Se mueve si cambia el texto, el idioma, el orden, la visibilidad o las fechas. Cambiar solo el nombre, o solo la oferta de una versión, no la mueve. Una fecha que no es `YYYY-MM`, o un fin anterior al inicio, no deja guardar y lo dice en la pantalla. Un correo con forma rara avisa y sí deja guardar.

La app no propone frases de experiencia, habilidades ni logros.

Si hay cambios sin guardar, al salir pregunta «Hay cambios sin guardar. ¿Salir de todas formas?».

## 6. Respaldo

Hay dos descargas.

«Exportar», en una tarjeta, baja solo ese CV. El nombre es `cv-<slug>-<8 primeros caracteres del id>.json`. El slug sale del nombre: minúsculas y sin tildes. Un nombre vacío usa `cv`. «CV maestro» produce un archivo que empieza por `cv-cv-maestro-`.

«Exportar todo» baja un paquete: `match-resume-respaldo-YYYY-MM-DD.json`. La fecha es el día UTC del momento de la exportación, no la hora local. Dentro van `bundleVersion`, `exportedAt` y la lista `documents`. El detalle del JSON está en `docs/formato-json.md`.

La app no elige la carpeta. La elige el navegador, con su descarga normal.

Esos archivos hay que guardarlos dentro de este repositorio para poder subirlos. La app no crea ninguna carpeta. Una que sirve es `respaldos/`, creada a mano, con los JSON dentro. Desde la raíz del repo:

```bash
git add respaldos
git commit -m "Respaldo de los CV"
git push
```

`git push` solo funciona si el repositorio ya tiene un remoto. Este clon, al escribir esta guía, no lo tenía.

«Exportar» de una sola tarjeta no quita el aviso de documentos sin respaldar. «Exportar todo» sí lo quita para los CV cuya fecha no sea posterior a esa exportación. Si después se crea una versión, el aviso vuelve a contar esa versión.

## 7. Restaurar

«Importar» abre el selector de archivos del navegador. Si se cierra sin elegir nada, la pantalla no cambia.

Con un archivo elegido, aparece «Qué se va a importar». Cada línea es el nombre del CV y una frase. Nada se escribe hasta pulsar «Confirmar». «Cancelar» cierra el plan y deja los datos como estaban.

Qué significa cada frase:

- «No está en este navegador. Se añadirá.» El id no existe aquí. Confirmar lo guarda tal cual viene en el archivo, con su fecha.
- «Ya está y es igual. Se ignora.» El documento completo coincide. Confirmar no lo vuelve a escribir.
- «El archivo es más reciente. Se reemplazará al confirmar.» El id ya existe y la fecha del archivo es posterior. Confirmar sustituye el local por el del archivo. No hace falta otra elección.
- Conflicto, con dos opciones. Sale si el de este navegador es más reciente («El de este navegador es más reciente. Se conserva salvo que elijas reemplazarlo.») o si la fecha es la misma y no son iguales («Tienen la misma fecha y no son iguales. Se conserva el de este navegador salvo que elijas reemplazarlo.»). La opción marcada es «Conservar el de este navegador». La otra es «Usar el importado». Confirmar solo reemplaza ese CV si se marcó «Usar el importado».
- «Ya hay un CV maestro con otro id. Este no se importa.» Es un rechazo. Confirmar no guarda ese documento. El resto del archivo, si lo hay, sí puede entrar.

Después de confirmar, una línea resume: «Añadidos: N. Reemplazados: N. Ignorados: N. Rechazados: N.»

Si el archivo no vale, no se guarda nada de él. Pasa con un JSON que no se puede leer, con un paquete en el que un documento está mal, y si un id viene repetido dentro del mismo archivo. El aviso dice qué documento falla cuando se puede saber. Los CV que ya estaban siguen.

Importar no borra los CV que el archivo no menciona.

## 8. Recuperarse de un desastre

Si el navegador se borró o el equipo es nuevo, los datos de IndexedDB no viajan solos. Hacen falta los JSON que estén en el repo.

1. Conseguir el repositorio, con la carpeta donde se guardaron los JSON.
2. En la raíz: `npm install` y `npm start`.
3. Abrir `http://localhost:4200/documentos`.

Al entrar, si no hay maestro, la app crea uno vacío nuevo, con un id nuevo. Ese no es el maestro del archivo.

4. Pulsar «Importar» y elegir el paquete `match-resume-respaldo-….json` (o un CV suelto).
5. Leer el plan. El maestro del archivo sale como «Ya hay un CV maestro con otro id. Este no se importa.» Las versiones cuyo id no esté ya aquí salen como «Se añadirá.»
6. «Confirmar».

Las versiones vuelven, con la fecha que traía el archivo. El texto del maestro del respaldo no sustituye al maestro vacío. No hay botón para borrar el maestro ni para quedarse con el id del archivo. En esta pantalla no se recupera el maestro.

## 9. Problemas frecuentes

Un documento guardado que no se puede leer no tumba la lista. Sale «No se pudo leer un documento. El resto sigue disponible.» Si son varios: «No se pudieron leer N documentos. El resto sigue disponible.»

Un segundo maestro, en un importar, no se convierte ni se duplica. El plan lo dice: «Ya hay un CV maestro con otro id. Este no se importa.» Los otros documentos del mismo archivo se pueden confirmar.

La descarga no pregunta una carpeta dentro de la app. Firefox usa su propia configuración de descargas. Si el archivo no aparece donde se esperaba, hay que mirar ahí (carpeta por defecto, o preguntar cada vez). Esto no se comprobó abriendo Firefox; es el mecanismo de la descarga.

## 10. Mapa técnico

- `src/app/domain`: el CV, añadir y quitar bloques, y la clasificación de un importar (`classifyImport`). Sin Angular.
- `src/app/application`: casos de uso y puertos (abrir un CV, guardar, exportar, importar).
- `src/app/infrastructure`: IndexedDB con Dexie, JSON con Zod, descarga en el navegador.
- `src/app/presentation/documentos`: la lista. `src/app/presentation/editor`: el formulario.
- `src/app/app.config.ts`: une cada puerto con su clase concreta.
- `docs/formato-json.md`: la forma del CV y del paquete.
- `docs/progreso.md`: qué está hecho y cómo se comprobó.
