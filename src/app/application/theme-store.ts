export type ThemeChoice = 'system' | 'light' | 'dark';

export abstract class ThemeStore {
  abstract read(): ThemeChoice;
  abstract save(choice: ThemeChoice): void;
}
