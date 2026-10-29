import { z } from 'zod';
import { ResumeArchive } from '../../application/resume-archive';
import { Resume } from '../../domain/resume/resume';
import { migrate } from './migrate';
import { orderResume, serializeResume } from './resume-serializer';
import { resumeSchema } from './resume-schema';

const bundleSchema = z.strictObject({
  bundleVersion: z.literal(1),
  exportedAt: z.iso.datetime(),
  documents: z.array(z.unknown()),
});

export class ZodResumeArchive extends ResumeArchive {
  override serializeOne(resume: Resume): string {
    return serializeResume(resume);
  }

  override serializeBundle(documents: Resume[], exportedAt: string): string {
    const bundle = {
      bundleVersion: 1 as const,
      exportedAt,
      documents: documents.map((resume) => orderResume(resume)),
    };
    return `${JSON.stringify(bundle, null, 2)}\n`;
  }

  override parse(text: string): Resume[] {
    let raw: unknown;
    try {
      raw = JSON.parse(text);
    } catch {
      throw new Error('El archivo no es JSON.');
    }
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new Error('El archivo no es un CV ni un paquete.');
    }
    const record = raw as Record<string, unknown>;
    if ('bundleVersion' in record || 'documents' in record) {
      return parseBundle(record);
    }
    try {
      return [readDocument(raw)];
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'No tiene la forma esperada.';
      throw new Error(`${label(0, raw)}: ${reason}`);
    }
  }
}

function parseBundle(raw: Record<string, unknown>): Resume[] {
  const envelope = bundleSchema.safeParse(raw);
  if (!envelope.success) {
    throw new Error(
      `El paquete no tiene la forma esperada. ${formatIssues(envelope.error.issues)}`,
    );
  }
  const documents: Resume[] = [];
  const errors: string[] = [];
  envelope.data.documents.forEach((item, index) => {
    try {
      documents.push(readDocument(item));
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'No tiene la forma esperada.';
      errors.push(`${label(index, item)}: ${reason}`);
    }
  });
  if (errors.length > 0) {
    throw new Error(errors.join(' '));
  }
  return documents;
}

function readDocument(raw: unknown): Resume {
  let migrated: unknown;
  try {
    migrated = migrate(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'El documento no es un objeto JSON.';
    throw new Error(reason);
  }
  const parsed = resumeSchema.safeParse(migrated);
  if (!parsed.success) {
    throw new Error(formatIssues(parsed.error.issues));
  }
  return parsed.data;
}

function label(index: number, raw: unknown): string {
  const position = index + 1;
  if (typeof raw !== 'object' || raw === null || !('meta' in raw)) {
    return `Documento ${position}`;
  }
  const meta = (raw as { meta?: { id?: unknown; name?: unknown } }).meta;
  const id = typeof meta?.id === 'string' && meta.id.length > 0 ? meta.id : null;
  const name = typeof meta?.name === 'string' && meta.name.length > 0 ? meta.name : null;
  if (id && name) {
    return `Documento ${position} (${id}, ${name})`;
  }
  if (id) {
    return `Documento ${position} (${id})`;
  }
  if (name) {
    return `Documento ${position} (${name})`;
  }
  return `Documento ${position}`;
}

function formatIssues(
  issues: { path: PropertyKey[]; message: string; code?: string; keys?: string[] }[],
): string {
  if (issues.length === 0) {
    return 'No tiene la forma esperada.';
  }
  return issues
    .map((issue) => {
      const path = issue.path.map(String).join('.');
      if (issue.code === 'unrecognized_keys' && issue.keys && issue.keys.length > 0) {
        const where = path.length > 0 ? `${path}: ` : '';
        return `${where}claves no reconocidas: ${issue.keys.join(', ')}`;
      }
      if (issue.code === 'custom') {
        return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
      }
      return path.length > 0
        ? `${path} no tiene la forma esperada.`
        : 'No tiene la forma esperada.';
    })
    .join(' ');
}
