import { Routes } from '@angular/router';
import { EditorPage } from './presentation/editor/editor-page';
import { LibraryPage } from './presentation/library/library-page';

export const routes: Routes = [
  { path: '', component: LibraryPage },
  {
    path: 'cv/:id',
    component: EditorPage,
    canDeactivate: [(component: EditorPage) => component.canLeave()],
  },
];
