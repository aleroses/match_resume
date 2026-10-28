import { Injectable, inject, signal } from '@angular/core';
import {
  AuditCv,
  DeleteDerivedCv,
  DeriveCv,
  DownloadBackup,
  DownloadPdf,
  ExportBackup,
  GetCv,
  ImportBackup,
  LoadLibrary,
  RenameCv,
  SaveCvContent,
  UpdateTarget,
} from '../application/use-cases';
import {
  BackupCodec,
  Clock,
  CvRepository,
  FileSaver,
  IdGenerator,
  PdfExporter,
  PdfTextExtractor,
} from '../application/ports';
import { AtsReport } from '../domain/assess-ats';
import {
  CvDocument,
  EducationItem,
  ExperienceItem,
  LanguageItem,
  ProjectItem,
  SkillGroup,
  contentEquals,
  isStaleDerived,
} from '../domain/cv-document';

@Injectable({ providedIn: 'root' })
export class CvStore {
  private readonly cvs = inject(CvRepository);
  private readonly clock = inject(Clock);
  private readonly ids = inject(IdGenerator);
  private readonly loadLibrary = new LoadLibrary(this.cvs, this.clock, this.ids);
  private readonly getCv = new GetCv(this.cvs);
  private readonly saveContent = new SaveCvContent(this.cvs, this.clock);
  private readonly renameCv = new RenameCv(this.cvs);
  private readonly updateTarget = new UpdateTarget(this.cvs);
  private readonly deriveCv = new DeriveCv(this.cvs, this.clock, this.ids);
  private readonly deleteDerived = new DeleteDerivedCv(this.cvs);
  private readonly importBackupCase = new ImportBackup(this.cvs, inject(BackupCodec));
  private readonly downloadBackupCase = new DownloadBackup(
    new ExportBackup(this.cvs, inject(BackupCodec), this.clock),
    inject(FileSaver),
  );
  private readonly downloadPdfCase = new DownloadPdf(this.cvs, inject(PdfExporter), inject(FileSaver));
  private readonly auditCv = new AuditCv(this.cvs, inject(PdfExporter), inject(PdfTextExtractor));
  private queue: Promise<void> = Promise.resolve();

  readonly documents = signal<CvDocument[]>([]);
  readonly draft = signal<CvDocument | null>(null);
  readonly saved = signal<CvDocument | null>(null);
  readonly report = signal<AtsReport | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);

  load(): Promise<void> {
    return this.run(() => this.refreshList());
  }

  open(id: string): Promise<void> {
    return this.run(async () => {
      await this.refreshList();
      const document = await this.getCv.execute(id);
      this.saved.set(structuredClone(document));
      this.draft.set(structuredClone(document));
      this.report.set(null);
    });
  }

  isDirty(): boolean {
    const draft = this.draft();
    const saved = this.saved();
    if (!draft || !saved) {
      return false;
    }
    return (
      draft.title !== saved.title ||
      draft.locale !== saved.locale ||
      !contentEquals(draft.content, saved.content) ||
      JSON.stringify(draft.target) !== JSON.stringify(saved.target)
    );
  }

  isStale(document: CvDocument): boolean {
    return isStaleDerived(
      document,
      this.documents().find((item) => item.kind === 'master'),
    );
  }

  save(): Promise<void> {
    const snapshot = this.draft();
    if (!snapshot) {
      return Promise.resolve();
    }
    const copy = structuredClone(snapshot);
    return this.run(async () => {
      await this.renameCv.execute(copy.id, copy.title);
      if (copy.kind === 'derived' && copy.target) {
        await this.updateTarget.execute(copy.id, copy.target);
      }
      await this.saveContent.execute(copy.id, copy.content, copy.locale);
      const document = await this.getCv.execute(copy.id);
      this.saved.set(structuredClone(document));
      this.draft.set(structuredClone(document));
      await this.refreshList();
    });
  }

  downloadBackup(): Promise<void> {
    return this.run(() => this.downloadBackupCase.execute());
  }

  importBackup(raw: string): Promise<void> {
    return this.run(async () => {
      await this.importBackupCase.execute(raw);
      await this.refreshList();
    });
  }

  async downloadPdf(): Promise<void> {
    await this.save();
    const id = this.saved()?.id;
    if (!id || this.error()) {
      return;
    }
    await this.run(() => this.downloadPdfCase.execute(id));
  }

  async audit(): Promise<void> {
    await this.save();
    const id = this.saved()?.id;
    if (!id || this.error()) {
      return;
    }
    await this.run(async () => {
      this.report.set(await this.auditCv.execute(id));
    });
  }

  derive(title: string): Promise<string | null> {
    let createdId: string | null = null;
    return this.run(async () => {
      createdId = (await this.deriveCv.execute(title)).id;
      await this.refreshList();
    }).then(() => (this.error() ? null : createdId));
  }

  async deleteCurrent(): Promise<boolean> {
    const id = this.draft()?.id;
    if (!id) {
      return false;
    }
    await this.run(async () => {
      await this.deleteDerived.execute(id);
      this.draft.set(null);
      this.saved.set(null);
      await this.refreshList();
    });
    return this.error() === null;
  }

  setLocale(value: string): void {
    if (value !== 'es' && value !== 'en') {
      return;
    }
    this.updateDraft((document) => {
      document.locale = value;
    });
  }

  addLink(): void {
    this.updateDraft((document) => {
      document.content.identity.links = [...document.content.identity.links, { label: '', url: '' }];
    });
  }

  removeLink(index: number): void {
    this.updateDraft((document) => {
      document.content.identity.links = document.content.identity.links.filter((_, itemIndex) => itemIndex !== index);
    });
  }

  addExperience(): void {
    this.updateDraft((document) => {
      const item: ExperienceItem = {
        id: this.ids.next(),
        organization: '',
        role: '',
        location: '',
        start: '',
        end: '',
        bullets: [],
      };
      document.content.experience = [...document.content.experience, item];
    });
  }

  removeExperience(id: string): void {
    this.updateDraft((document) => {
      document.content.experience = document.content.experience.filter((item) => item.id !== id);
    });
  }

  addEducation(): void {
    this.updateDraft((document) => {
      const item: EducationItem = {
        id: this.ids.next(),
        institution: '',
        degree: '',
        start: '',
        end: '',
        notes: '',
      };
      document.content.education = [...document.content.education, item];
    });
  }

  removeEducation(id: string): void {
    this.updateDraft((document) => {
      document.content.education = document.content.education.filter((item) => item.id !== id);
    });
  }

  addSkillGroup(): void {
    this.updateDraft((document) => {
      const group: SkillGroup = { id: this.ids.next(), label: '', items: [] };
      document.content.skills = [...document.content.skills, group];
    });
  }

  removeSkillGroup(id: string): void {
    this.updateDraft((document) => {
      document.content.skills = document.content.skills.filter((group) => group.id !== id);
    });
  }

  addLanguage(): void {
    this.updateDraft((document) => {
      const item: LanguageItem = { id: this.ids.next(), name: '', level: '' };
      document.content.languages = [...document.content.languages, item];
    });
  }

  removeLanguage(id: string): void {
    this.updateDraft((document) => {
      document.content.languages = document.content.languages.filter((item) => item.id !== id);
    });
  }

  addProject(): void {
    this.updateDraft((document) => {
      const item: ProjectItem = { id: this.ids.next(), name: '', url: '', summary: '', bullets: [] };
      document.content.projects = [...document.content.projects, item];
    });
  }

  removeProject(id: string): void {
    this.updateDraft((document) => {
      document.content.projects = document.content.projects.filter((item) => item.id !== id);
    });
  }

  private updateDraft(change: (document: CvDocument) => void): void {
    const document = this.draft();
    if (!document) {
      return;
    }
    change(document);
    this.draft.set({ ...document, content: { ...document.content } });
  }

  private async refreshList(): Promise<void> {
    this.documents.set(await this.loadLibrary.execute());
  }

  private run(action: () => Promise<void>): Promise<void> {
    const job = this.queue.then(async () => {
      this.busy.set(true);
      this.error.set(null);
      try {
        await action();
      } catch (error) {
        this.error.set(error instanceof Error ? error.message : 'No se pudo completar la acción.');
      } finally {
        this.busy.set(false);
      }
    });
    this.queue = job.then(
      () => undefined,
      () => undefined,
    );
    return job;
  }
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat('es', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function lines(value: string): string[] {
  return value.split('\n');
}

export function joinLines(values: string[]): string {
  return values.join('\n');
}
