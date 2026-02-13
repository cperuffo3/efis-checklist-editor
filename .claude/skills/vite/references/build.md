# Build & Packaging Reference

## Contents

- Build Pipeline
- Build Commands
- Output Structure
- electron-builder Integration
- Production vs Development
- Content Security Policy
- Troubleshooting Builds

## Build Pipeline

```
electron-vite build
    ├── Main:     src/main.ts       → dist/main/index.js       (Node.js bundle)
    ├── Preload:  src/preload.ts    → dist/preload/index.js    (Isolated bundle)
    └── Renderer: index.html        → dist/renderer/           (HTML + JS + CSS)

electron-builder build
    └── dist/ + electron-builder.yml → out/                    (Platform installer)
```

## Build Commands

```bash
pnpm run dev       # electron-vite dev — HMR for all three processes
pnpm run build     # electron-vite build — production bundles to dist/
pnpm run package   # build + electron-builder --dir (unpacked, no installer)
pnpm run make:win  # build + electron-builder --win (NSIS installer)
pnpm run make:mac  # build + electron-builder --mac (ZIP, x64 + arm64)
pnpm run make:linux # build + electron-builder --linux (DEB + RPM)
```

## Output Structure

After `pnpm run build`:

```
dist/
├── main/
│   └── index.js              # Bundled main process
├── preload/
│   └── index.js              # Bundled preload script
└── renderer/
    ├── index.html            # Entry HTML
    ├── assets/               # Static assets (copied by vite-plugin-static-copy)
    └── assets/*.js, *.css    # Bundled React app + styles
```

After `pnpm run make:win`:

```
out/
├── win-unpacked/             # Unpacked Electron app
└── EFIS Checklist Editor-0.1.0-Windows-Setup.exe
```

## electron-builder Integration

Config lives in `electron-builder.yml`. Key settings:

```yaml
files:
  - "dist/**/*" # Include all Vite build output
  - "package.json" # Required by Electron

asar: true # Package app in ASAR archive
asarUnpack:
  - "**/*.node" # Native modules must be outside ASAR

extraResources:
  - from: update-config.json # Auto-updater token (CI only)
    to: update-config.json
```

### Security Fuses

```yaml
electronFuses:
  runAsNode: false
  enableCookieEncryption: true
  enableNodeOptionsEnvironmentVariable: false
  enableNodeCliInspectArguments: false
  enableEmbeddedAsarIntegrityValidation: true
  onlyLoadAppFromAsar: true
```

These fuses are baked into the Electron binary at build time — they cannot be changed at runtime.

## Production vs Development

| Aspect                 | Development             | Production                        |
| ---------------------- | ----------------------- | --------------------------------- |
| Renderer loading       | `http://localhost:5173` | `file://dist/renderer/index.html` |
| DevTools               | Open (detached window)  | Disabled                          |
| Source maps            | Yes                     | Depends on config                 |
| HMR                    | Yes (renderer)          | No                                |
| `process.env.NODE_ENV` | `"development"`         | `"production"`                    |
| `app.isPackaged`       | `false`                 | `true`                            |

Detection pattern in main process:

```typescript
const inDevelopment = process.env.NODE_ENV === "development";
const isDev = !app.isPackaged;

if (isDev) {
  mainWindow.loadURL("http://localhost:5173");
} else {
  mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
}
```

## Content Security Policy

The CSP is set in `index.html`:

```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self';" />
```

This means:

- Only scripts from the app's own origin can execute
- No inline scripts, no `eval()`, no external script sources
- If you add a CDN dependency, you must update this CSP

## Troubleshooting Builds

### Build fails with "Cannot find module"

Check that the import is available in the correct process context. Main process cannot import renderer modules and vice versa.

### Assets not found in production

The `assets/` directory is copied by `vite-plugin-static-copy`. Verify the copy target is correct:

```typescript
viteStaticCopy({ targets: [{ src: "assets", dest: "." }] });
```

In production, icon paths differ from development:

```typescript
function getIconPath() {
  if (inDevelopment) {
    return path.join(__dirname, "../../assets/icons/icon.png");
  }
  return path.join(process.resourcesPath, "assets/icons/icon.png");
}
```

### Route tree not regenerating

The TanStack Router plugin watches `src/routes/`. If the route tree is stale:

1. Delete `src/routeTree.gen.ts`
2. Restart `pnpm run dev`
3. The plugin regenerates it automatically

### HMR not working for CSS changes

Ensure `@tailwindcss/vite` is in the plugins array. Tailwind 4 does not use PostCSS — if you have a `postcss.config.*` file, it may conflict.
