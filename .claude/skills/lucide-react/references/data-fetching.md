# Data Fetching Reference

## Contents

- Overview
- IPC-Based Data Flow
- Icon Data Patterns
- Anti-Patterns

## Overview

Lucide icons are static imports — they require no data fetching. This file documents how icons interact with the project's data flow, which uses **oRPC over IPC** (not HTTP). See the **orpc** skill for the full IPC pattern.

## IPC-Based Data Flow

This is an Electron app. All data flows through IPC, not HTTP. There is no REST API, no `fetch()`, no server state caching needed.

```
Renderer (React) → oRPC client → MessagePort → Main Process → File System
```

Icons appear in UI components that display data fetched via IPC. The icons themselves are always statically imported.

### Example: File List with Format Icons

```tsx
import { FileText } from "lucide-react";
import { cn } from "@/utils/cn";
import { useChecklistStore } from "@/stores/checklist-store";
import type { ChecklistFormat } from "@/types/checklist";

const FORMAT_COLORS: Record<ChecklistFormat, string> = {
  Ace: "text-green",
  Json: "text-accent",
  Gplt: "text-accent",
  AfsDynon: "text-purple",
  ForeFlight: "text-cyan",
  Grt: "text-orange",
  Pdf: "text-red",
};

function FileList() {
  const files = useChecklistStore((s) => Array.from(s.files.values()));

  return (
    <div>
      {files.map((file) => (
        <button key={file.id} className="flex items-center gap-2 px-3.5 py-1.5">
          <FileText className={cn("size-4", FORMAT_COLORS[file.format])} />
          <span className="text-muted-foreground text-xs">{file.name}</span>
        </button>
      ))}
    </div>
  );
}
```

### Example: Import Action with Loading Icon

```tsx
import { Upload, Loader2 } from "lucide-react";
import { useState } from "react";
import { importFile } from "@/actions/checklist";
import { toast } from "sonner";

function ImportButton() {
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    setLoading(true);
    try {
      const file = await importFile();
      if (file) toast.success(`Imported ${file.name}`);
    } catch (err) {
      toast.error("Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleImport}
      disabled={loading}
      className="flex items-center gap-1.5"
    >
      {loading ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Upload className="size-3.5" />
      )}
      <span>Import</span>
    </button>
  );
}
```

## WARNING: useEffect for Data Fetching

This project uses oRPC for IPC communication. The **orpc** skill covers the correct patterns. NEVER use `useEffect` + `fetch()` — there is no HTTP server.

```tsx
// BAD — there is no REST API in this Electron app
useEffect(() => {
  fetch("/api/checklists")
    .then((r) => r.json())
    .then(setFiles);
}, []);

// GOOD — use IPC actions
import { getRecentFiles } from "@/actions/checklist";
useEffect(() => {
  getRecentFiles().then(setRecentFiles);
}, []);
```

For complex async state, see the **zustand** skill for store-driven patterns. For toast feedback on IPC operations, see the **sonner** skill.

## Icon Loading States

Use `Loader2` with `animate-spin` for any async operation:

```tsx
import { Loader2 } from "lucide-react";

// Consistent loading pattern across the app
<Loader2 className="text-muted-foreground size-4 animate-spin" />;
```

This replaces FontAwesome's `faSpinner`. The `Loader2` icon has evenly spaced segments that animate smoothly — prefer it over `Loader` which has a single arc.
