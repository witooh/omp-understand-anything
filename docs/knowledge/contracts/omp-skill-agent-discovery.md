---
source: omp://skills.md
fetched_at: 2026-08-23
version: n/a
topic: omp-skill-agent-discovery
---

# OMP skill and agent discovery (installed plugins)

## Skills

Verbatim from `omp://skills.md`:

> For provider-based discovery (native/Claude/Codex/Agents/plugin providers), skills are discovered as **one level under `skills/`**:
>
> - `<skills-root>/<skill-name>/SKILL.md`
>
> Nested patterns like `<skills-root>/group/<skill>/SKILL.md` are not discovered by provider loaders.

> `omp-plugins` (priority 90) — `skills/` bundled next to extension packages loaded through `extensions:`, `--extension`/`-e`, or installed plugins under `~/.omp/plugins/node_modules`

> `description` is required for:
> - native `.omp` provider skill discovery (`requireDescription: true`)
> - `omp-plugins` extension-package skills and the `github` provider (`.github/skills/`), which also pass `requireDescription: true`

Interactive invocation (when `skills.enableSkillCommands` is true): `/skill:<name> [args]`.

Native project skills live at `<cwd>/.omp/skills/`, **not** `<cwd>/skills/`. A repo-root `skills/` directory is visible to OMP only when that directory is the installed/linked **plugin package** root.

## Agents

Verbatim from `omp://task-agent-discovery.md`:

> required `name`, `description`, and `systemPrompt`

> missing `name` or `description` => invalid (`null`), caller treats as parse failure

> `<extension-root>/agents` for every enabled OMP extension package

> Direct cross-harness roots such as `.claude/agents`, `.codex/agents`, and `.gemini/agents` are intentionally skipped

> Marketplace roots are excluded from `listOmpExtensionRoots` and enter only through the separately gated Claude-plugin path.

github: / link installs use the omp-plugins / extension-root path, not Claude marketplace remapping. `.claude-plugin/plugin.json` `skills`/`agents` path remaps do **not** apply to `PluginManager.install` / `link`.

## Provenance

- fetched: 2026-08-23
- source: omp://skills.md ; omp://task-agent-discovery.md
- validator: none — re-read those omp:// docs to revalidate
