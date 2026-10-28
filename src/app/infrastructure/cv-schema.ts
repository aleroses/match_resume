import { z } from 'zod';
import { BackupFile } from '../application/ports';
import { CvDocument } from '../domain/cv-document';

const text = z.string();
const iso = z.string().refine((value) => !Number.isNaN(Date.parse(value)), 'Fecha ISO inválida');

const cvDocumentSchema = z.strictObject({
  id: text.min(1),
  kind: z.enum(['master', 'derived']),
  derivedFrom: text.min(1).nullable(),
  sourceUpdatedAt: iso.nullable(),
  title: text.min(1),
  locale: z.enum(['es', 'en']),
  target: z.strictObject({ company: text, role: text, jobText: text }).nullable(),
  content: z.strictObject({
    identity: z.strictObject({
      fullName: text,
      headline: text,
      email: text,
      phone: text,
      location: text,
      links: z.array(z.strictObject({ label: text, url: text })),
    }),
    summary: text,
    experience: z.array(
      z.strictObject({
        id: text.min(1),
        organization: text,
        role: text,
        location: text,
        start: text,
        end: text.nullable(),
        bullets: z.array(text),
      }),
    ),
    education: z.array(
      z.strictObject({
        id: text.min(1),
        institution: text,
        degree: text,
        start: text,
        end: text.nullable(),
        notes: text,
      }),
    ),
    skills: z.array(z.strictObject({ id: text.min(1), label: text, items: z.array(text) })),
    languages: z.array(z.strictObject({ id: text.min(1), name: text, level: text })),
    projects: z.array(
      z.strictObject({
        id: text.min(1),
        name: text,
        url: text,
        summary: text,
        bullets: z.array(text),
      }),
    ),
  }),
  createdAt: iso,
  updatedAt: iso,
});

const backupSchema = z.strictObject({
  schemaVersion: z.literal(1),
  exportedAt: iso,
  documents: z.array(cvDocumentSchema).min(1),
});

export function parseCvDocument(input: unknown): CvDocument {
  const parsed = parseWith(cvDocumentSchema, input, 'El CV guardado no tiene la forma esperada.');
  assertRelations(parsed);
  return parsed;
}

export function parseBackup(input: unknown): BackupFile {
  const parsed = parseWith(backupSchema, input, 'El respaldo no tiene la forma esperada.');
  for (const document of parsed.documents) {
    assertRelations(document);
  }
  return parsed;
}

function parseWith<T>(schema: z.ZodType<T>, input: unknown, message: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    throw new Error(message);
  }
  return result.data;
}

function assertRelations(document: CvDocument): void {
  if (document.kind === 'master') {
    if (document.derivedFrom !== null || document.target !== null || document.sourceUpdatedAt !== null) {
      throw new Error('El CV maestro no puede ser una copia.');
    }
    return;
  }
  if (!document.derivedFrom || !document.target || !document.sourceUpdatedAt) {
    throw new Error('La copia debe recordar de qué CV maestro sale.');
  }
}
