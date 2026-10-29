import { Posting, Resume, VisibilityTarget } from './resume';

export function deriveVersion(resume: Resume, metaId: string, at: string): Resume {
  const copy = structuredClone(resume);
  copy.meta.id = metaId;
  copy.meta.kind = 'version';
  copy.meta.derivedFrom = resume.meta.id;
  copy.meta.createdAt = at;
  copy.meta.updatedAt = at;
  copy.meta.revision = 1;
  return copy;
}

export function rename(resume: Resume, name: string): Resume {
  if (resume.meta.name === name) {
    return resume;
  }
  return { ...resume, meta: { ...resume.meta, name } };
}

export function editPosting(resume: Resume, posting: Posting): Resume {
  if (samePosting(resume.posting, posting)) {
    return resume;
  }
  return { ...resume, posting: { ...posting } };
}

export function reorderSections(resume: Resume, orderedIds: string[], at: string): Resume {
  const current = resume.sections.map((section) => section.id);
  assertPermutation(current, orderedIds);
  if (sameSequence(current, orderedIds)) {
    return resume;
  }
  const byId = new Map(resume.sections.map((section) => [section.id, section]));
  const sections = orderedIds.map((id) => byId.get(id)!);
  return withContent(resume, sections, at);
}

export function reorderItems(resume: Resume, sectionId: string, orderedIds: string[], at: string): Resume {
  const index = resume.sections.findIndex((section) => section.id === sectionId);
  if (index < 0) {
    throw new Error('No está esa sección.');
  }
  const section = resume.sections[index]!;
  const current = section.items.map((item) => item.id);
  assertPermutation(current, orderedIds);
  if (sameSequence(current, orderedIds)) {
    return resume;
  }
  const byId = new Map(section.items.map((item) => [item.id, item]));
  const items = orderedIds.map((id) => byId.get(id)!);
  const sections = resume.sections.slice();
  sections[index] = { ...section, items };
  return withContent(resume, sections, at);
}

export function reorderBullets(
  resume: Resume,
  sectionId: string,
  itemId: string,
  orderedIds: string[],
  at: string,
): Resume {
  const sectionIndex = resume.sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) {
    throw new Error('No está esa sección.');
  }
  const section = resume.sections[sectionIndex]!;
  const itemIndex = section.items.findIndex((item) => item.id === itemId);
  if (itemIndex < 0) {
    throw new Error('No está ese ítem.');
  }
  const item = section.items[itemIndex]!;
  const current = item.bullets.map((bullet) => bullet.id);
  assertPermutation(current, orderedIds);
  if (sameSequence(current, orderedIds)) {
    return resume;
  }
  const byId = new Map(item.bullets.map((bullet) => [bullet.id, bullet]));
  const bullets = orderedIds.map((id) => byId.get(id)!);
  const items = section.items.slice();
  items[itemIndex] = { ...item, bullets };
  const sections = resume.sections.slice();
  sections[sectionIndex] = { ...section, items };
  return withContent(resume, sections, at);
}

export function setVisible(resume: Resume, target: VisibilityTarget, visible: boolean, at: string): Resume {
  if (target.kind === 'section') {
    const index = resume.sections.findIndex((section) => section.id === target.id);
    if (index < 0) {
      throw new Error('No está esa sección.');
    }
    const section = resume.sections[index]!;
    if (section.visible === visible) {
      return resume;
    }
    const sections = resume.sections.slice();
    sections[index] = { ...section, visible };
    return withContent(resume, sections, at);
  }

  if (target.kind === 'item') {
    for (let index = 0; index < resume.sections.length; index++) {
      const section = resume.sections[index]!;
      const itemIndex = section.items.findIndex((item) => item.id === target.id);
      if (itemIndex < 0) {
        continue;
      }
      const item = section.items[itemIndex]!;
      if (item.visible === visible) {
        return resume;
      }
      const items = section.items.slice();
      items[itemIndex] = { ...item, visible };
      const sections = resume.sections.slice();
      sections[index] = { ...section, items };
      return withContent(resume, sections, at);
    }
    throw new Error('No está ese ítem.');
  }

  for (let index = 0; index < resume.sections.length; index++) {
    const section = resume.sections[index]!;
    for (let itemIndex = 0; itemIndex < section.items.length; itemIndex++) {
      const item = section.items[itemIndex]!;
      const bulletIndex = item.bullets.findIndex((bullet) => bullet.id === target.id);
      if (bulletIndex < 0) {
        continue;
      }
      const bullet = item.bullets[bulletIndex]!;
      if (bullet.visible === visible) {
        return resume;
      }
      const bullets = item.bullets.slice();
      bullets[bulletIndex] = { ...bullet, visible };
      const items = section.items.slice();
      items[itemIndex] = { ...item, bullets };
      const sections = resume.sections.slice();
      sections[index] = { ...section, items };
      return withContent(resume, sections, at);
    }
  }
  throw new Error('No está esa viñeta.');
}

function withContent(resume: Resume, sections: Resume['sections'], at: string): Resume {
  return {
    ...resume,
    sections,
    meta: { ...resume.meta, updatedAt: at, revision: resume.meta.revision + 1 },
  };
}

function assertPermutation(current: string[], ordered: string[]): void {
  if (current.length !== ordered.length || new Set(ordered).size !== ordered.length) {
    throw new Error('La lista de ids no coincide con los elementos.');
  }
  const present = new Set(current);
  if (ordered.some((id) => !present.has(id))) {
    throw new Error('La lista de ids no coincide con los elementos.');
  }
}

function sameSequence(left: string[], right: string[]): boolean {
  return left.every((id, index) => id === right[index]);
}

function samePosting(left: Posting, right: Posting): boolean {
  return (
    left.company === right.company &&
    left.title === right.title &&
    left.status === right.status &&
    left.postingText === right.postingText &&
    left.pdfFile === right.pdfFile
  );
}
