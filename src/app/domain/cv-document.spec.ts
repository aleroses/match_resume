import { createMaster, deriveSnapshot, isStaleDerived, renameDocument, touchContent, withTarget } from './cv-document';

const T0 = '2026-01-01T00:00:00.000Z';
const T1 = '2026-02-01T00:00:00.000Z';

describe('CV document', () => {
  it('no cambia updatedAt si el contenido y el idioma siguen iguales', () => {
    const master = createMaster('m', T0);
    const clone = structuredClone(master.content);
    expect(touchContent(master, clone, master.locale, T1)).toBe(master);
  });

  it('cambia updatedAt solo cuando cambia el contenido o el idioma', () => {
    const master = createMaster('m', T0);
    const changed = touchContent(master, { ...master.content, summary: 'Texto propio' }, 'es', T1);
    expect(changed.updatedAt).toBe(T1);
    expect(changed.createdAt).toBe(T0);
    const translated = touchContent(master, master.content, 'en', T1);
    expect(translated.updatedAt).toBe(T1);
    expect(translated.locale).toBe('en');
  });

  it('renombrar y editar la oferta no cambian updatedAt', () => {
    const master = createMaster('m', T0);
    expect(renameDocument(master, 'Otro nombre').updatedAt).toBe(T0);
    const derived = deriveSnapshot(master, 'd', 'Oferta', T1);
    const targeted = withTarget(derived, { company: 'Acme', role: 'Dev', jobText: 'TypeScript' });
    expect(targeted.updatedAt).toBe(T1);
    expect(targeted.target).toEqual({ company: 'Acme', role: 'Dev', jobText: 'TypeScript' });
  });

  it('deriva una copia independiente del maestro', () => {
    const master = createMaster('m', T0);
    master.content.summary = 'Original';
    const derived = deriveSnapshot(master, 'd', 'Oferta', T1);
    derived.content.summary = 'Copia';
    expect(master.content.summary).toBe('Original');
    expect(derived.kind).toBe('derived');
    expect(derived.derivedFrom).toBe('m');
    expect(derived.sourceUpdatedAt).toBe(T0);
    expect(() => deriveSnapshot(derived, 'x', 'Otra', T1)).toThrow(/maestro/);
  });

  it('marca la copia como desactualizada si el maestro cambió después', () => {
    const master = createMaster('m', T0);
    const derived = deriveSnapshot(master, 'd', 'Oferta', T0);
    expect(isStaleDerived(derived, master)).toBe(false);
    const newer = { ...master, updatedAt: T1 };
    expect(isStaleDerived(derived, newer)).toBe(true);
  });
});
