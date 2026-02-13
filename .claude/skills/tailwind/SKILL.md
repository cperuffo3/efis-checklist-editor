The Tailwind CSS skill has been generated with 3 files:

- **`.claude/skills/tailwind/SKILL.md`** (120 lines) — Quick reference covering the CSS-first v4 configuration, `cn()` usage, token patterns, and the critical `@/utils/tailwind` import path note
- **`.claude/skills/tailwind/references/patterns.md`** (148 lines) — Theme token architecture, `@theme inline` mapping, EFIS-specific planned tokens, 4 documented anti-patterns (hardcoded colors, inline styles, string concatenation, v3 syntax), and panel/list/header styling patterns
- **`.claude/skills/tailwind/references/workflows.md`** (145 lines) — Step-by-step checklists for adding color tokens and fonts, class sorting/linting validation loop, debugging guide for class conflicts/dark mode/missing classes, `cva()` variant component patterns, and EFIS toolbar button examples

Key decisions:

- Highlighted the **dual `cn.ts`/`tailwind.ts` issue** as a WARNING — the codebase has both files with identical content, but shadcn components use `@/utils/tailwind`
- Documented the **v3 → v4 dark mode difference** since `@custom-variant dark` is non-obvious
- Included EFIS-specific token patterns from the UI spec that aren't yet implemented, so future phases have a reference
- Cross-referenced **shadcn-ui**, **prettier**, **eslint**, **zustand**, **frontend-design**, and **react** skills
