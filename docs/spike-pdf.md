# Conclusiones del spike de PDF

El código del spike se descartó. Estas decisiones quedan para cuando se genere el PDF.

- pdfmake genera el PDF de una columna con Source Sans 3 (regular, negrita, itálica y negrita itálica). Los cuatro TTF están en `public/fonts/`.
- La vista previa es un iframe con una URL `blob:`. En Firefox lo abre el visor nativo, así que el texto se puede seleccionar.
- pdf.js solo extrae el texto. No pinta la vista previa.
- No hace falta un Web Worker: un CV de dos páginas tardó una mediana de 226 ms en Chromium y 192 ms en Firefox.
- No hace falta jsPDF ni pdf-lib.
- No hizo falta desactivar ligaduras. El texto no trae los glifos ﬁ/ﬂ.
- Al unir los ítems de `getTextContent` hay que respetar el espacio entre objetos. Si no, dos bloques se pegan (`Núñezana`).
