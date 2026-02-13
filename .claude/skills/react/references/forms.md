# Forms Reference

## Contents

- Form Approach
- Controlled Inputs
- Properties Panel Pattern
- Inline Editing Pattern
- Select / Dropdown Pattern
- WARNING: Missing Form Library
- Validation with Zod

## Form Approach

This project uses **controlled components** with `useState` for simple forms (properties panel, inline editing). There is no form library like react-hook-form installed. For the MVP scope (properties panel, inline item editing), controlled inputs are sufficient.

## Controlled Inputs

Standard pattern using shadcn/ui `Input` component:

```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MetadataFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
}

function MetadataField({ label, value, onChange }: MetadataFieldProps) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-[11px]">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-elevated border-border text-foreground rounded-[4px] px-2.5 py-1.5 text-xs"
      />
    </div>
  );
}
```

## Properties Panel Pattern

The properties panel edits the selected item and file metadata. All fields are bidirectionally bound to the Zustand store.

```tsx
// Pattern for the properties panel (Phase 9)
function PropertiesPanel() {
  const activeItem = useChecklistStore((s) => s.activeItem);
  const updateItem = useChecklistStore((s) => s.updateItem);
  const updateFileMetadata = useChecklistStore((s) => s.updateFileMetadata);

  if (!activeItem) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center text-xs">
        Select an item to view its properties
      </div>
    );
  }

  return (
    <div className="space-y-5 p-3.5">
      <section>
        <h3 className="text-muted mb-2 text-[11px] font-semibold tracking-wide uppercase">
          Selected Item
        </h3>
        <MetadataField
          label="Challenge Text"
          value={activeItem.challengeText}
          onChange={(v) => updateItem(activeItem.id, { challengeText: v })}
        />
        {activeItem.type === "ChallengeResponse" && (
          <MetadataField
            label="Response Text"
            value={activeItem.responseText ?? ""}
            onChange={(v) => updateItem(activeItem.id, { responseText: v })}
          />
        )}
      </section>
    </div>
  );
}
```

Key points:

- Read from Zustand with selectors
- Write back on every change (no submit button)
- Conditional fields based on item type
- Empty state when nothing is selected

## Inline Editing Pattern

Double-click or Enter on a selected item enters edit mode. The item row switches from display to input.

```tsx
// Pattern for checklist-item-row.tsx (Phase 8)
interface ItemRowProps {
  item: ChecklistItem;
  isEditing: boolean;
  onStartEdit: () => void;
  onCommitEdit: (updates: Partial<ChecklistItem>) => void;
  onCancelEdit: () => void;
}

function ItemRow({
  item,
  isEditing,
  onStartEdit,
  onCommitEdit,
  onCancelEdit,
}: ItemRowProps) {
  const [challengeText, setChallengeText] = useState(item.challengeText);
  const [responseText, setResponseText] = useState(item.responseText ?? "");

  // Reset local state when entering edit mode
  useEffect(() => {
    if (isEditing) {
      setChallengeText(item.challengeText);
      setResponseText(item.responseText ?? "");
    }
  }, [isEditing, item.challengeText, item.responseText]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onCommitEdit({ challengeText, responseText });
    }
    if (e.key === "Escape") {
      onCancelEdit();
    }
  };

  if (!isEditing) {
    return (
      <div onDoubleClick={onStartEdit}>
        <span className="text-foreground text-[13px]">
          {item.challengeText}
        </span>
        {item.type === "ChallengeResponse" && (
          <span className="text-accent text-[13px] font-medium">
            {item.responseText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex gap-2" onKeyDown={handleKeyDown}>
      <Input
        autoFocus
        value={challengeText}
        onChange={(e) => setChallengeText(e.target.value)}
        className="flex-1 text-xs"
      />
      {item.type === "ChallengeResponse" && (
        <Input
          value={responseText}
          onChange={(e) => setResponseText(e.target.value)}
          className="w-2/5 text-xs"
        />
      )}
    </div>
  );
}
```

Key points:

- Local state for edit buffer (don't write to store until commit)
- Reset local state when `isEditing` changes
- Enter commits, Escape cancels
- Tab moves between challenge and response fields
- `autoFocus` on the first input when entering edit mode

## Select / Dropdown Pattern

Using shadcn/ui `Select` for type selection. See the **shadcn-ui** skill for full API.

```tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function TypeSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-muted-foreground text-[11px]">Type</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="bg-elevated border-border text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ChallengeResponse">
            Challenge / Response
          </SelectItem>
          <SelectItem value="ChallengeOnly">Challenge Only</SelectItem>
          <SelectItem value="Title">Title / Section Header</SelectItem>
          <SelectItem value="Note">Note / Plaintext</SelectItem>
          <SelectItem value="Warning">Warning</SelectItem>
          <SelectItem value="Caution">Caution</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
```

## WARNING: Missing Form Library

**Detected:** No `react-hook-form` or equivalent in dependencies.

**Impact:** For the current MVP scope (properties panel, inline editing), controlled components are fine. If forms grow complex (multi-step wizard, cross-field validation, large field counts), install react-hook-form.

### When to Add react-hook-form

Add it when any of these apply:

- Form has 8+ fields
- Cross-field validation is needed
- Form submission must be debounced
- You need `isDirty`, `isValid`, `touchedFields` tracking

```bash
pnpm add react-hook-form @hookform/resolvers
```

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const form = useForm({
  resolver: zodResolver(metadataSchema),
  defaultValues: { registration: "", makeModel: "" },
});
```

## Validation with Zod

See the **zod** skill. Zod schemas already validate IPC inputs on the main process side. For client-side validation:

```tsx
import { z } from "zod";

const metadataSchema = z.object({
  aircraftRegistration: z.string().max(10),
  makeModel: z.string().max(50),
  copyright: z.string().optional(),
});

function validateMetadata(data: unknown) {
  const result = metadataSchema.safeParse(data);
  if (!result.success) {
    toast.error("Invalid metadata", {
      description: result.error.issues[0]?.message,
    });
    return null;
  }
  return result.data;
}
```
