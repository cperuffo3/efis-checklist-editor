import type { TextFormatOptions } from "./options";

/** GRT (Grand Rapids Technology) text format configuration */
export const GRT_OPTIONS: TextFormatOptions = {
  fileExtensions: [".txt"],
  indentWidth: 2,

  checklistPrefix: "LIST",
  itemPrefix: "ITEM",

  groupNameSeparator: ": ",
  skipFirstGroup: true,
  expectationSeparator: " - ",
  notePrefix: "NOTE: ",
  titlePrefixSuffix: "** ",
  warningPrefix: "WARNING: ",
  cautionPrefix: "CAUTION: ",
  commentPrefix: "#",

  outputMetadata: true,
};
