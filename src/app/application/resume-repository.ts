import { Resume } from '../domain/resume/resume';

export interface ResumeList {
  resumes: Resume[];
  unreadableIds: string[];
}

export abstract class ResumeRepository {
  abstract list(): Promise<ResumeList>;
  abstract get(id: string): Promise<Resume | null>;
  abstract save(resume: Resume): Promise<void>;
  abstract delete(id: string): Promise<void>;
}
