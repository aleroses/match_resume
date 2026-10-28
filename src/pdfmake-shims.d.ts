declare module 'pdfmake' {
  interface PdfMakeNode {
    addFonts(fonts: Record<string, Record<string, string>>): void;
    setLocalAccessPolicy(policy: (path: string) => boolean): void;
    setUrlAccessPolicy(policy: (url: string) => boolean): void;
    createPdf(definition: unknown): { getBuffer(): Promise<Uint8Array> };
  }
  const pdfMake: PdfMakeNode;
  export default pdfMake;
}

declare module 'pdfmake/build/pdfmake' {
  interface PdfMakeBrowser {
    addFonts(fonts: Record<string, Record<string, string>>): void;
    addVirtualFileSystem(vfs: Record<string, string>): void;
    setUrlAccessPolicy(policy: (url: string) => boolean): void;
    createPdf(definition: unknown): { getBuffer(): Promise<Uint8Array> };
  }
  const pdfMake: PdfMakeBrowser;
  export default pdfMake;
}
