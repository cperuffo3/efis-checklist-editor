import type { ChecklistFile } from "@/types";
import type { FormatParser, ParsedChecklistFile } from "../types";
import { readGarminPilot } from "./reader";
import { writeGarminPilot } from "./writer";

/**
 * Garmin Pilot format parser (.gplt).
 *
 * Read/write are async (tar.gz compression), so we wrap them
 * to match the synchronous FormatParser interface by throwing
 * if called synchronously. Handlers should await the async versions.
 */
export const garminPilotParser: FormatParser & {
  parseAsync(content: Buffer, fileName: string): Promise<ParsedChecklistFile>;
  serializeAsync(file: ChecklistFile): Promise<Buffer>;
} = {
  parse(): never {
    throw new Error(
      "Garmin Pilot parser requires async — use garminPilotParser.parseAsync()",
    );
  },
  serialize(): never {
    throw new Error(
      "Garmin Pilot serializer requires async — use garminPilotParser.serializeAsync()",
    );
  },
  parseAsync: readGarminPilot,
  serializeAsync: writeGarminPilot,
};
