export type CvLocale = 'es' | 'en';
export type CvKind = 'master' | 'derived';
export type CvSection = 'summary' | 'experience' | 'education' | 'skills' | 'languages' | 'projects';

export interface CvLink {
  label: string;
  url: string;
}

export interface CvIdentity {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  links: CvLink[];
}

export interface ExperienceItem {
  id: string;
  organization: string;
  role: string;
  location: string;
  start: string;
  end: string | null;
  bullets: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  start: string;
  end: string | null;
  notes: string;
}

export interface SkillGroup {
  id: string;
  label: string;
  items: string[];
}

export interface LanguageItem {
  id: string;
  name: string;
  level: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  url: string;
  summary: string;
  bullets: string[];
}

export interface CvContent {
  identity: CvIdentity;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillGroup[];
  languages: LanguageItem[];
  projects: ProjectItem[];
}

export interface CvTarget {
  company: string;
  role: string;
  jobText: string;
}

export interface CvDocument {
  id: string;
  kind: CvKind;
  derivedFrom: string | null;
  sourceUpdatedAt: string | null;
  title: string;
  locale: CvLocale;
  target: CvTarget | null;
  content: CvContent;
  createdAt: string;
  updatedAt: string;
}

export function emptyContent(): CvContent {
  return {
    identity: {
      fullName: '',
      headline: '',
      email: '',
      phone: '',
      location: '',
      links: [],
    },
    summary: '',
    experience: [],
    education: [],
    skills: [],
    languages: [],
    projects: [],
  };
}

export function canonicalize(content: CvContent): CvContent {
  return {
    identity: {
      fullName: content.identity.fullName,
      headline: content.identity.headline,
      email: content.identity.email,
      phone: content.identity.phone,
      location: content.identity.location,
      links: content.identity.links.map((link) => ({ label: link.label, url: link.url })),
    },
    summary: content.summary,
    experience: content.experience.map((item) => ({
      id: item.id,
      organization: item.organization,
      role: item.role,
      location: item.location,
      start: item.start,
      end: item.end,
      bullets: [...item.bullets],
    })),
    education: content.education.map((item) => ({
      id: item.id,
      institution: item.institution,
      degree: item.degree,
      start: item.start,
      end: item.end,
      notes: item.notes,
    })),
    skills: content.skills.map((group) => ({
      id: group.id,
      label: group.label,
      items: [...group.items],
    })),
    languages: content.languages.map((item) => ({
      id: item.id,
      name: item.name,
      level: item.level,
    })),
    projects: content.projects.map((item) => ({
      id: item.id,
      name: item.name,
      url: item.url,
      summary: item.summary,
      bullets: [...item.bullets],
    })),
  };
}

export function contentEquals(left: CvContent, right: CvContent): boolean {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

export function createMaster(id: string, now: string): CvDocument {
  return {
    id,
    kind: 'master',
    derivedFrom: null,
    sourceUpdatedAt: null,
    title: 'CV maestro',
    locale: 'es',
    target: null,
    content: emptyContent(),
    createdAt: now,
    updatedAt: now,
  };
}

export function touchContent(
  document: CvDocument,
  content: CvContent,
  locale: CvLocale,
  now: string,
): CvDocument {
  const nextContent = canonicalize(content);
  if (document.locale === locale && contentEquals(document.content, nextContent)) {
    return document;
  }
  return { ...document, content: nextContent, locale, updatedAt: now };
}

export function renameDocument(document: CvDocument, title: string): CvDocument {
  const nextTitle = title.trim();
  if (!nextTitle || nextTitle === document.title) {
    return document;
  }
  return { ...document, title: nextTitle };
}

export function withTarget(document: CvDocument, target: CvTarget): CvDocument {
  if (document.kind !== 'derived') {
    throw new Error('Solo una versión derivada tiene oferta.');
  }
  const nextTarget = { company: target.company, role: target.role, jobText: target.jobText };
  if (
    document.target?.company === nextTarget.company &&
    document.target.role === nextTarget.role &&
    document.target.jobText === nextTarget.jobText
  ) {
    return document;
  }
  return { ...document, target: nextTarget };
}

export function deriveSnapshot(
  master: CvDocument,
  id: string,
  title: string,
  now: string,
): CvDocument {
  if (master.kind !== 'master') {
    throw new Error('Solo se puede derivar el CV maestro.');
  }
  return {
    id,
    kind: 'derived',
    derivedFrom: master.id,
    sourceUpdatedAt: master.updatedAt,
    title: title.trim() || 'Versión',
    locale: master.locale,
    target: { company: '', role: '', jobText: '' },
    content: canonicalize(structuredClone(master.content)),
    createdAt: now,
    updatedAt: now,
  };
}

export function sortDocuments(documents: CvDocument[]): CvDocument[] {
  return [...documents].sort((left, right) => {
    if (left.kind !== right.kind) {
      return left.kind === 'master' ? -1 : 1;
    }
    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function isStaleDerived(document: CvDocument, master: CvDocument | undefined): boolean {
  if (document.kind !== 'derived' || !master || master.kind !== 'master' || !document.sourceUpdatedAt) {
    return false;
  }
  return master.updatedAt > document.sourceUpdatedAt;
}

export function downloadName(title: string, extension: string): string {
  const base = title
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return `${base || 'cv'}.${extension}`;
}

function hasText(values: string[]): boolean {
  return values.some((value) => value.trim().length > 0);
}

export function filledSections(content: CvContent): CvSection[] {
  const sections: CvSection[] = [];
  if (content.summary.trim()) {
    sections.push('summary');
  }
  if (
    content.experience.some((item) =>
      hasText([item.organization, item.role, item.location, item.start, item.end ?? '', ...item.bullets]),
    )
  ) {
    sections.push('experience');
  }
  if (
    content.education.some((item) =>
      hasText([item.institution, item.degree, item.start, item.end ?? '', item.notes]),
    )
  ) {
    sections.push('education');
  }
  if (content.skills.some((group) => hasText([group.label, ...group.items]))) {
    sections.push('skills');
  }
  if (content.languages.some((item) => hasText([item.name, item.level]))) {
    sections.push('languages');
  }
  if (content.projects.some((item) => hasText([item.name, item.url, item.summary, ...item.bullets]))) {
    sections.push('projects');
  }
  return sections;
}
