const CURRENT_SCHEMA_VERSION = 1;

type JsonObject = Record<string, unknown>;

const migrations: Record<number, (raw: JsonObject) => JsonObject> = {
  0: (raw) => ({ ...raw, schemaVersion: 1 }),
};

export function migrate(raw: unknown): unknown {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('El documento no es un objeto JSON.');
  }
  let doc = raw as JsonObject;
  const declared = doc['schemaVersion'];
  if (declared !== undefined && (typeof declared !== 'number' || !Number.isInteger(declared))) {
    throw new Error('schemaVersion no es un entero.');
  }
  let version = declared === undefined ? 0 : declared;
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new Error(`No hay migración desde la versión ${version}.`);
  }
  while (version < CURRENT_SCHEMA_VERSION) {
    const step = migrations[version];
    if (!step) {
      throw new Error(`No hay migración desde la versión ${version}.`);
    }
    doc = step(doc);
    const next = doc['schemaVersion'];
    if (typeof next !== 'number' || !Number.isInteger(next) || next <= version) {
      throw new Error('La migración no avanzó de versión.');
    }
    version = next;
  }
  return doc;
}
