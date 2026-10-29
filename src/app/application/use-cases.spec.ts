import { Clock } from './clock';
import { IdGenerator } from './id-generator';
import { InMemoryResumeRepository } from './testing/in-memory-resume-repository';
import { DeleteVersion, DeriveVersion, ListResumes, OpenOrCreateMaster, SaveResume } from './use-cases';

const T0 = '2026-01-02T03:04:05.000Z';
const T1 = '2026-02-03T04:05:06.000Z';
const T2 = '2026-03-04T05:06:07.000Z';

class FixedClock extends Clock {
  constructor(private time: string) {
    super();
  }

  override now(): string {
    return this.time;
  }

  advance(time: string): void {
    this.time = time;
  }
}

class SequenceIds extends IdGenerator {
  private nextId = 1;

  override next(): string {
    const id = `id-${this.nextId}`;
    this.nextId += 1;
    return id;
  }
}

function setup(time = T0) {
  const resumes = new InMemoryResumeRepository();
  const clock = new FixedClock(time);
  const ids = new SequenceIds();
  return {
    resumes,
    clock,
    open: new OpenOrCreateMaster(resumes, ids, clock),
    list: new ListResumes(resumes),
    derive: new DeriveVersion(resumes, ids, clock),
    save: new SaveResume(resumes, clock),
    remove: new DeleteVersion(resumes),
  };
}

describe('documentos', () => {
  it('crea un solo maestro vacío y lo reutiliza', async () => {
    const { open, list, save } = setup();
    const first = await open.execute();
    const second = await open.execute();

    expect(second).toEqual(first);
    expect(first.meta.kind).toBe('master');
    expect(first.language).toBe('es');
    expect(first.basics.name).toBe('');
    expect(first.sections).toEqual([]);
    expect((await list.execute()).resumes).toHaveLength(1);

    await expect(save.execute({ ...first, meta: { ...first.meta, id: 'otro' } })).rejects.toThrow(/maestro/);
  });

  it('derivar conserva los ids de elementos y no toca el maestro', async () => {
    const { open, derive, resumes, clock } = setup();
    const master = await open.execute();
    master.sections = [
      {
        id: 's1',
        visible: true,
        title: 'Experiencia',
        items: [
          {
            id: 'i1',
            visible: true,
            title: 'Dev',
            organization: 'Acme',
            location: '',
            start: '2020-01',
            end: null,
            bullets: [{ id: 'b1', visible: true, text: 'Entregué el sistema.' }],
          },
        ],
      },
    ];
    await resumes.save(master);
    clock.advance(T1);

    const version = await derive.execute(master.meta.id);
    const storedMaster = await resumes.get(master.meta.id);

    expect(version.meta.kind).toBe('version');
    expect(version.meta.derivedFrom).toBe(master.meta.id);
    expect(version.meta.id).not.toBe(master.meta.id);
    expect(version.sections[0]!.id).toBe('s1');
    expect(version.sections[0]!.items[0]!.bullets[0]!.id).toBe('b1');
    expect(storedMaster).toEqual(master);
  });

  it('borrar el maestro falla y la versión sí se borra', async () => {
    const { open, derive, remove, list, clock } = setup();
    const master = await open.execute();
    clock.advance(T1);
    const version = await derive.execute(master.meta.id);

    await expect(remove.execute(master.meta.id)).rejects.toThrow(/maestro/);
    expect((await list.execute()).resumes.map((resume) => resume.meta.id)).toContain(master.meta.id);

    await remove.execute(version.meta.id);
    expect((await list.execute()).resumes.map((resume) => resume.meta.id)).toEqual([master.meta.id]);
    await expect(remove.execute(version.meta.id)).rejects.toThrow(/No está/);
  });

  it('lista por updatedAt descendente y desempata por id', async () => {
    const { open, resumes, list } = setup();
    const master = await open.execute();
    const older = {
      ...structuredClone(master),
      meta: {
        ...master.meta,
        id: 'b',
        kind: 'version' as const,
        derivedFrom: master.meta.id,
        updatedAt: T0,
      },
    };
    const newer = {
      ...structuredClone(master),
      meta: {
        ...master.meta,
        id: 'a',
        kind: 'version' as const,
        derivedFrom: master.meta.id,
        updatedAt: T1,
      },
    };
    const tied = {
      ...structuredClone(master),
      meta: {
        ...master.meta,
        id: 'c',
        kind: 'version' as const,
        derivedFrom: master.meta.id,
        updatedAt: T1,
      },
    };
    await resumes.save(older);
    await resumes.save(newer);
    await resumes.save(tied);

    expect((await list.execute()).resumes.map((resume) => resume.meta.id)).toEqual(['a', 'c', 'b', master.meta.id]);
  });

  it('guardar sin cambio de contenido no mueve updatedAt', async () => {
    const { open, save, clock, resumes } = setup();
    const master = await open.execute();
    clock.advance(T2);

    const renamed = await save.execute({ ...master, meta: { ...master.meta, name: 'Otro nombre' } });
    expect(renamed.meta.name).toBe('Otro nombre');
    expect(renamed.meta.updatedAt).toBe(T0);
    expect(renamed.meta.revision).toBe(1);

    const posted = await save.execute({
      ...renamed,
      posting: { company: 'Acme', title: 'Dev', status: 'applied', postingText: 'Texto', pdfFile: 'acme.pdf' },
    });
    expect(posted.meta.updatedAt).toBe(T0);
    expect(posted.meta.revision).toBe(1);

    const edited = await save.execute({
      ...posted,
      basics: { ...posted.basics, summary: 'Resumen nuevo' },
      meta: { ...posted.meta, updatedAt: T1, revision: 9 },
    });
    expect(edited.basics.summary).toBe('Resumen nuevo');
    expect(edited.meta.updatedAt).toBe(T2);
    expect(edited.meta.revision).toBe(2);
    expect(edited.meta.createdAt).toBe(T0);
    expect((await resumes.get(master.meta.id))?.meta.updatedAt).toBe(T2);
  });
});
