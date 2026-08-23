import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

function readRepoText(path) {
  return readFileSync(resolve(repoRoot, path), 'utf-8').replace(/\r\n?/g, '\n');
}

const INSTALL_CMD = 'omp plugin install github:witooh/omp-understand-anything';

describe('README OMP native install', () => {
  const readme = readRepoText('README.md');

  it('contains exactly the OMP plugin install command', () => {
    expect(readme).toContain(INSTALL_CMD);
    const pluginInstallLines = [...readme.matchAll(/omp plugin install[^\n`]*/g)].map((m) => m[0].trim());
    expect(pluginInstallLines.length).toBeGreaterThanOrEqual(1);
    for (const line of pluginInstallLines) {
      expect(line).toBe(INSTALL_CMD);
    }
  });

  it('does not mention install.sh omp', () => {
    expect(readme).not.toMatch(/install\.sh omp/);
  });

  it('Platform Compatibility table has an OMP row that does not use install.sh omp', () => {
    const table = readme.match(/### Platform Compatibility\n([\s\S]*?)(?:\n---|\n#{2,3} )/);
    expect(table).not.toBeNull();
    const body = table[1];
    const ompRow = body
      .split('\n')
      .map((line) => line.trim())
      .find((line) => /^\|\s*OMP\b/.test(line));
    expect(ompRow, 'OMP row in Platform Compatibility table').toBeTruthy();
    expect(ompRow).not.toMatch(/install\.sh omp/);
    expect(ompRow).toContain(INSTALL_CMD);
  });
});
