import { ChecklistFormat } from "@/types";
import type { FormatParser } from "../types";
import { DYNON_OPTIONS } from "./dynon";
import { GRT_OPTIONS } from "./grt";
import { readText } from "./reader";
import { writeText } from "./writer";

/** Dynon / AFS SkyView text format parser (.txt, .afd) */
export const dynonParser: FormatParser = {
  parse(content, fileName) {
    return readText(
      content.toString("utf-8"),
      fileName,
      DYNON_OPTIONS,
      ChecklistFormat.AfsDynon,
    );
  },
  serialize(file) {
    return writeText(file, DYNON_OPTIONS);
  },
};

/** GRT (Grand Rapids) text format parser (.txt) */
export const grtParser: FormatParser = {
  parse(content, fileName) {
    return readText(
      content.toString("utf-8"),
      fileName,
      GRT_OPTIONS,
      ChecklistFormat.Grt,
    );
  },
  serialize(file) {
    return writeText(file, GRT_OPTIONS);
  },
};
