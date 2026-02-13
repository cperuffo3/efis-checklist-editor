# Forms Reference

## Contents

- Icons in Form Inputs
- Properties Panel Form Fields
- Inline Editing Icons
- Select Dropdowns with Icons
- Anti-Patterns

## Icons in Form Inputs

The properties panel uses form inputs with labels. Icons appear alongside inputs as visual cues, not inside them.

### Input with Label and Icon Prefix

```tsx
import { Type, AlignLeft } from "lucide-react";
import { Input } from "@/components/ui/input";

function ChallengeInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <label className="text-muted-foreground flex items-center gap-1 text-[11px]">
        <Type className="size-3" />
        Challenge Text
      </label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-elevated text-xs"
        placeholder="Enter challenge..."
      />
    </div>
  );
}
```

See the **shadcn-ui** skill for `Input` component styling.

## Properties Panel Form Fields

The properties panel is the primary form surface in this app. All fields update the Zustand store bidirectionally.

```tsx
import { Hash, AlignCenter, FoldVertical } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function FormattingSection({
  indent,
  centered,
  collapsible,
  onIndentChange,
  onCenteredChange,
  onCollapsibleChange,
}: {
  indent: number;
  centered: boolean;
  collapsible: boolean;
  onIndentChange: (v: number) => void;
  onCenteredChange: (v: boolean) => void;
  onCollapsibleChange: (v: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-muted text-[11px] font-semibold tracking-wide uppercase">
        Formatting
      </h3>

      <div className="space-y-1">
        <label className="text-muted-foreground text-[11px]">
          Indent Level
        </label>
        <Select
          value={String(indent)}
          onValueChange={(v) => onIndentChange(Number(v))}
        >
          <SelectTrigger className="bg-elevated text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">0 — Top level</SelectItem>
            <SelectItem value="1">1 — Under section</SelectItem>
            <SelectItem value="2">2 — Sub-item</SelectItem>
            <SelectItem value="3">3 — Deep nested</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between">
        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <AlignCenter className="size-3" />
          Centered
        </label>
        <Switch checked={centered} onCheckedChange={onCenteredChange} />
      </div>

      <div className="flex items-center justify-between">
        <label className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
          <FoldVertical className="size-3" />
          Collapsible
        </label>
        <Switch checked={collapsible} onCheckedChange={onCollapsibleChange} />
      </div>
    </div>
  );
}
```

## Inline Editing Icons

When a checklist item enters edit mode, the edit icon (`Pencil`) triggers it. The icon appears on row hover.

```tsx
import { Pencil, Check, X } from "lucide-react";

function InlineEditTrigger({ onEdit }: { onEdit: () => void }) {
  return (
    <button
      onClick={onEdit}
      className="opacity-0 transition-opacity duration-150 group-hover:opacity-100"
    >
      <Pencil className="text-muted-foreground hover:text-foreground size-3" />
    </button>
  );
}

function InlineEditActions({
  onCommit,
  onCancel,
}: {
  onCommit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button onClick={onCommit} className="hover:bg-hover rounded p-0.5">
        <Check className="text-green size-3.5" />
      </button>
      <button onClick={onCancel} className="hover:bg-hover rounded p-0.5">
        <X className="text-red size-3.5" />
      </button>
    </div>
  );
}
```

## Select Dropdowns with Icons

The type selector in the properties panel shows colored indicators alongside each option:

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ChecklistItemType } from "@/types/checklist";

const TYPES: { value: ChecklistItemType; label: string; dot: string }[] = [
  {
    value: "ChallengeResponse",
    label: "Challenge / Response",
    dot: "bg-green",
  },
  { value: "ChallengeOnly", label: "Challenge Only", dot: "bg-accent" },
  { value: "Title", label: "Title / Section", dot: "bg-purple" },
  { value: "Note", label: "Note / Plaintext", dot: "bg-muted" },
  { value: "Warning", label: "Warning", dot: "bg-yellow" },
  { value: "Caution", label: "Caution", dot: "bg-orange" },
];

function TypeSelector({
  value,
  onChange,
}: {
  value: ChecklistItemType;
  onChange: (v: ChecklistItemType) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => onChange(v as ChecklistItemType)}
    >
      <SelectTrigger className="bg-elevated text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TYPES.map(({ value: v, label, dot }) => (
          <SelectItem key={v} value={v}>
            <div className="flex items-center gap-2">
              <div className={`size-2 rounded-full ${dot}`} />
              <span>{label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

## WARNING: Icons Inside Input Elements

**The Problem:**

```tsx
// BAD — icon inside input via absolute positioning with z-index issues
<div className="relative">
  <Search className="absolute top-1/2 left-2 size-4 -translate-y-1/2" />
  <input className="pl-8" />
</div>
```

**Why This Breaks:**

1. Fragile positioning that breaks at different font sizes
2. Click on the icon area doesn't focus the input
3. The shadcn `Input` component doesn't support prefixed icons natively

**The Fix:**

Use the search trigger pattern from the toolbar — a button styled like an input:

```tsx
import { Search } from "lucide-react";

function SearchTrigger({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border-border bg-elevated text-muted flex min-w-[220px] items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs"
    >
      <Search className="size-3.5" />
      <span>Search checklists...</span>
      <kbd className="bg-overlay ml-auto rounded px-1.5 text-[10px]">
        Ctrl+K
      </kbd>
    </button>
  );
}
```

This is the pattern used for the command palette trigger in the toolbar.
