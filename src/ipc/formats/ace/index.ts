import type { FormatParser } from "../types";
import { readAce } from "./reader";
import { writeAce } from "./writer";

/** Garmin ACE binary format parser (.ace) */
export const aceParser: FormatParser = {
  parse: readAce,
  serialize: writeAce,
};
