import type { ChecklistFile } from "@/types/checklist";
import type { FormatParser } from "../types";
import { generatePdf } from "./generator";

/**
 * PDF format "parser" — export only.
 *
 * PDF generation is async (stream-based), so the sync serialize()
 * throws. Handlers should use pdfParser.serializeAsync() instead.
 */
export const pdfParser: FormatParser & {
  serializeAsync(file: ChecklistFile): Promise<Buffer>;
} = {
  parse(): never {
    throw new Error("PDF import is not supported");
  },
  serialize(): never {
    throw new Error(
      "PDF generation requires async — use pdfParser.serializeAsync()",
    );
  },
  serializeAsync: generatePdf,
};
