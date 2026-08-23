import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const SCRIPT = resolve(
  repoRoot,
  'understand-anything-plugin/skills/understand/resolve-plugin-root.mjs',
);
const REAL_PLUGIN_ROOT = resolve(repoRoot, 'understand-anything-plugin');

const temps = [];

function makeTemp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  while (temps.length > 0) {
    rmSync(temps.pop(), { recursive: true, force: true });
  }
});

function writeFile(path, contents) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, contents);
}

function plantValidPlugin(dir) {
  writeFile(join(dir, 'package.json'), '{"name":"@understand-anything/skill"}\n');
  mkdirSync(join(dir, 'packages/core'), { recursive: true });
}

function plantWorkspaceOnly(dir) {
  writeFile(join(dir, 'package.json'), '{"name":"understand-anything"}\n');
  writeFile(join(dir, 'pnpm-workspace.yaml'), 'packages:\n  - packages/*\n');
}

function runResolver(envOverrides = {}, script = SCRIPT) {
  const env = { ...process.env, ...envOverrides };
  for (const key of ['CLAUDE_PLUGIN_ROOT', 'PLUGIN_ROOT']) {
    if (envOverrides[key] === undefined) delete env[key];
  }
  return spawnSync(process.execPath, [script], {
    encoding: 'utf-8',
    env,
  });
}

function printedPath(result) {
  return result.stdout.trim();
}

describe('resolve-plugin-root.mjs', () => {
  it('prints this repo understand-anything-plugin when env roots are unset', () => {
    expect(existsSync(join(REAL_PLUGIN_ROOT, 'packages/core'))).toBe(true);

    const result = runResolver({ HOME: makeTemp('ua-resolve-clean-') });


    expect(result.status).toBe(0);
    expect(printedPath(result)).toBe(REAL_PLUGIN_ROOT);
  });

  it('prefers PLUGIN_ROOT env when it is an OMP cache path with packages/core', () => {
    const home = makeTemp('ua-resolve-home-');
    const ompCache = join(
      home,
      'node_modules/understand-anything/understand-anything-plugin',
    );
    plantValidPlugin(ompCache);

    const result = runResolver({
      HOME: home,
      CLAUDE_PLUGIN_ROOT: '',
      PLUGIN_ROOT: ompCache,
    });

    expect(result.status).toBe(0);
    expect(printedPath(result)).toBe(resolve(ompCache));
  });

  it('does not treat package.json + pnpm-workspace.yaml as PLUGIN_ROOT', () => {
    const fakeRoot = makeTemp('ua-resolve-workspace-');
    plantWorkspaceOnly(fakeRoot);

    const result = runResolver({
      PLUGIN_ROOT: fakeRoot,
      CLAUDE_PLUGIN_ROOT: '',
    });

    expect(printedPath(result)).not.toBe(resolve(fakeRoot));
    if (result.status === 0) {
      expect(existsSync(join(printedPath(result), 'packages/core'))).toBe(true);
    }
  });

  it('prints PLUGIN_ROOT when it is a valid OMP-style understand-anything-plugin', () => {
    const home = makeTemp('ua-resolve-omp-');
    const ompPlugin = join(
      home,
      '.omp/plugins/node_modules/understand-anything/understand-anything-plugin',
    );
    plantValidPlugin(ompPlugin);

    const result = runResolver({
      HOME: home,
      PLUGIN_ROOT: ompPlugin,
      CLAUDE_PLUGIN_ROOT: '',
    });

    expect(result.status).toBe(0);
    expect(printedPath(result)).toBe(resolve(ompPlugin));
  });
});
