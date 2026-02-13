/** Item type determines rendering and behavior in the editor */
export enum ChecklistItemType {
  ChallengeResponse = "challenge_response",
  ChallengeOnly = "challenge_only",
  Title = "title",
  Note = "note",
  Warning = "warning",
  Caution = "caution",
}

/**
 * A single checklist item.
 *
 * Items are stored in a flat array per checklist. Parent-child relationships
 * are inferred from position + indent level: an item is a child of the nearest
 * preceding item with a lower indent level.
 */
export interface ChecklistItem {
  id: string;
  type: ChecklistItemType;
  challengeText: string;
  /** Only used when type is ChallengeResponse */
  responseText: string;
  /** Indent depth 0-3. Higher indent = nested under nearest preceding item with lower indent. */
  indent: 0 | 1 | 2 | 3;
  centered: boolean;
  /** When true, this item acts as a collapsible parent for subsequent deeper-indented items */
  collapsible: boolean;
}

/** A named checklist containing an ordered list of items */
export interface Checklist {
  id: string;
  name: string;
  items: ChecklistItem[];
}

/** Group category determines icon color and styling in the tree panel */
export enum ChecklistGroupCategory {
  Normal = "normal",
  Emergency = "emergency",
  Abnormal = "abnormal",
}

/** A named group of checklists (e.g., "Normal", "Emergency") */
export interface ChecklistGroup {
  id: string;
  name: string;
  category: ChecklistGroupCategory;
  checklists: Checklist[];
}

/** File-level metadata (aircraft info, copyright) */
export interface ChecklistFileMetadata {
  aircraftRegistration: string;
  makeModel: string;
  copyright: string;
}

/** Supported file formats for import/export */
export enum ChecklistFormat {
  Ace = "ace",
  Gplt = "gplt",
  AfsDynon = "afs_dynon",
  ForeFlight = "foreflight",
  Grt = "grt",
  Json = "json",
  Pdf = "pdf",
}

/** Top-level container representing a single checklist file */
export interface ChecklistFile {
  id: string;
  name: string;
  format: ChecklistFormat;
  /** Absolute path on disk, undefined for unsaved new files */
  filePath?: string;
  groups: ChecklistGroup[];
  metadata: ChecklistFileMetadata;
  lastModified: number;
  /** Whether the file has unsaved changes */
  dirty: boolean;
}
