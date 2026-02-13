import { cn } from "@/utils/tailwind";
import { ChecklistGroupCategory } from "@/types/checklist";

interface GroupIconProps {
  category: ChecklistGroupCategory;
  className?: string;
}

const CATEGORY_CONFIG: Record<
  ChecklistGroupCategory,
  { symbol: string; bgClass: string; textClass: string }
> = {
  [ChecklistGroupCategory.Normal]: {
    symbol: "\u2713",
    bgClass: "bg-efis-green-dim",
    textClass: "text-efis-green",
  },
  [ChecklistGroupCategory.Emergency]: {
    symbol: "!",
    bgClass: "bg-efis-red-dim",
    textClass: "text-efis-red",
  },
  [ChecklistGroupCategory.Abnormal]: {
    symbol: "\u26A0",
    bgClass: "bg-efis-yellow-dim",
    textClass: "text-efis-yellow",
  },
};

export function GroupIcon({ category, className }: GroupIconProps) {
  const config = CATEGORY_CONFIG[category];

  return (
    <span
      className={cn(
        "inline-flex size-4.5 shrink-0 items-center justify-center rounded text-[10px] leading-none font-bold",
        config.bgClass,
        config.textClass,
        className,
      )}
    >
      {config.symbol}
    </span>
  );
}
