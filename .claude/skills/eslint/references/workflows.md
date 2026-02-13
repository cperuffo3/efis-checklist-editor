# ESLint Workflows Reference

## Contents

- Standard Lint-Fix Cycle
- Adding a New ESLint Plugin
- Fixing Common Lint Errors
- CI/Pre-Commit Workflow
- Migrating or Updating Config
- Debugging Rule Behavior

## Standard Lint-Fix Cycle

The primary workflow for this project:

```bash
# 1. Run lint with auto-fix
pnpm run lint

# 2. Review remaining warnings/errors that couldn't auto-fix
# 3. Fix manually or suppress with inline comments
# 4. Run format to ensure Prettier and ESLint agree
pnpm run format

# 5. Verify clean
pnpm run lint
```

**Iterate-until-pass pattern:**

1. Run `pnpm run lint`
2. If errors remain, fix them manually
3. Run `pnpm run format` (Prettier may fix class ordering that ESLint flagged)
4. Run `pnpm run lint` again
5. Only proceed when lint passes with zero errors

Copy this checklist and track progress:

- [ ] Run `pnpm run lint` — fix auto-fixable issues
- [ ] Fix remaining errors manually
- [ ] Run `pnpm run format` — ensure Prettier agreement
- [ ] Run `pnpm run lint` — confirm zero errors
- [ ] Commit changes

## Adding a New ESLint Plugin

**When:** You need rules for a new tool (e.g., `eslint-plugin-import` for import ordering).

```bash
# 1. Install the plugin
pnpm add -D eslint-plugin-import
```

```javascript
// 2. Import in eslint.config.mjs
import pluginImport from "eslint-plugin-import";

// 3. Add to the defineConfig array BEFORE eslintPluginPrettierRecommended
export default defineConfig([
  // ... existing configs ...
  pluginImport.configs.recommended, // Add here
  eslintPluginPrettierRecommended, // Prettier always late
  ...tseslint.configs.recommended,
  // ... custom rules ...
]);
```

Copy this checklist and track progress:

- [ ] Install plugin: `pnpm add -D <plugin-name>`
- [ ] Import plugin in `eslint.config.mjs`
- [ ] Add config object to the `defineConfig` array
- [ ] Place it before Prettier config to avoid conflicts
- [ ] Run `pnpm run lint` to verify no new unexpected errors
- [ ] Fix or suppress any legitimate new warnings

### WARNING: Flat Config Compatibility

Not all ESLint plugins support flat config yet. Check the plugin's docs for a `.configs.flat` export. If the plugin only has legacy config, use `@eslint/compat`:

```javascript
import { fixupPluginRules } from "@eslint/compat";
import legacyPlugin from "eslint-plugin-legacy";

// Wrap legacy plugin for flat config compatibility
{
  plugins: {
    legacy: fixupPluginRules(legacyPlugin),
  },
  rules: {
    "legacy/some-rule": "warn",
  },
}
```

## Fixing Common Lint Errors

### `@typescript-eslint/no-unused-vars`

```typescript
// Error: 'props' is defined but never used
function MyComponent(props: MyProps) { ... }

// Fix: Destructure what you need
function MyComponent({ title, onClose }: MyProps) { ... }

// Fix: Prefix with underscore if intentionally unused
function MyComponent(_props: MyProps) { ... }
```

### `react-hooks/rules-of-hooks`

```typescript
// Error: React Hook "useState" is called conditionally
if (condition) {
  const [val, setVal] = useState(0); // BAD
}

// Fix: Always call hooks at the top level
const [val, setVal] = useState(0);
// Use the condition in the render or effect instead
```

### `tailwind-canonical-classes/tailwind-canonical-classes`

```tsx
// Warning: Tailwind classes are not in canonical order
<div className="mt-4 flex items-center p-2">

// Fix: Let Prettier sort them automatically
pnpm run format

// Or manually reorder following Tailwind's canonical order:
// layout → flex/grid → spacing → sizing → typography → colors → effects
<div className="flex items-center p-2 mt-4">
```

This rule is set to `warn`, not `error`. Running `pnpm run format` with `prettier-plugin-tailwindcss` auto-sorts classes. See the **prettier** skill.

### `@typescript-eslint/no-explicit-any`

```typescript
// Error: Unexpected any. Specify a different type
function parse(data: any) { ... }

// Fix: Use unknown and narrow
function parse(data: unknown) {
  if (typeof data === "object" && data !== null && "name" in data) {
    // Now TypeScript knows the shape
  }
}
```

## CI/Pre-Commit Workflow

For CI or pre-commit hooks, run lint **without** auto-fix to catch issues:

```bash
# CI: fail on any lint error (no --fix)
npx eslint .

# Or combine with format check
npx prettier --check . && npx eslint .
```

This project does not currently have pre-commit hooks. If adding them, use `lint-staged`:

```bash
pnpm add -D lint-staged
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{js,mjs,cjs}": ["eslint --fix", "prettier --write"],
    "*.{json,md,css}": ["prettier --write"]
  }
}
```

## Migrating or Updating Config

### Adding Rules for New File Types

When new file types enter the project (e.g., `.astro`, `.vue`):

```javascript
// Add a targeted config object
{
  files: ["**/*.vue"],
  plugins: { vue: vuePlugin },
  rules: { ...vuePlugin.configs.recommended.rules },
},
```

### Upgrading TypeScript-ESLint

```bash
pnpm update typescript-eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

After upgrading, run `pnpm run lint` — new rules may surface warnings in existing code. Fix or explicitly disable them.

## Debugging Rule Behavior

### Identify Which Rule Fires

```bash
# Show rule IDs in output
npx eslint src/components/editor/toolbar.tsx --format compact
```

### Check Effective Config for a File

```bash
# Print the resolved config for a specific file
npx eslint --print-config src/main.ts
```

### Test a Single Rule

```bash
# Run only one rule against a file
npx eslint src/App.tsx --rule '{"no-console": "error"}' --no-eslintrc
```

Note: `--no-eslintrc` is legacy syntax. In flat config, use `--no-config-lookup` if available, or create a minimal test config.

### Check If a File Is Ignored

```bash
# Returns exit code 0 if file would be linted, 1 if ignored
npx eslint --debug src/routeTree.gen.ts 2>&1 | findstr "ignore"
```

The shared ignore file is `.prettierignore`. Both ESLint and Prettier read from it via `includeIgnoreFile()` in the ESLint config and Prettier's native support.
