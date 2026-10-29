export interface PickedFile {
  name: string;
  text: string;
}

export abstract class FileGateway {
  abstract download(filename: string, text: string): void;
  abstract pickFile(): Promise<PickedFile | null>;
}
