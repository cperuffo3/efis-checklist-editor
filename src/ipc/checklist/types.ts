import type { ChecklistFormat } from "@/types";

/** An entry in the recent files list persisted to disk */
export interface RecentFileEntry {
  filePath: string;
  fileName: string;
  format: ChecklistFormat;
  lastOpened: number;
}
