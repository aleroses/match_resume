import { CvDocument, filledSections } from './cv-document';
import { labelFor } from './section-labels';

export const ATS_DISCLAIMER =
  'Esta revisión es orientativa y no garantiza que el CV supere un sistema ATS.';

export interface AtsFinding {
  level: 'ok' | 'aviso';
  code: string;
  message: string;
}

export interface AtsReport {
  findings: AtsFinding[];
  termsInPdf: number;
  termsTotal: number;
  disclaimer: string;
}

const STOPWORDS = new Set([
  'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'al', 'y', 'o', 'u', 'en',
  'con', 'por', 'para', 'que', 'se', 'su', 'sus', 'es', 'son', 'como', 'mas', 'entre', 'sobre',
  'sin', 'este', 'esta', 'esto', 'ese', 'esa', 'eso', 'tambien', 'nos', 'le', 'les', 'lo', 'ya',
  'muy', 'hay', 'fue', 'ser', 'estar', 'the', 'and', 'for', 'with', 'that', 'this', 'from', 'your',
  'you', 'are', 'our', 'will', 'not', 'but', 'have', 'has', 'was', 'were', 'been', 'into', 'onto',
  'per', 'via', 'its', 'their', 'they', 'who', 'what', 'when', 'where', 'how', 'why', 'all', 'any',
  'can', 'may', 'than', 'then', 'such', 'other', 'about', 'after', 'before', 'over', 'under',
  'within', 'using', 'use', 'used', 'including', 'include',
]);

export function assessAts(extractedText: string, document: CvDocument): AtsReport {
  const text = extractedText.trim();
  if (!text) {
    return {
      findings: [
        {
          level: 'aviso',
          code: 'text-empty',
          message: 'No se pudo leer texto seleccionable en el PDF. Un ATS necesita texto real, no una imagen.',
        },
      ],
      termsInPdf: 0,
      termsTotal: 0,
      disclaimer: ATS_DISCLAIMER,
    };
  }

  const findings: AtsFinding[] = [
    { level: 'ok', code: 'text-ok', message: 'El PDF contiene texto seleccionable.' },
  ];
  const identity = document.content.identity;
  pushPresence(findings, text, identity.fullName, 'name', 'El nombre aparece en el texto del PDF.', 'El nombre no aparece en el texto del PDF.');
  pushPresence(findings, text, identity.email, 'email', 'El correo aparece en el texto del PDF.', 'El correo no aparece en el texto del PDF.', true);
  pushPresence(findings, text, identity.phone, 'phone', 'El teléfono aparece en el texto del PDF.', 'El teléfono no aparece en el texto del PDF.');

  for (const section of filledSections(document.content)) {
    const heading = labelFor(document.locale, section);
    const present = phraseAppears(text, heading);
    findings.push({
      level: present ? 'ok' : 'aviso',
      code: `heading-${fold(heading)}`,
      message: present
        ? `El encabezado «${heading}» aparece en el texto del PDF.`
        : `El encabezado «${heading}» no aparece en el texto del PDF.`,
    });
  }

  const jobText = document.target?.jobText ?? '';
  if (document.kind === 'master') {
    findings.push({
      level: 'aviso',
      code: 'no-job-text',
      message: 'El CV maestro no tiene una oferta asociada. La comparación de términos no aplica.',
    });
    return { findings, termsInPdf: 0, termsTotal: 0, disclaimer: ATS_DISCLAIMER };
  }
  if (!jobText.trim()) {
    findings.push({
      level: 'aviso',
      code: 'no-job-text',
      message: 'No hay texto de oferta para comparar.',
    });
    return { findings, termsInPdf: 0, termsTotal: 0, disclaimer: ATS_DISCLAIMER };
  }

  const terms = termsFromJob(jobText);
  const termsInPdf = terms.filter((term) => wordAppears(text, term)).length;
  if (terms.length > 0 && termsInPdf === 0) {
    findings.push({
      level: 'aviso',
      code: 'terms-none',
      message: 'Ningún término de la oferta aparece en el texto del PDF.',
    });
  }
  return { findings, termsInPdf, termsTotal: terms.length, disclaimer: ATS_DISCLAIMER };
}

export function termsFromJob(jobText: string): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const token of jobText.split(/[^\p{L}\p{N}+#]+/u)) {
    if (!keepToken(token)) {
      continue;
    }
    const key = fold(token);
    if (STOPWORDS.has(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    terms.push(token);
  }
  return terms;
}

function pushPresence(
  findings: AtsFinding[],
  text: string,
  value: string,
  code: string,
  okMessage: string,
  missingMessage: string,
  exact = false,
): void {
  if (!value.trim()) {
    return;
  }
  const present = exact
    ? text.toLowerCase().includes(value.trim().toLowerCase())
    : phraseAppears(text, value);
  findings.push({
    level: present ? 'ok' : 'aviso',
    code: present ? `${code}-ok` : `${code}-missing`,
    message: present ? okMessage : missingMessage,
  });
}

function keepToken(token: string): boolean {
  if (/[+#]/.test(token)) {
    return token.length >= 2;
  }
  return token.length >= 3;
}

function fold(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

function phraseAppears(text: string, phrase: string): boolean {
  const words = fold(phrase).split(/[^\p{L}\p{N}+#]+/u).filter(Boolean);
  if (words.length === 0) {
    return false;
  }
  const pattern = new RegExp(words.map(escapeRegExp).join('[^\\p{L}\\p{N}+#]+'), 'u');
  return pattern.test(fold(text));
}

function wordAppears(text: string, term: string): boolean {
  const needle = fold(term);
  const pattern = new RegExp(`(?:^|[^\\p{L}\\p{N}+#])${escapeRegExp(needle)}(?:$|[^\\p{L}\\p{N}+#])`, 'u');
  return pattern.test(fold(text));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
