import { createMaster, deriveSnapshot } from '../domain/cv-document';
import { parseBackup, parseCvDocument } from './cv-schema';

describe('esquema Zod', () => {
  it('acepta un maestro y rechaza basura', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    expect(parseCvDocument(master).id).toBe('m');
    expect(() => parseCvDocument({ ...master, kind: 'otro' })).toThrow(/forma esperada/);
    expect(() => parseBackup({ schemaVersion: 2, exportedAt: master.updatedAt, documents: [master] })).toThrow(
      /forma esperada/,
    );
  });

  it('exige el enlace de una copia con su maestro', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    const derived = deriveSnapshot(master, 'd', 'Oferta', '2026-02-01T00:00:00.000Z');
    expect(parseCvDocument(derived).derivedFrom).toBe('m');
    expect(() => parseCvDocument({ ...derived, derivedFrom: null })).toThrow(/maestro/);
  });
});
