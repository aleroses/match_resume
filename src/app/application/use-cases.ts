import { deriveVersion, emptyMaster, withStoredTimestamps } from '../domain/resume/resume-rules';
import { Resume } from '../domain/resume/resume';
import { Clock } from './clock';
import { IdGenerator } from './id-generator';
import { ResumeList, ResumeRepository } from './resume-repository';

export class OpenOrCreateMaster {
  constructor(
    private readonly resumes: ResumeRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(): Promise<Resume> {
    const { resumes } = await this.resumes.list();
    const master = resumes.find((resume) => resume.meta.kind === 'master');
    if (master) {
      return master;
    }
    const created = emptyMaster(this.ids.next(), this.clock.now());
    await this.resumes.save(created);
    return created;
  }
}

export class ListResumes {
  constructor(private readonly resumes: ResumeRepository) {}

  async execute(): Promise<ResumeList> {
    const listed = await this.resumes.list();
    const resumes = [...listed.resumes].sort((left, right) => {
      if (left.meta.updatedAt !== right.meta.updatedAt) {
        return left.meta.updatedAt < right.meta.updatedAt ? 1 : -1;
      }
      if (left.meta.id === right.meta.id) {
        return 0;
      }
      return left.meta.id < right.meta.id ? -1 : 1;
    });
    return { resumes, unreadableIds: listed.unreadableIds };
  }
}

export class DeriveVersion {
  constructor(
    private readonly resumes: ResumeRepository,
    private readonly ids: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(sourceId: string): Promise<Resume> {
    const source = await this.resumes.get(sourceId);
    if (!source) {
      throw new Error('No está ese CV.');
    }
    const copy = deriveVersion(source, this.ids.next(), this.clock.now());
    await this.resumes.save(copy);
    return copy;
  }
}

export class SaveResume {
  constructor(
    private readonly resumes: ResumeRepository,
    private readonly clock: Clock,
  ) {}

  async execute(incoming: Resume): Promise<Resume> {
    const stored = await this.resumes.get(incoming.meta.id);
    const at = this.clock.now();
    const next = stored
      ? withStoredTimestamps(stored, incoming, at)
      : { ...incoming, meta: { ...incoming.meta, createdAt: at, updatedAt: at, revision: 1 } };
    await this.resumes.save(next);
    return next;
  }
}

export class DeleteVersion {
  constructor(private readonly resumes: ResumeRepository) {}

  async execute(id: string): Promise<void> {
    const resume = await this.resumes.get(id);
    if (!resume) {
      throw new Error('No está ese CV.');
    }
    if (resume.meta.kind === 'master') {
      throw new Error('No se puede borrar el CV maestro.');
    }
    await this.resumes.delete(id);
  }
}

export class GetResume {
  constructor(private readonly resumes: ResumeRepository) {}

  async execute(id: string): Promise<Resume> {
    const resume = await this.resumes.get(id);
    if (!resume) {
      throw new Error('No está ese CV.');
    }
    return resume;
  }
}
