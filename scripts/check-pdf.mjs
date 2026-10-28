import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const pdfMake = require('pdfmake');
const fonts = resolve('public/fonts');

pdfMake.setLocalAccessPolicy(() => true);
pdfMake.setUrlAccessPolicy(() => false);
pdfMake.addFonts({
  SourceSans3: {
    normal: resolve(fonts, 'SourceSans3-Regular.ttf'),
    bold: resolve(fonts, 'SourceSans3-Bold.ttf'),
    italics: resolve(fonts, 'SourceSans3-It.ttf'),
    bolditalics: resolve(fonts, 'SourceSans3-BoldIt.ttf'),
  },
});

const bytes = new Uint8Array(
  await pdfMake
    .createPdf({
      pageSize: 'A4',
      defaultStyle: { font: 'SourceSans3', fontSize: 11 },
      content: [
        { text: 'Ana Núñez' },
        { text: 'Experiencia', bold: true },
        { text: 'Diseñé software en España.' },
        { text: 'Actualidad' },
      ],
    })
    .getBuffer(),
);

const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(
  resolve('node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs'),
).href;
const document = await pdfjs
  .getDocument({ data: bytes, useSystemFonts: false, useWorkerFetch: false, verbosity: 0 })
  .promise;
const page = await document.getPage(1);
const content = await page.getTextContent();
const text = content.items.map((item) => ('str' in item ? item.str : '')).join(' ');

for (const expected of ['Ana Núñez', 'Diseñé', 'España', 'Experiencia', 'Actualidad']) {
  if (!text.includes(expected)) {
    console.error(`Falta en el texto del PDF: ${expected}`);
    console.error(text);
    process.exit(1);
  }
}

console.log('PDF con texto seleccionable y tildes: ok');
