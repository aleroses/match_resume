import { Resume } from './resume';
import { isVirginMaster } from './resume-rules';

export type ImportClass =
  | 'add'
  | 'skip'
  | 'replace-newer'
  | 'keep-local-newer'
  | 'reject-second-master'
  | 'adopt-master'
  | 'conflict-diverged';

export function classifyImport(local: Resume | null, incoming: Resume): ImportClass {
  if (
    local &&
    local.meta.kind === 'master' &&
    incoming.meta.kind === 'master' &&
    local.meta.id !== incoming.meta.id
  ) {
    return isVirginMaster(local) ? 'adopt-master' : 'reject-second-master';
  }
  if (!local) {
    return 'add';
  }
  if (sameResume(local, incoming)) {
    return 'skip';
  }
  if (incoming.meta.updatedAt > local.meta.updatedAt) {
    return 'replace-newer';
  }
  if (incoming.meta.updatedAt < local.meta.updatedAt) {
    return 'keep-local-newer';
  }
  return 'conflict-diverged';
}

function sameResume(left: Resume, right: Resume): boolean {
  return sameValue(left, right);
}

function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left !== 'object' || typeof right !== 'object' || left === null || right === null) {
    return false;
  }
  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) {
      return false;
    }
    return left.every((item, index) => sameValue(item, right[index]));
  }
  const leftEntries = Object.entries(left);
  const rightRecord = right as Record<string, unknown>;
  if (leftEntries.length !== Object.keys(rightRecord).length) {
    return false;
  }
  return leftEntries.every(([key, value]) => sameValue(value, rightRecord[key]));
}
