declare module "hwp.js" {
  interface Paragraph {
    text?: string;
  }

  interface Section {
    paragraphs?: Paragraph[];
  }

  class HWPDocument {
    constructor(data: ArrayBuffer);
    sections?: Section[];
  }

  export default HWPDocument;
}

