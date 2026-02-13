import type { ChecklistFile } from "@/types";

/**
 * Data shape returned by parsers — excludes runtime-only fields
 * that the caller adds after parsing (id, dirty, lastModified).
 */
export type ParsedChecklistFile = Omit<
  ChecklistFile,
  "id" | "dirty" | "lastModified"
>;

/**
 * Common interface for all format parsers.
 *
 * Binary formats (ACE, ForeFlight, Garmin Pilot) receive a Buffer;
 * text formats call `content.toString("utf-8")` internally.
 * Serializers return `Buffer` for binary or `string` for text.
 */
export interface FormatParser {
  /** Parse raw file content into the internal checklist model */
  parse(content: Buffer, fileName: string): ParsedChecklistFile;
  /** Serialize internal checklist model to file content */
  serialize(file: ChecklistFile): Buffer | string;
}
