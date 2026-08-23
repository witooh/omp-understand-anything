# Understand Anything

Vocabulary for the knowledge-graph product. Implementation conventions stay out of this file.

## Language

**Knowledge graph**:
The project's analyzed map of files, symbols, and relationships, stored as JSON under the data directory.
_Avoid_: index, wiki (unless `/understand-knowledge`)

**UA_DIR**:
The per-project data directory that holds the knowledge graph and analysis scratch. `.ua/` unless a legacy `.understand-anything/` already exists.
_Avoid_: plugin root, output dir

**PLUGIN_ROOT**:
The directory that owns `packages/core` (and `packages/dashboard`) — the `understand-anything-plugin` package. Not the git repository root of this monorepo.
_Avoid_: repo root, clone root, OMP package root (those can differ)

**Native OMP plugin**:
The repo-root package installed with `omp plugin install github:witooh/omp-understand-anything`, discovered by OMP as skills + agents + extension.
_Avoid_: install.sh platform, Pi Agent (`~/.agents/skills`), marketplace-primary
