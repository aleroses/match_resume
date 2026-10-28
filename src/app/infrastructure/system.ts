import { Clock, FileSaver, IdGenerator } from '../application/ports';

export class SystemClock extends Clock {
  override now(): string {
    return new Date().toISOString();
  }
}

export class CryptoIds extends IdGenerator {
  override next(): string {
    return crypto.randomUUID();
  }
}

export class BrowserFileSaver extends FileSaver {
  override save(filename: string, data: Uint8Array, mime: string): void {
    const blob = new Blob([new Uint8Array(data)], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
}
