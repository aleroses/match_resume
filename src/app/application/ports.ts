import { AtsReport } from '../domain/assess-ats';
import { CvContent, CvDocument, CvLocale, CvTarget } from '../domain/cv-document';

export interface BackupFile {
  schemaVersion: 1;
  exportedAt: string;
  documents: CvDocument[];
}

export abstract class CvRepository {
  abstract list(): Promise<CvDocument[]>;
  abstract get(id: string): Promise<CvDocument | null>;
  abstract save(document: CvDocument): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract replaceAll(documents: CvDocument[]): Promise<void>;
}

export abstract class Clock {
  abstract now(): string;
}

export abstract class IdGenerator {
  abstract next(): string;
}

export abstract class PdfExporter {
  abstract export(document: CvDocument): Promise<Uint8Array>;
}

export abstract class PdfTextExtractor {
  abstract extract(pdf: Uint8Array): Promise<string>;
}

export abstract class BackupCodec {
  abstract encode(file: BackupFile): string;
  abstract decode(raw: string): BackupFile;
}

export abstract class FileSaver {
  abstract save(filename: string, data: Uint8Array, mime: string): void;
}

export type { AtsReport, CvContent, CvDocument, CvLocale, CvTarget };
