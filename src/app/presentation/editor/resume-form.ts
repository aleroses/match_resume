import { withStoredTimestamps } from '../../domain/resume/resume-rules';
import {
  Basics,
  Language,
  Posting,
  PostingStatus,
  Resume,
  Section,
} from '../../domain/resume/resume';

export interface BulletDraft {
  id: string;
  visible: boolean;
  text: string;
}

export interface ItemDraft {
  id: string;
  visible: boolean;
  title: string;
  organization: string;
  location: string;
  start: string;
  end: string;
  current: boolean;
  bullets: BulletDraft[];
}

export interface SectionDraft {
  id: string;
  visible: boolean;
  title: string;
  items: ItemDraft[];
}

export interface ResumeDraft {
  name: string;
  language: Language;
  posting: {
    company: string;
    title: string;
    status: PostingStatus;
    postingText: string;
    pdfFile: string;
  };
  basics: Basics;
  sections: SectionDraft[];
}

export function resumeToDraft(resume: Resume): ResumeDraft {
  return {
    name: resume.meta.name,
    language: resume.language,
    posting: {
      company: resume.posting.company,
      title: resume.posting.title,
      status: resume.posting.status,
      postingText: resume.posting.postingText,
      pdfFile: resume.posting.pdfFile ?? '',
    },
    basics: { ...resume.basics },
    sections: resume.sections.map((section) => ({
      id: section.id,
      visible: section.visible,
      title: section.title,
      items: section.items.map((item) => ({
        id: item.id,
        visible: item.visible,
        title: item.title,
        organization: item.organization,
        location: item.location,
        start: item.start,
        end: item.end ?? '',
        current: item.end === null,
        bullets: item.bullets.map((bullet) => ({ ...bullet })),
      })),
    })),
  };
}

export function draftToResume(draft: ResumeDraft, stored: Resume): Resume {
  const posting: Posting =
    stored.meta.kind === 'version'
      ? {
          company: draft.posting.company,
          title: draft.posting.title,
          status: draft.posting.status,
          postingText: draft.posting.postingText,
          pdfFile: draft.posting.pdfFile === '' ? null : draft.posting.pdfFile,
        }
      : stored.posting;
  return {
    schemaVersion: stored.schemaVersion,
    meta: { ...stored.meta, name: draft.name },
    language: draft.language,
    layout: stored.layout,
    posting,
    basics: { ...draft.basics },
    sections: draft.sections.map(sectionFromDraft),
  };
}

export function hasUnsaved(saved: Resume, incoming: Resume): boolean {
  const next = withStoredTimestamps(saved, incoming, saved.meta.updatedAt);
  return !sameValue(next, saved);
}

function sectionFromDraft(section: SectionDraft): Section {
  return {
    id: section.id,
    visible: section.visible,
    title: section.title,
    items: section.items.map((item) => ({
      id: item.id,
      visible: item.visible,
      title: item.title,
      organization: item.organization,
      location: item.location,
      start: item.start,
      end: item.current || item.end === '' ? null : item.end,
      bullets: item.bullets.map((bullet) => ({ ...bullet })),
    })),
  };
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
