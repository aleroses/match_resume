# Formato JSON del CV

Un respaldo es un solo CV en JSON: `schemaVersion` 1, indentación de 2 espacios y un salto de línea al final. Las claves van siempre, aunque el texto esté vacío, y en el orden de los ejemplos. Así un diff en git muestra el texto que cambió.

`updatedAt` y `revision` cambian solo si cambia el contenido: `language`, `layout`, `basics` o `sections` (texto, orden o visibilidad). Cambiar `meta.name` o `posting` no los mueve. `revision` es un entero que empieza en 1 y sube de uno en uno junto con `updatedAt`.

Las fechas de `meta` son instantes ISO (`2026-01-02T03:04:05.000Z`). Las de un ítem son `YYYY-MM`. `""` significa que no hay fecha. `end: null` significa que el puesto o el estudio sigue abierto.

## Campos

- `schemaVersion`: `1`. Si el archivo no trae este campo, se lee como versión 0 y se acepta como versión 1 cuando el resto coincide. Una versión más nueva se rechaza.
- `meta.id`: id del documento.
- `meta.name`: nombre en la lista de documentos.
- `meta.kind`: `master` o `version`.
- `meta.derivedFrom`: `null` en el maestro. En una versión, el id del documento del que salió la copia. Los ids de secciones, ítems y viñetas se conservan en esa copia.
- `meta.createdAt`, `meta.updatedAt`, `meta.revision`.
- `language`: `es` o `en`. Es el idioma del texto del CV.
- `layout`: `one-column`.
- `posting.company`, `posting.title`, `posting.postingText`: datos de la oferta. Pueden ir vacíos.
- `posting.status`: `draft`, `applied` o `closed`.
- `posting.pdfFile`: nombre del PDF asociado, o `null`. No es el binario.
- `basics`: nombre, titular, correo, teléfono, una URL, lugar y resumen.
- `sections`: bloques con `id`, `visible`, `title` e `items`. El título lo escribe quien usa el CV (`Experiencia`, `Educación`, `Habilidades`).
- `items`: entradas con `id`, `visible`, `title`, `organization`, `location`, `start`, `end` y `bullets`. Experiencia, educación y habilidades usan la misma forma. Si un dato no aplica, va `""` o una lista vacía.
- `bullets`: viñetas con `id`, `visible` y `text`.

## Ejemplo en español

```json
{
  "schemaVersion": 1,
  "meta": {
    "id": "m1",
    "name": "CV maestro",
    "kind": "master",
    "derivedFrom": null,
    "createdAt": "2026-01-02T03:04:05.000Z",
    "updatedAt": "2026-01-02T03:04:05.000Z",
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
    "name": "Ana Núñez",
    "headline": "Desarrolladora",
    "email": "ana@example.com",
    "phone": "+34 600 000 000",
    "url": "https://example.com",
    "location": "Madrid",
    "summary": "Resumen con ñ y tildes."
  },
  "sections": [
    {
      "id": "s1",
      "visible": true,
      "title": "Experiencia",
      "items": [
        {
          "id": "i1",
          "visible": true,
          "title": "Desarrolladora",
          "organization": "Acme",
          "location": "Madrid",
          "start": "2020-01",
          "end": null,
          "bullets": [
            {
              "id": "b1",
              "visible": true,
              "text": "Entregué el sistema."
            }
          ]
        }
      ]
    }
  ]
}
```

## El mismo CV en inglés

```json
{
  "schemaVersion": 1,
  "meta": {
    "id": "m1",
    "name": "Master CV",
    "kind": "master",
    "derivedFrom": null,
    "createdAt": "2026-01-02T03:04:05.000Z",
    "updatedAt": "2026-01-02T03:04:05.000Z",
    "revision": 1
  },
  "language": "en",
  "layout": "one-column",
  "posting": {
    "company": "",
    "title": "",
    "status": "draft",
    "postingText": "",
    "pdfFile": null
  },
  "basics": {
    "name": "Ana Núñez",
    "headline": "Developer",
    "email": "ana@example.com",
    "phone": "+34 600 000 000",
    "url": "https://example.com",
    "location": "Madrid",
    "summary": "Summary with ñ and accents."
  },
  "sections": [
    {
      "id": "s1",
      "visible": true,
      "title": "Experience",
      "items": [
        {
          "id": "i1",
          "visible": true,
          "title": "Developer",
          "organization": "Acme",
          "location": "Madrid",
          "start": "2020-01",
          "end": null,
          "bullets": [
            {
              "id": "b1",
              "visible": true,
              "text": "I delivered the system."
            }
          ]
        }
      ]
    }
  ]
}
```
