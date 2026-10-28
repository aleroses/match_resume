import { PdfTextExtractor } from '../../application/ports';

export async function extractPdfText(pdf: Uint8Array, workerSrc: string): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
  const task = pdfjs.getDocument({
    data: pdf.slice(),
    useSystemFonts: false,
    useWorkerFetch: false,
    verbosity: 0,
  });
  const document = await task.promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => (isTextItem(item) ? item.str : ''))
      .join(' ');
    pages.push(line);
  }
  return pages.join('\n');
}

export class PdfJsTextExtractor extends PdfTextExtractor {
  override extract(pdf: Uint8Array): Promise<string> {
    const workerSrc = new URL('pdfjs/pdf.worker.min.mjs', document.baseURI).href;
    return extractPdfText(pdf, workerSrc);
  }
}

function isTextItem(item: unknown): item is { str: string } {
  return typeof item === 'object' && item !== null && 'str' in item && typeof item.str === 'string';
}
