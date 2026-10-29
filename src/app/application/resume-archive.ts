import { Resume } from '../domain/resume/resume';

export abstract class ResumeArchive {
  abstract serializeOne(resume: Resume): string;
  abstract serializeBundle(documents: Resume[], exportedAt: string): string;
  abstract parse(text: string): Resume[];
}
