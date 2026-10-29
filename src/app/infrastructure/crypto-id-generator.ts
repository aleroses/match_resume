import { IdGenerator } from '../application/id-generator';

export class CryptoIdGenerator extends IdGenerator {
  override next(): string {
    return crypto.randomUUID();
  }
}
