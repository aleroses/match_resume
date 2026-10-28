import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { BackupCodec, Clock, CvRepository, FileSaver, IdGenerator, PdfExporter, PdfTextExtractor } from './application/ports';
import { DexieCvRepository } from './infrastructure/dexie-cv-repository';
import { PdfMakeExporter } from './infrastructure/pdf/pdfmake-exporter';
import { PdfJsTextExtractor } from './infrastructure/pdf/pdfjs-text';
import { BrowserFileSaver, CryptoIds, SystemClock } from './infrastructure/system';
import { ZodBackupCodec } from './infrastructure/zod-backup-codec';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    { provide: CvRepository, useClass: DexieCvRepository },
    { provide: Clock, useClass: SystemClock },
    { provide: IdGenerator, useClass: CryptoIds },
    { provide: PdfExporter, useClass: PdfMakeExporter },
    { provide: PdfTextExtractor, useClass: PdfJsTextExtractor },
    { provide: BackupCodec, useClass: ZodBackupCodec },
    { provide: FileSaver, useClass: BrowserFileSaver },
  ],
};
