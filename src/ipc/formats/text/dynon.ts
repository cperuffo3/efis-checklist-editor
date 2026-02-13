import type { TextFormatOptions } from "./options";

/** Dynon/AFS SkyView text format configuration */
export const DYNON_OPTIONS: TextFormatOptions = {
  fileExtensions: [".txt", ".afd"],
  indentWidth: 2,
  allUppercase: true,
  checklistTopBlankLine: true,
  outputMetadata: true,

  checklistPrefix: "CHKLST{{checklistNum}}.TITLE,",
  checklistPrefixMatcher: /^CHKLST(?<checklistNum>\d+)\.TITLE/,
  itemPrefix: "CHKLST{{checklistNum}}.LINE{{itemNum}},",
  itemPrefixMatcher: /^CHKLST(?<checklistNum>\d+)\.LINE(?<itemNum>\d+)/,
  checklistZeroIndexed: true,
  checklistItemZeroIndexed: false,

  groupNameSeparator: ": ",
  skipFirstGroup: true,
  expectationSeparator: " - ",
  notePrefix: "NOTE: ",
  titlePrefixSuffix: "** ",
  warningPrefix: "WARNING: ",
  cautionPrefix: "CAUTION: ",
  commentPrefix: "#",
};
