import { emptyMaster, deriveVersion, withStoredTimestamps } from '../../domain/resume/resume-rules';
import { draftToResume, hasUnsaved, resumeToDraft } from './resume-form';

const T0 = '2026-01-02T03:04:05.000Z';
const T1 = '2026-02-03T04:05:06.000Z';

describe('resume-form', () => {
  it('reconstruye una versión con fin abierto y viñeta', () => {
    const master = emptyMaster('m1', T0);
    master.basics = { ...master.basics, name: 'Ana Núñez', email: 'ana@example.com' };
    master.sections = [
      {
        id: 's1',
        visible: true,
        title: 'Experiencia',
        items: [
          {
            id: 'i1',
            visible: false,
            title: 'Dev',
            organization: 'Acme',
            location: 'Madrid',
            start: '2020-01',
            end: null,
            bullets: [{ id: 'b1', visible: true, text: 'Entregué el sistema.' }],
          },
        ],
      },
    ];
    const version = deriveVersion(master, 'v1', T0);
    version.posting = {
      company: 'Acme',
      title: 'Dev',
      status: 'applied',
      postingText: 'Texto',
      pdfFile: null,
    };

    const draft = resumeToDraft(version);
    expect(draft.sections[0]!.items[0]!.current).toBe(true);
    expect(draft.sections[0]!.items[0]!.end).toBe('');
    expect(draftToResume(draft, version)).toEqual(version);
  });

  it('en el maestro deja la oferta guardada', () => {
    const master = emptyMaster('m1', T0);
    const draft = resumeToDraft(master);
    draft.posting.company = 'Acme';
    draft.name = 'Otro';

    const next = draftToResume(draft, master);
    expect(next.posting).toEqual(master.posting);
    expect(next.meta.name).toBe('Otro');
    expect(hasUnsaved(master, next)).toBe(true);
    expect(withStoredTimestamps(master, next, T1).meta.updatedAt).toBe(T0);
  });

  it('marcar un texto y deshacerlo', () => {
    const master = emptyMaster('m1', T0);
    const draft = resumeToDraft(master);
    const changed = draftToResume(
      { ...draft, basics: { ...draft.basics, summary: 'Hola' } },
      master,
    );

    expect(hasUnsaved(master, changed)).toBe(true);
    expect(withStoredTimestamps(master, changed, T1).meta.updatedAt).toBe(T1);
    expect(hasUnsaved(master, draftToResume(draft, master))).toBe(false);
  });
});
