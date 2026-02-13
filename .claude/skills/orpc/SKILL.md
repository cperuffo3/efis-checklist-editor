---
name: orpc
description: |
  Implements type-safe RPC communication between Electron main and renderer processes via oRPC over MessagePort.
  Use when: adding new IPC handlers, creating renderer-side action wrappers, defining Zod input schemas for handlers, setting up middleware/context for handlers, or debugging IPC communication issues.
allowed-tools: Read, Edit, Write, Glob, Grep, Bash, mcp__context7__resolve-library-id, mcp__context7__query-docs
---

# oRPC Skill

Type-safe IPC between Electron main ↔ renderer using `@orpc/server` and `@orpc/client` over `MessagePort`. This project uses oRPC instead of raw `ipcMain.handle`/`ipcRenderer.invoke` — the router shape is shared, so the client is fully typed against the server's handlers.

## Quick Start

### Define a Handler (Main Process)

```typescript
// src/ipc/<domain>/handlers.ts
import { os } from "@orpc/server";
import { myInputSchema } from "./schemas";

// No input
export const getStatus = os.handler(() => "ok");

// With Zod-validated input
export const doSomething = os.input(myInputSchema).handler(({ input }) => {
  return { result: input.name };
});
```

### Call from Renderer

```typescript
// src/actions/<domain>.ts
import { ipc } from "@/ipc/manager";

export function doSomething(name: string) {
  return ipc.client.myDomain.doSomething({ name });
}
```

## Key Concepts

| Concept                       | Location                    | Purpose                              |
| ----------------------------- | --------------------------- | ------------------------------------ |
| `os.handler()`                | `@orpc/server`              | Define a typed RPC handler           |
| `os.input(schema)`            | `@orpc/server`              | Add Zod validation before handler    |
| `os.use(middleware)`          | `@orpc/server`              | Inject context (e.g., BrowserWindow) |
| `RPCHandler`                  | `@orpc/server/message-port` | Server-side transport                |
| `RPCLink`                     | `@orpc/client/message-port` | Client-side transport                |
| `createORPCClient`            | `@orpc/client`              | Creates typed client from link       |
| `RouterClient<typeof router>` | `@orpc/server`              | Type the client to match router      |

## Handler Patterns

| Pattern      | Code                                                                 | When                             |
| ------------ | -------------------------------------------------------------------- | -------------------------------- |
| No input     | `os.handler(() => value)`                                            | Read-only queries                |
| With input   | `os.input(schema).handler(({ input }) => ...)`                       | Mutations, parameterized queries |
| Async        | `os.handler(async () => ...)`                                        | File I/O, network, dialogs       |
| With context | `os.use(ipcContext.mainWindowContext).handler(({ context }) => ...)` | Need BrowserWindow access        |
| Chained      | `os.input(schema).use(middleware).handler(...)`                      | Validated input + context        |

## File Organization

Every IPC domain follows this structure:

```
src/ipc/<domain>/
  handlers.ts   → os.handler() definitions
  schemas.ts    → Zod input schemas
  index.ts      → barrel: export const domain = { handler1, handler2 }

src/ipc/router.ts → import and add domain to router object
src/actions/<domain>.ts → renderer-side wrappers calling ipc.client
```

## See Also

- [patterns](references/patterns.md) — Handler, schema, context, and error patterns
- [workflows](references/workflows.md) — Step-by-step for adding new IPC domains

## Related Skills

- See the **zod** skill for input validation schemas
- See the **electron** skill for main process APIs (dialogs, nativeTheme, BrowserWindow)
- See the **typescript** skill for strict typing patterns

## Documentation Resources

> Fetch latest oRPC documentation with Context7.

**How to use Context7:**

1. Use `mcp__context7__resolve-library-id` to search for "orpc"
2. Prefer website documentation (`/websites/deepwiki_unnoq_orpc`) over source repos
3. Query with `mcp__context7__query-docs` using the resolved library ID

**Library IDs:**

- `/websites/deepwiki_unnoq_orpc` (website docs, preferred)
- `/llmstxt/orpc_dev_llms-full_txt` (official site llms.txt)
- `/unnoq/orpc` (source repo)

**Recommended Queries:**

- "MessagePort adapter setup Electron"
- "middleware context os.handler os.input os.use"
- "RPCLink client setup createORPCClient"
- "error handling ORPCError"
