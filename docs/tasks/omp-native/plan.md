# omp-native plan

No HTTP contract. Build against `docs/tasks/omp-native/spec.md`.

## Layout

```
package.json                         # + omp.extensions  (OMP package = repo root)
skills -> understand-anything-plugin/skills
agents -> understand-anything-plugin/agents
extensions/omp-understand.mjs        # slash + auto-update
understand-anything-plugin/skills/understand/resolve-plugin-root.mjs
```

Two roots: OMP plugin root = git repo (discovery). UA `PLUGIN_ROOT` = `understand-anything-plugin/` (`packages/core`).

## Tasks

### T1 — Root `omp` manifest

- **Seam:** `package.json` (root)
- **Depends:** none
- **Do:** add `omp.extensions: ["./extensions/omp-understand.mjs"]`. Do not change `name`. Leave `private` unless install fails (then record and drop it). Write a default-export no-op factory at that path so the manifest target exists (T4 replaces the body).
- **Test:** `tests/omp/manifest.test.mjs` — `name === "understand-anything"`; `omp.extensions[0]` exists and default-exports a function.

### T2 — Package-root skills/agents layout

- **Seam:** repo-root `skills/`, `agents/`
- **Depends:** none
- **Do:** git symlinks `skills` → `understand-anything-plugin/skills`, `agents` → `understand-anything-plugin/agents`. Same files as Claude. No copies.
- **Test:** `tests/omp/discovery-layout.test.mjs` — realpath of each AC-002/AC-003 path exists; each `SKILL.md` / agent has `name` + `description`.

### T3 — `PLUGIN_ROOT` resolver

- **Seam:** `understand-anything-plugin/skills/understand/resolve-plugin-root.mjs` + skill/hook docs that duplicate the candidate list
- **Depends:** none
- **Do:** one script living **inside** `understand-anything-plugin/skills/understand/` so `realpath(script)/../..` is UA `PLUGIN_ROOT`. Print the first candidate whose identity is `package.json` + `packages/core/` (never `pnpm-workspace.yaml` alone). Candidates in order: `CLAUDE_PLUGIN_ROOT`, `PLUGIN_ROOT` env (only if it passes identity), `~/.understand-anything-plugin`, realpath(`<this script>/../..`), then OMP caches **`$root/node_modules/understand-anything/understand-anything-plugin`** for `$root` in `~/.omp/plugins` and `$XDG_DATA_HOME/omp/plugins` (never the `understand-anything` package dir itself), then existing clone-style paths. Do not walk up from cwd onto the monorepo root. Update `SKILL.md` (understand, understand-dashboard, understand-domain) and `hooks/auto-update-prompt.md` to call the script. Figma already says "same logic as /understand".
- **Test:** `tests/omp/resolve-plugin-root.test.mjs` — (1) script location resolves to `understand-anything-plugin`; (2) fake OMP layout `node_modules/understand-anything/understand-anything-plugin/packages/core` wins; (3) fake OMP layout that only has repo-root `package.json` + `pnpm-workspace.yaml` (no `packages/core`) does **not** win; (4) snippet tests in `tests/skill/understand/test_skill_security_snippets.test.mjs` stay green.

### T4 — OMP extension (slash + auto-update)

- **Seam:** `extensions/omp-understand.mjs`
- **Depends:** T1 (manifest path)
- **Do:** default-export factory. `registerCommand` for each AC-002 name: read `understand-anything-plugin/skills/<name>/SKILL.md`, strip frontmatter, `sendMessage` with `triggerTurn: true` when idle. Port auto-update predicates from `post-tool-use-auto-update.mjs` / SessionStart one-liner onto `tool_result` (`followUp`) and `session_start` (`nextTurn`). Resolve prompt file via `understand-anything-plugin/hooks/auto-update-prompt.md` next to this repo, not `CLAUDE_PLUGIN_ROOT`. No runtime calls during load.
- **Test:** `tests/omp/extension.test.mjs` — fake `pi`; assert 9 command names; commit+autoUpdate+graph sends followUp; session_start stale graph sends nextTurn; no send during factory.

### T5 — README Native row

- **Seam:** `README.md`
- **Depends:** none
- **Do:** Claude-style Native section + compatibility row. Install command exactly `omp plugin install github:witooh/omp-understand-anything`. Do **not** add `omp` to install.sh/ps1 or the "Supported `<platform>` values" line.
- **Test:** `tests/omp/readme-native.test.mjs` — README contains that install command; does not contain `install.sh omp`; `tests/install/platform-table-consistency.test.mjs` still green.

## Waves

- **Wave 1:** T1, T2, T3, T5 (`Depends: none`)
- **Wave 2:** T4 (`Depends: T1`)
