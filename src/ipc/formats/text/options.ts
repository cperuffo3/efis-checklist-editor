/** Configuration options for text-based checklist formats */
export interface TextFormatOptions {
  /** File extensions this format can parse */
  fileExtensions: string[];
  /** If a line would be wider than this, it will be wrapped */
  maxLineLength?: number;
  /** Number of spaces per indent level */
  indentWidth: number;
  /** Whether all content should be uppercase */
  allUppercase?: boolean;
  /** If set, group names are separated by this string (e.g. ": ") */
  groupNameSeparator?: string;
  /** If true, the first group name is omitted in output */
  skipFirstGroup?: boolean;
  /** If true, each checklist starts with a blank line item */
  checklistTopBlankLine?: boolean;
  /** Whether to output a metadata checklist */
  outputMetadata?: boolean;
  /** Template for checklist prefix ({{checklistNum}} replaced) */
  checklistPrefix: string;
  /** Template for item prefix ({{checklistNum}} and {{itemNum}} replaced) */
  itemPrefix: string;
  /** Regex to match checklist prefixes (with optional named group "checklistNum") */
  checklistPrefixMatcher?: RegExp;
  /** Regex to match item prefixes (with optional named groups "checklistNum", "itemNum") */
  itemPrefixMatcher?: RegExp;
  /** Whether checklistNum counting starts at 0 (vs 1) */
  checklistZeroIndexed?: boolean;
  /** Whether itemNum counting starts at 0 (vs 1) */
  checklistItemZeroIndexed?: boolean;
  /** Whether commas are forbidden in checklist text */
  forbidCommas?: boolean;
  /** Separator between challenge and response (e.g. " - ") */
  expectationSeparator: string;
  /** Prefix for note items (e.g. "NOTE: ") */
  notePrefix: string;
  /** Prefix AND suffix for title items (suffix is reversed) */
  titlePrefixSuffix: string;
  /** Prefix for warning items (e.g. "WARNING: ") */
  warningPrefix: string;
  /** Prefix for caution items (e.g. "CAUTION: ") */
  cautionPrefix: string;
  /** Line prefix for comments (e.g. "#") */
  commentPrefix?: string;
}

/** Wrap continuation prefix */
export const WRAP_PREFIX = "| ";

/** Metadata checklist constants */
export const METADATA_CHECKLIST_TITLE = "Checklist Info";
export const METADATA_FILE_TITLE = "Checklist file:";
export const METADATA_MAKE_MODEL_TITLE = "Make and model:";
export const METADATA_AIRCRAFT_TITLE = "Aircraft:";
export const METADATA_MANUFACTURER_TITLE = "Manufacturer:";
export const METADATA_COPYRIGHT_TITLE = "Copyright:";

/** Default name for the first group */
export const DEFAULT_FIRST_GROUP = "Main group";

/** Header comment for exports */
export const HEADER_COMMENT = "# CHECKLIST EXPORTED FROM EFIS Checklist Editor";
