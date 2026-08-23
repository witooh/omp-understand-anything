import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const pluginRoot = join(repoRoot, 'understand-anything-plugin');
const autoUpdatePromptPath = join(pluginRoot, 'hooks', 'auto-update-prompt.md');

const COMMAND_NAMES = [
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

const COMMIT_COMMAND = /git\s+(commit|merge|cherry-pick|rebase)/;

function stripFrontmatter(text) {
  const match = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? text.slice(match[0].length) : text;
}

function parseDescription(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return '';
  const description = match[1].match(/^description:\s*(?:\|)?\s*(.*)$/m);
  return description ? description[1].trim() : '';
}

function findDataDir(cwd) {
  const legacy = join(cwd, '.understand-anything');
  return existsSync(legacy) ? legacy : join(cwd, '.ua');
}

function autoUpdateEnabled(dataDir) {
  try {
    const config = JSON.parse(readFileSync(join(dataDir, 'config.json'), 'utf8'));
    return config.autoUpdate === true;
  } catch {
    return false;
  }
}

function currentHead(cwd) {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}
function sendCustom(pi, customType, content, options) {
  pi.sendMessage(
    {
      customType,
      content,
      display: true,
    },
    options,
  );
}


export default function ompUnderstand(pi) {
  for (const name of COMMAND_NAMES) {
    const raw = readFileSync(join(pluginRoot, 'skills', name, 'SKILL.md'), 'utf8');
    const body = stripFrontmatter(raw);
    const description = parseDescription(raw);
    pi.registerCommand(name, {
      description,
      handler() {
        sendCustom(pi, 'com.understand-anything.skill', body, { triggerTurn: true });
      },
    });
  }

  pi.on('tool_result', async (event, ctx) => {
    if (event?.type !== 'tool_result') return;
    if (event.toolName !== 'bash') return;
    const command = event.input?.command;
    if (typeof command !== 'string' || !COMMIT_COMMAND.test(command)) {
      return;
    }
    const cwd = ctx?.cwd;
    if (typeof cwd !== 'string') return;

    const dataDir = findDataDir(cwd);
    if (!autoUpdateEnabled(dataDir)) return;
    if (!existsSync(join(dataDir, 'knowledge-graph.json'))) return;

    sendCustom(
      pi,
      'com.understand-anything.auto-update',
      `[understand-anything] Commit detected with auto-update enabled. ` +
      `You MUST read the file at ${autoUpdatePromptPath} ` +
      'and execute its instructions to incrementally update the knowledge graph. ' +
      'Do not ask the user for confirmation — just do it.',
      { deliverAs: 'followUp' },
    );
  });

  pi.on('session_start', async (_event, ctx) => {
    const cwd = ctx?.cwd;
    if (typeof cwd !== 'string') return;

    const dataDir = findDataDir(cwd);
    if (!autoUpdateEnabled(dataDir)) return;
    if (!existsSync(join(dataDir, 'meta.json'))) return;
    if (!existsSync(join(dataDir, 'knowledge-graph.json'))) return;

    let storedHash;
    try {
      storedHash = JSON.parse(
        readFileSync(join(dataDir, 'meta.json'), 'utf8'),
      ).gitCommitHash;
    } catch {
      return;
    }

    if (storedHash === currentHead(cwd)) return;

    sendCustom(
      pi,
      'com.understand-anything.auto-update',
      `[understand-anything] Knowledge graph is stale. You MUST read the file at ${autoUpdatePromptPath} ` +
      'and execute its instructions to check for structural changes and update the graph. ' +
      'Do not ask the user for confirmation — just do it.',
      { deliverAs: 'nextTurn' },
    );
  });
}
