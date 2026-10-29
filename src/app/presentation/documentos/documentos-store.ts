import { Injectable, inject, signal } from '@angular/core';
import { Resume } from '../../domain/resume/resume';
import { DeleteVersion, DeriveVersion, ListResumes, OpenOrCreateMaster } from '../../application/use-cases';

@Injectable({ providedIn: 'root' })
export class DocumentosStore {
  private readonly openMaster = inject(OpenOrCreateMaster);
  private readonly listResumes = inject(ListResumes);
  private readonly deriveVersion = inject(DeriveVersion);
  private readonly deleteVersion = inject(DeleteVersion);

  readonly resumes = signal<Resume[]>([]);
  readonly unreadableIds = signal<string[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly persistenceDenied = signal(false);

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

  denyPersistence(): void {
    this.persistenceDenied.set(true);
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
