import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import { ApplicationConfig, inject, LOCALE_ID, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { Clock } from './application/clock';
import { IdGenerator } from './application/id-generator';
import { ResumeRepository } from './application/resume-repository';
import { DeleteVersion, DeriveVersion, ListResumes, OpenOrCreateMaster, SaveResume } from './application/use-cases';
import { routes } from './app.routes';
import { CryptoIdGenerator } from './infrastructure/crypto-id-generator';
import { DexieResumeRepository } from './infrastructure/dexie-resume-repository';
import { SystemClock } from './infrastructure/system-clock';
import { DocumentosStore } from './presentation/documentos/documentos-store';

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
    {
      provide: OpenOrCreateMaster,
      useFactory: () => new OpenOrCreateMaster(inject(ResumeRepository), inject(IdGenerator), inject(Clock)),
    },
    { provide: ListResumes, useFactory: () => new ListResumes(inject(ResumeRepository)) },
    {
      provide: DeriveVersion,
      useFactory: () => new DeriveVersion(inject(ResumeRepository), inject(IdGenerator), inject(Clock)),
    },
    { provide: SaveResume, useFactory: () => new SaveResume(inject(ResumeRepository), inject(Clock)) },
    { provide: DeleteVersion, useFactory: () => new DeleteVersion(inject(ResumeRepository)) },
    provideAppInitializer(() => {
      const store = inject(DocumentosStore);
      const persist = navigator.storage?.persist?.bind(navigator.storage);
      if (!persist) {
        store.denyPersistence();
        return;
      }
      return persist()
        .then((granted) => {
          if (!granted) {
            store.denyPersistence();
          }
        })
        .catch(() => {
          store.denyPersistence();
        });
    }),
  ],
};
