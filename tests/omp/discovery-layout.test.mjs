import { describe, expect, it } from 'vitest';
import { existsSync, lstatSync, readFileSync, realpathSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');

const SKILL_NAMES = [
  'understand',
  'understand-chat',
  'understand-dashboard',
  'understand-diff',
  'understand-domain',
  'understand-explain',
  'understand-figma',
  'understand-knowledge',
  'understand-onboard',
];

const AGENT_NAMES = [
  'architecture-analyzer',
  'article-analyzer',
  'assemble-reviewer',
  'design-analyzer',
  'domain-analyzer',
  'file-analyzer',
  'graph-reviewer',
  'knowledge-graph-guide',
  'project-scanner',
  'tour-builder',
];

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  expect(match, 'YAML frontmatter delimiters').toBeTruthy();
  const block = match[1];
  const name = block.match(/^name:\s*(.+)$/m);
  const description = block.match(/^description:\s*(?:\|)?\s*(.*)$/m);
  return {
    name: name ? name[1].trim() : '',
    description: description ? description[1].trim() : '',
  };
}

describe('package-root skills/agents discovery layout', () => {
  it('realpath(skills) equals realpath(understand-anything-plugin/skills)', () => {
    const rootSkills = resolve(repoRoot, 'skills');
    expect(existsSync(rootSkills), 'repo-root skills').toBe(true);
    expect(lstatSync(rootSkills).isSymbolicLink(), 'skills is a symlink').toBe(true);
    expect(realpathSync(rootSkills)).toBe(
      realpathSync(resolve(repoRoot, 'understand-anything-plugin/skills')),
    );
  });

  it('realpath(agents) equals realpath(understand-anything-plugin/agents)', () => {
    const rootAgents = resolve(repoRoot, 'agents');
    expect(existsSync(rootAgents), 'repo-root agents').toBe(true);
    expect(lstatSync(rootAgents).isSymbolicLink(), 'agents is a symlink').toBe(true);
    expect(realpathSync(rootAgents)).toBe(
      realpathSync(resolve(repoRoot, 'understand-anything-plugin/agents')),
    );
  });

  it('each skills/<name>/SKILL.md exists after realpath and has name + description', () => {
    for (const name of SKILL_NAMES) {
      const skillMd = resolve(repoRoot, 'skills', name, 'SKILL.md');
      expect(existsSync(skillMd), skillMd).toBe(true);
      const resolved = realpathSync(skillMd);
      expect(existsSync(resolved), resolved).toBe(true);
      const fm = parseFrontmatter(readFileSync(resolved, 'utf-8'));
      expect(fm.name, `${name} frontmatter name`).toBeTruthy();
      expect(fm.description, `${name} frontmatter description`).toBeTruthy();
    }
  });

  it('each agents/<name>.md exists after realpath and has name + description', () => {
    for (const name of AGENT_NAMES) {
      const agentMd = resolve(repoRoot, 'agents', `${name}.md`);
      expect(existsSync(agentMd), agentMd).toBe(true);
      const resolved = realpathSync(agentMd);
      expect(existsSync(resolved), resolved).toBe(true);
      const fm = parseFrontmatter(readFileSync(resolved, 'utf-8'));
      expect(fm.name, `${name} frontmatter name`).toBeTruthy();
      expect(fm.description, `${name} frontmatter description`).toBeTruthy();
    }
  });
});
