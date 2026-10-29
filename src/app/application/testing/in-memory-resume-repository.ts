import { Resume } from '../../domain/resume/resume';
import { ResumeList, ResumeRepository } from '../resume-repository';

export class InMemoryResumeRepository extends ResumeRepository {
  private readonly rows = new Map<string, Resume>();

  override async list(): Promise<ResumeList> {
    return {
      resumes: [...this.rows.values()].map((resume) => structuredClone(resume)),
      unreadableIds: [],
    };
  }

  override async get(id: string): Promise<Resume | null> {
    const row = this.rows.get(id);
    return row ? structuredClone(row) : null;
  }

  override async save(resume: Resume): Promise<void> {
    if (resume.meta.kind === 'master') {
      for (const row of this.rows.values()) {
        if (row.meta.kind === 'master' && row.meta.id !== resume.meta.id) {
          throw new Error('Ya hay un CV maestro.');
        }
      }
    }
    this.rows.set(resume.meta.id, structuredClone(resume));
  }

  override async delete(id: string): Promise<void> {
    this.rows.delete(id);
  }
}
