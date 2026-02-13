import { cn } from "@/utils/tailwind";
import { ChecklistFormat } from "@/types/checklist";

interface FormatBadgeProps {
  format: ChecklistFormat;
  className?: string;
}

const FORMAT_CONFIG: Record<
  ChecklistFormat,
  { label: string; className: string }
> = {
  [ChecklistFormat.Ace]: {
    label: ".ace",
    className: "text-efis-green",
  },
  [ChecklistFormat.Gplt]: {
    label: ".gplt",
    className: "text-efis-accent",
  },
  [ChecklistFormat.AfsDynon]: {
    label: ".txt",
    className: "text-efis-purple",
  },
  [ChecklistFormat.ForeFlight]: {
    label: ".fmd",
    className: "text-efis-cyan",
  },
  [ChecklistFormat.Grt]: {
    label: ".txt",
    className: "text-efis-orange",
  },
  [ChecklistFormat.Json]: {
    label: ".json",
    className: "text-efis-accent",
  },
  [ChecklistFormat.Pdf]: {
    label: ".pdf",
    className: "text-efis-red",
  },
};

export function FormatBadge({ format, className }: FormatBadgeProps) {
  const config = FORMAT_CONFIG[format];

  return (
    <span
      className={cn(
        "bg-bg-overlay rounded-full px-1.5 font-mono text-[10px] leading-relaxed",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
