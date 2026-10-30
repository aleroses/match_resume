import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ThemeChoice, ThemeStore } from './application/theme-store';
import { App } from './app';

class MemoryThemeStore extends ThemeStore {
  private choice: ThemeChoice = 'system';

  override read(): ThemeChoice {
    return this.choice;
  }

  override save(choice: ThemeChoice): void {
    this.choice = choice;
  }
}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ThemeStore, useClass: MemoryThemeStore },
      ],
    }).compileComponents();
  });

  it('creates the shell', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });
});
