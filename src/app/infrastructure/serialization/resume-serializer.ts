import { Resume } from '../../domain/resume/resume';
import { migrate } from './migrate';
import { resumeSchema } from './resume-schema';

export function serializeResume(resume: Resume): string {
  return `${JSON.stringify(orderResume(resume), null, 2)}\n`;
}

export function parseResume(json: string): Resume {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('El archivo no es JSON.');
  }
  const result = resumeSchema.safeParse(migrate(raw));
  if (!result.success) {
    throw new Error('El CV no tiene la forma esperada.');
  }
  return result.data;
}

export function orderResume(resume: Resume): Resume {
  return {
    schemaVersion: resume.schemaVersion,
    meta: {
      id: resume.meta.id,
      name: resume.meta.name,
      kind: resume.meta.kind,
      derivedFrom: resume.meta.derivedFrom,
      createdAt: resume.meta.createdAt,
      updatedAt: resume.meta.updatedAt,
      revision: resume.meta.revision,
    },
    language: resume.language,
    layout: resume.layout,
    posting: {
      company: resume.posting.company,
      title: resume.posting.title,
      status: resume.posting.status,
      postingText: resume.posting.postingText,
      pdfFile: resume.posting.pdfFile,
    },
    basics: {
      name: resume.basics.name,
      headline: resume.basics.headline,
      email: resume.basics.email,
      phone: resume.basics.phone,
      url: resume.basics.url,
      location: resume.basics.location,
      summary: resume.basics.summary,
    },
    sections: resume.sections.map((section) => ({
      id: section.id,
      visible: section.visible,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        visible: item.visible,
        title: item.title,
        organization: item.organization,
        location: item.location,
        start: item.start,
        end: item.end,
        bullets: item.bullets.map((bullet) => ({
          id: bullet.id,
          visible: bullet.visible,
          text: bullet.text,
        })),
      })),
    })),
  };
}
