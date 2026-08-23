# omp-native

**Date:** 2026-08-23
**Objective:** This fork installs as a native OMP plugin via `github:witooh/omp-understand-anything` and exposes the same product surface other agents already get.

## Decisions (2026-08-23)

- **D-001** Install = `omp plugin install github:witooh/omp-understand-anything`. Repo root is the OMP plugin package. `omp plugin link .` is the same package for local verify. Not `install.sh omp`. Not marketplace-primary.
  Evidence: `docs/knowledge/requirements/understand-anything/omp-native.md`, `docs/knowledge/contracts/omp-plugin-package.md`
- **D-002** Full parity: all 9 skills, all 10 agents, slash names (`/understand`, …), dashboard, auto-update.
  Evidence: verbal ALIGN; current Claude skill/agent/hook tree
- **D-003** Fork only. Additive `PLUGIN_ROOT` only — do not break Claude / install.sh.
  Evidence: same requirements entry
- **D-004** (2026-08-23, advisory): two roots. **OMP plugin root** = git repo root (`understand-anything`) for discovery (`skills/`, `agents/`, `omp.extensions`). **UA `PLUGIN_ROOT`** = `understand-anything-plugin/` — the only tree with `packages/core` and `packages/dashboard`. Root `pnpm-workspace.yaml` must never qualify as `PLUGIN_ROOT`. OMP cache candidates must end at `…/node_modules/understand-anything/understand-anything-plugin`.


## Acceptance criteria

- **AC-001** Root `package.json` `name` remains `understand-anything` and declares `omp.extensions` pointing at an existing default-export factory. `getEnabledPlugins` would not skip this package.
  Evidence: `docs/knowledge/contracts/omp-plugin-package.md`
- **AC-002** From the package root, OMP can discover these skills as `<root>/skills/<name>/SKILL.md` (one level, with `description`):
  `understand`, `understand-chat`, `understand-dashboard`, `understand-diff`, `understand-domain`, `understand-explain`, `understand-figma`, `understand-knowledge`, `understand-onboard`.
  Evidence: `docs/knowledge/contracts/omp-skill-agent-discovery.md`
- **AC-003** From the package root, OMP can discover all current agents under `<root>/agents/*.md` (`name` + `description` already present):
  `architecture-analyzer`, `article-analyzer`, `assemble-reviewer`, `design-analyzer`, `domain-analyzer`, `file-analyzer`, `graph-reviewer`, `knowledge-graph-guide`, `project-scanner`, `tour-builder`.
  Evidence: `docs/knowledge/contracts/omp-skill-agent-discovery.md`
- **AC-004** The extension registers slash commands named after those 9 skills. Each command injects that skill's `SKILL.md` body (same role as Claude `/understand`). Built-in command names are not used.
  Evidence: `docs/knowledge/contracts/omp-extension-events.md`
- **AC-005** `PLUGIN_ROOT` is `understand-anything-plugin/` (has `packages/core`), never the OMP plugin / git root. After `omp plugin install github:witooh/omp-understand-anything`, a valid candidate is `…/node_modules/understand-anything/understand-anything-plugin`. Self-relative from a repo-root `skills/` symlink must not win: identity is `package.json` **and** `packages/core/` (not `pnpm-workspace.yaml`). Existing Claude/install.sh candidates still work when they already point at `understand-anything-plugin/`.
  Evidence: `understand-anything-plugin/skills/understand/SKILL.md`; root `pnpm-workspace.yaml` vs `understand-anything-plugin/packages/core`; D-004
- **AC-006** Auto-update parity with `understand-anything-plugin/hooks/hooks.json`:
  - After a `bash` tool whose command matches `git (commit|merge|cherry-pick|rebase)`, if `autoUpdate === true` and a knowledge graph exists, inject the auto-update prompt (`hooks/auto-update-prompt.md`) via `sendMessage` `deliverAs: "followUp"`.
  - On `session_start`, if the graph is stale vs `git rev-parse HEAD` (same predicate as the Claude SessionStart command), inject that stale-graph instruction via `sendMessage` `deliverAs: "nextTurn"`.
  Evidence: `understand-anything-plugin/hooks/hooks.json`, `post-tool-use-auto-update.mjs`, `docs/knowledge/contracts/omp-extension-events.md`
- **AC-007** README lists OMP as Native with `omp plugin install github:witooh/omp-understand-anything`. OMP is **not** added to `install.sh` / `install.ps1` platform tables (those tests require table ⊆ installer ids).

## Non-goals

- `install.sh omp` / `install.ps1` platform row
- `.omp-plugin/marketplace.json` as the primary channel
- Upstream PR to `Egonex-AI/Understand-Anything`
- HTTP API / `docs/api/`
- Rewriting the analysis pipeline or dashboard
- Guaranteeing Windows git-symlink behavior

## API

No HTTP endpoints. Skip `docs/api/`.
