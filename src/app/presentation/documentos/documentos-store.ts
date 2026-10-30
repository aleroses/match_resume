import { computed, Injectable, inject, signal } from '@angular/core';
import { BackupReminderStore } from '../../application/backup-reminder-store';
import { FileGateway } from '../../application/file-gateway';
import {
  ApplyImport,
  ExportAll,
  ExportResume,
  ImportPlan,
  ImportResult,
  PlanImport,
} from '../../application/transfer';
import {
  DeleteVersion,
  DeriveVersion,
  ListResumes,
  OpenOrCreateMaster,
} from '../../application/use-cases';
import { Resume } from '../../domain/resume/resume';

@Injectable({ providedIn: 'root' })
export class DocumentosStore {
  private readonly openMaster = inject(OpenOrCreateMaster);
  private readonly listResumes = inject(ListResumes);
  private readonly deriveVersion = inject(DeriveVersion);
  private readonly deleteVersion = inject(DeleteVersion);
  private readonly exportResume = inject(ExportResume);
  private readonly exportAllResumes = inject(ExportAll);
  private readonly planImport = inject(PlanImport);
  private readonly applyImport = inject(ApplyImport);
  private readonly files = inject(FileGateway);
  private readonly reminder = inject(BackupReminderStore);

  readonly resumes = signal<Resume[]>([]);
  readonly unreadableIds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly persistenceDenied = signal(false);
  readonly persistenceGranted = signal(false);
  readonly lastExportAllAt = signal<string | null>(this.reminder.lastExportAllAt());
  readonly importPlan = signal<ImportPlan | null>(null);
  readonly importResult = signal<ImportResult | null>(null);
  private readonly choices = signal<Readonly<Record<string, boolean>>>({});

  readonly unbackedCount = computed(() => {
    const at = this.lastExportAllAt();
    const resumes = this.resumes();
    if (at === null) {
      return resumes.length;
    }
    return resumes.filter((resume) => resume.meta.updatedAt > at).length;
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.openMaster.execute();
      await this.refresh();
    } catch (error) {
      this.error.set(message(error));
    } finally {
      this.loading.set(false);
    }
  }

  async createVersion(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.deriveVersion.execute(id);
      await this.refresh();
    } catch (error) {
      this.error.set(message(error));
    }
  }

  async remove(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.deleteVersion.execute(id);
      await this.refresh();
    } catch (error) {
      this.error.set(message(error));
    }
  }

  async exportOne(id: string): Promise<void> {
    this.error.set(null);
    try {
      await this.exportResume.execute(id);
    } catch (error) {
      this.error.set(message(error));
    }
  }

  async exportAll(): Promise<void> {
    this.error.set(null);
    this.busy.set(true);
    try {
      await this.exportAllResumes.execute();
      this.lastExportAllAt.set(this.reminder.lastExportAllAt());
    } catch (error) {
      this.error.set(message(error));
    } finally {
      this.busy.set(false);
    }
  }

  async startImport(): Promise<void> {
    this.error.set(null);
    const picked = await this.files.pickFile();
    if (!picked) {
      return;
    }
    this.importPlan.set(null);
    this.importResult.set(null);
    this.busy.set(true);
    try {
      const plan = await this.planImport.execute(picked.text);
      this.importPlan.set(plan);
      this.choices.set({});
      this.importResult.set(null);
    } catch (error) {
      this.importPlan.set(null);
      this.error.set(message(error));
    } finally {
      this.busy.set(false);
    }
  }

  replaces(id: string): boolean {
    return this.choices()[id] === true;
  }

  choose(id: string, replace: boolean): void {
    this.choices.update((current) => ({ ...current, [id]: replace }));
  }

  cancelImport(): void {
    this.importPlan.set(null);
    this.choices.set({});
  }

  async confirmImport(): Promise<void> {
    const plan = this.importPlan();
    if (!plan) {
      return;
    }
    this.error.set(null);
    this.busy.set(true);
    try {
      const replaceIds = new Set(
        Object.entries(this.choices())
          .filter(([, replace]) => replace)
          .map(([id]) => id),
      );
      const result = await this.applyImport.execute(plan, replaceIds);
      this.importPlan.set(null);
      this.choices.set({});
      this.importResult.set(result);
      await this.refresh();
    } catch (error) {
      this.error.set(message(error));
    } finally {
      this.busy.set(false);
    }
  }

  async requestPersistence(): Promise<void> {
    const persist = navigator.storage?.persist?.bind(navigator.storage);
    if (!persist) {
      this.persistenceGranted.set(false);
      this.persistenceDenied.set(true);
      return;
    }
    try {
      const granted = await persist();
      this.persistenceGranted.set(granted);
      this.persistenceDenied.set(!granted);
    } catch {
      this.persistenceGranted.set(false);
      this.persistenceDenied.set(true);
    }
  }

  private async refresh(): Promise<void> {
    const listed = await this.listResumes.execute();
    this.resumes.set(listed.resumes);
    this.unreadableIds.set(listed.unreadableIds);
  }
}

function message(error: unknown): string {
  return error instanceof Error ? error.message : 'No se pudieron cargar los documentos.';
}
