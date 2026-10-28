import { assessAts, ATS_DISCLAIMER, termsFromJob } from './assess-ats';
import { createMaster, deriveSnapshot } from './cv-document';

describe('assessAts', () => {
  it('no promete que el CV vaya a pasar un ATS', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    master.content.identity.fullName = 'Ana Núñez';
    const report = assessAts('Ana Nuñez\nResumen', master);
    expect(report.disclaimer).toBe(ATS_DISCLAIMER);
    expect(report.disclaimer).toMatch(/no garantiza/i);
    for (const finding of report.findings) {
      expect(finding.message.toLowerCase()).not.toMatch(/aprobado|apto|garantiza/);
    }
  });

  it('avisa si el PDF no tiene texto y si faltan encabezados', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    master.content.summary = 'Un resumen propio';
    expect(assessAts('   ', master).findings[0]?.code).toBe('text-empty');
    const report = assessAts('Texto distinto sin el titulo de seccion', master);
    expect(report.findings.some((finding) => finding.code === 'heading-resumen' && finding.level === 'aviso')).toBe(true);
  });

  it('cuenta términos de la oferta sin confundir Java con JavaScript', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    const derived = deriveSnapshot(master, 'd', 'Oferta', '2026-01-02T00:00:00.000Z');
    derived.target = { company: 'Acme', role: 'Dev', jobText: 'Buscamos Java y TypeScript con pruebas' };
    derived.content.summary = 'TypeScript';
    const report = assessAts('Resumen\nTypeScript y JavaScript', derived);
    expect(termsFromJob(derived.target.jobText)).toEqual(['Buscamos', 'Java', 'TypeScript', 'pruebas']);
    expect(report.termsTotal).toBe(4);
    expect(report.termsInPdf).toBe(1);
  });
});
