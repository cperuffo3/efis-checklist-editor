All skill files have been created. Here's a summary of what was generated:

**SKILL.md** - Main skill file with quick start patterns, key concepts table, common patterns (Provider+Hook context, conditional rendering), and links to all references.

**references/hooks.md** - useEffect with IPC calls, cleanup patterns (active flag, event subscriptions), custom context hooks, useCallback guidance, and two WARNING sections (stale closures, missing cleanup).

**references/components.md** - Component structure, props typing (`ComponentProps<"a">`), barrel exports, shadcn/ui composition, layout patterns (Provider+Content split), conditional rendering, and WARNINGs for inline styles and modifying shadcn/ui files.

**references/data-fetching.md** - IPC architecture overview (no HTTP), action wrapper pattern, loading/error state machines, event subscriptions, TanStack Query integration, and WARNINGs for useEffect data fetching and missing error handling.

**references/state.md** - State categories table, useState patterns, Context for shared state, Zustand selectors, derived state computation, and WARNINGs for state-for-derived-values and prop drilling.

**references/forms.md** - Controlled inputs with shadcn/ui, properties panel pattern, inline editing pattern (edit buffer with commit/cancel), Select/dropdown pattern, Zod validation, and a WARNING about the missing form library with guidance on when to add react-hook-form.

**references/performance.md** - React Compiler impact (reduces manual memoization), memoization guidelines, Zustand selector optimization, component splitting, list rendering with stable keys, code splitting with React.lazy, and WARNINGs for inline object props and index-as-key.

All files reference the actual codebase patterns, use project-specific examples (oRPC IPC, Electron, shadcn/ui), and cross-reference related skills (zustand, tailwind, shadcn-ui, electron, orpc, etc.).
