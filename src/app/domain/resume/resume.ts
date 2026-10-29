export type Language = 'es' | 'en';

export type PostingStatus = 'draft' | 'applied' | 'closed';

export interface ResumeMeta {
  id: string;
  name: string;
  kind: 'master' | 'version';
  derivedFrom: string | null;
  createdAt: string;
  updatedAt: string;
  revision: number;
}

export interface Posting {
  company: string;
  title: string;
  status: PostingStatus;
  postingText: string;
  pdfFile: string | null;
}

export interface Basics {
  name: string;
  headline: string;
  email: string;
  phone: string;
  url: string;
  location: string;
  summary: string;
}

export interface Bullet {
  id: string;
  visible: boolean;
  text: string;
}

export interface Item {
  id: string;
  visible: boolean;
  title: string;
  organization: string;
  location: string;
  start: string;
  end: string | null;
  bullets: Bullet[];
}

export interface Section {
  id: string;
  visible: boolean;
  title: string;
  items: Item[];
}

export interface Resume {
  schemaVersion: 1;
  meta: ResumeMeta;
  language: Language;
  layout: 'one-column';
  posting: Posting;
  basics: Basics;
  sections: Section[];
}

export type VisibilityTarget =
  | { kind: 'section'; id: string }
  | { kind: 'item'; id: string }
  | { kind: 'bullet'; id: string };
