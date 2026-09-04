import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

describe('root omp manifest', () => {
  it('names the package understand-anything and lists a default-export factory', async () => {
    const pkg = JSON.parse(readFileSync(resolve(repoRoot, 'package.json'), 'utf-8'));

    expect(pkg.name).toBe('understand-anything');
    expect(pkg.version).toBe('2.9.4');
    expect(pkg.omp.extensions).toEqual(['./extensions/omp-understand.mjs']);

    const extensionPath = resolve(repoRoot, pkg.omp.extensions[0]);
    expect(existsSync(extensionPath)).toBe(true);

    const mod = await import(pathToFileURL(extensionPath).href);
    expect(typeof mod.default).toBe('function');
  });
});
