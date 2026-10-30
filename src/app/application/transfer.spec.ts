import { BackupReminderStore } from './backup-reminder-store';
import { Clock } from './clock';
import { FileGateway } from './file-gateway';
import { IdGenerator } from './id-generator';
import { ResumeArchive } from './resume-archive';
import { InMemoryResumeRepository } from './testing/in-memory-resume-repository';
import { ApplyImport, ExportAll, ExportResume, PlanImport, resumeFileName } from './transfer';
import { ListResumes, OpenOrCreateMaster } from './use-cases';
import { Resume } from '../domain/resume/resume';
import { deriveVersion, emptyMaster } from '../domain/resume/resume-rules';

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
  at: string | null = null;

  override lastExportAllAt(): string | null {
    return this.at;
  }

  override recordExportAll(at: string): void {
    this.at = at;
  }
}

class MemoryArchive extends ResumeArchive {
  override serializeOne(resume: Resume): string {
    return JSON.stringify(resume);
  }

  override serializeBundle(documents: Resume[], exportedAt: string): string {
    return JSON.stringify({ bundleVersion: 1, exportedAt, documents });
  }

  override parse(text: string): Resume[] {
    if (text.startsWith('invalid')) {
      throw new Error('Documento 2 (bad): no vale.');
    }
    const raw = JSON.parse(text) as { documents?: Resume[] };
    if (raw.documents) {
      return raw.documents;
    }
    return [raw as Resume];
  }
}

class CountingRepository extends InMemoryResumeRepository {
  saves = 0;

  override async save(resume: Resume): Promise<void> {
    this.saves += 1;
    await super.save(resume);
  }
}

class SequenceIds extends IdGenerator {
  private nextId = 1;

  override next(): string {
    const id = `id-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

function localDay(iso: string): string {
  const date = new Date(iso);
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function harness(time = T1) {
  const resumes = new CountingRepository();
  const files = new MemoryFiles();
  const archive = new MemoryArchive();
  const reminder = new MemoryReminder();
  const clock = new FixedClock(time);
  const list = new ListResumes(resumes);
  return {
    resumes,
    files,
    archive,
    reminder,
    exportOne: new ExportResume(resumes, archive, files),
    exportAll: new ExportAll(list, archive, files, clock, reminder),
    plan: new PlanImport(resumes, archive),
    apply: new ApplyImport(resumes),
    list,
    open: new OpenOrCreateMaster(resumes, new SequenceIds(), clock),
  };
}

describe('exportar e importar', () => {
  it('exporta un CV con nombre estable y no anota el respaldo completo', async () => {
    const { resumes, exportOne, files, reminder } = harness();
    const resume = emptyMaster('1234abcd-rest', T0);
    resume.meta.name = 'Ana Núñez';
    await resumes.save(resume);

    await exportOne.execute(resume.meta.id);

    expect(files.downloads[0]?.filename).toBe('cv-ana-nunez-1234abcd.json');
    expect(reminder.at).toBeNull();

    const empty = emptyMaster('abcd1234', T0);
    empty.meta.name = '   ';
    expect(resumeFileName(empty)).toBe('cv-cv-abcd1234.json');
  });

  it('exporta el paquete en el orden de la lista y anota la fecha', async () => {
    const { resumes, exportAll, files, reminder, list } = harness();
    const master = emptyMaster('m1', T0);
    const older = deriveVersion(master, 'b-version', T0);
    const newer = deriveVersion(master, 'a-version', T0);
    newer.meta.updatedAt = T1;
    await resumes.save(master);
    await resumes.save(older);
    await resumes.save(newer);

    await exportAll.execute();

    expect(files.downloads[0]?.filename).toBe(`match-resume-respaldo-${localDay(T1)}.json`);
    const packed = JSON.parse(files.downloads[0]!.text) as { documents: Resume[] };
    const listed = await list.execute();
    expect(packed.documents.map((resume) => resume.meta.id)).toEqual(
      listed.resumes.map((resume) => resume.meta.id),
    );
    expect(reminder.at).toBe(T1);
  });

  it('un archivo inválido no escribe nada', async () => {
    const { resumes, plan } = harness();
    const seed = emptyMaster('seed', T0);
    await resumes.save(seed);
    resumes.saves = 0;

    await expect(plan.execute('invalid')).rejects.toThrow(/Documento 2/);
    expect(resumes.saves).toBe(0);
    expect(await resumes.get('seed')).toEqual(seed);
  });

  it('importar dos veces el mismo archivo no vuelve a escribir', async () => {
    const { resumes, exportAll, files, plan, apply } = harness();
    const master = emptyMaster('m1', T0);
    const version = deriveVersion(master, 'v1', T0);
    await resumes.save(master);
    await resumes.save(version);
    await exportAll.execute();
    const text = files.downloads[0]!.text;

    const first = await plan.execute(text);
    expect(first.items.every((item) => item.action === 'skip')).toBe(true);
    resumes.saves = 0;
    await apply.execute(first, new Set());
    expect(resumes.saves).toBe(0);

    const second = await plan.execute(text);
    expect(second.items.every((item) => item.action === 'skip')).toBe(true);
    const before = await resumes.list();
    await apply.execute(second, new Set());
    expect(await resumes.list()).toEqual(before);
  });

  it('no pisa un local más reciente sin confirmación', async () => {
    const { resumes, archive, plan, apply } = harness();
    const local = emptyMaster('same', T1);
    local.basics.summary = 'local';
    await resumes.save(local);
    const incoming = emptyMaster('same', T0);
    incoming.basics.summary = 'archivo';

    const planned = await plan.execute(archive.serializeOne(incoming));
    expect(planned.items[0]?.action).toBe('conflict');
    await apply.execute(planned, new Set());
    expect((await resumes.get('same'))?.basics.summary).toBe('local');

    await apply.execute(planned, new Set(['same']));
    const stored = await resumes.get('same');
    expect(stored?.basics.summary).toBe('archivo');
    expect(stored?.meta.updatedAt).toBe(T0);
    expect(stored?.meta.revision).toBe(1);
  });

  it('no pisa una diferencia con la misma fecha sin confirmación', async () => {
    const { resumes, archive, plan, apply } = harness();
    const local = emptyMaster('same', T0);
    local.meta.name = 'Local';
    await resumes.save(local);
    const incoming = emptyMaster('same', T0);
    incoming.meta.name = 'Archivo';

    const planned = await plan.execute(archive.serializeOne(incoming));
    expect(planned.items[0]?.action).toBe('conflict');
    await apply.execute(planned, new Set());
    expect((await resumes.get('same'))?.meta.name).toBe('Local');

    await apply.execute(planned, new Set(['same']));
    expect((await resumes.get('same'))?.meta.name).toBe('Archivo');
    expect((await resumes.get('same'))?.meta.updatedAt).toBe(T0);
  });

  it('adopta el maestro del archivo si el local está virgen y conserva derivedFrom', async () => {
    const { resumes, archive, plan, apply } = harness();
    const local = emptyMaster('local-master', T0);
    local.meta.name = 'Renombrado';
    await resumes.save(local);
    const other = emptyMaster('other-master', T1);
    other.basics.summary = 'Texto del respaldo';
    const version = deriveVersion(other, 'version-1', T1);
    const text = archive.serializeBundle([other, version], T1);

    const planned = await plan.execute(text);
    expect(await resumes.get('local-master')).toEqual(local);
    expect(planned.items.map((item) => item.action)).toEqual(['replace', 'add']);
    expect(planned.items[0]?.removeId).toBe('local-master');
    expect(planned.items[0]?.reason).toBe(
      'El maestro de este navegador está vacío. Al confirmar se borra y se adopta el del archivo.',
    );
    const result = await apply.execute(planned, new Set());

    expect(result).toEqual({ added: 1, replaced: 1, skipped: 0, rejected: 0 });
    expect(await resumes.get('local-master')).toBeNull();
    expect((await resumes.get('other-master'))?.basics.summary).toBe('Texto del respaldo');
    expect((await resumes.get('version-1'))?.meta.derivedFrom).toBe('other-master');
  });

  it('rechaza un segundo maestro si el local ya tiene contenido', async () => {
    const { resumes, archive, plan, apply } = harness();
    const local = emptyMaster('local-master', T0);
    local.basics.summary = 'Ya escrito';
    local.meta.revision = 2;
    await resumes.save(local);
    const other = emptyMaster('other-master', T1);
    const version = deriveVersion(other, 'version-1', T1);
    const text = archive.serializeBundle([other, version], T1);

    const planned = await plan.execute(text);
    expect(planned.items.map((item) => item.action)).toEqual(['reject', 'add']);
    const result = await apply.execute(planned, new Set());

    expect(result).toEqual({ added: 1, replaced: 0, skipped: 0, rejected: 1 });
    expect(await resumes.get('local-master')).toEqual(local);
    expect(await resumes.get('other-master')).toBeNull();
    expect((await resumes.get('version-1'))?.meta.derivedFrom).toBe('other-master');
  });

  it('tras adoptar, un segundo maestro del mismo archivo se rechaza', async () => {
    const { resumes, archive, plan, apply } = harness();
    await resumes.save(emptyMaster('local', T0));
    const first = emptyMaster('m1', T0);
    const second = emptyMaster('m2', T0);
    const planned = await plan.execute(archive.serializeBundle([first, second], T1));

    expect(planned.items.map((item) => item.action)).toEqual(['replace', 'reject']);
    await apply.execute(planned, new Set());
    expect(await resumes.get('local')).toBeNull();
    expect(await resumes.get('m1')).toEqual(first);
    expect(await resumes.get('m2')).toBeNull();
  });

  it('en un almacén vacío el segundo maestro del archivo se rechaza', async () => {
    const { resumes, archive, plan, apply } = harness();
    const first = emptyMaster('m1', T0);
    const second = emptyMaster('m2', T0);
    const planned = await plan.execute(archive.serializeBundle([first, second], T1));

    expect(planned.items.map((item) => item.action)).toEqual(['add', 'reject']);
    await apply.execute(planned, new Set());
    expect(await resumes.get('m1')).toEqual(first);
    expect(await resumes.get('m2')).toBeNull();
  });

  it('un id repetido no escribe nada', async () => {
    const { resumes, archive, plan } = harness();
    const seed = emptyMaster('seed', T0);
    await resumes.save(seed);
    resumes.saves = 0;
    const copy = emptyMaster('m1', T0);
    const text = archive.serializeBundle([copy, structuredClone(copy)], T1);

    await expect(plan.execute(text)).rejects.toThrow(/repite el id m1/);
    expect(resumes.saves).toBe(0);
    expect(await resumes.get('seed')).toEqual(seed);
  });

  it('reemplaza un importado más reciente al confirmar y conserva su fecha', async () => {
    const { resumes, archive, plan, apply } = harness();
    const local = emptyMaster('same', T0);
    local.basics.summary = 'viejo';
    await resumes.save(local);
    const incoming = emptyMaster('same', T1);
    incoming.basics.summary = 'nuevo';
    incoming.meta.revision = 4;

    const planned = await plan.execute(archive.serializeOne(incoming));
    expect(planned.items[0]?.action).toBe('replace');
    await apply.execute(planned, new Set());
    const stored = await resumes.get('same');
    expect(stored?.basics.summary).toBe('nuevo');
    expect(stored?.meta.updatedAt).toBe(T1);
    expect(stored?.meta.revision).toBe(4);
  });

  it('exportar e importar en un almacén vacío reproduce los documentos', async () => {
    const source = harness();
    const master = emptyMaster('m1', T0);
    master.basics.name = 'Ana Núñez';
    const version = deriveVersion(master, 'v1', T0);
    version.posting.company = 'Acme';
    await source.resumes.save(master);
    await source.resumes.save(version);
    await source.exportAll.execute();

    const target = harness();
    const planned = await target.plan.execute(source.files.downloads[0]!.text);
    expect(planned.items.map((item) => item.action)).toEqual(['add', 'add']);
    await target.apply.execute(planned, new Set());

    expect(await target.list.execute()).toEqual(await source.list.execute());
  });

  it('recupera el maestro y las versiones tras borrar el almacén y abrirlo', async () => {
    const source = harness();
    const master = emptyMaster('m1', T0);
    master.basics.name = 'Ana Núñez';
    const version = deriveVersion(master, 'v1', T0);
    version.posting.company = 'Acme';
    await source.resumes.save(master);
    await source.resumes.save(version);
    await source.exportAll.execute();

    const target = harness();
    const created = await target.open.execute();
    const planned = await target.plan.execute(source.files.downloads[0]!.text);

    expect(planned.items.map((item) => item.action)).toEqual(['replace', 'add']);
    expect(planned.items[0]?.removeId).toBe(created.meta.id);
    await target.apply.execute(planned, new Set());

    expect(await target.resumes.get(created.meta.id)).toBeNull();
    expect(await target.resumes.get('m1')).toEqual(master);
    expect((await target.resumes.get('v1'))?.meta.derivedFrom).toBe('m1');
    expect((await target.resumes.get('v1'))?.posting.company).toBe('Acme');
  });
});
