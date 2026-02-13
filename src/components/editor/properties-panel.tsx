import { useCallback, useMemo } from "react";
import { Check, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useChecklistStore } from "@/stores";
import {
  ChecklistItemType,
  ChecklistFormat,
  ChecklistGroupCategory,
} from "@/types/checklist";
import type {
  ChecklistFile,
  ChecklistGroup,
  Checklist,
  ChecklistItem,
} from "@/types/checklist";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ITEM_TYPE_LABELS: Record<ChecklistItemType, string> = {
  [ChecklistItemType.ChallengeResponse]: "Challenge / Response",
  [ChecklistItemType.ChallengeOnly]: "Challenge Only",
  [ChecklistItemType.Title]: "Title / Section",
  [ChecklistItemType.Note]: "Note",
  [ChecklistItemType.Warning]: "Warning",
  [ChecklistItemType.Caution]: "Caution",
};

const GROUP_CATEGORY_LABELS: Record<ChecklistGroupCategory, string> = {
  [ChecklistGroupCategory.Normal]: "Normal",
  [ChecklistGroupCategory.Emergency]: "Emergency",
  [ChecklistGroupCategory.Abnormal]: "Abnormal",
};

const INDENT_LABELS: Record<number, string> = {
  0: "0 \u2014 Top level",
  1: "1 \u2014 Under section",
  2: "2 \u2014 Sub-item",
  3: "3 \u2014 Deep nested",
};

/** Format compatibility by item type. All MVP types are broadly supported. */
const FORMAT_COMPATIBILITY: {
  format: string;
  key: ChecklistFormat;
}[] = [
  { format: "Garmin G3X", key: ChecklistFormat.Ace },
  { format: "AFS / Dynon", key: ChecklistFormat.AfsDynon },
  { format: "ForeFlight", key: ChecklistFormat.ForeFlight },
  { format: "Garmin Pilot", key: ChecklistFormat.Gplt },
  { format: "GRT", key: ChecklistFormat.Grt },
  { format: "PDF", key: ChecklistFormat.Pdf },
];

/**
 * Determine which formats support a given item with its current properties.
 *
 * Format-specific limitations (from reference editor docs):
 * - ForeFlight: no nested/indented items, no centering
 * - AFS/Dynon: all types via text formatting/prefixes
 * - GRT: similar to AFS/Dynon, all types via text formatting
 * - Garmin ACE: full support (no empty groups/checklists, but that's file-level)
 * - Garmin Pilot: full item support (group limitations are file-level)
 * - PDF: full support (export/display only)
 */
function getFormatSupport(item: ChecklistItem): Set<ChecklistFormat> {
  const allFormats = new Set<ChecklistFormat>([
    ChecklistFormat.Ace,
    ChecklistFormat.AfsDynon,
    ChecklistFormat.ForeFlight,
    ChecklistFormat.Gplt,
    ChecklistFormat.Grt,
    ChecklistFormat.Pdf,
  ]);

  // ForeFlight does not support nested/indented items
  if (item.indent > 0) {
    allFormats.delete(ChecklistFormat.ForeFlight);
  }

  // ForeFlight does not support centered formatting
  if (item.centered) {
    allFormats.delete(ChecklistFormat.ForeFlight);
  }

  return allFormats;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function findActiveGroup(
  file: ChecklistFile,
  checklistId: string,
): ChecklistGroup | undefined {
  return file.groups.find((g) =>
    g.checklists.some((c) => c.id === checklistId),
  );
}

function findActiveChecklist(
  group: ChecklistGroup,
  checklistId: string,
): Checklist | undefined {
  return group.checklists.find((c) => c.id === checklistId);
}

function findActiveItem(
  checklist: Checklist,
  itemId: string,
): ChecklistItem | undefined {
  return checklist.items.find((i) => i.id === itemId);
}

// ---------------------------------------------------------------------------
// Section Components
// ---------------------------------------------------------------------------

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-text-muted mb-2.5 text-[11px] font-semibold tracking-wide uppercase">
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Selected Item Section
// ---------------------------------------------------------------------------

interface SelectedItemSectionProps {
  item: ChecklistItem;
  onTypeChange: (type: ChecklistItemType) => void;
  onChallengeChange: (text: string) => void;
  onResponseChange: (text: string) => void;
}

function SelectedItemSection({
  item,
  onTypeChange,
  onChallengeChange,
  onResponseChange,
}: SelectedItemSectionProps) {
  const hasResponse = item.type === ChecklistItemType.ChallengeResponse;

  return (
    <div className="border-border border-b px-3.5 py-3">
      <SectionHeader>Selected Item</SectionHeader>

      {/* Type selector */}
      <div className="mb-3">
        <Label className="text-muted-foreground mb-1 block text-[11px]">
          Type
        </Label>
        <Select value={item.type} onValueChange={onTypeChange}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(ITEM_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Challenge text */}
      <div className="mb-3">
        <Label className="text-muted-foreground mb-1 block text-[11px]">
          {item.type === ChecklistItemType.Title
            ? "Section Title"
            : item.type === ChecklistItemType.Note
              ? "Note Text"
              : item.type === ChecklistItemType.Warning
                ? "Warning Text"
                : item.type === ChecklistItemType.Caution
                  ? "Caution Text"
                  : "Challenge Text"}
        </Label>
        <Input
          value={item.challengeText}
          onChange={(e) => onChallengeChange(e.target.value)}
          placeholder="Enter text..."
          className="text-xs"
        />
      </div>

      {/* Response text (only for Challenge/Response) */}
      {hasResponse && (
        <div>
          <Label className="text-muted-foreground mb-1 block text-[11px]">
            Response Text
          </Label>
          <Input
            value={item.responseText}
            onChange={(e) => onResponseChange(e.target.value)}
            placeholder="Enter response..."
            className="text-xs"
          />
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Formatting Section
// ---------------------------------------------------------------------------

interface FormattingSectionProps {
  item: ChecklistItem;
  onIndentChange: (indent: string) => void;
  onCenteredChange: (centered: boolean) => void;
  onCollapsibleChange: (collapsible: boolean) => void;
}

function FormattingSection({
  item,
  onIndentChange,
  onCenteredChange,
  onCollapsibleChange,
}: FormattingSectionProps) {
  return (
    <div className="border-border border-b px-3.5 py-3">
      <SectionHeader>Formatting</SectionHeader>

      {/* Indent level */}
      <div className="mb-3">
        <Label className="text-muted-foreground mb-1 block text-[11px]">
          Indent Level
        </Label>
        <Select value={String(item.indent)} onValueChange={onIndentChange}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(INDENT_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Centered toggle */}
      <div className="mb-3 flex items-center justify-between">
        <Label className="text-muted-foreground text-[11px]">Centered</Label>
        <Switch
          size="sm"
          checked={item.centered}
          onCheckedChange={onCenteredChange}
        />
      </div>

      {/* Collapsible toggle */}
      <div className="flex items-center justify-between">
        <Label className="text-muted-foreground text-[11px]">Collapsible</Label>
        <Switch
          size="sm"
          checked={item.collapsible}
          onCheckedChange={onCollapsibleChange}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Format Compatibility Section
// ---------------------------------------------------------------------------

interface FormatCompatibilitySectionProps {
  item: ChecklistItem;
}

function FormatCompatibilitySection({ item }: FormatCompatibilitySectionProps) {
  const supported = useMemo(() => getFormatSupport(item), [item]);

  return (
    <div className="border-border border-b px-3.5 py-3">
      <SectionHeader>Format Compatibility</SectionHeader>

      <div className="space-y-1.5">
        {FORMAT_COMPATIBILITY.map(({ format, key }) => {
          const isSupported = supported.has(key);
          return (
            <div key={key} className="flex items-center justify-between">
              <span className="text-text-secondary text-[11px]">{format}</span>
              {isSupported ? (
                <span className="text-efis-green flex items-center gap-1 text-[11px]">
                  <Check className="size-3" />
                  Supported
                </span>
              ) : (
                <span className="text-text-muted flex items-center gap-1 text-[11px]">
                  <X className="size-3" />
                  Unsupported
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Group Info Section
// ---------------------------------------------------------------------------

interface GroupInfoSectionProps {
  group: ChecklistGroup;
  onCategoryChange: (category: ChecklistGroupCategory) => void;
}

function GroupInfoSection({ group, onCategoryChange }: GroupInfoSectionProps) {
  return (
    <div className="border-border border-b px-3.5 py-3">
      <SectionHeader>Group Info</SectionHeader>

      <div className="mb-3">
        <Label className="text-muted-foreground mb-1 block text-[11px]">
          Category
        </Label>
        <Select value={group.category} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-full" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(GROUP_CATEGORY_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PropertiesPanel
// ---------------------------------------------------------------------------

export function PropertiesPanel() {
  const files = useChecklistStore((s) => s.files);
  const activeFileId = useChecklistStore((s) => s.activeFileId);
  const activeChecklistId = useChecklistStore((s) => s.activeChecklistId);
  const activeItemId = useChecklistStore((s) => s.activeItemId);
  const updateItem = useChecklistStore((s) => s.updateItem);
  const updateGroupCategory = useChecklistStore((s) => s.updateGroupCategory);

  // Derive active data
  const activeFile = activeFileId ? files[activeFileId] : null;

  const activeGroup = useMemo(() => {
    if (!activeFile || !activeChecklistId) return null;
    return findActiveGroup(activeFile, activeChecklistId) ?? null;
  }, [activeFile, activeChecklistId]);

  const activeChecklist = useMemo(() => {
    if (!activeGroup || !activeChecklistId) return null;
    return findActiveChecklist(activeGroup, activeChecklistId) ?? null;
  }, [activeGroup, activeChecklistId]);

  const activeItem = useMemo(() => {
    if (!activeChecklist || !activeItemId) return null;
    return findActiveItem(activeChecklist, activeItemId) ?? null;
  }, [activeChecklist, activeItemId]);

  // Item update helper
  const handleUpdateItem = useCallback(
    (changes: Partial<Omit<ChecklistItem, "id">>) => {
      if (!activeFileId || !activeGroup || !activeChecklistId || !activeItemId)
        return;
      updateItem(
        activeFileId,
        activeGroup.id,
        activeChecklistId,
        activeItemId,
        changes,
      );
    },
    [activeFileId, activeGroup, activeChecklistId, activeItemId, updateItem],
  );

  // Item field handlers
  const handleTypeChange = useCallback(
    (type: ChecklistItemType) => {
      const changes: Partial<Omit<ChecklistItem, "id">> = { type };
      // Clear response text when switching away from ChallengeResponse
      if (type !== ChecklistItemType.ChallengeResponse) {
        changes.responseText = "";
      }
      handleUpdateItem(changes);
    },
    [handleUpdateItem],
  );

  const handleChallengeChange = useCallback(
    (challengeText: string) => handleUpdateItem({ challengeText }),
    [handleUpdateItem],
  );

  const handleResponseChange = useCallback(
    (responseText: string) => handleUpdateItem({ responseText }),
    [handleUpdateItem],
  );

  const handleIndentChange = useCallback(
    (value: string) =>
      handleUpdateItem({ indent: Number(value) as 0 | 1 | 2 | 3 }),
    [handleUpdateItem],
  );

  const handleCenteredChange = useCallback(
    (centered: boolean) => handleUpdateItem({ centered }),
    [handleUpdateItem],
  );

  const handleCollapsibleChange = useCallback(
    (collapsible: boolean) => handleUpdateItem({ collapsible }),
    [handleUpdateItem],
  );

  const handleCategoryChange = useCallback(
    (category: ChecklistGroupCategory) => {
      if (!activeFileId || !activeGroup) return;
      updateGroupCategory(activeFileId, activeGroup.id, category);
    },
    [activeFileId, activeGroup, updateGroupCategory],
  );

  return (
    <div className="border-border bg-bg-surface flex min-h-0 w-70 shrink-0 flex-col border-l">
      {/* Header */}
      <div className="border-border border-b px-3.5 py-3">
        <span className="text-muted-foreground text-[11px] font-semibold tracking-wide uppercase">
          Item Properties
        </span>
      </div>

      {/* Content */}
      <ScrollArea className="min-h-0 flex-1">
        {activeItem ? (
          <>
            <SelectedItemSection
              item={activeItem}
              onTypeChange={handleTypeChange}
              onChallengeChange={handleChallengeChange}
              onResponseChange={handleResponseChange}
            />
            <FormattingSection
              item={activeItem}
              onIndentChange={handleIndentChange}
              onCenteredChange={handleCenteredChange}
              onCollapsibleChange={handleCollapsibleChange}
            />
            <FormatCompatibilitySection item={activeItem} />
          </>
        ) : (
          <div className="text-text-muted px-3.5 py-6 text-center text-xs">
            Select an item to view its properties
          </div>
        )}
        {activeGroup && (
          <GroupInfoSection
            group={activeGroup}
            onCategoryChange={handleCategoryChange}
          />
        )}
      </ScrollArea>
    </div>
  );
}
