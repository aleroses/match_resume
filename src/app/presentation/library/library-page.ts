import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CvStore, formatTimestamp } from '../cv-store';

@Component({
  selector: 'app-library-page',
  imports: [RouterLink],
  templateUrl: './library-page.html',
})
export class LibraryPage implements OnInit {
  readonly store = inject(CvStore);
  private readonly router = inject(Router);
  readonly newTitle = signal('');
  readonly formatTimestamp = formatTimestamp;

  ngOnInit(): void {
    void this.store.load();
  }

  async create(): Promise<void> {
    const id = await this.store.derive(this.newTitle());
    if (id) {
      await this.router.navigate(['/cv', id]);
    }
  }

  text(event: Event): string {
    const target = event.target;
    return target instanceof HTMLInputElement ? target.value : '';
  }

  async importFile(event: Event): Promise<void> {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.[0]) {
      return;
    }
    const raw = await input.files[0].text();
    input.value = '';
    await this.store.importBackup(raw);
  }
}
