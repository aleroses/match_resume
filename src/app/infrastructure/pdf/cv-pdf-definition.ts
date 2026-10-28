import { CvDocument, CvSection, filledSections } from '../../domain/cv-document';
import { labelFor, sectionLabels } from '../../domain/section-labels';

export interface PdfBlock {
  text?: string;
  style?: string;
  margin?: [number, number, number, number];
  ul?: string[];
  link?: string;
}

export interface PdfDefinition {
  pageSize: 'A4';
  pageMargins: [number, number, number, number];
  defaultStyle: { font: string; fontSize: number };
  styles: {
    name: { fontSize: number; bold: boolean };
    heading: { fontSize: number; bold: boolean; margin: [number, number, number, number] };
  };
  info: { title: string; author: string };
  content: PdfBlock[];
}

export function buildCvDefinition(document: CvDocument): PdfDefinition {
  const labels = sectionLabels(document.locale);
  const content = document.content;
  const blocks: PdfBlock[] = [];
  const name = content.identity.fullName.trim() || document.title;
  blocks.push({ text: name, style: 'name' });
  if (content.identity.headline.trim()) {
    blocks.push({ text: content.identity.headline.trim(), margin: [0, 2, 0, 0] });
  }
  const contact = [content.identity.email, content.identity.phone, content.identity.location]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' · ');
  if (contact) {
    blocks.push({ text: contact, margin: [0, 4, 0, 2] });
  }
  for (const link of content.identity.links) {
    const url = link.url.trim();
    const label = link.label.trim();
    if (!url && !label) {
      continue;
    }
    blocks.push({ text: url || label, link: url || undefined, margin: [0, 0, 0, 2] });
  }

  for (const section of filledSections(content)) {
    blocks.push({ text: labelFor(document.locale, section), style: 'heading' });
    appendSection(blocks, document, section, labels.present);
  }

  return {
    pageSize: 'A4',
    pageMargins: [48, 48, 48, 48],
    defaultStyle: { font: 'SourceSans3', fontSize: 11 },
    styles: {
      name: { fontSize: 18, bold: true },
      heading: { fontSize: 13, bold: true, margin: [0, 10, 0, 4] },
    },
    info: { title: document.title, author: name },
    content: blocks,
  };
}

function appendSection(
  blocks: PdfBlock[],
  document: CvDocument,
  section: CvSection,
  present: string,
): void {
  const content = document.content;
  if (section === 'summary') {
    blocks.push({ text: content.summary.trim(), margin: [0, 0, 0, 6] });
    return;
  }
  if (section === 'experience') {
    for (const item of content.experience) {
      pushEntry(blocks, item.role, item.organization, item.location, item.start, item.end, present, item.bullets);
    }
    return;
  }
  if (section === 'education') {
    for (const item of content.education) {
      pushEntry(blocks, item.degree, item.institution, '', item.start, item.end, present, []);
      if (item.notes.trim()) {
        blocks.push({ text: item.notes.trim(), margin: [0, 0, 0, 6] });
      }
    }
    return;
  }
  if (section === 'skills') {
    for (const group of content.skills) {
      const items = group.items.map((item) => item.trim()).filter(Boolean);
      const line = [group.label.trim(), items.join(', ')].filter(Boolean).join(': ');
      if (line) {
        blocks.push({ text: line, margin: [0, 0, 0, 2] });
      }
    }
    return;
  }
  if (section === 'languages') {
    for (const item of content.languages) {
      const line = [item.name.trim(), item.level.trim()].filter(Boolean).join(' — ');
      if (line) {
        blocks.push({ text: line, margin: [0, 0, 0, 2] });
      }
    }
    return;
  }
  for (const item of content.projects) {
    const title = [item.name.trim(), item.url.trim()].filter(Boolean).join(' — ');
    if (title) {
      blocks.push({ text: title, link: item.url.trim() || undefined, margin: [0, 4, 0, 0] });
    }
    if (item.summary.trim()) {
      blocks.push({ text: item.summary.trim() });
    }
    pushBullets(blocks, item.bullets);
  }
}

function pushEntry(
  blocks: PdfBlock[],
  primary: string,
  secondary: string,
  location: string,
  start: string,
  end: string | null,
  present: string,
  bullets: string[],
): void {
  const title = [primary.trim(), secondary.trim()].filter(Boolean).join(' — ');
  if (title) {
    blocks.push({ text: title, margin: [0, 4, 0, 0] });
  }
  const period = [start.trim(), end === null ? present : end.trim()].filter(Boolean).join(' – ');
  const meta = [period, location.trim()].filter(Boolean).join(' · ');
  if (meta) {
    blocks.push({ text: meta });
  }
  pushBullets(blocks, bullets);
}

function pushBullets(blocks: PdfBlock[], bullets: string[]): void {
  const lines = bullets.map((bullet) => bullet.trim()).filter(Boolean);
  if (lines.length > 0) {
    blocks.push({ ul: lines, margin: [0, 2, 0, 4] });
  }
}
