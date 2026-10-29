import { BackupReminderStore } from '../../application/backup-reminder-store';
import { Clock } from '../../application/clock';
import { FileGateway } from '../../application/file-gateway';
import { InMemoryResumeRepository } from '../../application/testing/in-memory-resume-repository';
import { ApplyImport, ExportAll, PlanImport } from '../../application/transfer';
import { ListResumes } from '../../application/use-cases';
import { Resume } from '../../domain/resume/resume';
import { deriveVersion, emptyMaster } from '../../domain/resume/resume-rules';
import { ZodResumeArchive } from './resume-archive';

const T0 = '2026-01-02T03:04:05.000Z';
const T1 = '2026-02-03T04:05:06.000Z';

class FixedClock extends Clock {
  constructor(private time: string) {
    super();
  }

  override now(): string {
    return this.time;
  }
}

class MemoryFiles extends FileGateway {
  downloads: { filename: string; text: string }[] = [];

  override download(filename: string, text: string): void {
    this.downloads.push({ filename, text });
  }

  override pickFile(): Promise<{ name: string; text: string } | null> {
    return Promise.resolve(null);
  }
}

class MemoryReminder extends BackupReminderStore {
  override lastExportAllAt(): string | null {
    return null;
  }

  override recordExportAll(): void {}
}

class CountingRepository extends InMemoryResumeRepository {
  saves = 0;

  override async save(resume: Resume): Promise<void> {
    this.saves += 1;
    await super.save(resume);
  }
}

describe('ZodResumeArchive', () => {
  const archive = new ZodResumeArchive();

  it('exportar e importar en un almacén vacío reproduce los documentos', async () => {
    const source = new InMemoryResumeRepository();
    const master = emptyMaster('m1', T0);
    master.basics.name = 'Ana Núñez';
    const version = deriveVersion(master, 'v1', T0);
    version.posting.company = 'Acme';
    await source.save(master);
    await source.save(version);
    const files = new MemoryFiles();
    await new ExportAll(
      new ListResumes(source),
      archive,
      files,
      new FixedClock(T1),
      new MemoryReminder(),
    ).execute();

    const text = files.downloads[0]!.text;
    expect(text.startsWith('{\n  "bundleVersion": 1')).toBe(true);
    expect(text).toContain('\n  "exportedAt": "2026-02-03T04:05:06.000Z"');
    expect(text.endsWith('\n')).toBe(true);

    const target = new InMemoryResumeRepository();
    const plan = await new PlanImport(target, archive).execute(text);
    expect(plan.items.map((item) => item.action)).toEqual(['add', 'add']);
    await new ApplyImport(target).execute(plan, new Set());
    expect(await new ListResumes(target).execute()).toEqual(
      await new ListResumes(source).execute(),
    );
  });

  it('un documento corrupto nombra la posición y no escribe nada', async () => {
    const repo = new CountingRepository();
    const stored = emptyMaster('local', T0);
    await repo.save(stored);
    repo.saves = 0;
    const good = emptyMaster('m-good', T0);
    const bad = emptyMaster('m-bad', T0);
    bad.meta.kind = 'version';
    bad.meta.derivedFrom = null;
    const text = JSON.stringify({
      bundleVersion: 1,
      exportedAt: T0,
      documents: [good, bad],
    });

    await expect(new PlanImport(repo, archive).execute(text)).rejects.toThrow(
      /Documento 2 \(m-bad, CV maestro\)/,
    );
    expect(repo.saves).toBe(0);
    expect(await repo.list()).toEqual({ resumes: [stored], unreadableIds: [] });
    expect(await repo.get('m-good')).toBeNull();
  });

  it('migra cada documento del paquete y lee un CV suelto', () => {
    const resume = emptyMaster('m1', T0);
    const { schemaVersion: _version, ...legacy } = resume;
    const text = JSON.stringify({
      bundleVersion: 1,
      exportedAt: T1,
      documents: [legacy],
    });
    expect(archive.parse(text)).toEqual([resume]);
    expect(archive.parse(archive.serializeOne(resume))).toEqual([resume]);
  });

  it('rechaza una clave de más en el paquete y un CV suelto inválido', () => {
    expect(() =>
      archive.parse(JSON.stringify({ bundleVersion: 1, exportedAt: T0, documents: [], note: 'x' })),
    ).toThrow(/note/);
    const broken = emptyMaster('m1', T0);
    broken.meta.kind = 'version';
    expect(() => archive.parse(JSON.stringify(broken))).toThrow(/Documento 1 \(m1, CV maestro\)/);
  });
});
