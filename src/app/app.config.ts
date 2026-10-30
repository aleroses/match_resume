import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  inject,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { BackupReminderStore } from './application/backup-reminder-store';
import { ThemeStore } from './application/theme-store';
import { Clock } from './application/clock';
import { FileGateway } from './application/file-gateway';
import { IdGenerator } from './application/id-generator';
import { ResumeArchive } from './application/resume-archive';
import { ResumeRepository } from './application/resume-repository';
import { ApplyImport, ExportAll, ExportResume, PlanImport } from './application/transfer';
import {
  DeleteVersion,
  DeriveVersion,
  GetResume,
  ListResumes,
  OpenOrCreateMaster,
  SaveResume,
} from './application/use-cases';
import { routes } from './app.routes';
import { BrowserFileGateway } from './infrastructure/browser-file-gateway';
import { CryptoIdGenerator } from './infrastructure/crypto-id-generator';
import { DexieResumeRepository } from './infrastructure/dexie-resume-repository';
import { LocalStorageBackupReminder } from './infrastructure/local-storage-backup-reminder';
import { LocalStorageThemeStore } from './infrastructure/local-storage-theme-store';
import { ZodResumeArchive } from './infrastructure/serialization/resume-archive';
import { SystemClock } from './infrastructure/system-clock';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes, withComponentInputBinding()),
    { provide: IdGenerator, useClass: CryptoIdGenerator },
    { provide: Clock, useClass: SystemClock },
    { provide: ResumeRepository, useClass: DexieResumeRepository },
    { provide: FileGateway, useClass: BrowserFileGateway },
    { provide: ResumeArchive, useClass: ZodResumeArchive },
    { provide: BackupReminderStore, useClass: LocalStorageBackupReminder },
    { provide: ThemeStore, useClass: LocalStorageThemeStore },
    {
      provide: OpenOrCreateMaster,
      useFactory: () =>
        new OpenOrCreateMaster(inject(ResumeRepository), inject(IdGenerator), inject(Clock)),
    },
    { provide: ListResumes, useFactory: () => new ListResumes(inject(ResumeRepository)) },
    {
      provide: DeriveVersion,
      useFactory: () =>
        new DeriveVersion(inject(ResumeRepository), inject(IdGenerator), inject(Clock)),
    },
    {
      provide: SaveResume,
      useFactory: () => new SaveResume(inject(ResumeRepository), inject(Clock)),
    },
    { provide: DeleteVersion, useFactory: () => new DeleteVersion(inject(ResumeRepository)) },
    { provide: GetResume, useFactory: () => new GetResume(inject(ResumeRepository)) },
    {
      provide: ExportResume,
      useFactory: () =>
        new ExportResume(inject(ResumeRepository), inject(ResumeArchive), inject(FileGateway)),
    },
    {
      provide: ExportAll,
      useFactory: () =>
        new ExportAll(
          inject(ListResumes),
          inject(ResumeArchive),
          inject(FileGateway),
          inject(Clock),
          inject(BackupReminderStore),
        ),
    },
    {
      provide: PlanImport,
      useFactory: () => new PlanImport(inject(ResumeRepository), inject(ResumeArchive)),
    },
    { provide: ApplyImport, useFactory: () => new ApplyImport(inject(ResumeRepository)) },
  ],
};
