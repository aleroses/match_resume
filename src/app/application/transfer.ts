import { classifyImport, ImportClass } from '../domain/resume/classify-import';
import { Resume } from '../domain/resume/resume';
import { BackupReminderStore } from './backup-reminder-store';
import { Clock } from './clock';
import { FileGateway } from './file-gateway';
import { ResumeArchive } from './resume-archive';
import { ResumeRepository } from './resume-repository';
import { ListResumes } from './use-cases';

export type ImportAction = 'add' | 'skip' | 'replace' | 'conflict' | 'reject';

export interface ImportPlanItem {
  action: ImportAction;
  resume: Resume;
  reason: string;
}

export interface ImportPlan {
  items: ImportPlanItem[];
}

export interface ImportResult {
  added: number;
  replaced: number;
  skipped: number;
  rejected: number;
}

export function resumeFileName(resume: Resume): string {
  const id = resume.meta.id.slice(0, 8);
  return `cv-${slug(resume.meta.name)}-${id}.json`;
}

export function bundleFileName(exportedAt: string): string {
  return `match-resume-respaldo-${exportedAt.slice(0, 10)}.json`;
}

export class ExportResume {
  constructor(
    private readonly resumes: ResumeRepository,
    private readonly archive: ResumeArchive,
    private readonly files: FileGateway,
  ) {}

  async execute(id: string): Promise<void> {
    const resume = await this.resumes.get(id);
    if (!resume) {
      throw new Error('No está ese CV.');
    }
    this.files.download(resumeFileName(resume), this.archive.serializeOne(resume));
  }
}

export class ExportAll {
  constructor(
    private readonly list: ListResumes,
    private readonly archive: ResumeArchive,
    private readonly files: FileGateway,
    private readonly clock: Clock,
    private readonly reminder: BackupReminderStore,
  ) {}

  async execute(): Promise<void> {
    const { resumes } = await this.list.execute();
    const exportedAt = this.clock.now();
    this.files.download(
      bundleFileName(exportedAt),
      this.archive.serializeBundle(resumes, exportedAt),
    );
    this.reminder.recordExportAll(exportedAt);
  }
}

export class PlanImport {
  constructor(
    private readonly resumes: ResumeRepository,
    private readonly archive: ResumeArchive,
  ) {}

  async execute(text: string): Promise<ImportPlan> {
    const incoming = this.archive.parse(text);
    const repeated = duplicateId(incoming);
    if (repeated) {
      throw new Error(`El archivo repite el id ${repeated}.`);
    }
    const stored = await this.resumes.list();
    let master = stored.resumes.find((resume) => resume.meta.kind === 'master') ?? null;
    const items: ImportPlanItem[] = [];
    for (const resume of incoming) {
      const sameId = stored.resumes.find((item) => item.meta.id === resume.meta.id) ?? null;
      const local =
        resume.meta.kind === 'master' && master && master.meta.id !== resume.meta.id
          ? master
          : sameId;
      const verdict = classifyImport(local, resume);
      items.push(planItem(verdict, resume));
      if (resume.meta.kind === 'master' && verdict === 'add') {
        master = resume;
      }
    }
    return { items };
  }
}

export class ApplyImport {
  constructor(private readonly resumes: ResumeRepository) {}

  async execute(plan: ImportPlan, replaceConflictIds: ReadonlySet<string>): Promise<ImportResult> {
    const result: ImportResult = { added: 0, replaced: 0, skipped: 0, rejected: 0 };
    for (const item of plan.items) {
      if (item.action === 'add') {
        await this.resumes.save(item.resume);
        result.added += 1;
      } else if (
        item.action === 'replace' ||
        (item.action === 'conflict' && replaceConflictIds.has(item.resume.meta.id))
      ) {
        await this.resumes.save(item.resume);
        result.replaced += 1;
      } else if (item.action === 'reject') {
        result.rejected += 1;
      } else {
        result.skipped += 1;
      }
    }
    return result;
  }
}

function planItem(verdict: ImportClass, resume: Resume): ImportPlanItem {
  switch (verdict) {
    case 'add':
      return { action: 'add', resume, reason: 'No está en este navegador. Se añadirá.' };
    case 'skip':
      return { action: 'skip', resume, reason: 'Ya está y es igual. Se ignora.' };
    case 'replace-newer':
      return {
        action: 'replace',
        resume,
        reason: 'El archivo es más reciente. Se reemplazará al confirmar.',
      };
    case 'keep-local-newer':
      return {
        action: 'conflict',
        resume,
        reason: 'El de este navegador es más reciente. Se conserva salvo que elijas reemplazarlo.',
      };
    case 'conflict-diverged':
      return {
        action: 'conflict',
        resume,
        reason:
          'Tienen la misma fecha y no son iguales. Se conserva el de este navegador salvo que elijas reemplazarlo.',
      };
    case 'reject-second-master':
      return {
        action: 'reject',
        resume,
        reason: 'Ya hay un CV maestro con otro id. Este no se importa.',
      };
  }
}

function duplicateId(resumes: Resume[]): string | null {
  const seen = new Set<string>();
  for (const resume of resumes) {
    if (seen.has(resume.meta.id)) {
      return resume.meta.id;
    }
    seen.add(resume.meta.id);
  }
  return null;
}

function slug(name: string): string {
  const plain = name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  const hyphenated = plain.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return hyphenated.length > 0 ? hyphenated : 'cv';
}
