# ESLint Patterns Reference

## Contents

- Flat Config Structure
- Plugin Integration Order
- Tailwind Canonical Classes Plugin
- Environment-Specific Globals
- WARNING: Rule Ordering Matters
- WARNING: Disabling TypeScript Rules Wholesale
- WARNING: Ignoring React Hooks Exhaustive Deps
- Common Rule Configurations

## Flat Config Structure

This project uses ESLint 9 flat config — a single array of config objects in `eslint.config.mjs`. Each object applies in order; later objects override earlier ones.

```javascript
// eslint.config.mjs — actual project structure
export default defineConfig([
  // 1. Shared ignores (from .prettierignore)
  includeIgnoreFile(prettierIgnorePath),
  // 2. File targeting
  { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
  // 3. Global environments
  { languageOptions: { globals: globals.browser } },
  // 4. Node globals for scripts only
  { files: ["scripts/**/*.{js,mjs,cjs}"], languageOptions: { globals: globals.node } },
  // 5. Base configs (JS, React, Hooks, Prettier, TS)
  pluginJs.configs.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  reactHooks.configs.flat.recommended,
  eslintPluginPrettierRecommended,
  ...tseslint.configs.recommended,
  // 6. Project-specific rules
  { plugins: { "tailwind-canonical-classes": tailwindCanonicalClasses }, rules: { ... } },
]);
```

## Plugin Integration Order

Order matters in flat config. This project follows a deliberate sequence:

| Position | Config                            | Purpose                                               |
| -------- | --------------------------------- | ----------------------------------------------------- |
| First    | `includeIgnoreFile`               | Skip ignored files before any processing              |
| Early    | `pluginJs.configs.recommended`    | Base JS rules                                         |
| Middle   | React + React Hooks               | Framework rules                                       |
| Late     | `eslintPluginPrettierRecommended` | Disables formatting rules that conflict with Prettier |
| Late     | `tseslint.configs.recommended`    | TypeScript rules (spread, adds multiple configs)      |
| Last     | Custom rules object               | Project-specific rules always win                     |

### WARNING: Prettier Config Must Come After Style Rules

**The Problem:**

```javascript
// BAD — Prettier config placed before TypeScript rules
eslintPluginPrettierRecommended,
...tseslint.configs.recommended, // TS rules may re-enable formatting rules
```

**Why This Breaks:**
`eslint-config-prettier` disables rules that conflict with Prettier. If other configs come after it, they can re-enable those rules, causing ESLint and Prettier to fight.

**The Fix:**

Place `eslintPluginPrettierRecommended` after all rule-providing configs, or at least verify no later config re-enables formatting rules. In this project, `tseslint.configs.recommended` does not re-enable formatting rules, so the current order is safe.

## Tailwind Canonical Classes Plugin

The `tailwind-canonical-classes` plugin enforces consistent Tailwind class ordering based on the actual CSS file.

```javascript
// eslint.config.mjs — Tailwind plugin config
{
  plugins: {
    "tailwind-canonical-classes": tailwindCanonicalClasses,
  },
  rules: {
    "tailwind-canonical-classes/tailwind-canonical-classes": [
      "warn",
      {
        cssPath: "./src/styles/global.css",  // Points to the @theme inline block
        rootFontSize: 16,
      },
    ],
  },
}
```

**Why `warn` not `error`:** Class ordering is a style preference. Blocking CI on class order while actively building UI components creates friction. The warning surfaces issues without breaking flow. See the **tailwind** skill for class ordering conventions.

## Environment-Specific Globals

```javascript
// Browser globals for all source files (default)
{ languageOptions: { globals: globals.browser } },

// Node globals ONLY for build scripts
{
  files: ["scripts/**/*.{js,mjs,cjs}"],
  languageOptions: { globals: globals.node },
},
```

The main process (`src/main.ts`, `src/preload.ts`) runs in Node but is bundled by electron-vite, which handles Node globals. The ESLint config targets browser globals for the renderer process where most code lives.

## WARNING: Disabling TypeScript Rules Wholesale

**The Problem:**

```typescript
// BAD — blanket disable to suppress noise
/* eslint-disable @typescript-eslint/no-explicit-any */
```

**Why This Breaks:**

1. Hides real type safety issues across an entire file
2. New code in the file silently inherits the disable
3. `any` types propagate through function signatures, defeating TypeScript

**The Fix:**

```typescript
// GOOD — disable for one specific line with justification
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- IPC returns untyped data
const rawPayload = event.data as any;
```

**When You Might Be Tempted:** Working with Electron IPC boundaries, third-party libraries without types, or JSON parsing. Use `unknown` instead of `any` and narrow with type guards. See the **typescript** skill.

## WARNING: Ignoring React Hooks Exhaustive Deps

**The Problem:**

```typescript
// BAD — stale closure bug waiting to happen
useEffect(() => {
  doSomethingWith(activeFileId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

**Why This Breaks:**

1. `activeFileId` changes but the effect never re-runs — stale data
2. The suppress comment hides the bug from code review
3. This is the #1 source of "works sometimes" bugs in React

**The Fix:**

```typescript
// GOOD — include all dependencies
useEffect(() => {
  doSomethingWith(activeFileId);
}, [activeFileId]);

// GOOD — if you truly want "run once", extract the value
const initialFileId = useRef(activeFileId);
useEffect(() => {
  doSomethingWith(initialFileId.current);
}, []);
```

See the **react** skill for React Hooks patterns.

## Common Rule Configurations

Rules you may want to add to the custom config object:

```javascript
// Prevent accidental console.log in production code
"no-console": ["warn", { allow: ["warn", "error"] }],

// Enforce consistent return types on functions
"@typescript-eslint/explicit-function-return-type": "off", // Too noisy for React components

// Warn on unused variables but allow underscore prefix
"@typescript-eslint/no-unused-vars": ["warn", {
  argsIgnorePattern: "^_",
  varsIgnorePattern: "^_",
}],

// Disallow non-null assertions (use proper narrowing)
"@typescript-eslint/no-non-null-assertion": "warn",
```
