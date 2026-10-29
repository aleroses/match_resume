import Dexie, { type Table } from 'dexie';
import { ResumeRepository, ResumeList } from '../application/resume-repository';
import { Resume } from '../domain/resume/resume';
import { resumeSchema } from './serialization/resume-schema';

const SCHEMA = 'meta.id, meta.kind, meta.updatedAt';

class ResumeDatabase extends Dexie {
  resumes!: Table<Resume, string>;

  constructor() {
    super('match-resume');
    this.version(1).stores({ resumes: SCHEMA });
  }
}

export class DexieResumeRepository extends ResumeRepository {
  private readonly db = new ResumeDatabase();

  override async list(): Promise<ResumeList> {
    const rows = await this.db.resumes.toArray();
    const resumes: Resume[] = [];
    const unreadableIds: string[] = [];
    for (const row of rows) {
      const parsed = resumeSchema.safeParse(row);
      if (parsed.success) {
        resumes.push(parsed.data);
      } else {
        unreadableIds.push(rowId(row));
      }
    }
    return { resumes, unreadableIds };
  }

  override async get(id: string): Promise<Resume | null> {
    const row = await this.db.resumes.get(id);
    if (row === undefined) {
      return null;
    }
    const parsed = resumeSchema.safeParse(row);
    if (!parsed.success) {
      throw new Error('No se pudo leer el CV.');
    }
    return parsed.data;
  }

  override async save(resume: Resume): Promise<void> {
    if (resume.meta.kind === 'master') {
      const ids = await this.db.resumes.where('meta.kind').equals('master').primaryKeys();
      if (ids.some((key) => key !== resume.meta.id)) {
        throw new Error('Ya hay un CV maestro.');
      }
    }
    await this.db.resumes.put(resume);
  }

  override async delete(id: string): Promise<void> {
    await this.db.resumes.delete(id);
  }

  close(): void {
    this.db.close();
  }
}

function rowId(row: unknown): string {
  if (typeof row === 'object' && row !== null && 'meta' in row) {
    const meta = (row as { meta?: { id?: unknown } }).meta;
    if (typeof meta?.id === 'string' && meta.id.length > 0) {
      return meta.id;
    }
  }
  return 'desconocido';
}

export async function putRawResume(value: unknown): Promise<void> {
  const db = new Dexie('match-resume');
  db.version(1).stores({ resumes: SCHEMA });
  await db.table('resumes').put(value);
  db.close();
}
