import { Routes } from '@angular/router';
import { DocumentosPage } from './presentation/documentos/documentos-page';
import { EditorPage, editorCanLeave } from './presentation/editor/editor-page';
import { ExportarPage } from './presentation/exportar/exportar-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'documentos' },
  { path: 'documentos', component: DocumentosPage },
  { path: 'editor/:id', component: EditorPage, canDeactivate: [editorCanLeave] },
  { path: 'exportar', component: ExportarPage },
];
