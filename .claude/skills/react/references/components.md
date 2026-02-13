# Components Reference

## Contents

- Component Structure
- Props Typing
- Barrel Exports
- shadcn/ui Composition
- Layout Components
- Conditional Rendering
- WARNING: Inline Styles
- WARNING: Modifying shadcn/ui Components

## Component Structure

All components are functional, named exports, kebab-case files, PascalCase functions.

```tsx
// src/components/editor/format-badge.tsx
import { cn } from "@/utils/cn";

interface FormatBadgeProps {
  format: string;
  className?: string;
}

export function FormatBadge({ format, className }: FormatBadgeProps) {
  return (
    <span
      className={cn("bg-overlay rounded-full px-1.5 text-[10px]", className)}
    >
      {format}
    </span>
  );
}
```

Rules:

- Props interface named `<Component>Props`, defined directly above the component
- Always accept `className?` if the component renders a visible element
- Use `cn()` to merge caller classes with defaults (see the **tailwind** skill)

## Props Typing

Use `ComponentProps<"element">` when wrapping native elements. Avoids re-declaring standard HTML props.

```tsx
// src/components/shared/external-link.tsx
import { ComponentProps } from "react";

export function ExternalLink({
  children,
  className,
  href,
  ...props
}: ComponentProps<"a">) {
  function open() {
    if (!href) return;
    openExternalLink(href);
  }

  return (
    <a
      className={cn("cursor-pointer underline", className)}
      {...props}
      onClick={open}
    >
      {children}
    </a>
  );
}
```

For components that wrap shadcn/ui, extend the shadcn component's props:

```tsx
import { Button, type ButtonProps } from "@/components/ui/button";

interface ToolbarButtonProps extends ButtonProps {
  icon: React.ReactNode;
  label?: string;
}
```

## Barrel Exports

Every component folder gets an `index.ts` barrel file for clean imports.

```tsx
// src/components/home/index.ts
export { HeroSection } from "./hero-section";
export { QuickStartCard } from "./quick-start-card";
export { FeaturesGrid } from "./features-grid";
export { ScriptsCard } from "./scripts-card";
export { CustomizationCard } from "./customization-card";
export { AiSectionCard } from "./ai-section-card";
```

Import as: `import { HeroSection, FeaturesGrid } from "@/components/home";`

For components that also export hooks/providers, include them all:

```tsx
// src/components/shared/index.ts
export { DragWindowRegion } from "./drag-window-region";
export {
  UpdateNotification,
  UpdateNotificationProvider,
  useUpdateNotification,
} from "./update-notification";
```

## shadcn/ui Composition

Use shadcn/ui primitives from `@/components/ui/*` as building blocks. See the **shadcn-ui** skill for the full component list.

```tsx
// Card composition pattern
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function QuickStartCard() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">Quick Start</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="bg-muted rounded-md px-3 py-2 font-mono text-xs">
          <code>pnpm start</code>
        </div>
      </CardContent>
    </Card>
  );
}
```

Never modify files in `src/components/ui/`. They are managed by the shadcn CLI and will be overwritten on update.

## Layout Components

Two-level pattern: Provider wrapper + Content component.

```tsx
// src/layouts/base-layout.tsx
function BaseLayoutContent({ children }: { children: React.ReactNode }) {
  const { state } = useUpdateNotification();
  // ... layout with hooks
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <DragWindowRegion title="EFIS Checklist Editor" />
      <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      <footer className="border-border flex h-10 shrink-0 items-center border-t px-4">
        {/* footer content */}
      </footer>
    </div>
  );
}

export default function BaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UpdateNotificationProvider>
      <BaseLayoutContent>{children}</BaseLayoutContent>
    </UpdateNotificationProvider>
  );
}
```

This separation lets `BaseLayoutContent` use `useUpdateNotification()` because it's inside the provider.

## Conditional Rendering

### Early returns for edge cases

```tsx
if (dismissed || state === "idle") return null;
```

### State-driven blocks

```tsx
{
  state === "checking" && <Spinner />;
}
{
  state === "available" && (
    <div className="flex gap-2">
      <Button size="sm" onClick={downloadUpdate}>
        Download
      </Button>
      <Button size="sm" variant="outline" onClick={dismiss}>
        Later
      </Button>
    </div>
  );
}
{
  state === "error" && <p className="text-destructive text-sm">{error}</p>;
}
```

### Platform-specific rendering

```tsx
const isMacOS = platform === "darwin";
return <div>{!isMacOS && <WindowButtons />}</div>;
```

## WARNING: Inline Styles

**The Problem:**

```tsx
// BAD - violates CLAUDE.md styling rules
<div style={{ backgroundColor: "#0d1117", padding: "16px" }}>
```

**Why This Breaks:**

1. CLAUDE.md explicitly forbids inline styles, CSS files, and hardcoded colors
2. Inline styles bypass Tailwind's design system and dark mode support
3. Cannot be sorted/linted by prettier-plugin-tailwindcss

**The Fix:**

```tsx
// GOOD - use Tailwind design tokens
<div className="bg-bg-base p-4">
```

**Exception:** CSS custom properties that have no Tailwind equivalent:

```tsx
// OK - only for CSS variables without a utility class
<div style={{ background: "var(--gradient-page)" }}>
```

## WARNING: Modifying shadcn/ui Components

**The Problem:**

```tsx
// BAD - editing src/components/ui/button.tsx directly
// Adding custom variant inside the shadcn component file
```

**Why This Breaks:**

1. `pnpm run bump-shadcn-components` overwrites all files in `src/components/ui/`
2. Custom changes are silently lost
3. Next developer runs the update script and your variant disappears

**The Fix:**

```tsx
// GOOD - create a wrapper in src/components/shared/ or src/components/editor/
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/utils/cn";

interface ToolbarButtonProps extends ButtonProps {
  active?: boolean;
}

export function ToolbarButton({
  active,
  className,
  ...props
}: ToolbarButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn(
        "text-muted-foreground",
        active && "bg-active text-foreground",
        className,
      )}
      {...props}
    />
  );
}
```

## Component Organization Checklist

Copy this checklist when creating a new feature area:

- [ ] Create `src/components/<feature>/` directory
- [ ] One component per file, kebab-case filename
- [ ] Props interface defined above component
- [ ] Accept `className?` prop if rendering visible elements
- [ ] Use `cn()` for class merging
- [ ] Create `index.ts` barrel export
- [ ] Import shadcn/ui primitives, never modify them
