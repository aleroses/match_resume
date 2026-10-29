import { FileGateway, PickedFile } from '../application/file-gateway';

export class BrowserFileGateway extends FileGateway {
  override download(filename: string, text: string): void {
    const blob = new Blob([text], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  override pickFile(): Promise<PickedFile | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      let settled = false;
      const finish = (value: PickedFile | null) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };
      input.addEventListener('cancel', () => finish(null));
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) {
          finish(null);
          return;
        }
        void file.text().then(
          (text) => finish({ name: file.name, text }),
          () => finish(null),
        );
      });
      input.click();
    });
  }
}
