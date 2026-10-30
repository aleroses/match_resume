import { DatePipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import {
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IdGenerator } from '../../application/id-generator';
import { GetResume, SaveResume } from '../../application/use-cases';
import { Language, PostingStatus, Resume } from '../../domain/resume/resume';
import {
  addBullet,
  addItem,
  addSection,
  removeBullet,
  removeItem,
  removeSection,
  reorderBullets,
  reorderItems,
  reorderSections,
  setVisible,
} from '../../domain/resume/resume-rules';
import { draftToResume, hasUnsaved, ItemDraft, resumeToDraft, SectionDraft } from './resume-form';

interface BulletControls {
  id: FormControl<string>;
  visible: FormControl<boolean>;
  text: FormControl<string>;
}

interface ItemControls {
  id: FormControl<string>;
  visible: FormControl<boolean>;
  title: FormControl<string>;
  organization: FormControl<string>;
  location: FormControl<string>;
  start: FormControl<string>;
  end: FormControl<string>;
  current: FormControl<boolean>;
  bullets: FormArray<FormGroup<BulletControls>>;
}

interface SectionControls {
  id: FormControl<string>;
  visible: FormControl<boolean>;
  title: FormControl<string>;
  items: FormArray<FormGroup<ItemControls>>;
}

@Component({
  selector: 'app-editor',
  imports: [ReactiveFormsModule, DatePipe, RouterLink],
  templateUrl: './editor-page.html',
  styleUrl: './editor-page.css',
})
export class EditorPage {
  readonly id = input.required<string>();

  private readonly forms = inject(FormBuilder);
  private readonly getResume = inject(GetResume);
  private readonly saveResume = inject(SaveResume);
  private readonly ids = inject(IdGenerator);

  readonly saved = signal<Resume | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly formError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly busy = signal(false);

  readonly form = this.forms.nonNullable.group({
    name: '',
    language: this.forms.nonNullable.control<Language>('es'),
    posting: this.forms.nonNullable.group({
      company: '',
      title: '',
      status: this.forms.nonNullable.control<PostingStatus>('draft'),
      postingText: '',
      pdfFile: '',
    }),
    basics: this.forms.nonNullable.group({
      name: '',
      headline: '',
      email: '',
      phone: '',
      url: '',
      location: '',
      summary: '',
    }),
    sections: this.forms.array<FormGroup<SectionControls>>([]),
  });

  constructor() {
    toObservable(this.id)
      .pipe(takeUntilDestroyed())
      .subscribe((id) => void this.open(id));
  }

  hasUnsavedChanges(): boolean {
    const saved = this.saved();
    if (!saved) {
      return false;
    }
    return hasUnsaved(saved, draftToResume(this.form.getRawValue(), saved));
  }

  emailWarning(): string | null {
    const email = this.form.controls.basics.controls.email.value;
    if (email === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return null;
    }
    return 'El correo no parece una dirección. Se puede guardar igual.';
  }

  addSection(): void {
    this.mutate((resume, at) => addSection(resume, this.ids.next(), at));
  }

  removeSectionAt(index: number): void {
    this.mutate((resume, at) => removeSection(resume, this.sectionId(resume, index), at));
  }

  moveSection(index: number, direction: -1 | 1): void {
    this.mutate((resume, at) =>
      reorderSections(
        resume,
        moveIds(
          resume.sections.map((section) => section.id),
          index,
          direction,
        ),
        at,
      ),
    );
  }

  showSection(index: number, visible: boolean): void {
    this.mutate((resume, at) =>
      setVisible(resume, { kind: 'section', id: this.sectionId(resume, index) }, visible, at),
    );
  }

  addItemAt(sectionIndex: number): void {
    this.mutate((resume, at) =>
      addItem(resume, this.sectionId(resume, sectionIndex), this.ids.next(), at),
    );
  }

  removeItemAt(sectionIndex: number, itemIndex: number): void {
    this.mutate((resume, at) =>
      removeItem(
        resume,
        this.sectionId(resume, sectionIndex),
        this.itemId(resume, sectionIndex, itemIndex),
        at,
      ),
    );
  }

  moveItem(sectionIndex: number, itemIndex: number, direction: -1 | 1): void {
    this.mutate((resume, at) => {
      const section = resume.sections[sectionIndex];
      if (!section) {
        return resume;
      }
      return reorderItems(
        resume,
        section.id,
        moveIds(
          section.items.map((item) => item.id),
          itemIndex,
          direction,
        ),
        at,
      );
    });
  }

  showItem(sectionIndex: number, itemIndex: number, visible: boolean): void {
    this.mutate((resume, at) =>
      setVisible(
        resume,
        { kind: 'item', id: this.itemId(resume, sectionIndex, itemIndex) },
        visible,
        at,
      ),
    );
  }

  addBulletAt(sectionIndex: number, itemIndex: number): void {
    this.mutate((resume, at) =>
      addBullet(
        resume,
        this.sectionId(resume, sectionIndex),
        this.itemId(resume, sectionIndex, itemIndex),
        this.ids.next(),
        at,
      ),
    );
  }

  removeBulletAt(sectionIndex: number, itemIndex: number, bulletIndex: number): void {
    this.mutate((resume, at) =>
      removeBullet(
        resume,
        this.sectionId(resume, sectionIndex),
        this.itemId(resume, sectionIndex, itemIndex),
        this.bulletId(resume, sectionIndex, itemIndex, bulletIndex),
        at,
      ),
    );
  }

  moveBullet(
    sectionIndex: number,
    itemIndex: number,
    bulletIndex: number,
    direction: -1 | 1,
  ): void {
    this.mutate((resume, at) => {
      const item = resume.sections[sectionIndex]?.items[itemIndex];
      const section = resume.sections[sectionIndex];
      if (!section || !item) {
        return resume;
      }
      return reorderBullets(
        resume,
        section.id,
        item.id,
        moveIds(
          item.bullets.map((bullet) => bullet.id),
          bulletIndex,
          direction,
        ),
        at,
      );
    });
  }

  showBullet(sectionIndex: number, itemIndex: number, bulletIndex: number, visible: boolean): void {
    this.mutate((resume, at) =>
      setVisible(
        resume,
        { kind: 'bullet', id: this.bulletId(resume, sectionIndex, itemIndex, bulletIndex) },
        visible,
        at,
      ),
    );
  }

  dateMessage(): string | null {
    return dateError(this.form.getRawValue().sections);
  }

  async save(): Promise<void> {
    const saved = this.saved();
    if (!saved || this.busy()) {
      return;
    }
    const dates = this.dateMessage();
    if (dates) {
      this.formError.set(dates);
      this.notice.set(null);
      return;
    }
    this.busy.set(true);
    this.formError.set(null);
    try {
      const next = await this.saveResume.execute(draftToResume(this.form.getRawValue(), saved));
      this.saved.set(next);
      this.fill(next);
      this.notice.set('Guardado.');
    } catch (error) {
      this.formError.set(message(error));
    } finally {
      this.busy.set(false);
    }
  }

  checked(event: Event): boolean {
    return event.target instanceof HTMLInputElement && event.target.checked;
  }

  private async open(id: string): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    this.formError.set(null);
    this.notice.set(null);
    this.saved.set(null);
    try {
      const resume = await this.getResume.execute(id);
      this.saved.set(resume);
      this.fill(resume);
    } catch (error) {
      this.loadError.set(message(error));
    } finally {
      this.loading.set(false);
    }
  }

  private mutate(change: (resume: Resume, at: string) => Resume): void {
    const saved = this.saved();
    if (!saved) {
      return;
    }
    const current = draftToResume(this.form.getRawValue(), saved);
    const next = change(current, saved.meta.updatedAt);
    this.setSections(resumeToDraft(next).sections);
    this.notice.set(null);
  }

  private fill(resume: Resume): void {
    const draft = resumeToDraft(resume);
    this.form.patchValue({
      name: draft.name,
      language: draft.language,
      posting: draft.posting,
      basics: draft.basics,
    });
    this.setSections(draft.sections);
  }

  private setSections(sections: SectionDraft[]): void {
    const array = this.form.controls.sections;
    array.clear();
    for (const section of sections) {
      array.push(this.sectionGroup(section));
    }
  }

  private sectionGroup(section: SectionDraft): FormGroup<SectionControls> {
    return this.forms.nonNullable.group({
      id: section.id,
      visible: section.visible,
      title: section.title,
      items: this.forms.array(section.items.map((item) => this.itemGroup(item))),
    });
  }

  private itemGroup(item: ItemDraft): FormGroup<ItemControls> {
    return this.forms.nonNullable.group({
      id: item.id,
      visible: item.visible,
      title: item.title,
      organization: item.organization,
      location: item.location,
      start: item.start,
      end: item.end,
      current: item.current,
      bullets: this.forms.array(
        item.bullets.map((bullet) =>
          this.forms.nonNullable.group({
            id: bullet.id,
            visible: bullet.visible,
            text: bullet.text,
          }),
        ),
      ),
    });
  }

  private sectionId(resume: Resume, index: number): string {
    const id = resume.sections[index]?.id;
    if (!id) {
      throw new Error('No está esa sección.');
    }
    return id;
  }

  private itemId(resume: Resume, sectionIndex: number, itemIndex: number): string {
    const id = resume.sections[sectionIndex]?.items[itemIndex]?.id;
    if (!id) {
      throw new Error('No está ese ítem.');
    }
    return id;
  }

  private bulletId(
    resume: Resume,
    sectionIndex: number,
    itemIndex: number,
    bulletIndex: number,
  ): string {
    const id = resume.sections[sectionIndex]?.items[itemIndex]?.bullets[bulletIndex]?.id;
    if (!id) {
      throw new Error('No está esa viñeta.');
    }
    return id;
  }
}

export function editorCanLeave(component: EditorPage): boolean {
  if (!component.hasUnsavedChanges()) {
    return true;
  }
  return window.confirm('Hay cambios sin guardar. ¿Salir de todas formas?');
}

function moveIds(ids: string[], index: number, direction: -1 | 1): string[] {
  const target = index + direction;
  if (target < 0 || target >= ids.length) {
    return ids;
  }
  const next = ids.slice();
  const current = next[index]!;
  next[index] = next[target]!;
  next[target] = current;
  return next;
}

const YEAR_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;

function dateError(sections: SectionDraft[]): string | null {
  for (const section of sections) {
    for (const item of section.items) {
      if (!isMonth(item.start) || (!item.current && !isMonth(item.end))) {
        return 'Las fechas son YYYY-MM o se dejan vacías.';
      }
      if (!item.current && item.start !== '' && item.end !== '' && item.end < item.start) {
        return 'La fecha de fin no puede ser anterior a la de inicio.';
      }
    }
  }
  return null;
}

function isMonth(value: string): boolean {
  return value === '' || YEAR_MONTH.test(value);
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudo abrir el CV.';
}
