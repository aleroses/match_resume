import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Resume } from '../../domain/resume/resume';
import { DocumentosStore } from './documentos-store';

@Component({
  selector: 'app-documentos',
  imports: [DatePipe],
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

  kindLabel(resume: Resume): string {
    return resume.meta.kind === 'master' ? 'Maestro' : 'Versión';
  }
}
