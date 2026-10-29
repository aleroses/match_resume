import { z } from 'zod';
import { Resume } from '../../domain/resume/resume';

const id = z.string().min(1);
const text = z.string();
const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const instant = z.iso.datetime();

const bulletSchema = z.strictObject({
  id,
  visible: z.boolean(),
  text,
});

const itemSchema = z.strictObject({
  id,
  visible: z.boolean(),
  title: text,
  organization: text,
  location: text,
  start: z.union([z.literal(''), yearMonth]),
  end: z.union([z.null(), yearMonth]),
  bullets: z.array(bulletSchema),
});

const sectionSchema = z.strictObject({
  id,
  visible: z.boolean(),
  title: text,
  items: z.array(itemSchema),
});

export const resumeSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    meta: z.strictObject({
      id,
      name: text,
      kind: z.enum(['master', 'version']),
      derivedFrom: id.nullable(),
      createdAt: instant,
      updatedAt: instant,
      revision: z.number().int().min(1),
    }),
    language: z.enum(['es', 'en']),
    layout: z.literal('one-column'),
    posting: z.strictObject({
      company: text,
      title: text,
      status: z.enum(['draft', 'applied', 'closed']),
      postingText: text,
      pdfFile: id.nullable(),
    }),
    basics: z.strictObject({
      name: text,
      headline: text,
      email: text,
      phone: text,
      url: text,
      location: text,
      summary: text,
    }),
    sections: z.array(sectionSchema),
  })
  .superRefine((resume, ctx) => {
    if (resume.meta.kind === 'master' && resume.meta.derivedFrom !== null) {
      ctx.addIssue('El maestro no tiene derivedFrom.');
    }
    if (resume.meta.kind === 'version' && resume.meta.derivedFrom === null) {
      ctx.addIssue('La versión recuerda de qué documento sale.');
    }
  }) satisfies z.ZodType<Resume>;
