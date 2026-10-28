import { createMaster } from '../domain/cv-document';
import { BackupCodec, BackupFile, Clock, FileSaver, IdGenerator, PdfExporter, PdfTextExtractor } from './ports';
import { InMemoryCvRepository } from './testing/in-memory-cv-repository';
import {
  AuditCv,
  DeleteDerivedCv,
  DeriveCv,
  ImportBackup,
  LoadLibrary,
  SaveCvContent,
  UpdateTarget,
} from './use-cases';

class FixedClock extends Clock {
  constructor(private current: string) {
    super();
  }

  override now(): string {
    return this.current;
  }
}

class SequenceIds extends IdGenerator {
  private n = 0;

  override next(): string {
    this.n += 1;
    return `id-${this.n}`;
  }
}

class MemoryCodec extends BackupCodec {
  override encode(file: BackupFile): string {
    return JSON.stringify(file);
  }

  override decode(raw: string): BackupFile {
    return JSON.parse(raw) as BackupFile;
  }
}

class ThrowingCodec extends BackupCodec {
  override encode(): string {
    return '';
  }

  override decode(): BackupFile {
    throw new Error('El archivo no es JSON válido.');
  }
}

class RecordingRepository extends InMemoryCvRepository {
  saves = 0;
  replacements = 0;

  override async save(document: Parameters<InMemoryCvRepository['save']>[0]): Promise<void> {
    this.saves += 1;
    await super.save(document);
  }

  override async replaceAll(documents: Parameters<InMemoryCvRepository['replaceAll']>[0]): Promise<void> {
    this.replacements += 1;
    await super.replaceAll(documents);
  }
}

class FakePdf extends PdfExporter {
  override async export(): Promise<Uint8Array> {
    return new Uint8Array([1]);
  }
}

class FakeText extends PdfTextExtractor {
  constructor(private readonly text: string) {
    super();
  }

  override async extract(): Promise<string> {
    return this.text;
  }
}

class MemoryFiles extends FileSaver {
  saved: string[] = [];

  override save(filename: string): void {
    this.saved.push(filename);
  }
}

describe('casos de uso', () => {
  it('crea el maestro una sola vez y no reescribe si el contenido no cambia', async () => {
    const cvs = new RecordingRepository();
    const library = new LoadLibrary(cvs, new FixedClock('2026-01-01T00:00:00.000Z'), new SequenceIds());
    const first = await library.execute();
    expect(first).toHaveLength(1);
    expect(first[0]?.kind).toBe('master');
    cvs.saves = 0;
    await library.execute();
    expect(cvs.saves).toBe(0);

    const save = new SaveCvContent(cvs, new FixedClock('2026-03-01T00:00:00.000Z'));
    const unchanged = await save.execute(first[0].id, first[0].content, 'es');
    expect(unchanged.updatedAt).toBe('2026-01-01T00:00:00.000Z');
    expect(cvs.saves).toBe(0);
  });

  it('derivar copia el contenido y borrar el maestro está prohibido', async () => {
    const cvs = new InMemoryCvRepository();
    const ids = new SequenceIds();
    const clock = new FixedClock('2026-01-01T00:00:00.000Z');
    const [master] = await new LoadLibrary(cvs, clock, ids).execute();
    await new SaveCvContent(cvs, clock).execute(master.id, { ...master.content, summary: 'Hecho por mí' }, 'es');
    const derived = await new DeriveCv(cvs, new FixedClock('2026-04-01T00:00:00.000Z'), ids).execute('Oferta');
    expect(derived.derivedFrom).toBe(master.id);
    expect(derived.content.summary).toBe('Hecho por mí');
    await expect(new DeleteDerivedCv(cvs).execute(master.id)).rejects.toThrow(/maestro/);
    await new DeleteDerivedCv(cvs).execute(derived.id);
    expect(await cvs.get(derived.id)).toBeNull();
  });

  it('editar la oferta no cambia updatedAt', async () => {
    const cvs = new InMemoryCvRepository();
    const ids = new SequenceIds();
    const [master] = await new LoadLibrary(cvs, new FixedClock('2026-01-01T00:00:00.000Z'), ids).execute();
    const derived = await new DeriveCv(cvs, new FixedClock('2026-02-01T00:00:00.000Z'), ids).execute('Oferta');
    const updated = await new UpdateTarget(cvs).execute(derived.id, {
      company: 'Acme',
      role: 'Dev',
      jobText: 'TypeScript',
    });
    expect(updated.updatedAt).toBe(derived.updatedAt);
    await expect(
      new UpdateTarget(cvs).execute(master.id, { company: 'Acme', role: 'Dev', jobText: '' }),
    ).rejects.toThrow(/derivada/);
  });

  it('no reemplaza el almacén si el respaldo no vale', async () => {
    const cvs = new RecordingRepository();
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    await cvs.save(master);
    const importing = new ImportBackup(cvs, new ThrowingCodec());
    await expect(importing.execute('{')).rejects.toThrow(/JSON/);
    expect(cvs.replacements).toBe(0);
    expect((await cvs.list()).map((document) => document.id)).toEqual(['m']);

    const twoMasters = new ImportBackup(
      cvs,
      new MemoryCodec(),
    );
    const raw = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      documents: [master, createMaster('m2', '2026-01-02T00:00:00.000Z')],
    });
    await expect(twoMasters.execute(raw)).rejects.toThrow(/único CV maestro/);
    expect(cvs.replacements).toBe(0);
  });

  it('la auditoría no escribe el CV ni afirma un aprobado', async () => {
    const cvs = new RecordingRepository();
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    master.content.identity.fullName = 'Ana';
    await cvs.save(master);
    cvs.saves = 0;
    const report = await new AuditCv(cvs, new FakePdf(), new FakeText('Ana')).execute('m');
    expect(cvs.saves).toBe(0);
    expect(report.disclaimer).toMatch(/no garantiza/);
    expect(report.findings.some((finding) => finding.message.toLowerCase().includes('aprobado'))).toBe(false);
    expect(new MemoryFiles().saved).toEqual([]);
  });
});
