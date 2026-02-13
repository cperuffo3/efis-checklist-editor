import { cn } from "@/utils/tailwind";
import { ChecklistItemType } from "@/types/checklist";

// ---------------------------------------------------------------------------
// Adjustable constants — must match indent-guides.tsx for alignment
// ---------------------------------------------------------------------------

/** X-offset of the downward connector line (must match indent-guides LINE_LEFT) */
const CONNECTOR_LEFT = "left-[15px]";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

interface TypeIndicatorProps {
  type: ChecklistItemType;
  /** When true, draws a vertical line from center to bottom (for parent items with children) */
  showConnector?: boolean;
  /** Tailwind text color class for the connector line (e.g. "text-efis-purple") */
  connectorColorClass?: string;
  className?: string;
}

const TYPE_CONFIG: Record<
  ChecklistItemType,
  { shape: "circle" | "bar"; colorClass: string }
> = {
  [ChecklistItemType.ChallengeResponse]: {
    shape: "circle",
    colorClass: "bg-efis-green",
  },
  [ChecklistItemType.ChallengeOnly]: {
    shape: "circle",
    colorClass: "bg-efis-accent",
  },
  [ChecklistItemType.Title]: {
    shape: "bar",
    colorClass: "bg-efis-purple",
  },
  [ChecklistItemType.Note]: {
    shape: "circle",
    colorClass: "bg-text-muted",
  },
  [ChecklistItemType.Warning]: {
    shape: "circle",
    colorClass: "bg-efis-yellow",
  },
  [ChecklistItemType.Caution]: {
    shape: "circle",
    colorClass: "bg-efis-orange",
  },
};

export function TypeIndicator({
  type,
  showConnector,
  connectorColorClass,
  className,
}: TypeIndicatorProps) {
  const config = TYPE_CONFIG[type];

  return (
    <div
      className={cn(
        "relative flex w-8 shrink-0 items-center justify-center",
        className,
      )}
    >
      <span
        className={cn(
          config.colorClass,
          config.shape === "circle"
            ? "size-1.5 rounded-full"
            : "h-0.75 w-3.5 rounded-sm",
        )}
      />

      {/* Downward connector for parent items — aligns with child indent guide lines */}
      {showConnector && connectorColorClass && (
        <div
          className={cn(
            "absolute top-[calc(50%+8px)] -bottom-px border-l-2 border-current",
            CONNECTOR_LEFT,
            connectorColorClass,
          )}
        />
      )}
    </div>
  );
}
