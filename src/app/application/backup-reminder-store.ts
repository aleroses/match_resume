export abstract class BackupReminderStore {
  abstract lastExportAllAt(): string | null;
  abstract recordExportAll(at: string): void;
}
