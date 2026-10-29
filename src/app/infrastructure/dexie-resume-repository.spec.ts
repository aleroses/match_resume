import 'fake-indexeddb/auto';
import Dexie from 'dexie';
import { emptyMaster } from '../domain/resume/resume-rules';
import { DexieResumeRepository, putRawResume } from './dexie-resume-repository';

const T0 = '2026-01-02T03:04:05.000Z';

describe('DexieResumeRepository', () => {
  let repo: DexieResumeRepository;

  beforeEach(() => {
    repo = new DexieResumeRepository();
  });

  afterEach(async () => {
    repo.close();
    await Dexie.delete('match-resume');
  });

  it('guarda y lee un maestro', async () => {
    const master = emptyMaster('m1', T0);
    await repo.save(master);
    expect(await repo.get('m1')).toEqual(master);
    expect(await repo.list()).toEqual({ resumes: [master], unreadableIds: [] });
  });

  it('omite un registro ilegible y no crea otro maestro encima', async () => {
    await putRawResume({ meta: { id: 'bad', kind: 'master', updatedAt: T0 } });

    const listed = await repo.list();
    expect(listed.resumes).toEqual([]);
    expect(listed.unreadableIds).toEqual(['bad']);
    await expect(repo.get('bad')).rejects.toThrow(/leer/);
    await expect(repo.save(emptyMaster('m2', T0))).rejects.toThrow(/maestro/);
  });
});
