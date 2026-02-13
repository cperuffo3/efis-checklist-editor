import { ChecklistFormat } from "@/types";
import { aceParser } from "./ace";
import { foreflightParser } from "./foreflight";
import { garminPilotParser } from "./garmin-pilot";
import { jsonParser } from "./json";
import { pdfParser } from "./pdf";
import { dynonParser, grtParser } from "./text";
import type { FormatParser } from "./types";

export type { FormatParser, ParsedChecklistFile } from "./types";

const parserRegistry: Record<ChecklistFormat, FormatParser> = {
  [ChecklistFormat.Json]: jsonParser,
  [ChecklistFormat.Ace]: aceParser,
  [ChecklistFormat.AfsDynon]: dynonParser,
  [ChecklistFormat.Grt]: grtParser,
  [ChecklistFormat.ForeFlight]: foreflightParser,
  [ChecklistFormat.Gplt]: garminPilotParser,
  [ChecklistFormat.Pdf]: pdfParser,
};

/** Get the parser for a given format */
export function getParser(format: ChecklistFormat): FormatParser {
  return parserRegistry[format];
}

/**
 * Detect format from file extension.
 *
 * For `.txt` files, attempts to disambiguate between Dynon and GRT
 * by peeking at the file content.
 */
export function detectFormat(
  filePath: string,
  content?: Buffer,
): ChecklistFormat | null {
  const ext = filePath.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "ace":
      return ChecklistFormat.Ace;
    case "json":
      return ChecklistFormat.Json;
    case "afd":
      return ChecklistFormat.AfsDynon;
    case "fmd":
      return ChecklistFormat.ForeFlight;
    case "gplt":
      return ChecklistFormat.Gplt;
    case "txt":
      return detectTextFormat(content);
    case "pdf":
      return ChecklistFormat.Pdf;
    default:
      return null;
  }
}

/**
 * Disambiguate `.txt` files between Dynon and GRT formats.
 *
 * Dynon files use `CHKLST{{n}}.TITLE` prefixes.
 * GRT files use `LIST` / `ITEM` prefixes.
 *
 * Falls back to Dynon if content is not available or ambiguous.
 */
function detectTextFormat(content?: Buffer): ChecklistFormat {
  if (!content) return ChecklistFormat.AfsDynon;

  const text = content.toString("utf-8");
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (/^CHKLST\d+\./.test(trimmed)) {
      return ChecklistFormat.AfsDynon;
    }
    if (/^(LIST|ITEM)\b/.test(trimmed)) {
      return ChecklistFormat.Grt;
    }
  }

  // Default to Dynon if we can't tell
  return ChecklistFormat.AfsDynon;
}

// Re-export async parsers for handlers that need them
export { garminPilotParser } from "./garmin-pilot";
export { pdfParser } from "./pdf";
