import { assessAts, AtsReport } from '../domain/assess-ats';
import {
  createMaster,
  CvContent,
  CvDocument,
  CvLocale,
  CvTarget,
  deriveSnapshot,
  downloadName,
  renameDocument,
  sortDocuments,
  touchContent,
  withTarget,
} from '../domain/cv-document';
import { BackupCodec, Clock, CvRepository, FileSaver, IdGenerator, PdfExporter, PdfTextExtractor } from './ports';

async function requireDocument(cvs: CvRepository, id: string): Promise<CvDocument> {
  const document = await cvs.get(id);
  if (!document) {
    throw new Error('No se encontró el CV.');
  }
  return document;
}

export class LoadLibrary {
  constructor(
    private readonly cvs: CvRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(): Promise<CvDocument[]> {
    const documents = await this.cvs.list();
    if (documents.length === 0) {
      const master = createMaster(this.ids.next(), this.clock.now());
      await this.cvs.save(master);
      return [master];
    }
    if (!documents.some((document) => document.kind === 'master')) {
      throw new Error('El almacén no tiene CV maestro.');
    }
    return sortDocuments(documents);
  }
}

export class GetCv {
  constructor(private readonly cvs: CvRepository) {}

  async execute(id: string): Promise<CvDocument> {
    return requireDocument(this.cvs, id);
  }
}

export class SaveCvContent {
  constructor(
    private readonly cvs: CvRepository,
    private readonly clock: Clock,
  ) {}

  async execute(id: string, content: CvContent, locale: CvLocale): Promise<CvDocument> {
    const current = await requireDocument(this.cvs, id);
    const next = touchContent(current, content, locale, this.clock.now());
    if (next !== current) {
      await this.cvs.save(next);
    }
    return next;
  }
}

export class RenameCv {
  constructor(private readonly cvs: CvRepository) {}

  async execute(id: string, title: string): Promise<CvDocument> {
    const current = await requireDocument(this.cvs, id);
    const next = renameDocument(current, title);
    if (next !== current) {
      await this.cvs.save(next);
    }
    return next;
  }
}

export class UpdateTarget {
  constructor(private readonly cvs: CvRepository) {}

  async execute(id: string, target: CvTarget): Promise<CvDocument> {
    const current = await requireDocument(this.cvs, id);
    const next = withTarget(current, target);
    if (next !== current) {
      await this.cvs.save(next);
    }
    return next;
  }
}

export class DeriveCv {
  constructor(
    private readonly cvs: CvRepository,
    private readonly clock: Clock,
    private readonly ids: IdGenerator,
  ) {}

  async execute(title: string): Promise<CvDocument> {
    const master = (await this.cvs.list()).find((document) => document.kind === 'master');
    if (!master) {
      throw new Error('No hay CV maestro.');
    }
    const derived = deriveSnapshot(master, this.ids.next(), title, this.clock.now());
    await this.cvs.save(derived);
    return derived;
  }
}

export class DeleteDerivedCv {
  constructor(private readonly cvs: CvRepository) {}

  async execute(id: string): Promise<void> {
    const document = await requireDocument(this.cvs, id);
    if (document.kind === 'master') {
      throw new Error('No se puede borrar el CV maestro.');
    }
    await this.cvs.delete(id);
  }
}

export class ExportBackup {
  constructor(
    private readonly cvs: CvRepository,
    private readonly codec: BackupCodec,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<string> {
    return this.codec.encode({
      schemaVersion: 1,
      exportedAt: this.clock.now(),
      documents: sortDocuments(await this.cvs.list()),
    });
  }
}

export class ImportBackup {
  constructor(
    private readonly cvs: CvRepository,
    private readonly codec: BackupCodec,
  ) {}

  async execute(raw: string): Promise<CvDocument[]> {
    const file = this.codec.decode(raw);
    const masters = file.documents.filter((document) => document.kind === 'master');
    if (masters.length !== 1) {
      throw new Error('El respaldo debe contener un único CV maestro.');
    }
    const ids = new Set<string>();
    for (const document of file.documents) {
      if (ids.has(document.id)) {
        throw new Error('El respaldo tiene identificadores repetidos.');
      }
      ids.add(document.id);
      if (document.kind === 'derived' && document.derivedFrom !== masters[0].id) {
        throw new Error('Hay copias que no apuntan al CV maestro del respaldo.');
      }
    }
    await this.cvs.replaceAll(file.documents);
    return file.documents;
  }
}

export class DownloadBackup {
  constructor(
    private readonly exportBackup: ExportBackup,
    private readonly files: FileSaver,
  ) {}

  async execute(): Promise<void> {
    const json = await this.exportBackup.execute();
    this.files.save('cv-respaldo.json', new TextEncoder().encode(json), 'application/json');
  }
}

export class DownloadPdf {
  constructor(
    private readonly cvs: CvRepository,
    private readonly pdf: PdfExporter,
    private readonly files: FileSaver,
  ) {}

  async execute(id: string): Promise<void> {
    const document = await requireDocument(this.cvs, id);
    const bytes = await this.pdf.export(document);
    this.files.save(downloadName(document.title, 'pdf'), bytes, 'application/pdf');
  }
}

export class AuditCv {
  constructor(
    private readonly cvs: CvRepository,
    private readonly pdf: PdfExporter,
    private readonly text: PdfTextExtractor,
  ) {}

  async execute(id: string): Promise<AtsReport> {
    const document = await requireDocument(this.cvs, id);
    const bytes = await this.pdf.export(document);
    const extracted = await this.text.extract(bytes);
    return assessAts(extracted, document);
  }
}
