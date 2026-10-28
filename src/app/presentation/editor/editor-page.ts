import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CvStore, formatTimestamp, joinLines, lines } from '../cv-store';

@Component({
  selector: 'app-editor-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './editor-page.html',
})
export class EditorPage {
  readonly store = inject(CvStore);
  readonly confirmDelete = signal(false);
  readonly formatTimestamp = formatTimestamp;
  readonly lines = lines;
  readonly joinLines = joinLines;
  private readonly router = inject(Router);

  constructor() {
    const route = inject(ActivatedRoute);
    route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const id = params.get('id');
      this.confirmDelete.set(false);
      if (id) {
        void this.store.open(id);
      }
    });
    const onLeave = (event: BeforeUnloadEvent) => {
      if (this.store.isDirty()) {
        event.preventDefault();
      }
    };
    window.addEventListener('beforeunload', onLeave);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('beforeunload', onLeave));
  }

  canLeave(): boolean {
    if (!this.store.isDirty()) {
      return true;
    }
    return window.confirm('Hay cambios sin guardar. ¿Salir de esta versión?');
  }

  async remove(): Promise<void> {
    if (await this.store.deleteCurrent()) {
      await this.router.navigateByUrl('/');
    }
  }

  checked(event: Event): boolean {
    const target = event.target;
    return target instanceof HTMLInputElement && target.checked;
  }
}
