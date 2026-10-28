import { CvDocument } from '../../domain/cv-document';
import { CvRepository } from '../ports';

export class InMemoryCvRepository extends CvRepository {
  private readonly documents = new Map<string, CvDocument>();

  override async list(): Promise<CvDocument[]> {
    return [...this.documents.values()].map((document) => structuredClone(document));
  }

  override async get(id: string): Promise<CvDocument | null> {
    const document = this.documents.get(id);
    return document ? structuredClone(document) : null;
  }

  override async save(document: CvDocument): Promise<void> {
    this.documents.set(document.id, structuredClone(document));
  }

  override async delete(id: string): Promise<void> {
    this.documents.delete(id);
  }

  override async replaceAll(documents: CvDocument[]): Promise<void> {
    this.documents.clear();
    for (const document of documents) {
      this.documents.set(document.id, structuredClone(document));
    }
  }
}
