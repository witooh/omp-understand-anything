---
source: https://raw.githubusercontent.com/can1357/oh-my-pi/v18.0.1/packages/coding-agent/src/extensibility/extensions/types.ts
fetched_at: 2026-08-23
version: v18.0.1
topic: omp-tool-result-event
---

# OMP `tool_result` event (v18.0.1)

Verbatim from `packages/coding-agent/src/extensibility/extensions/types.ts`:

```ts
interface ToolResultEventBase {
	type: "tool_result";
	toolCallId: string;
	input: Record<string, unknown>;
	content: (TextContent | ImageContent)[];
	isError: boolean;
}

export interface BashToolResultEvent extends ToolResultEventBase {
	toolName: "bash";
	details: BashToolDetails | undefined;
}
```

`BashToolInput` (`packages/coding-agent/src/tools/bash.ts`):

```ts
export interface BashToolInput {
	command: string;
	env?: Record<string, string>;
	timeout?: number;
	cwd?: string;
```

Wrapper emit (`packages/coding-agent/src/extensibility/extensions/wrapper.ts`):

```ts
const resultResult = await this.runner.emitToolResult({
	type: "tool_result",
	toolName: this.tool.name,
	toolCallId,
	input: normalizeToolEventInput(
		this.tool.name,
		resolveToolEventInput(this.tool, toolEventArgs(effectiveParams, context)),
	),
	content: result.content,
	details: result.details,
	isError: !!executionError,
});
```

`this.tool.name` for the bash tool is `"bash"` (not `"Bash"`). The command lives at `event.input.command`, not a top-level `command` field.

## Provenance

- fetched: 2026-08-23
- source: https://github.com/can1357/oh-my-pi/blob/v18.0.1/packages/coding-agent/src/extensibility/extensions/types.ts
- validator: tag v18.0.1
