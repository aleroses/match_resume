import tseslint from 'typescript-eslint';

const externalLibrary = String.raw`^(?:zod|dexie|pdfmake|pdfjs-dist)(?:/|$)`;
const angularPackage = String.raw`^@angular/`;

function layers(...names) {
  return String.raw`(?:^|/)(?:${names.join('|')})(?:/|$)`;
}

function restricted(patterns) {
  return ['error', { patterns }];
}

export default tseslint.config(
  { ignores: ['dist/**', '.angular/**', 'node_modules/**'] },
  {
    files: ['src/**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  {
    files: ['src/app/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': restricted([
        { regex: angularPackage, message: 'domain es TypeScript puro: no importa Angular.' },
        { regex: externalLibrary, message: 'domain no importa librerías externas.' },
        {
          regex: layers('application', 'infrastructure', 'presentation'),
          message: 'domain no importa otras capas.',
        },
      ]),
    },
  },
  {
    files: ['src/app/application/**/*.ts'],
    rules: {
      'no-restricted-imports': restricted([
        { regex: angularPackage, message: 'application no importa Angular.' },
        { regex: externalLibrary, message: 'application no importa librerías de infraestructura.' },
        {
          regex: layers('infrastructure', 'presentation'),
          message: 'application solo importa domain.',
        },
      ]),
    },
  },
  {
    files: ['src/app/presentation/**/*.ts'],
    rules: {
      'no-restricted-imports': restricted([
        { regex: externalLibrary, message: 'presentation no importa librerías de infraestructura.' },
        { regex: layers('infrastructure'), message: 'presentation no importa infrastructure.' },
      ]),
    },
  },
  {
    files: ['src/app/infrastructure/**/*.ts'],
    rules: {
      'no-restricted-imports': restricted([
        { regex: layers('presentation'), message: 'infrastructure no importa presentation.' },
      ]),
    },
  },
);
