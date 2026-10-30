Nota importante: Me gustaria trabajar con una carpeta que se llame data para que todo lo que generemos se vaya ahí y no tener archivos por diferentes ubicaciones.

Otra cosa, siempre que abro en proyecto en firefox me aparece un mensaje emergente que dice: Allow localhost: 4200 to store data in persistent storage? block allow.

Despues de esto el navegador se congela, no pasa con Chrome.

Tambien al probar me salio esto en la terminal:

                                  match_resume   etapa-4 ≢  ?2 ~1 -1  
ale ❯ ng test --watch=false && npm run lint && ng build
zsh: command not found: ng


http-server no es muy antiguo para ser usando el 2026?

en mi terminal:

                                  match_resume   etapa-4 ≢  ?2 ~1 -1  
ale ❯ npx http-server dist/match-resume/browser -p 4300 -a 127.0.0.1
# abre http://127.0.0.1:4300/
Need to install the following packages:
http-server@14.1.1
Ok to proceed? (y) y

npm warn deprecated whatwg-encoding@2.0.0: Use @exodus/bytes instead for a more spec-conformant and faster implementation
Starting up http-server, serving dist/match-resume/browser

http-server version: 14.1.1

http-server settings: 
CORS: disabled
Cache: 3600 seconds
Connection Timeout: 120 seconds
Directory Listings: visible
AutoIndex: visible
Serve GZIP Files: false
Serve Brotli Files: false
Default File Extension: none

Available on:
  http://127.0.0.1:4300
Hit CTRL-C to stop the server


Eso sigue bloqueando el navegador firefox, simplemente se congela así que haré mis pruebas en Chrome usando npm start y dando click donde dice local: http://localhost:4200/ para poder ver la web no de http-server no se si sea necesario.

Probé importando un cv existente e inmediatamente exporte y me dio cv-cv-maestro-bc7524de.json

{
  "schemaVersion": 1,
  "meta": {
    "id": "bc7524de-db84-43ad-9dd6-2ce683cac249",
    "name": "CV maestro",
    "kind": "master",
    "derivedFrom": null,
    "createdAt": "2026-10-30T00:47:15.369Z",
    "updatedAt": "2026-10-30T00:47:15.369Z",
    "revision": 1
  },
  "language": "es",
  "layout": "one-column",
  "posting": {
    "company": "",
    "title": "",
    "status": "draft",
    "postingText": "",
    "pdfFile": null
  },
  "basics": {
    "name": "",
    "headline": "",
    "email": "",
    "phone": "",
    "url": "",
    "location": "",
    "summary": ""
  },
  "sections": []
}


En realidad no entiendo como funciona la web, se ve muy simple y sin funciones...

4. Documentar el funcionamiento paso a paso

Me dio esto:

Voy a contrastar la guía con el comportamiento real de la app y con el formato de las reglas, para no documentar nada que no esté comprobado.

luego:

Guía de uso

Dos archivos nuevos. Sin capturas. Sin editor, PDF ni cuentas: eso se dice como ausencia, no como función. También se actualiza docs/progreso.md, porque la regla de progreso ya obliga a dejar el estado vivo en el mismo cambio.

docs/guia-de-uso.md

Español, para dentro de unos meses. Los textos de pantalla se copian de la app.





Qué es y qué no es. Solo el navegador. Sin cuentas y sin servidor. Los CV viven en IndexedDB (match-resume). El respaldo son los JSON que tú subes a git. La interfaz está en español. /editor y /exportar solo muestran un título; exportar e importar están en /documentos. No hay forma de editar el texto del CV en la pantalla.



Arranque. En la raíz del repo: npm install, luego npm start (ng serve). Abrir http://localhost:4200/; redirige a /documentos. El build es npm run build y deja los archivos en dist/match-resume/browser. Para servirlo con lo que ya trae el proyecto: npx ng serve --configuration production (también en el puerto 4200). No hay un script aparte de servidor estático.



/documentos. Al entrar, si no hay maestro, se crea uno vacío llamado «CV maestro». Una versión es una copia con otro id. «Más reciente» es la primera tarjeta: updatedAt de mayor a menor y, si empatan, el id. «Modificado» es esa fecha en español (d MMM y, HH:mm). «1 documento sin respaldar» / «N documentos sin respaldar» cuenta CV con updatedAt posterior al último «Exportar todo»; si nunca se ha exportado todo, cuentan todos. El aviso de persistencia es el texto exacto: «El navegador puede borrar estos datos. El respaldo es exportar el JSON a GitHub.» Si una versión trae empresa o puesto, la tarjeta los muestra. Hoy no hay pantalla para rellenarlos.



Crear y borrar. «Crear versión» en cualquier tarjeta. La copia no se vuelve a sincronizar. «Eliminar» solo en versiones, con «¿Eliminar esta versión?». El maestro no tiene ese botón y el caso de uso lo rechaza.



Respaldo. «Exportar» en la tarjeta: cv-<slug>-<8 primeros del id>.json. El slug sale del nombre (minúsculas, sin tildes; «CV maestro» da cv-cv-maestro-…). «Exportar todo»: match-resume-respaldo-YYYY-MM-DD.json, con la fecha UTC. El navegador elige la carpeta; la app no. Guardar esos archivos dentro del repo (por ejemplo en una carpeta respaldos/ que creas tú; la app no la crea) y:

git add respaldos
git commit -m "Respaldo de los CV"
git push

Este clon no tiene remoto. git push solo funciona cuando ya exista uno. Exportar uno no quita el aviso de sin respaldar; exportar todo sí, para los CV cuya fecha no sea posterior.





Restaurar. «Importar» abre el selector. Cancelarlo no cambia nada. Tras elegir archivo, «Qué se va a importar» y luego Confirmar o Cancelar. Textos reales del plan: se añadirá; ya está y se ignora; el archivo es más reciente y se reemplaza al confirmar; conflicto (local más reciente, o misma fecha y no iguales) con «Conservar el de este navegador» marcado y «Usar el importado» como la otra opción; maestro con otro id, no se importa. Al confirmar, la línea «Añadidos: N. Reemplazados: N. Ignorados: N. Rechazados: N.» Un archivo que no vale (JSON malo, paquete con un documento malo, id repetido) muestra el error y no escribe nada de ese archivo.



Desastre. Clonar o copiar el repo con los JSON, npm install, npm start, abrir /documentos. Eso crea un maestro vacío nuevo. Importar el paquete rechaza el maestro del archivo («Ya hay un CV maestro con otro id») y puede añadir las versiones. No hay botón para borrar el maestro ni para adoptar el id del respaldo. El texto del maestro no vuelve por la pantalla. La guía lo dice así, sin un paso inventado que deje el maestro restaurado.



Problemas. Documento ilegible: «No se pudo leer un documento…» (o el plural) y el resto sigue. Segundo maestro: el mensaje del plan. Descarga: la app dispara la descarga del navegador y no elige carpeta; si en Firefox no cae donde esperas, la carpeta la manda la configuración de descargas de Firefox. Eso no se comprobó en Firefox; se describe el mecanismo, no un fallo reproducido.



Mapa, unas diez líneas. domain (datos y classifyImport), application (casos de uso y puertos), infrastructure (Dexie, Zod, descarga), presentation/documentos (pantalla y store), enlace en src/app/app.config.ts. Formato de archivo: docs/formato-json.md.

Regla

.cursor/rules/guia-de-uso.mdc, alwaysApply: true, menos de 15 líneas, al estilo de progreso.mdc: si cambia lo que se ve (textos, botones, avisos, importar, exportar, rutas visibles), actualizar docs/guia-de-uso.md en el mismo cambio; quitar lo que ya no sea cierto; no documentar lo que no se haya comprobado.

Y me respondio con:

La guía quedó en `docs/guia-de-uso.md`. Describe solo lo que la app hace ahora: arranque, la pantalla de documentos, versiones, respaldo con `git add`, `commit` y `push`, e importar.

El apartado de desastre dice el límite real. En un navegador vacío la página crea un maestro nuevo, y el maestro del JSON se rechaza porque el id es otro. Las versiones sí pueden volver. No hay paso que restaure el texto del maestro.

También está `.cursor/rules/guia-de-uso.mdc`, siempre activa y de menos de 15 líneas: si cambia lo que se ve, la guía se actualiza en el mismo cambio. `docs/progreso.md` ya lo recoge.

Nota: Acabo de crear un repo remoto y no tiene descripción, ni readme ni gitignore tampoco licencia, necesito subir esta información con todo esto ya que ahora no tiene nada.

https://github.com/aleroses/match_resume.git

…or create a new repository on the command line

echo "# match_resume" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M master
git remote add origin https://github.com/aleroses/match_resume.git
git push -u origin master

or push an existing repository form the command line

git remote add origin https://github.com/aleroses/match_resume.git
git branch -M master
git push -u origin master

Prompt de la Etapa 5a

El editor puede apoyarse en las reglas que ya sellan `updatedAt`. Reviso qué falta en dominio para añadir y quitar bloques, y dejo el plan por cortes.

El editor de contenido está en `/editor/:id`, en la rama `etapa-5a`. «Editar» en cada tarjeta abre ese CV. «Guardar» lo escribe con `SaveResume`: «Modificado» se mueve si cambia el texto, el idioma, el orden, la visibilidad o las fechas. El nombre y la oferta dejan esa fecha quieta.

**Formularios reactivos.** El componente importa `ReactiveFormsModule`. Un `FormGroup` agrupa `FormControl`: cada control guarda un valor (el nombre, el correo, el título de una sección). En la plantilla, `formControlName` une el campo con ese control. Lo que se escribe vive en el formulario; al guardar, o al añadir y quitar bloques, ese valor se convierte en un `Resume`.

**`FormArray`.** Es una lista de controles que crece y se encoge. Las secciones son un `FormArray`; dentro, los ítems; dentro de cada ítem, las viñetas. «Añadir» y «Eliminar» meten o sacan un grupo de esa lista. Subir, bajar y la visibilidad pasan por las reglas de dominio y vuelven a rellenar el formulario, así que el texto a medias se conserva.

**`canDeactivate`.** Es una guarda de la ruta: Angular la llama antes de salir. `editorCanLeave` mira si hay cambios sin guardar y, si los hay, pregunta «Hay cambios sin guardar. ¿Salir de todas formas?». Cancelar se queda en el editor.

**Parámetro de la ruta.** La ruta es `editor/:id`. Con `withComponentInputBinding`, ese `:id` llega al componente como un `input()`. Si el id no existe, la pantalla dice «No está ese CV.» y enlaza con documentos.

En Chromium comprobé: guardar un texto mueve la fecha y guardarlo otra vez no; en una versión, empresa y nombre no la mueven; «marzo» y un fin anterior al inicio dejan «Guardar» desactivado; un correo con forma rara avisa y deja guardar; la pregunta al salir cancela o sale según la respuesta. Las versiones de esa prueba se borraron. El resumen de prueba del maestro se dejó vacío, así que su «Modificado» quedó en 29 oct 2026, 20:24.

`ng test --watch=false` pasó 54 pruebas, `npm run lint` pasó y `ng build` también (sigue el aviso del bundle por encima de 500 kB). Firefox no se abrió. No hay commit.





Nota: El uso del programa no debe ir en el readme? porque actualmente hay esto:

# Gestor de CV

Esqueleto Angular 22 de solo cliente. La interfaz está en español. Aún no hay funcionalidad de CV.

```bash
npm start
```

Las capas están en `src/app/{domain,application,infrastructure,presentation}`. El enlace de puertos está en `src/app/app.config.ts`.

`AGENTS.md` tiene las instrucciones del proyecto. Las conclusiones del spike de PDF están en `docs/spike-pdf.md`.

Entonces en donde guardó el funcionamiento?

Estructura del proyecto:

                                 match_resume   etapa-5a ≢  ?5 ~7 -1  
ale ❯ tree -L 4 -I "node_modules|.*"
.
├── AGENTS.md
├── angular.json
├── cv_prompt.md
├── data
│   ├── cv-cv-maestro-6781f2fe.json
│   └── match-resume-respaldo-2026-10-29.json
├── dist
│   └── match-resume
│       ├── 3rdpartylicenses.txt
│       └── browser
│           ├── favicon.ico
│           ├── fonts
│           ├── index.html
│           ├── main-AOGJX4DJ.js
│           └── styles-5INURTSO.css
├── docs
│   ├── formato-json.md
│   ├── guia-de-uso.md
│   ├── progreso.md
│   └── spike-pdf.md
├── eslint.config.mjs
├── package.json
├── package-lock.json
├── public
│   ├── favicon.ico
│   └── fonts
│       ├── OFL.txt
│       ├── SourceSans3-BoldIt.ttf
│       ├── SourceSans3-Bold.ttf
│       ├── SourceSans3-It.ttf
│       └── SourceSans3-Regular.ttf
├── README.md
├── src
│   ├── app
│   │   ├── app.config.ts
│   │   ├── app.css
│   │   ├── app.html
│   │   ├── application
│   │   │   ├── backup-reminder-store.ts
│   │   │   ├── clock.ts
│   │   │   ├── file-gateway.ts
│   │   │   ├── id-generator.ts
│   │   │   ├── README.md
│   │   │   ├── resume-archive.ts
│   │   │   ├── resume-repository.ts
│   │   │   ├── testing
│   │   │   ├── transfer.spec.ts
│   │   │   ├── transfer.ts
│   │   │   ├── use-cases.spec.ts
│   │   │   └── use-cases.ts
│   │   ├── app.routes.ts
│   │   ├── app.spec.ts
│   │   ├── app.ts
│   │   ├── domain
│   │   │   ├── normalize-whitespace.spec.ts
│   │   │   ├── normalize-whitespace.ts
│   │   │   ├── README.md
│   │   │   └── resume
│   │   ├── infrastructure
│   │   │   ├── browser-file-gateway.ts
│   │   │   ├── crypto-id-generator.ts
│   │   │   ├── dexie-resume-repository.spec.ts
│   │   │   ├── dexie-resume-repository.ts
│   │   │   ├── local-storage-backup-reminder.ts
│   │   │   ├── README.md
│   │   │   ├── serialization
│   │   │   └── system-clock.ts
│   │   └── presentation
│   │       ├── documentos
│   │       ├── editor
│   │       ├── exportar
│   │       └── README.md
│   ├── index.html
│   ├── main.ts
│   └── styles.css
├── tsconfig.app.json
├── tsconfig.json
└── tsconfig.spec.json

21 directories, 58 files

