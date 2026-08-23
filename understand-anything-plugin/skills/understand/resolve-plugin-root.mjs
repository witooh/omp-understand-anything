#!/usr/bin/env node
/**
 * Print the UA PLUGIN_ROOT (understand-anything-plugin/).
 *
 * Identity is package.json AND packages/core — never a monorepo / OMP
 * package root that only has package.json + pnpm-workspace.yaml.
 *
 * Usage: node resolve-plugin-root.mjs
 */

import { existsSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function nonempty(value) {
  return typeof value === 'string' && value.trim() !== '';
}

export function isValidPluginRoot(dir) {
  if (!nonempty(dir)) return false;
  const abs = resolve(dir);
  return existsSync(join(abs, 'package.json')) && existsSync(join(abs, 'packages/core'));
}

function selfRelativeRoot() {
  const scriptPath = fileURLToPath(import.meta.url);
  const realScript = existsSync(scriptPath) ? realpathSync(scriptPath) : scriptPath;
  return resolve(dirname(realScript), '../..');
}

export function collectCandidates(env = process.env) {
  const home = nonempty(env.HOME) ? env.HOME : homedir();
  const ompRoot = nonempty(env.OMP_PLUGINS_ROOT)
    ? env.OMP_PLUGINS_ROOT
    : join(home, '.omp/plugins');
  const candidates = [
    env.CLAUDE_PLUGIN_ROOT,
    env.PLUGIN_ROOT,
    join(home, '.understand-anything-plugin'),
    selfRelativeRoot(),
    join(ompRoot, 'node_modules/understand-anything/understand-anything-plugin'),
  ];
  if (nonempty(env.XDG_DATA_HOME)) {
    candidates.push(
      join(env.XDG_DATA_HOME, 'omp/plugins/node_modules/understand-anything/understand-anything-plugin'),
    );
  }
  candidates.push(
    join(home, '.codex/understand-anything/understand-anything-plugin'),
    join(home, '.opencode/understand-anything/understand-anything-plugin'),
    join(home, '.pi/understand-anything/understand-anything-plugin'),
    join(home, 'understand-anything/understand-anything-plugin'),
  );
  return candidates.filter(nonempty);
}

export function resolvePluginRoot(env = process.env) {
  for (const candidate of collectCandidates(env)) {
    if (isValidPluginRoot(candidate)) return resolve(candidate);
  }
  return null;
}

const resolved = resolvePluginRoot();
if (!resolved) {
  console.error('Error: Cannot find the understand-anything plugin root.');
  process.exit(1);
}
console.log(resolved);
