import { BackupCodec, BackupFile } from '../application/ports';
import { parseBackup } from './cv-schema';

export class ZodBackupCodec extends BackupCodec {
  override encode(file: BackupFile): string {
    return JSON.stringify(parseBackup(file), null, 2);
  }

  override decode(raw: string): BackupFile {
    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      throw new Error('El archivo no es JSON válido.');
    }
    return parseBackup(data);
  }
}
