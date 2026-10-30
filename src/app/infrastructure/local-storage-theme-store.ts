import { ThemeChoice, ThemeStore } from '../application/theme-store';

const STORAGE_KEY = 'match-resume.theme';

export class LocalStorageThemeStore extends ThemeStore {
  override read(): ThemeChoice {
    try {
      return themeChoice(localStorage.getItem(STORAGE_KEY));
    } catch {
      return 'system';
    }
  }

  override save(choice: ThemeChoice): void {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      return;
    }
  }
}

function themeChoice(value: string | null): ThemeChoice {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}
