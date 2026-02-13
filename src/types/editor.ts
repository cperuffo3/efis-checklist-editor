/** Editor UI state tracked alongside the data stores */
export interface EditorState {
  /** Currently active file in the files sidebar */
  activeFileId: string | null;
  /** Currently selected checklist in the tree panel */
  activeChecklistId: string | null;
  /** Currently selected item in the editor */
  activeItemId: string | null;
  /** Item currently in inline-editing mode (null = not editing) */
  editingItemId: string | null;
  /** Set of item IDs whose children are collapsed in the editor */
  collapsedItemIds: Set<string>;
}
