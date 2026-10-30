import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ImportResult } from '../../application/transfer';
import { Resume } from '../../domain/resume/resume';
import { DocumentosStore } from './documentos-store';

@Component({
  selector: 'app-documentos',
  imports: [DatePipe, RouterLink],
  templateUrl: './documentos-page.html',
  styleUrl: './documentos-page.css',
})
export class DocumentosPage {
  readonly store = inject(DocumentosStore);

  constructor() {
    void this.store.load();
  }

  create(id: string): void {
    void this.store.createVersion(id);
  }

  remove(id: string): void {
    if (!window.confirm('¿Eliminar esta versión?')) {
      return;
    }
    void this.store.remove(id);
  }

  exportOne(id: string): void {
    void this.store.exportOne(id);
  }

  exportAll(): void {
    void this.store.exportAll();
  }

  importFile(): void {
    void this.store.startImport();
  }

  confirmImport(): void {
    void this.store.confirmImport();
  }

  cancelImport(): void {
    this.store.cancelImport();
  }

  choose(id: string, replace: boolean): void {
    this.store.choose(id, replace);
  }

  kindLabel(resume: Resume): string {
    return resume.meta.kind === 'master' ? 'Maestro' : 'Versión';
  }

  summary(result: ImportResult): string {
    return `Añadidos: ${result.added}. Reemplazados: ${result.replaced}. Ignorados: ${result.skipped}. Rechazados: ${result.rejected}.`;
  }
}
