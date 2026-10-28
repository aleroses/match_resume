import { Injectable } from '@angular/core';
import Dexie, { type Table } from 'dexie';
import { CvRepository } from '../application/ports';
import { CvDocument } from '../domain/cv-document';
import { parseCvDocument } from './cv-schema';

@Injectable({ providedIn: 'root' })
export class CvDatabase extends Dexie {
  documents!: Table<CvDocument, string>;

  constructor() {
    super('match_resume');
    this.version(1).stores({ documents: 'id, kind' });
  }
}

@Injectable()
export class DexieCvRepository extends CvRepository {
  constructor(private readonly db: CvDatabase) {
    super();
  }

  override async list(): Promise<CvDocument[]> {
    const rows = await this.db.documents.toArray();
    return rows.map((row) => parseCvDocument(row));
  }

  override async get(id: string): Promise<CvDocument | null> {
    const row = await this.db.documents.get(id);
    return row ? parseCvDocument(row) : null;
  }

  override async save(document: CvDocument): Promise<void> {
    await this.db.documents.put(parseCvDocument(document));
  }

  override async delete(id: string): Promise<void> {
    await this.db.documents.delete(id);
  }

  override async replaceAll(documents: CvDocument[]): Promise<void> {
    const parsed = documents.map((document) => parseCvDocument(document));
    await this.db.transaction('rw', this.db.documents, async () => {
      await this.db.documents.clear();
      await this.db.documents.bulkAdd(parsed);
    });
  }
}
