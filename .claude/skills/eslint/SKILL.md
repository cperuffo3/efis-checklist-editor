---
name: eslint
description: |
  Enforces code quality using ESLint 9 flat config with TypeScript, React, React Hooks, Prettier integration, and Tailwind canonical class ordering.
  Use when: fixing lint errors, adding ESLint rules, configuring linting for new file types, understanding why a lint rule fires, or running the lint workflow.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# ESLint Skill

This project uses ESLint 9 with **flat config** (`eslint.config.mjs`), TypeScript-ESLint, React/React Hooks, Prettier conflict resolution, and `tailwind-canonical-classes` for Tailwind CSS class ordering. The lint script auto-fixes: `pnpm run lint` → `eslint . --fix`.

## Quick Start

### Run Linting

```bash
# Lint with auto-fix (the standard workflow)
pnpm run lint

# Lint without auto-fix (check only)
npx eslint .

# Lint a specific file
npx eslint src/components/editor/toolbar.tsx --fix
```

### Config Location

The single config file is `eslint.config.mjs` at project root. It uses `defineConfig` from `eslint/config` and imports `.prettierignore` as the shared ignore file.

## Key Concepts

| Concept              | Usage                                               | Example                                                           |
| -------------------- | --------------------------------------------------- | ----------------------------------------------------------------- |
| Flat config          | Single `eslint.config.mjs` array of config objects  | `export default defineConfig([...])`                              |
| Shared ignores       | Uses `.prettierignore` via `includeIgnoreFile()`    | Ignores `dist/`, `routeTree.gen.ts`                               |
| Tailwind plugin      | Warns on non-canonical Tailwind class order         | `"tailwind-canonical-classes/tailwind-canonical-classes": "warn"` |
| Prettier integration | `eslint-config-prettier` disables conflicting rules | Placed after all other configs                                    |
| TypeScript           | `tseslint.configs.recommended` spread into config   | `...tseslint.configs.recommended`                                 |
| React JSX runtime    | No `import React` needed                            | `pluginReact.configs.flat["jsx-runtime"]`                         |

## Common Patterns

### Adding a Custom Rule

**When:** You need to enforce a project-specific pattern.

```javascript
// In eslint.config.mjs — add a new config object to the array
{
  rules: {
    "no-console": ["warn", { allow: ["warn", "error"] }],
  },
},
```

### Ignoring a File from Linting

**When:** A generated or third-party file triggers lint errors.

Add it to `.prettierignore` — both Prettier and ESLint share this ignore file.

```
# .prettierignore
/src/routeTree.gen.ts
/src/some-generated-file.ts
```

### Suppressing a Rule Inline

**When:** A specific line legitimately needs an exception.

```typescript
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rawData = response as any;
```

## See Also

- [patterns](references/patterns.md) — Config structure, plugin integration, DO/DON'T pairs
- [workflows](references/workflows.md) — Lint-fix cycles, CI integration, adding plugins

## Related Skills

- See the **prettier** skill for formatting rules and Tailwind class sorting
- See the **typescript** skill for TypeScript-specific type checking beyond ESLint
- See the **tailwind** skill for Tailwind CSS class conventions and the canonical ordering plugin
- See the **react** skill for React Hooks rules enforced by `eslint-plugin-react-hooks`
- See the **vite** skill for how electron-vite interacts with the lint/build pipeline

## Documentation Resources

> Fetch latest ESLint documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "eslint"
2. **Prefer website documentation** (IDs starting with `/websites/`) over source code repositories
3. Query with `mcp__context7__query-docs` using the resolved library ID

**Library ID:** `/websites/eslint` _(website docs, 4876 snippets, High reputation)_

**Recommended Queries:**

- "eslint flat config migration"
- "eslint defining custom rules"
- "eslint typescript configuration"
- "eslint ignore patterns"
