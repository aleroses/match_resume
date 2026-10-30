import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ThemeChoice, ThemeStore } from './application/theme-store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private readonly themes = inject(ThemeStore);
  readonly theme = signal<ThemeChoice>(this.themes.read());

  constructor() {
    this.apply(this.theme());
  }

  setTheme(value: string): void {
    const choice = themeChoice(value);
    this.themes.save(choice);
    this.theme.set(choice);
    this.apply(choice);
  }

  choice(event: Event): string {
    return event.target instanceof HTMLSelectElement ? event.target.value : 'system';
  }

  private apply(choice: ThemeChoice): void {
    const root = document.documentElement;
    if (choice === 'system') {
      delete root.dataset['theme'];
      return;
    }
    root.dataset['theme'] = choice;
  }
}

function themeChoice(value: string): ThemeChoice {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}
