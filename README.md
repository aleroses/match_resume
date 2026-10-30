# Gestor de CV

Página en el navegador para mantener un CV y copias por oferta, y para exportar e importar JSON. No hay servidor ni cuentas. La interfaz está en español. No hay PDF.

## Requisitos

Node.js y npm. Angular declara soporte para Node 22, 24 o 26 o superior. En Node 25 el arranque avisa de que esa versión no está en la lista.

## Uso

```bash
npm install
npm start
```

`npm start` abre `http://localhost:4200/`.

## Pruebas

```bash
npx ng test --watch=false
npm run lint
```

## Documentación

- [Guía de uso](docs/guia-de-uso.md)
- [Formato JSON](docs/formato-json.md)
- [Progreso](docs/progreso.md)
