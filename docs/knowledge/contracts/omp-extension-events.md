---
source: omp://skills/authoring-extensions.md
fetched_at: 2026-08-23
version: n/a
topic: omp-extension-events
---

# OMP ExtensionAPI (commands + lifecycle)

## Factory

Verbatim from `omp://skills/authoring-extensions.md`:

```ts
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("My extension loaded!", "info");
  });
}
```

> Installed-plugin manifest entries may be `.ts`, `.js`, `.mjs`, or `.cjs`

> **Do not call runtime actions during load.** Methods like `pi.sendMessage()` throw `ExtensionRuntimeNotInitializedError` if called synchronously during module evaluation

> **Command names must not clash with built-ins.** Conflicts are skipped with a diagnostic log.

## Delivery (for hook-equivalent prompts)

Verbatim from `omp://extensions.md`:

> `pi.sendMessage(message, options)` supports:
>
> - `deliverAs: "steer"` (default) — interrupts current run
> - `deliverAs: "followUp"` — queued to run after current run
> - `deliverAs: "nextTurn"` — stored and injected on the next user prompt
> - `triggerTurn: true` — starts a turn when idle

## Events used for Claude-hook parity

- `session_start` — analog of Claude `SessionStart`
- `tool_result` — analog of Claude `PostToolUse` (after the tool ran)
- `registerCommand(name, { description, handler })` — analog of Claude slash skills (`/understand`)

Claude `hooks/hooks.json` command hooks are **not** OMP hooks. OMP hook modules are JS/TS factories under `hooks/pre|post/` or an `omp.extensions` module.

## Provenance

- fetched: 2026-08-23
- source: omp://skills/authoring-extensions.md ; omp://extensions.md
- validator: none — re-read those omp:// docs to revalidate
