import { CvLocale, CvSection } from './cv-document';

export interface SectionLabels {
  summary: string;
  experience: string;
  education: string;
  skills: string;
  languages: string;
  projects: string;
  present: string;
}

const SPANISH: SectionLabels = {
  summary: 'Resumen',
  experience: 'Experiencia',
  education: 'Educación',
  skills: 'Habilidades',
  languages: 'Idiomas',
  projects: 'Proyectos',
  present: 'Actualidad',
};

const ENGLISH: SectionLabels = {
  summary: 'Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  languages: 'Languages',
  projects: 'Projects',
  present: 'Present',
};

export function sectionLabels(locale: CvLocale): SectionLabels {
  return locale === 'en' ? ENGLISH : SPANISH;
}

export function labelFor(locale: CvLocale, section: CvSection): string {
  return sectionLabels(locale)[section];
}
