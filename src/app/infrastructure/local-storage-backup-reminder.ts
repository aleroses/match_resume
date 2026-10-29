import { BackupReminderStore } from '../application/backup-reminder-store';

const STORAGE_KEY = 'match-resume.export-all-at';

export class LocalStorageBackupReminder extends BackupReminderStore {
  override lastExportAllAt(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  }

  override recordExportAll(at: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, at);
    } catch {
      return;
    }
  }
}
