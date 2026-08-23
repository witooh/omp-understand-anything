import { spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

import ompUnderstand from '../../extensions/omp-understand.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '../..');
const AUTO_UPDATE_PROMPT = join(
  repoRoot,
  'understand-anything-plugin',
  'hooks',
  'auto-update-prompt.md',
);
const UNDERSTAND_SKILL = join(
  repoRoot,
  'understand-anything-plugin',
  'skills',
  'understand',
  'SKILL.md',
);

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

const temps = [];

function makeTemp(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  temps.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of temps.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

function createFakePi() {
  const commands = new Map();
  const handlers = new Map();
  const messages = [];
  let inFactory = false;

  const pi = {
    on(event, handler) {
      handlers.set(event, handler);
    },
    registerCommand(name, spec) {
      commands.set(name, spec);
    },
    sendMessage(message, options) {
      if (inFactory) {
        throw new Error('ExtensionRuntimeNotInitializedError');
      }
      messages.push({ message, options });
    },
  };

  function runFactory() {
    inFactory = true;
    try {
      ompUnderstand(pi);
    } finally {
      inFactory = false;
    }
  }

  return { pi, commands, handlers, messages, runFactory };
}

function writeDataDir(
  cwd,
  {
    dirName = '.understand-anything',
    autoUpdate = true,
    createConfig = true,
    createGraph = true,
    meta,
  } = {},
) {
  const dataDir = join(cwd, dirName);
  mkdirSync(dataDir, { recursive: true });
  if (createConfig) {
    writeFileSync(join(dataDir, 'config.json'), JSON.stringify({ autoUpdate }));
  }
  if (createGraph) {
    writeFileSync(join(dataDir, 'knowledge-graph.json'), '{}');
  }
  if (meta !== undefined) {
    writeFileSync(join(dataDir, 'meta.json'), JSON.stringify(meta));
  }
  return dataDir;
}

function runGit(cwd, args) {
  const result = spawnSync('git', args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'ua-extension-test',
      GIT_AUTHOR_EMAIL: 'ua-extension-test@example.com',
      GIT_COMMITTER_NAME: 'ua-extension-test',
      GIT_COMMITTER_EMAIL: 'ua-extension-test@example.com',
    },
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(' ')} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function initGitRepo() {
  const root = makeTemp('ua-omp-ext-git-');
  runGit(root, ['init', '-q']);
  runGit(root, ['config', 'commit.gpgsign', 'false']);
  writeFileSync(join(root, 'README'), 'fixture\n');
  runGit(root, ['add', 'README']);
  runGit(root, ['commit', '-q', '-m', 'init']);
  return { root, head: runGit(root, ['rev-parse', 'HEAD']) };
}

/** Shape emitted by ExtensionToolWrapper.emitToolResult (oh-my-pi v18.0.1). */
function ompBashToolResult(command, extras = {}) {
  return {
    type: 'tool_result',
    toolName: 'bash',
    toolCallId: 'call-1',
    input: { command },
    content: [],
    details: undefined,
    isError: false,
    ...extras,
  };
}

async function fireToolResult(handlers, event, cwd) {
  const handler = handlers.get('tool_result');
  expect(handler, 'tool_result handler').toEqual(expect.any(Function));
  await handler(event, { cwd });
}

async function fireSessionStart(handlers, cwd) {
  const handler = handlers.get('session_start');
  expect(handler, 'session_start handler').toEqual(expect.any(Function));
  await handler({}, { cwd });
}

describe('OMP understand extension', () => {
  it('does not sendMessage during factory', () => {
    const { messages, runFactory } = createFakePi();

    expect(runFactory).not.toThrow();
    expect(messages).toEqual([]);
  });

  it('registers exactly the nine skill slash commands', () => {
    const { commands, runFactory } = createFakePi();
    runFactory();

    expect([...commands.keys()]).toEqual(COMMAND_NAMES);
  });

  it('injects the understand skill body without YAML frontmatter', async () => {
    const skillText = readFileSync(UNDERSTAND_SKILL, 'utf8');
    expect(skillText.startsWith('---')).toBe(true);
    expect(skillText).toContain('name: understand');
    expect(skillText).toContain('# /understand');

    const { commands, messages, runFactory } = createFakePi();
    runFactory();

    await commands.get('understand').handler();

    expect(messages).toHaveLength(1);
    expect(messages[0].options).toMatchObject({ triggerTurn: true });
    expect(messages[0].message).toMatchObject({
      customType: 'com.understand-anything.skill',
      display: true,
    });
    expect(messages[0].message.content).toContain('# /understand');
    expect(messages[0].message.content).toContain(
      'Analyze the current codebase and produce a `knowledge-graph.json`',
    );
    expect(messages[0].message.content.trimStart().startsWith('name: understand')).toBe(
      false,
    );
    expect(messages[0].message.content).not.toMatch(/^---/);
  });

  describe('tool_result auto-update', () => {
    it('sends followUp with the plugin auto-update prompt after a bash git commit', async () => {
      const cwd = makeTemp('ua-omp-ext-commit-');
      writeDataDir(cwd);

      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireToolResult(
        handlers,
        ompBashToolResult('git commit -m "test"'),
        cwd,
      );

      expect(messages).toHaveLength(1);
      expect(messages[0].options).toMatchObject({ deliverAs: 'followUp' });
      expect(messages[0].message).toMatchObject({
        customType: 'com.understand-anything.auto-update',
        display: true,
      });
      expect(messages[0].message.content).toContain(AUTO_UPDATE_PROMPT);
    });

    it('does not treat a top-level command field as bash input', async () => {
      const cwd = makeTemp('ua-omp-ext-wrong-shape-');
      writeDataDir(cwd);
      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireToolResult(
        handlers,
        {
          type: 'tool_result',
          toolName: 'bash',
          toolCallId: 'call-1',
          command: 'git commit -m "test"',
          content: [],
          isError: false,
        },
        cwd,
      );

      expect(messages).toEqual([]);
    });


    it.each(['commit', 'merge', 'cherry-pick', 'rebase'])(
      'recognizes git %s as a graph-changing operation',
      async (operation) => {
        const cwd = makeTemp('ua-omp-ext-op-');
        writeDataDir(cwd);
        const { handlers, messages, runFactory } = createFakePi();
        runFactory();

        await fireToolResult(
          handlers,
          ompBashToolResult(`git ${operation} example`),
          cwd,
        );

        expect(messages).toHaveLength(1);
      },
    );

    it('uses the legacy .ua data directory when .understand-anything is absent', async () => {
      const cwd = makeTemp('ua-omp-ext-ua-');
      writeDataDir(cwd, { dirName: '.ua' });
      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireToolResult(
        handlers,
        ompBashToolResult('git commit -m "test"'),
        cwd,
      );

      expect(messages).toHaveLength(1);
    });

    it.each([
      [
        'git status',
        {
          command: 'git status --short',
        },
      ],
      [
        'autoUpdate false',
        {
          autoUpdate: false,
        },
      ],
      [
        'missing graph',
        {
          createGraph: false,
        },
      ],
      [
        'missing config',
        {
          createConfig: false,
        },
      ],
    ])('does not sendMessage for %s', async (_label, options) => {
      const cwd = makeTemp('ua-omp-ext-silent-');
      writeDataDir(cwd, options);
      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireToolResult(
        handlers,
        ompBashToolResult(options.command ?? 'git commit -m "test"'),
        cwd,
      );

      expect(messages).toEqual([]);
    });
  });

  describe('session_start stale graph', () => {
    it('sends nextTurn when autoUpdate is on and meta hash differs from HEAD', async () => {
      const { root } = initGitRepo();
      writeDataDir(root, {
        meta: { gitCommitHash: 'not-the-current-head' },
      });

      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireSessionStart(handlers, root);

      expect(messages).toHaveLength(1);
      expect(messages[0].options).toMatchObject({ deliverAs: 'nextTurn' });
      expect(messages[0].message).toMatchObject({
        customType: 'com.understand-anything.auto-update',
        display: true,
      });
      expect(messages[0].message.content).toContain(AUTO_UPDATE_PROMPT);
    });

    it('does not send when meta.gitCommitHash matches HEAD', async () => {
      const { root, head } = initGitRepo();
      writeDataDir(root, { meta: { gitCommitHash: head } });

      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireSessionStart(handlers, root);

      expect(messages).toEqual([]);
    });

    it('does not send when autoUpdate is false', async () => {
      const { root } = initGitRepo();
      writeDataDir(root, {
        autoUpdate: false,
        meta: { gitCommitHash: 'stale' },
      });

      const { handlers, messages, runFactory } = createFakePi();
      runFactory();

      await fireSessionStart(handlers, root);

      expect(messages).toEqual([]);
    });
  });
});
