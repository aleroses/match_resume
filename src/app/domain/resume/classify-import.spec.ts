import { classifyImport } from './classify-import';
import { Resume } from './resume';
import { emptyMaster } from './resume-rules';

const T0 = '2026-01-02T03:04:05.000Z';
const T1 = '2026-02-03T04:05:06.000Z';

function master(): Resume {
  const resume = emptyMaster('m1', T0);
  resume.basics.name = 'Ana';
  return resume;
}

describe('classifyImport', () => {
  it('añade un id nuevo', () => {
    expect(classifyImport(null, master())).toBe('add');
  });

  it('ignora un documento idéntico', () => {
    const resume = master();
    expect(classifyImport(structuredClone(resume), resume)).toBe('skip');
  });

  it('marca reemplazo si el importado es posterior', () => {
    const local = master();
    const incoming = structuredClone(local);
    incoming.meta.updatedAt = T1;
    incoming.basics.summary = 'Nuevo';
    expect(classifyImport(local, incoming)).toBe('replace-newer');
  });

  it('marca el local como más reciente', () => {
    const local = master();
    local.meta.updatedAt = T1;
    const incoming = master();
    incoming.basics.summary = 'Viejo';
    expect(classifyImport(local, incoming)).toBe('keep-local-newer');
  });

  it('choca si la fecha coincide y el nombre no', () => {
    const local = master();
    const incoming = structuredClone(local);
    incoming.meta.name = 'Otro';
    expect(classifyImport(local, incoming)).toBe('conflict-diverged');
  });

  it('choca si la fecha coincide y la oferta no', () => {
    const local = master();
    const incoming = structuredClone(local);
    incoming.posting.company = 'Acme';
    expect(classifyImport(local, incoming)).toBe('conflict-diverged');
  });

  it('rechaza un segundo maestro aunque sea más reciente', () => {
    const incoming = emptyMaster('m2', T1);
    expect(classifyImport(master(), incoming)).toBe('reject-second-master');
  });

  it('adopta un maestro con otro id si el local está virgen', () => {
    const local = emptyMaster('local', T0);
    local.meta.name = 'Otro nombre';
    expect(classifyImport(local, emptyMaster('backup', T1))).toBe('adopt-master');
  });

  it('rechaza un maestro vacío si la revisión ya subió', () => {
    const local = emptyMaster('local', T0);
    local.meta.revision = 2;
    expect(classifyImport(local, emptyMaster('m2', T1))).toBe('reject-second-master');
  });

  it('compara un maestro cuando el id es el mismo', () => {
    const local = master();
    const incoming = structuredClone(local);
    incoming.meta.updatedAt = T1;
    incoming.basics.summary = 'Nuevo';
    expect(classifyImport(local, incoming)).toBe('replace-newer');
  });
});
