# oRPC Workflows Reference

## Contents

- Adding a New IPC Domain
- MessagePort Handshake Flow
- Adding a Handler to an Existing Domain
- Testing IPC Handlers
- Debugging IPC Issues

---

## Adding a New IPC Domain

This is the most common workflow. Follow this exact sequence — skipping steps causes type errors or silent failures.

Copy this checklist and track progress:

- [ ] Step 1: Create `src/ipc/<domain>/schemas.ts` with Zod schemas
- [ ] Step 2: Create `src/ipc/<domain>/handlers.ts` with handler definitions
- [ ] Step 3: Create `src/ipc/<domain>/index.ts` barrel export
- [ ] Step 4: Add domain to `src/ipc/router.ts`
- [ ] Step 5: Create `src/actions/<domain>.ts` renderer wrappers
- [ ] Step 6: Use actions in components

### Step 1: Schemas

```typescript
// src/ipc/checklist/schemas.ts
import z from "zod";

export const readFileInputSchema = z.object({
  filePath: z.string().min(1),
});

export const writeFileInputSchema = z.object({
  filePath: z.string().min(1),
  data: z.string(),
});
```

See the **zod** skill for advanced schema patterns.

### Step 2: Handlers

```typescript
// src/ipc/checklist/handlers.ts
import { os } from "@orpc/server";
import { readFile, writeFile } from "node:fs/promises";
import { readFileInputSchema, writeFileInputSchema } from "./schemas";

export const readChecklistFile = os
  .input(readFileInputSchema)
  .handler(async ({ input }) => {
    const content = await readFile(input.filePath, "utf-8");
    return JSON.parse(content);
  });

export const writeChecklistFile = os
  .input(writeFileInputSchema)
  .handler(async ({ input }) => {
    await writeFile(input.filePath, input.data, "utf-8");
    return { success: true };
  });
```

### Step 3: Barrel Export

```typescript
// src/ipc/checklist/index.ts
import { readChecklistFile, writeChecklistFile } from "./handlers";

export const checklist = {
  readChecklistFile,
  writeChecklistFile,
};
```

### Step 4: Add to Router

```typescript
// src/ipc/router.ts
import { app } from "./app";
import { checklist } from "./checklist"; // new
import { shell } from "./shell";
import { theme } from "./theme";
import { updater } from "./updater";
import { window } from "./window";

export const router = {
  theme,
  window,
  app,
  shell,
  updater,
  checklist, // new
};
```

**After this step:** The renderer's `ipc.client` automatically gains `ipc.client.checklist.readChecklistFile(...)` with full type inference. No additional type registration needed.

### Step 5: Action Wrappers

```typescript
// src/actions/checklist.ts
import { ipc } from "@/ipc/manager";

export async function readChecklistFile(filePath: string) {
  return ipc.client.checklist.readChecklistFile({ filePath });
}

export async function writeChecklistFile(filePath: string, data: string) {
  return ipc.client.checklist.writeChecklistFile({ filePath, data });
}
```

### Step 6: Use in Components

```typescript
import { readChecklistFile } from "@/actions/checklist";

function EditorPanel() {
  const loadFile = async (path: string) => {
    const data = await readChecklistFile(path);
    // use data...
  };
}
```

### Validation Loop

1. Add the domain following steps 1-5
2. Run `pnpm run dev` to check for TypeScript errors
3. If type errors in `ipc.client`, verify the barrel export matches handler names exactly
4. If runtime errors, check that `router.ts` imports the domain correctly
5. Only proceed to component integration when `pnpm run dev` compiles clean

---

## MessagePort Handshake Flow

Understanding this flow is essential for debugging IPC connection issues.

```
Renderer (manager.ts)                 Preload (preload.ts)              Main (main.ts)
─────────────────────                 ────────────────────              ──────────────
1. new MessageChannel()
   → port1 (clientPort)
   → port2 (serverPort)

2. clientPort.start()

3. window.postMessage(
     "start-orpc-server",
     "*",
     [serverPort]                ←── transferred
   )
                                 4. window.addEventListener
                                    catches "start-orpc-server"

                                 5. ipcRenderer.postMessage(
                                      "start-orpc-server",
                                      null,
                                      [serverPort]          ←── transferred
                                    )
                                                             6. ipcMain.on(
                                                                  "start-orpc-server",
                                                                  (event) => {
                                                                    const [port] = event.ports;
                                                                    port.start();
                                                                    rpcHandler.upgrade(port);
                                                                  }
                                                                )

───────────── Bidirectional RPC established ─────────────

7. ipc.client.theme.setThemeMode("dark")
   → serialized over MessagePort →    handler executes
   ← result returned ←                ← return value
```

Key files:

- `src/ipc/manager.ts` — creates MessageChannel, sends port, creates client
- `src/preload.ts` — forwards port from renderer to main
- `src/main.ts` — receives port, calls `rpcHandler.upgrade(port)`
- `src/ipc/handler.ts` — `new RPCHandler(router)` creates the server
- `src/constants/index.ts` — `IPC_CHANNELS.START_ORPC_SERVER` channel name

---

## Adding a Handler to an Existing Domain

Simpler than adding a whole domain — just extend the existing files.

Copy this checklist and track progress:

- [ ] Step 1: Add Zod schema to existing `schemas.ts` (if handler has input)
- [ ] Step 2: Add handler to existing `handlers.ts`
- [ ] Step 3: Add handler to domain barrel export in `index.ts`
- [ ] Step 4: Add action wrapper to existing `src/actions/<domain>.ts`

```typescript
// 1. Add to schemas.ts
export const newHandlerInputSchema = z.object({ id: z.string() });

// 2. Add to handlers.ts
export const newHandler = os
  .input(newHandlerInputSchema)
  .handler(({ input }) => {
    return { found: true, id: input.id };
  });

// 3. Add to index.ts barrel
export const myDomain = {
  existingHandler,
  newHandler, // add here
};

// 4. Add to actions
export function newAction(id: string) {
  return ipc.client.myDomain.newHandler({ id });
}
```

The router picks it up automatically since it already imports the domain object.

---

## Debugging IPC Issues

### "Handler not found" or undefined client method

**Cause:** Handler not exported in barrel, or barrel not imported in router.

```bash
# Check the chain:
# 1. Is handler exported from handlers.ts?
# 2. Is handler included in domain barrel (index.ts)?
# 3. Is domain imported and added to router.ts?
```

### "Main window is not set in IPC context"

**Cause:** Handler uses `ipcContext.mainWindowContext` but `ipcContext.setMainWindow()` was not called yet.

**Fix:** Verify `src/main.ts` calls `ipcContext.setMainWindow(mainWindow)` in `createWindow()`.

### IPC calls hang (never resolve)

**Cause:** MessagePort handshake failed. The port was never forwarded.

**Check:**

1. `src/preload.ts` has the `window.addEventListener("message")` listener
2. `src/main.ts` has `ipcMain.on(IPC_CHANNELS.START_ORPC_SERVER)` listener
3. Both use the same channel name from `src/constants/index.ts`

### TypeScript errors on ipc.client

**Cause:** The `RouterClient<typeof router>` type in `manager.ts` derives its shape from the router. If the router import is stale, restart the dev server.

```bash
# Kill dev server and restart
pnpm run dev
```

### Handler runs but returns undefined

**Cause:** Handler function doesn't return a value. oRPC serializes the return value — `undefined` becomes `null`.

```typescript
// BAD — no return
export const doThing = os.handler(() => {
  someOperation();
});

// GOOD — explicit return
export const doThing = os.handler(() => {
  someOperation();
  return { done: true };
});
```
