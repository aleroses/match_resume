import { Resume } from '../../domain/resume/resume';
import { migrate } from './migrate';
import { parseResume, serializeResume } from './resume-serializer';

const resume: Resume = {
  schemaVersion: 1,
  meta: {
    id: 'm1',
    name: 'CV maestro',
    kind: 'master',
    derivedFrom: null,
    createdAt: '2026-01-02T03:04:05.000Z',
    updatedAt: '2026-01-02T03:04:05.000Z',
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
  ],
};

describe('serializeResume', () => {
  it('vuelve al mismo documento al parsear', () => {
    expect(parseResume(serializeResume(resume))).toEqual(resume);
  });

  it('escribe las claves en el mismo orden aunque el objeto se haya armado al revés', () => {
    const scrambled = {
      sections: resume.sections.map((section) => ({
        items: section.items.map((item) => ({
          bullets: item.bullets.map((bullet) => ({
            text: bullet.text,
            visible: bullet.visible,
            id: bullet.id,
          })),
          end: item.end,
          start: item.start,
          location: item.location,
          organization: item.organization,
          title: item.title,
          visible: item.visible,
          id: item.id,
        })),
        title: section.title,
        visible: section.visible,
        id: section.id,
      })),
      basics: {
        summary: resume.basics.summary,
        location: resume.basics.location,
        url: resume.basics.url,
        phone: resume.basics.phone,
        email: resume.basics.email,
        headline: resume.basics.headline,
        name: resume.basics.name,
      },
      posting: {
        pdfFile: resume.posting.pdfFile,
        postingText: resume.posting.postingText,
        status: resume.posting.status,
        title: resume.posting.title,
        company: resume.posting.company,
      },
      layout: resume.layout,
      language: resume.language,
      meta: {
        revision: resume.meta.revision,
        updatedAt: resume.meta.updatedAt,
        createdAt: resume.meta.createdAt,
        derivedFrom: resume.meta.derivedFrom,
        kind: resume.meta.kind,
        name: resume.meta.name,
        id: resume.meta.id,
      },
      schemaVersion: resume.schemaVersion,
    } as Resume;

    expect(serializeResume(scrambled)).toBe(serializeResume(resume));
    expect(serializeResume(resume).endsWith('\n')).toBe(true);
    expect(serializeResume(resume)).toContain('  "schemaVersion": 1');
  });
});

describe('migrate', () => {
  it('lleva un documento sin schemaVersion a la versión 1', () => {
    const { schemaVersion: _version, ...legacy } = resume;
    expect(parseResume(JSON.stringify(legacy))).toEqual(resume);
    expect(migrate({ schemaVersion: 0, ...legacy })).toMatchObject({ schemaVersion: 1 });
  });

  it('rechaza una versión futura', () => {
    expect(() => migrate({ ...resume, schemaVersion: 2 })).toThrow(/versión 2/);
  });

  it('rechaza un maestro con derivedFrom y una versión sin él', () => {
    expect(() => parseResume(JSON.stringify({ ...resume, meta: { ...resume.meta, derivedFrom: 'otro' } }))).toThrow(
      /forma esperada/,
    );
    const version = {
      ...resume,
      meta: { ...resume.meta, kind: 'version', derivedFrom: null },
    };
    expect(() => parseResume(JSON.stringify(version))).toThrow(/forma esperada/);
  });
});
