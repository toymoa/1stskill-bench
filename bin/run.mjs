#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { lstatSync, mkdirSync, mkdtempSync, opendirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractPatch, stageRepository, tree, treeHash } from '../lib/artifact.mjs';
import { suiteVersion, tasks } from '../lib/catalog.mjs';
import { skillInstructionHash } from '../lib/identity.mjs';
import { parseUsage } from '../lib/usage.mjs';

// Mirrors repositoryLimits.taskTimeoutMs in 1stskill runner/native/evaluator.mjs.
const TASK_TIMEOUT_MS = 900_000;
// Mirrors maxOutputBytes in 1stskill runner/native/evaluator.mjs.
const OUTPUT_LIMIT = 5 * 1024 * 1024;
const MAX_FILE_BYTES = 65_536;
const MAX_TOTAL_BYTES = 262_144;
const MAX_FILES = 20;
const SHA40 = /^[a-f0-9]{40}$/i;
const USAGE =
  'Usage: node bin/run.mjs --cli claude|codex [--model <id>] --skill <skill dir> --out <result file>';

// Mirrors isSkillFileName in 1stskill src/domain/validation.js:7-15.
const isSkillFileName = (name) => {
  if (name.length > 200 || name.includes('\\') || name.startsWith('/')) return false;
  const segments = name.split('/');
  return (
    segments.every((s) => s !== '.' && s !== '..' && /^[\p{L}\p{N}_.-]+$/u.test(s)) &&
    (/\.md$/i.test(segments.at(-1)) || /^LICEN[SC]E(?:\.txt)?$/i.test(segments.at(-1)))
  );
};

function parseArgs(argv) {
  const values = {};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!['--cli', '--model', '--skill', '--out'].includes(key))
      throw new Error('Unknown argument: ' + key + '\n' + USAGE);
    const value = argv[++i];
    if (!value || value.startsWith('--')) throw new Error('Missing value for ' + key + '\n' + USAGE);
    values[key.slice(2)] = value;
  }
  if (!['claude', 'codex'].includes(values.cli))
    throw new Error('--cli must be claude or codex\n' + USAGE);
  if (!values.skill || !values.out) throw new Error('--skill and --out are required\n' + USAGE);
  return values;
}

// Collects the same Markdown and LICENSE files the site imports for a skill:
// top-level SKILL.md plus nested files, matching 1stskill src/domain/validation.js
// and src/services/github-skill.js limits.
function collectSkillFiles(root) {
  const files = [];
  let total = 0;
  function walk(directory, prefix) {
    const handle = opendirSync(directory);
    try {
      for (let entry; (entry = handle.readSync());) {
        if (entry.name === '.git' || entry.name === 'node_modules') continue;
        const path = join(directory, entry.name);
        const name = prefix ? prefix + '/' + entry.name : entry.name;
        const stat = lstatSync(path);
        if (stat.isSymbolicLink()) throw new Error('Skill contains a symbolic link: ' + name);
        if (stat.isDirectory()) {
          walk(path, name);
          continue;
        }
        if (!stat.isFile() || !isSkillFileName(name)) continue;
        if (stat.size < 1 || stat.size > MAX_FILE_BYTES)
          throw new Error('Skill file must be 1 byte to 64 KB: ' + name);
        total += stat.size;
        if (total > MAX_TOTAL_BYTES) throw new Error('Skill exceeds 256 KB in total');
        if (files.length >= MAX_FILES) throw new Error('Skill has more than 20 files');
        let content;
        try {
          content = new TextDecoder('utf-8', { fatal: true }).decode(readFileSync(path));
        } catch {
          throw new Error('Skill file is not UTF-8 text: ' + name);
        }
        files.push({ name, content });
      }
    } finally {
      handle.closeSync();
    }
  }
  walk(root, '');
  if (!files.some((f) => f.name.toLowerCase() === 'skill.md'))
    throw new Error('Skill directory must contain a top-level SKILL.md');
  return files;
}

// Mirrors the submitted-skill install in 1stskill runner/native/evaluator.mjs:152-160.
function installSkill(files, workspace, cli) {
  const directory = join(workspace, cli === 'codex' ? '.agents' : '.claude', 'skills', 'submitted');
  for (const file of files) {
    const target = join(directory, file.name.toLowerCase() === 'skill.md' ? 'SKILL.md' : file.name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content, { flag: 'wx' });
  }
}

function removeSkill(workspace, cli) {
  rmSync(join(workspace, cli === 'codex' ? '.agents' : '.claude'), { recursive: true, force: true });
}

// Same non-interactive flags as 1stskill runner/native/bridge.mjs:53-75.
function cliArgs(cli, model) {
  return cli === 'codex'
    ? [
        'exec',
        '--json',
        '--skip-git-repo-check',
        '--dangerously-bypass-approvals-and-sandbox',
        ...(model ? ['--model', model] : []),
        '-',
      ]
    : [
        '-p',
        '--output-format',
        'stream-json',
        '--verbose',
        '--dangerously-skip-permissions',
        ...(model ? ['--model', model] : []),
      ];
}

function runCli({ cli, model, prompt, cwd, timeoutMs }) {
  return new Promise((resolve) => {
    const child = spawn(cli, cliArgs(cli, model), {
      cwd,
      env: process.env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let stdout = '',
      stderr = '',
      bytes = 0,
      outputLimited = false,
      timedOut = false,
      settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(result);
    };
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, timeoutMs);
    for (const [stream, key] of [
      [child.stdout, 'stdout'],
      [child.stderr, 'stderr'],
    ])
      stream.on('data', (chunk) => {
        bytes += chunk.length;
        if (bytes > OUTPUT_LIMIT) {
          outputLimited = true;
          child.kill('SIGKILL');
          return;
        }
        if (key === 'stdout') stdout += chunk;
        else stderr += chunk;
      });
    child.stdin.on('error', () => {});
    child.stdin.end(prompt);
    child.on('error', () =>
      finish({ exitCode: 1, stdout, stderr, timedOut, outputLimited, startError: true }),
    );
    child.on('exit', (code) =>
      finish({ exitCode: code ?? 1, stdout, stderr, timedOut, outputLimited, startError: false }),
    );
  });
}

function cliVersion(cli) {
  const result = spawnSync(cli, ['--version'], { encoding: 'utf8', timeout: 60_000 });
  const text = `${result.stdout || ''}\n${result.stderr || ''}`.trim();
  const semver = text.match(/\b\d+\.\d+\.\d+\b/);
  if (semver) return semver[0];
  const first = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return first ? first.slice(0, 60) : 'unknown';
}

function git(directory, args) {
  const result = spawnSync('git', ['-C', directory, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

const firstCommit = (...values) => values.find((value) => SHA40.test(value || '')) || null;

function repositoryName(directory) {
  if (process.env.GITHUB_REPOSITORY) return process.env.GITHUB_REPOSITORY;
  const remote = git(directory, ['remote', 'get-url', 'origin']);
  const match = remote.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return match ? `${match[1]}/${match[2]}` : 'local/skill';
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const repoRoot = fileURLToPath(new URL('..', import.meta.url));
  const skillFiles = collectSkillFiles(options.skill);
  const instructionHash = skillInstructionHash(skillFiles);
  const skillCommit = firstCommit(
    process.env.GA_SKILL_COMMIT,
    git(options.skill, ['rev-parse', 'HEAD']),
    process.env.GITHUB_SHA,
  );
  if (!skillCommit) process.stderr.write('warning: skill commit unresolved; using zeros\n');
  if (!process.env.GA_ACCOUNT)
    process.stderr.write('warning: GA_ACCOUNT is empty; the site will reject this result\n');
  const runnerCommit = firstCommit(process.env.RUNNER_COMMIT, git(repoRoot, ['rev-parse', 'HEAD']));
  if (!runnerCommit) process.stderr.write('warning: runner commit unresolved; using zeros\n');
  const taskTreeHash = Object.fromEntries(
    tasks.map((task) => [task.id, treeHash(tree(task.root))]),
  );
  const version = cliVersion(options.cli);
  process.stderr.write(
    `cli=${options.cli} version=${version} model=${options.model || 'default'} tasks=${tasks.length}\n`,
  );
  const results = [];
  for (const task of tasks) {
    const started = Date.now();
    let artifact = null,
      usage = null;
    const issues = [];
    const workspace = mkdtempSync(join(tmpdir(), '1stskill-ga-'));
    try {
      stageRepository(task, workspace);
      installSkill(skillFiles, workspace, options.cli);
      const prompt = `Use the submitted skill at ${options.cli === 'codex' ? '.agents' : '.claude'}/skills/submitted/SKILL.md.\n\n${task.prompt}`;
      const run = await runCli({
        cli: options.cli,
        model: options.model,
        prompt,
        cwd: workspace,
        timeoutMs: TASK_TIMEOUT_MS,
      });
      if (run.startError) issues.push('cli could not start');
      else if (run.timedOut) issues.push(`cli timed out after ${TASK_TIMEOUT_MS} ms`);
      else if (run.exitCode !== 0) issues.push(`cli exited with code ${run.exitCode}`);
      if (run.outputLimited) issues.push('cli output exceeded 5 MB');
      const parsed = parseUsage(options.cli, run.stdout);
      if (parsed.inputTokens !== null || parsed.outputTokens !== null) usage = parsed;
      removeSkill(workspace, options.cli);
      try {
        artifact = extractPatch(task, workspace);
      } catch (error) {
        issues.push(error.message);
      }
    } catch (error) {
      issues.push(error.message);
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }
    const error = artifact ? null : issues.join('; ').slice(0, 300) || 'no patch';
    results.push({ id: task.id, elapsedMs: Date.now() - started, usage, artifact, error });
    process.stderr.write(
      `${task.id}: ${artifact ? artifact.files.length + ' changed file(s)' : 'no patch'}${error ? ' (' + error + ')' : ''}\n`,
    );
  }
  const result = {
    schema: '1stskill.ga-result/1',
    skill: {
      repository: repositoryName(options.skill),
      commit: skillCommit || '0'.repeat(40),
      instructionHash,
      account: process.env.GA_ACCOUNT || '',
    },
    runner: {
      repository: process.env.RUNNER_REPOSITORY || 'toymoa/1stskill-bench',
      commit: runnerCommit || '0'.repeat(40),
    },
    suite: { version: suiteVersion, taskTreeHash },
    cli: { name: options.cli, version, model: options.model || 'default' },
    github: {
      runId: process.env.GITHUB_RUN_ID || 'local',
      runAttempt: process.env.GITHUB_RUN_ATTEMPT || '1',
    },
    tasks: results,
    createdAt: new Date().toISOString(),
  };
  mkdirSync(dirname(options.out), { recursive: true });
  writeFileSync(options.out, JSON.stringify(result, null, 2) + '\n');
  process.stdout.write(options.out + '\n');
}

await main();
