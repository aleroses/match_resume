import { PdfExporter } from '../../application/ports';
import { CvDocument } from '../../domain/cv-document';
import { buildCvDefinition } from './cv-pdf-definition';

interface PdfMakeBrowser {
  addFonts(fonts: Record<string, Record<string, string>>): void;
  addVirtualFileSystem(vfs: Record<string, string>): void;
  setUrlAccessPolicy(policy: (url: string) => boolean): void;
  createPdf(definition: unknown): { getBuffer(): Promise<Uint8Array> };
}

const FONT_FILES = {
  normal: 'SourceSans3-Regular.ttf',
  bold: 'SourceSans3-Bold.ttf',
  italics: 'SourceSans3-It.ttf',
  bolditalics: 'SourceSans3-BoldIt.ttf',
} as const;

let fontsTask: Promise<void> | null = null;

export class PdfMakeExporter extends PdfExporter {
  override async export(document: CvDocument): Promise<Uint8Array> {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default as PdfMakeBrowser;
    await ensureFonts(pdfMake);
    pdfMake.setUrlAccessPolicy(() => false);
    const buffer = await pdfMake.createPdf(buildCvDefinition(document)).getBuffer();
    return new Uint8Array(buffer);
  }
}

function ensureFonts(pdfMake: PdfMakeBrowser): Promise<void> {
  fontsTask ??= loadFonts(pdfMake).catch((error: unknown) => {
    fontsTask = null;
    throw error;
  });
  return fontsTask;
}

async function loadFonts(pdfMake: PdfMakeBrowser): Promise<void> {
  const vfs: Record<string, string> = {};
  for (const fileName of Object.values(FONT_FILES)) {
    const response = await fetch(new URL(`fonts/${fileName}`, document.baseURI));
    if (!response.ok) {
      throw new Error('No se pudieron cargar las fuentes del PDF.');
    }
    vfs[fileName] = bytesToBase64(new Uint8Array(await response.arrayBuffer()));
  }
  pdfMake.addVirtualFileSystem(vfs);
  pdfMake.addFonts({ SourceSans3: { ...FONT_FILES } });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunk));
  }
  return btoa(binary);
}
