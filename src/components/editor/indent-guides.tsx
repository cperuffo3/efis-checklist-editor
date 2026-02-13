import { cn } from "@/utils/tailwind";
import { ChecklistItemType } from "@/types/checklist";

// ---------------------------------------------------------------------------
// Adjustable guide constants — tweak these to tune line positions & sizes
// ---------------------------------------------------------------------------

/** Width of each indent column */
const COL_WIDTH = "w-5"; // 20px

/** X-offset of the vertical line from each column's left edge */
const LINE_LEFT = "left-[15px]";

/** Width of the horizontal tick connector */
const TICK_WIDTH = "w-2";

// ---------------------------------------------------------------------------
// Color mapping — parent type → Tailwind text color for connector lines
// ---------------------------------------------------------------------------

export const ITEM_TYPE_LINE_COLOR: Record<ChecklistItemType, string> = {
  [ChecklistItemType.ChallengeResponse]: "text-efis-green",
  [ChecklistItemType.ChallengeOnly]: "text-efis-accent",
  [ChecklistItemType.Title]: "text-efis-purple",
  [ChecklistItemType.Note]: "text-text-muted",
  [ChecklistItemType.Warning]: "text-efis-yellow",
  [ChecklistItemType.Caution]: "text-efis-orange",
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LineSegment {
  /** Whether the vertical line extends past this row (true) or stops at center (false = last child) */
  continues: boolean;
  /** Tailwind text color class matching the parent item type (e.g. "text-efis-purple") */
  colorClass: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface IndentGuidesProps {
  segments: LineSegment[];
}

export function IndentGuides({ segments }: IndentGuidesProps) {
  if (segments.length === 0) return null;

  return (
    <div className="flex shrink-0 self-stretch">
      {segments.map((seg, i) => {
        const isDeepest = i === segments.length - 1;

        return (
          <div
            key={i}
            className={cn("relative shrink-0", COL_WIDTH, seg.colorClass)}
          >
            {/* Vertical line — full height if continues, half height if last child */}
            {/* Extends 1px beyond row bounds (-top-px / -bottom-px) to cover row margin gaps */}
            <div
              className={cn(
                "absolute border-l-2 border-current",
                LINE_LEFT,
                seg.continues
                  ? "-top-px -bottom-px"
                  : "-top-px h-[calc(50%+1px)]",
              )}
            />

            {/* Horizontal tick — drawn on the deepest column (connects to type indicator)
                and on any non-deepest column where the line ends (└ terminator) */}
            {(isDeepest || !seg.continues) && (
              <div
                className={cn(
                  "absolute top-[calc(50%-1px)] border-t-2 border-current",
                  LINE_LEFT,
                  TICK_WIDTH,
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
