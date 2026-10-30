import { Resume } from './resume';
import {
  addBullet,
  addItem,
  addSection,
  deriveVersion,
  editPosting,
  removeBullet,
  removeItem,
  removeSection,
  rename,
  reorderBullets,
  reorderItems,
  reorderSections,
  setVisible,
} from './resume-rules';

const T0 = '2026-01-02T03:04:05.000Z';
const T1 = '2026-02-03T04:05:06.000Z';

function sample(): Resume {
  return {
    schemaVersion: 1,
    meta: {
      id: 'm1',
      name: 'CV maestro',
      kind: 'master',
      derivedFrom: null,
      createdAt: T0,
      updatedAt: T0,
      revision: 1,
    },
    language: 'es',
    layout: 'one-column',
    posting: { company: '', title: '', status: 'draft', postingText: '', pdfFile: null },
    basics: {
      name: 'Ana Núñez',
      headline: 'Desarrolladora',
      email: 'ana@example.com',
      phone: '+34 600 000 000',
      url: 'https://example.com',
      location: 'Madrid',
      summary: 'Resumen con ñ y tildes.',
    },
    sections: [
      {
        id: 's1',
        visible: true,
        title: 'Experiencia',
        items: [
          {
            id: 'i1',
            visible: true,
            title: 'Desarrolladora',
            organization: 'Acme',
            location: 'Madrid',
            start: '2020-01',
            end: null,
            bullets: [{ id: 'b1', visible: true, text: 'Entregué el sistema.' }],
          },
        ],
      },
      {
        id: 's2',
        visible: true,
        title: 'Educación',
        items: [
          {
            id: 'i2',
            visible: true,
            title: 'Grado',
            organization: 'UBA',
            location: '',
            start: '2014-03',
            end: '2019-12',
            bullets: [
              { id: 'b2', visible: true, text: 'Una materia.' },
              { id: 'b3', visible: true, text: 'Otra materia.' },
            ],
          },
        ],
      },
    ],
  };
}

describe('deriveVersion', () => {
  it('copia el contenido, conserva los ids de elementos y no muta el maestro', () => {
    const master = sample();
    const version = deriveVersion(master, 'v1', T1);

    expect(version).not.toBe(master);
    expect(master.meta).toEqual(sample().meta);
    expect(version.meta).toEqual({
      id: 'v1',
      name: 'CV maestro',
      kind: 'version',
      derivedFrom: 'm1',
      createdAt: T1,
      updatedAt: T1,
      revision: 1,
    });
    expect(version.sections.map((section) => section.id)).toEqual(['s1', 's2']);
    expect(version.sections[0]!.items[0]!.id).toBe('i1');
    expect(version.sections[0]!.items[0]!.bullets[0]!.id).toBe('b1');
    expect(version.basics).toEqual(master.basics);
    expect(version.posting).toEqual(master.posting);

    version.basics.name = 'Otra';
    version.sections[0]!.title = 'Trabajo';
    expect(master.basics.name).toBe('Ana Núñez');
    expect(master.sections[0]!.title).toBe('Experiencia');
  });
});

describe('reordenar', () => {
  it('mueve secciones y actualiza updatedAt y revision', () => {
    const resume = sample();
    const reordered = reorderSections(resume, ['s2', 's1'], T1);
    expect(reordered.sections.map((section) => section.id)).toEqual(['s2', 's1']);
    expect(reordered.meta.updatedAt).toBe(T1);
    expect(reordered.meta.revision).toBe(2);
    expect(reordered.meta.createdAt).toBe(T0);
    expect(resume.meta.updatedAt).toBe(T0);
  });

  it('devuelve el mismo objeto si el orden de secciones no cambia', () => {
    const resume = sample();
    expect(reorderSections(resume, ['s1', 's2'], T1)).toBe(resume);
  });

  it('rechaza una lista de secciones que no es la actual', () => {
    expect(() => reorderSections(sample(), ['s1'], T1)).toThrow(/no coincide/);
    expect(() => reorderSections(sample(), ['s1', 's1'], T1)).toThrow(/no coincide/);
  });

  it('reordena ítems y viñetas', () => {
    const resume = sample();
    const withItems = {
      ...resume,
      sections: resume.sections.map((section) =>
        section.id === 's1'
          ? {
              ...section,
              items: [
                section.items[0]!,
                { ...section.items[0]!, id: 'i9', title: 'Otro puesto', bullets: [] },
              ],
            }
          : section,
      ),
    };
    const items = reorderItems(withItems, 's1', ['i9', 'i1'], T1);
    expect(items.sections[0]!.items.map((item) => item.id)).toEqual(['i9', 'i1']);
    expect(items.meta.revision).toBe(2);

    const bullets = reorderBullets(resume, 's2', 'i2', ['b3', 'b2'], T1);
    expect(bullets.sections[1]!.items[0]!.bullets.map((bullet) => bullet.id)).toEqual(['b3', 'b2']);
    expect(reorderBullets(resume, 's2', 'i2', ['b2', 'b3'], T1)).toBe(resume);
  });
});

describe('setVisible', () => {
  it('oculta una sección y sube la revisión', () => {
    const resume = sample();
    const hidden = setVisible(resume, { kind: 'section', id: 's1' }, false, T1);
    expect(hidden.sections[0]!.visible).toBe(false);
    expect(hidden.meta.updatedAt).toBe(T1);
    expect(hidden.meta.revision).toBe(2);
    expect(resume.sections[0]!.visible).toBe(true);
  });

  it('oculta un ítem y una viñeta', () => {
    const resume = sample();
    const item = setVisible(resume, { kind: 'item', id: 'i1' }, false, T1);
    expect(item.sections[0]!.items[0]!.visible).toBe(false);
    const bullet = setVisible(resume, { kind: 'bullet', id: 'b1' }, false, T1);
    expect(bullet.sections[0]!.items[0]!.bullets[0]!.visible).toBe(false);
    expect(bullet.meta.revision).toBe(2);
  });

  it('devuelve el mismo objeto si la visibilidad no cambia', () => {
    const resume = sample();
    expect(setVisible(resume, { kind: 'section', id: 's1' }, true, T1)).toBe(resume);
    expect(setVisible(resume, { kind: 'item', id: 'i2' }, true, T1)).toBe(resume);
    expect(setVisible(resume, { kind: 'bullet', id: 'b3' }, true, T1)).toBe(resume);
  });

  it('falla si el id no existe', () => {
    expect(() => setVisible(sample(), { kind: 'bullet', id: 'no' }, false, T1)).toThrow(/viñeta/);
  });
});

describe('metadatos que no son contenido', () => {
  it('renombrar y editar la postulación no cambian updatedAt ni revision', () => {
    const resume = sample();
    const renamed = rename(resume, 'Otro nombre');
    expect(renamed.meta.name).toBe('Otro nombre');
    expect(renamed.meta.updatedAt).toBe(T0);
    expect(renamed.meta.revision).toBe(1);
    expect(rename(renamed, 'Otro nombre')).toBe(renamed);

    const posted = editPosting(resume, {
      company: 'Acme',
      title: 'Dev',
      status: 'applied',
      postingText: 'TypeScript',
      pdfFile: 'acme.pdf',
    });
    expect(posted.posting.company).toBe('Acme');
    expect(posted.meta.updatedAt).toBe(T0);
    expect(posted.meta.revision).toBe(1);
    expect(editPosting(posted, { ...posted.posting })).toBe(posted);
  });
});

describe('añadir y quitar', () => {
  it('añade una sección vacía y no muta el original', () => {
    const resume = sample();
    const next = addSection(resume, 's3', T1);

    expect(next.sections.map((section) => section.id)).toEqual(['s1', 's2', 's3']);
    expect(next.sections[2]).toEqual({ id: 's3', visible: true, title: '', items: [] });
    expect(next.meta.updatedAt).toBe(T1);
    expect(next.meta.revision).toBe(2);
    expect(resume.sections).toHaveLength(2);
    expect(resume.meta.revision).toBe(1);
  });

  it('quita una sección que no está y deja la lista vacía si era la última', () => {
    const resume = sample();
    expect(() => removeSection(resume, 'no', T1)).toThrow(/sección/);

    const only = removeSection(removeSection(resume, 's2', T1), 's1', T1);
    expect(only.sections).toEqual([]);
    expect(only.meta.revision).toBe(3);
  });

  it('añade y quita un ítem y una viñeta', () => {
    const resume = sample();
    const withItem = addItem(resume, 's2', 'i3', T1);
    expect(withItem.sections[1]!.items[1]).toMatchObject({
      id: 'i3',
      visible: true,
      title: '',
      start: '',
      end: null,
      bullets: [],
    });

    const withBullet = addBullet(withItem, 's2', 'i3', 'b4', T1);
    expect(withBullet.sections[1]!.items[1]!.bullets).toEqual([
      { id: 'b4', visible: true, text: '' },
    ]);

    const cleared = removeBullet(withBullet, 's2', 'i3', 'b4', T1);
    expect(cleared.sections[1]!.items[1]!.bullets).toEqual([]);

    const removed = removeItem(cleared, 's2', 'i3', T1);
    expect(removed.sections[1]!.items.map((item) => item.id)).toEqual(['i2']);
    expect(() => removeItem(resume, 's1', 'no', T1)).toThrow(/ítem/);
    expect(() => removeBullet(resume, 's1', 'i1', 'no', T1)).toThrow(/viñeta/);
  });
});
