import { createMaster } from '../../domain/cv-document';
import { buildCvDefinition } from './cv-pdf-definition';

describe('definición del PDF', () => {
  it('es una sola columna de texto con encabezados reales', () => {
    const master = createMaster('m', '2026-01-01T00:00:00.000Z');
    master.content.identity.fullName = 'Ana Núñez';
    master.content.summary = 'Diseñé software en España.';
    master.content.experience = [
      {
        id: 'e1',
        organization: 'Taller',
        role: 'Desarrolladora',
        location: 'León',
        start: '2020-01',
        end: null,
        bullets: ['Mantuve el módulo de facturación.'],
      },
    ];
    const definition = buildCvDefinition(master);
    const serialized = JSON.stringify(definition);
    expect(serialized).not.toContain('"table"');
    expect(serialized).not.toContain('"columns"');
    expect(definition.defaultStyle.font).toBe('SourceSans3');
    expect(definition.content.some((block) => block.text === 'Ana Núñez')).toBe(true);
    expect(definition.content.some((block) => block.text === 'Experiencia')).toBe(true);
    expect(serialized).toContain('Actualidad');
  });
});
