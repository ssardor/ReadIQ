declare module 'pdf-parse' {
  interface PdfParseLoadParams {
    data?: string | number[] | ArrayBuffer | Uint8Array
    url?: string | URL
    password?: string
  }

  interface PdfParseTextResult {
    text: string
  }

  class PDFParse {
    constructor(options: PdfParseLoadParams)
    getText(params?: Record<string, unknown>): Promise<PdfParseTextResult>
    destroy(): Promise<void>
  }

  export { PDFParse }
}
