Tengo esto en la consola:

                                match_resume   etapa-5a ≢  ?8 ~11 -1  
ale ❯ git add -A
git commit -m "Etapa 5a: editor de contenido"
git tag gestor-v0 e06d276          # el gestor viejo queda a salvo

git checkout master
git merge --ff-only etapa-5a       # master pasa a tener todo el trabajo nuevo
git remote add origin https://github.com/aleroses/match_resume.git
git push -u origin master
git push origin gestor-v0
[etapa-5a 02a836c] Etapa 5a: editor de contenido
 19 files changed, 1644 insertions(+), 22 deletions(-)
 create mode 100644 .cursor/rules/guia-de-uso.mdc
 create mode 100644 cv_prompt.md
 rename match-resume-respaldo-2026-10-29.json => data/match-resume-respaldo-2026-10-29.json (100%)
 create mode 100644 docs/guia-de-uso.md
 create mode 100644 src/app/presentation/editor/editor-page.css
 create mode 100644 src/app/presentation/editor/editor-page.html
 create mode 100644 src/app/presentation/editor/resume-form.spec.ts
 create mode 100644 src/app/presentation/editor/resume-form.ts
fatal: tag 'gestor-v0' already exists
Switched to branch 'master'
Updating e06d276..02a836c
Fast-forward
 .cursor/rules/guia-de-uso.mdc                       |   11 +
 README.md                                           |    8 +-
 angular.json                                        |   23 +-
 cv_prompt.md                                        |  301 +++++
 data/cv-cv-maestro-6781f2fe.json                    |   31 +
 data/match-resume-respaldo-2026-10-29.json          |   68 +
 docs/formato-json.md                                |  191 +++
 docs/guia-de-uso.md                                 |  150 +++
 docs/progreso.md                                    |   56 +-
 docs/spike-pdf.md                                   |   11 +
 package-lock.json                                   | 1420 +++++---------------
 package.json                                        |    7 +-
 scripts/check-pdf.mjs                               |   54 -
 src/app/app.config.ts                               |  112 +-
 src/app/app.routes.ts                               |   15 +-
 src/app/application/README.md                       |    5 +
 src/app/application/backup-reminder-store.ts        |    4 +
 src/app/application/clock.ts                        |    3 +
 src/app/application/file-gateway.ts                 |    9 +
 src/app/application/id-generator.ts                 |    3 +
 src/app/application/ports.ts                        |   43 -
 src/app/application/resume-archive.ts               |    7 +
 src/app/application/resume-repository.ts            |   13 +
 .../application/testing/in-memory-cv-repository.ts  |   30 -
 .../testing/in-memory-resume-repository.ts          |   33 +
 src/app/application/transfer.spec.ts                |  285 ++++
 src/app/application/transfer.ts                     |  179 +++
 src/app/application/use-cases.spec.ts               |  323 +++--
 src/app/application/use-cases.ts                    |  234 +---
 src/app/domain/README.md                            |    5 +
 src/app/domain/assess-ats.spec.ts                   |   34 -
 src/app/domain/assess-ats.ts                        |  165 ---
 src/app/domain/cv-document.spec.ts                  |   51 -
 src/app/domain/cv-document.ts                       |  291 ----
 src/app/domain/normalize-whitespace.spec.ts         |    7 +
 src/app/domain/normalize-whitespace.ts              |    3 +
 src/app/domain/resume/classify-import.spec.ts       |   66 +
 src/app/domain/resume/classify-import.ts            |   58 +
 src/app/domain/resume/resume-rules.spec.ts          |  264 ++++
 src/app/domain/resume/resume-rules.ts               |  367 +++++
 src/app/domain/resume/resume.ts                     |   70 +
 src/app/domain/section-labels.ts                    |   39 -
 src/app/infrastructure/README.md                    |    5 +
 src/app/infrastructure/browser-file-gateway.ts      |   44 +
 src/app/infrastructure/crypto-id-generator.ts       |    7 +
 src/app/infrastructure/cv-schema.spec.ts            |   20 -
 src/app/infrastructure/cv-schema.ts                 |  101 --
 src/app/infrastructure/dexie-cv-repository.ts       |   48 -
 .../infrastructure/dexie-resume-repository.spec.ts  |   36 +
 src/app/infrastructure/dexie-resume-repository.ts   |   81 ++
 .../infrastructure/local-storage-backup-reminder.ts |   21 +
 .../infrastructure/pdf/cv-pdf-definition.spec.ts    |   29 -
 src/app/infrastructure/pdf/cv-pdf-definition.ts     |  151 ---
 src/app/infrastructure/pdf/pdfjs-text.ts            |   34 -
 src/app/infrastructure/pdf/pdfmake-exporter.ts      |   59 -
 src/app/infrastructure/serialization/migrate.ts     |   35 +
 .../serialization/resume-archive.spec.ts            |  130 ++
 .../infrastructure/serialization/resume-archive.ts  |  130 ++
 .../infrastructure/serialization/resume-schema.ts   |   72 +
 .../serialization/resume-serializer.spec.ts         |  132 ++
 .../serialization/resume-serializer.ts              |   73 +
 src/app/infrastructure/system-clock.ts              |    7 +
 src/app/infrastructure/system.ts                    |   25 -
 src/app/infrastructure/zod-backup-codec.ts          |   18 -
 src/app/presentation/README.md                      |    5 +
 src/app/presentation/cv-store.ts                    |  320 -----
 src/app/presentation/documentos/documentos-page.css |   66 +
 .../presentation/documentos/documentos-page.html    |  123 ++
 src/app/presentation/documentos/documentos-page.ts  |   63 +
 src/app/presentation/documentos/documentos-store.ts |  181 +++
 src/app/presentation/editor/editor-page.css         |   35 +
 src/app/presentation/editor/editor-page.html        |  402 +++---
 src/app/presentation/editor/editor-page.ts          |  452 ++++++-
 src/app/presentation/editor/resume-form.spec.ts     |   70 +
 src/app/presentation/editor/resume-form.ts          |  145 ++
 src/app/presentation/exportar/exportar-page.ts      |    7 +
 src/app/presentation/library/library-page.html      |   51 -
 src/app/presentation/library/library-page.ts        |   41 -
 src/index.html                                      |    1 -
 src/main.ts                                         |    3 +-
 src/pdfmake-shims.d.ts                              |   21 -
 src/styles.css                                      |  105 +-
 tsconfig.app.json                                   |    8 +-
 tsconfig.spec.json                                  |    9 +-
 84 files changed, 4993 insertions(+), 3422 deletions(-)
 create mode 100644 .cursor/rules/guia-de-uso.mdc
 create mode 100644 cv_prompt.md
 create mode 100644 data/cv-cv-maestro-6781f2fe.json
 create mode 100644 data/match-resume-respaldo-2026-10-29.json
 create mode 100644 docs/formato-json.md
 create mode 100644 docs/guia-de-uso.md
 create mode 100644 docs/spike-pdf.md
 delete mode 100644 scripts/check-pdf.mjs
 create mode 100644 src/app/application/README.md
 create mode 100644 src/app/application/backup-reminder-store.ts
 create mode 100644 src/app/application/clock.ts
 create mode 100644 src/app/application/file-gateway.ts
 create mode 100644 src/app/application/id-generator.ts
 delete mode 100644 src/app/application/ports.ts
 create mode 100644 src/app/application/resume-archive.ts
 create mode 100644 src/app/application/resume-repository.ts
 delete mode 100644 src/app/application/testing/in-memory-cv-repository.ts
 create mode 100644 src/app/application/testing/in-memory-resume-repository.ts
 create mode 100644 src/app/application/transfer.spec.ts
 create mode 100644 src/app/application/transfer.ts
 create mode 100644 src/app/domain/README.md
 delete mode 100644 src/app/domain/assess-ats.spec.ts
 delete mode 100644 src/app/domain/assess-ats.ts
 delete mode 100644 src/app/domain/cv-document.spec.ts
 delete mode 100644 src/app/domain/cv-document.ts
 create mode 100644 src/app/domain/normalize-whitespace.spec.ts
 create mode 100644 src/app/domain/normalize-whitespace.ts
 create mode 100644 src/app/domain/resume/classify-import.spec.ts
 create mode 100644 src/app/domain/resume/classify-import.ts
 create mode 100644 src/app/domain/resume/resume-rules.spec.ts
 create mode 100644 src/app/domain/resume/resume-rules.ts
 create mode 100644 src/app/domain/resume/resume.ts
 delete mode 100644 src/app/domain/section-labels.ts
 create mode 100644 src/app/infrastructure/README.md
 create mode 100644 src/app/infrastructure/browser-file-gateway.ts
 create mode 100644 src/app/infrastructure/crypto-id-generator.ts
 delete mode 100644 src/app/infrastructure/cv-schema.spec.ts
 delete mode 100644 src/app/infrastructure/cv-schema.ts
 delete mode 100644 src/app/infrastructure/dexie-cv-repository.ts
 create mode 100644 src/app/infrastructure/dexie-resume-repository.spec.ts
 create mode 100644 src/app/infrastructure/dexie-resume-repository.ts
 create mode 100644 src/app/infrastructure/local-storage-backup-reminder.ts
 delete mode 100644 src/app/infrastructure/pdf/cv-pdf-definition.spec.ts
 delete mode 100644 src/app/infrastructure/pdf/cv-pdf-definition.ts
 delete mode 100644 src/app/infrastructure/pdf/pdfjs-text.ts
 delete mode 100644 src/app/infrastructure/pdf/pdfmake-exporter.ts
 create mode 100644 src/app/infrastructure/serialization/migrate.ts
 create mode 100644 src/app/infrastructure/serialization/resume-archive.spec.ts
 create mode 100644 src/app/infrastructure/serialization/resume-archive.ts
 create mode 100644 src/app/infrastructure/serialization/resume-schema.ts
 create mode 100644 src/app/infrastructure/serialization/resume-serializer.spec.ts
 create mode 100644 src/app/infrastructure/serialization/resume-serializer.ts
 create mode 100644 src/app/infrastructure/system-clock.ts
 delete mode 100644 src/app/infrastructure/system.ts
 delete mode 100644 src/app/infrastructure/zod-backup-codec.ts
 create mode 100644 src/app/presentation/README.md
 delete mode 100644 src/app/presentation/cv-store.ts
 create mode 100644 src/app/presentation/documentos/documentos-page.css
 create mode 100644 src/app/presentation/documentos/documentos-page.html
 create mode 100644 src/app/presentation/documentos/documentos-page.ts
 create mode 100644 src/app/presentation/documentos/documentos-store.ts
 create mode 100644 src/app/presentation/editor/editor-page.css
 create mode 100644 src/app/presentation/editor/resume-form.spec.ts
 create mode 100644 src/app/presentation/editor/resume-form.ts
 create mode 100644 src/app/presentation/exportar/exportar-page.ts
 delete mode 100644 src/app/presentation/library/library-page.html
 delete mode 100644 src/app/presentation/library/library-page.ts
 delete mode 100644 src/pdfmake-shims.d.ts
Username for 'https://github.com': aleroses
Password for 'https://aleroses@github.com': 
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/aleroses/match_resume.git/'
Username for 'https://github.com': aleroses
Password for 'https://aleroses@github.com': 
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/aleroses/match_resume.git/'
                                               match_resume  master ≢  
1m 10.855s ale ❯ git remote
origin
                                               match_resume  master ≢  
ale ❯ git remote -v
origin  https://github.com/aleroses/match_resume.git (fetch)
origin  https://github.com/aleroses/match_resume.git (push)

                                               match_resume  master ≢  
ale ❯ git pull origin master
fatal: couldn't find remote ref master

ale ❯ git pull origin master
fatal: couldn't find remote ref master

                                               match_resume  master ≢  
ale ❯ git branch
  etapa-1
  etapa-3
  etapa-4
  etapa-5a
* master


                                          match_resume  master ≢  ~1  
ale ❯ git remote -v
origin  https://github.com/aleroses/match_resume.git (fetch)
origin  https://github.com/aleroses/match_resume.git (push)
                                          match_resume  master ≢  ~1  
ale ❯ git remote set-url origin git@github.com:aleroses/match_resume.git
                                          match_resume  master ≢  ~1  
ale ❯ git remote -v                                                     
origin  git@github.com:aleroses/match_resume.git (fetch)
origin  git@github.com:aleroses/match_resume.git (push)

                                          match_resume  master ≢  ~1  
ale ❯ git pull origin master
fatal: couldn't find remote ref master
                                          match_resume  master ≢  ~1  
1.201s ale ❯ git push origin master
Enumerating objects: 244, done.
Counting objects: 100% (244/244), done.
Delta compression using up to 12 threads
Compressing objects: 100% (233/233), done.
Writing objects: 100% (244/244), 876.54 KiB | 8.94 MiB/s, done.
Total 244 (delta 63), reused 0 (delta 0), pack-reused 0
remote: Resolving deltas: 100% (63/63), done.
To github.com:aleroses/match_resume.git
 * [new branch]      master -> master


                                          match_resume  master ≢  ~1  
2.706s ale ❯ git status
On branch master
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   cv_prompt.md


El archivo cv_prompt.md es donde hago estos apuntes que te envio, debe estar en el .gitignore.

Como arranco de cero? para hacer pruebas desde cero sin datos?

7. Prompt para resolver todo (Etapa 5a.1)

La hipótesis del congelamiento encaja con el arranque: `provideAppInitializer` devuelve la promesa de `persist()` y Angular no pinta hasta que Firefox responde. El maestro vacío también encaja con el rechazo actual, porque `emptyMaster` tiene `revision` 1.

Correcciones 5a.1

Rama etapa-5a1 desde master (ya tiene la 5a). Sin campos nuevos en Resume. Sin commit salvo que lo pidas.

1. Persistencia: la causa y el arreglo

Sí es esa la causa. En app.config.ts el provideAppInitializer hace return persist(). Angular no termina el arranque hasta que esa promesa se resuelve. Firefox muestra «Allow localhost:4200 to store data in persistent storage?» y la página se queda en blanco hasta que se responde.





Quitar ese initializer y el import de DocumentosStore en app.config.ts. El arranque no llama a persist() ni espera a persisted().



En documentos-store.ts, requestPersistence() solo desde el clic. Si persist() resuelve true, persistenceDenied queda en false y una signal persistenceGranted oculta el botón. Si resuelve false, falta la API o lanza, persistenceDenied pasa a true.



En documentos-page.html el aviso se ve desde el principio, no solo tras un rechazo: «El navegador puede borrar estos datos. El respaldo es exportar el JSON a GitHub.» Junto a él, el botón «Proteger los datos del navegador», visible mientras no esté concedido. Concedido o no, esa frase del JSON sigue en pantalla.

2. Maestro virgen al importar

Virgen: kind === 'master', revision === 1 y el contenido que ya compara sameContent (language, layout, basics, sections) igual al de emptyMaster. El nombre y la oferta no entran: renombrar no sube revision. Si el texto se editó y se vació, revision ya no es 1 y sigue el rechazo.

En classify-import.ts, si el local es virgen y el importado es un maestro con otro id, el veredicto nuevo es adopt-master. Si el local ya no es virgen, sigue reject-second-master. Un helper isVirginMaster en resume-rules.ts para no duplicar sameContent.

En transfer.ts:





El ítem del plan lleva removeId (el id del maestro vacío). No es un campo de Resume.



La acción es replace, sin radios. El motivo: «El maestro de este navegador está vacío. Al confirmar se borra y se adopta el del archivo.»



ApplyImport borra removeId y después guarda el importado. El orden importa: save de un segundo maestro lanza «Ya hay un CV maestro.» Cuenta como reemplazado. Cancelar no escribe ni borra.



Tras planear esa adopción, ese maestro pasa a ser el local: un segundo maestro del mismo archivo se rechaza.

Pruebas en classify-import.spec.ts y transfer.spec.ts. El test actual que rechaza un segundo maestro contra un emptyMaster local pasa a ser la adopción. Casos:





Almacén con maestro virgen: al confirmar desaparece el id vacío y queda el del archivo.



Maestro con contenido (revision mayor o basics distinto): rechazo, el local sigue.



Las versiones del paquete se añaden con su derivedFrom original, el id del maestro del archivo.



Ida y vuelta: exportar todo, repositorio nuevo (el vacío equivale a borrar IndexedDB), OpenOrCreateMaster, importar y confirmar. Vuelven el maestro (su id y su texto) y las versiones. El test de almacén vacío, sin abrir antes, sigue añadiendo los dos.

3. Carpeta data/, apuntes y fecha local





guia-de-uso.md: los JSON se guardan en data/ eligiendo esa carpeta en las descargas del navegador. La app no elige carpeta ni escribe archivos; solo dispara la descarga. Firefox: Ajustes, General, Descargas, Guardar archivos en, y elegir data/. Chrome: Configuración, Descargas, Ubicación, Cambiar, y la misma carpeta; sin «Preguntar dónde guardar cada archivo».



Mover cv_prompt.md a docs/cv_prompt.md sin reescribirlo.



bundleFileName usa el día local de exportedAt (getFullYear, getMonth, getDate), no los diez primeros caracteres UTC. exportedAt dentro del JSON sigue siendo el instante ISO. El test de 2026-02-03T04:05:06.000Z espera el día local de ese instante, calculado igual, para que valga en UTC y en UTC−5. La guía deja de decir que el nombre es UTC.

4. README y estado vivo

README.md corto: gestor de CV en el navegador, sin servidor ni cuentas; editor e importar/exportar JSON; sin PDF. Requisitos Node y npm (Angular avisa en Node 25; declara 22, 24 o 26+). npm install, npm start en http://localhost:4200/. Pruebas: npx ng test --watch=false y npm run lint. Enlaces a docs/guia-de-uso.md, docs/formato-json.md y docs/progreso.md.

Actualizar la guía (aviso con botón, desastre: el maestro virgen se sustituye al confirmar; uno ya editado no; data/ y fecha local) y progreso.md. ng test --watch=false, npm run lint, ng build.

El mensaje final explica la comprobación a mano en Firefox: npm start, abrir http://localhost:4200/documentos y ver la lista sin el cuadro de persistent storage; el aviso del JSON y el botón están ahí; solo al pulsar el botón aparece el permiso; aceptar o rechazar no deja la página en blanco.













Añade algo de estilos porque ahora está todo blanco y se ve horrible (o dejalo para despues) pero ten en cuenta modo oscuro, diseño moderno, con ux y ui. y que paso con el readme .gitignore y la licencia gpl?
