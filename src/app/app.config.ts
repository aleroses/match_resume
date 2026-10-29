import { registerLocaleData } from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { IdGenerator } from './application/id-generator';
import { routes } from './app.routes';
import { CryptoIdGenerator } from './infrastructure/crypto-id-generator';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    { provide: LOCALE_ID, useValue: 'es' },
    provideRouter(routes, withComponentInputBinding()),
    { provide: IdGenerator, useClass: CryptoIdGenerator },
  ],
};
