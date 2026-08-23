---
source: omp://plugin-manager-installer-plumbing.md
fetched_at: 2026-08-23
version: n/a
topic: omp-plugin-package
---

# OMP plugin package (github: / link)

## Install identity

`omp plugin install github:witooh/omp-understand-anything` classifies as a git spec and goes through `PluginManager.install` (not MarketplaceManager). The installed package name is `package.json#name` at the **cloned repository root**.

`omp plugin link <path>` symlinks that same local `package.json#name` into `~/.omp/plugins/node_modules/<name>`.

## Manifest

Verbatim from `omp://plugin-manager-installer-plumbing.md`:

> Manifest is resolved as:
>
> 1. `package.json.omp`
> 2. fallback `package.json.pi`
> 3. fallback `{ version: package.version }`

> - A package missing `omp`/`pi` is still installable and listable.
> - Runtime plugin loading (`getEnabledPlugins`) skips packages without `omp`/`pi` manifest.

> Manifest-declared **extensions** feed `discoverAndLoadExtensions` through `getAllPluginExtensionPaths(cwd)`.

On-disk (non-XDG default):

> `~/.omp/plugins/node_modules/<package>` — installed npm packages plus link and marketplace-cache symlinks

When XDG roots exist and the XDG variables are set, user plugin state resolves under `$XDG_DATA_HOME/omp/plugins`.

## This repo

Root `package.json` `name` is `understand-anything`. The Claude plugin tree lives in `understand-anything-plugin/` (`@understand-anything/skill`). A github: install of this repo therefore lands at `…/plugins/node_modules/understand-anything`, **not** `@understand-anything/skill`.

`packages/core` lives under `understand-anything-plugin/packages/core`, not the git root.

## Provenance

- fetched: 2026-08-23
- source: omp://plugin-manager-installer-plumbing.md
- validator: none — re-read `omp://plugin-manager-installer-plumbing.md` to revalidate
