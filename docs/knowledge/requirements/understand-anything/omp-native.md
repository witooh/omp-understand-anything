---
source: verbal:2026-08-23
fetched_at: 2026-08-23
version: n/a
topic: omp-native
---

# Native OMP support (this fork)

## Related

- [omp-plugin-package](../../contracts/omp-plugin-package.md) — AC-001 install identity
- [omp-skill-agent-discovery](../../contracts/omp-skill-agent-discovery.md) — AC-002 / AC-003 discovery
- [omp-extension-events](../../contracts/omp-extension-events.md) — AC-004 slash + AC-006 auto-update
- [omp-tool-result-event](../../contracts/omp-tool-result-event.md) — AC-006 `tool_result` field names (v18.0.1)

## Brief

User: รองรับ omp แบบ native เพิ่มเข้ามา.

Closed 2026-08-23:

- **D-004** Two roots: OMP plugin root = git repo; UA `PLUGIN_ROOT` = `understand-anything-plugin/` (`packages/core`). OMP cache path must end at `…/understand-anything/understand-anything-plugin`.

- **D-001** Install channel = `omp plugin install github:witooh/omp-understand-anything`. Repo **root** is the OMP plugin package. `omp plugin link .` is the same package for local verify — not a second product channel. Not `install.sh omp`. Not marketplace-primary.
- **D-002** Surface = full parity with other AI agents: all skills, all agents, slash names like `/understand`, dashboard, auto-update hook behavior.
- **D-003** Scope = this fork only (`witooh/omp-understand-anything`). No upstream PR. Claude/`install.sh` candidates stay working (additive `PLUGIN_ROOT` only).

## Provenance

- fetched: 2026-08-23
- source: verbal:2026-08-23 (chat ALIGN)
- validator: none — chat transcript
