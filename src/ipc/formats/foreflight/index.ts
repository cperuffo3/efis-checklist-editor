import type { FormatParser } from "../types";
import { readForeFlight } from "./reader";
import { writeForeFlight } from "./writer";

/** ForeFlight encrypted format parser (.fmd) */
export const foreflightParser: FormatParser = {
  parse: readForeFlight,
  serialize: writeForeFlight,
};
