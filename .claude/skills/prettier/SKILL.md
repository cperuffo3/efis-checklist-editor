The **prettier** skill has been created with 3 files:

1. **SKILL.md** — Quick reference with project config, commands, Tailwind class sorting, and Context7 docs integration
2. **references/patterns.md** — DO/DON'T examples for quotes, trailing commas, Tailwind class sorting with `cn()`, import formatting, and JSX formatting
3. **references/workflows.md** — Format-then-lint workflow, fixing formatting errors, CI validation, editor integration, and iterate-until-pass patterns

Key highlights:

- Documents the exact `.prettierrc` config (double quotes, trailing commas, semicolons, 2-space indent)
- Covers `prettier-plugin-tailwindcss` integration and how `cn()` calls are auto-detected
- WARNING anti-patterns for manual formatting fixes, string concatenation breaking Tailwind plugin, and editor config conflicts
- Cross-references **eslint**, **tailwind**, **shadcn-ui**, and **tanstack-router** skills
- 17 code blocks across all files
