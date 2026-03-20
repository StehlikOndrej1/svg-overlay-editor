import { cpSync, existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const distDir = path.join(repoRoot, 'dist');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
    throw new Error(output || `${command} ${args.join(' ')} failed with exit code ${result.status}`);
  }

  return result;
}

function tryRun(command, args, options = {}) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: options.captureOutput ? 'pipe' : 'inherit',
    ...options,
  });
}

function emptyDirectory(dirPath) {
  for (const entry of readdirSync(dirPath)) {
    if (entry === '.git') continue;
    rmSync(path.join(dirPath, entry), { recursive: true, force: true });
  }
}

function copyDistContents(sourceDir, targetDir) {
  for (const entry of readdirSync(sourceDir)) {
    cpSync(path.join(sourceDir, entry), path.join(targetDir, entry), { recursive: true });
  }
}

if (!existsSync(distDir)) {
  throw new Error('Missing dist/ directory. Run the build step before deploy.');
}

const tempDir = mkdtempSync(path.join(tmpdir(), 'svg-overlay-editor-deploy-'));

try {
  run('git', ['clone', '--quiet', '--no-checkout', repoRoot, tempDir]);

  const branchCheck = tryRun('git', ['-C', tempDir, 'rev-parse', '--verify', 'gh-pages'], { captureOutput: true });
  if (branchCheck.status === 0) run('git', ['-C', tempDir, 'switch', 'gh-pages']);
  else run('git', ['-C', tempDir, 'switch', '--orphan', 'gh-pages']);

  emptyDirectory(tempDir);
  copyDistContents(distDir, tempDir);
  writeFileSync(path.join(tempDir, '.nojekyll'), '');

  const name = tryRun('git', ['config', '--get', 'user.name'], { captureOutput: true }).stdout.trim() || 'Codex';
  const email = tryRun('git', ['config', '--get', 'user.email'], { captureOutput: true }).stdout.trim() || 'codex@example.com';
  run('git', ['-C', tempDir, 'config', 'user.name', name]);
  run('git', ['-C', tempDir, 'config', 'user.email', email]);

  run('git', ['-C', tempDir, 'add', '--all']);

  const changesCheck = tryRun('git', ['-C', tempDir, 'diff', '--cached', '--quiet'], { captureOutput: true });
  if (changesCheck.status !== 0) {
    run('git', ['-C', tempDir, 'commit', '-m', 'Deploy GitHub Pages']);
  } else {
    console.log('No changes in dist/ to publish.');
  }

  const remoteUrl = tryRun('git', ['remote', 'get-url', 'origin'], { captureOutput: true }).stdout.trim();
  if (!remoteUrl) {
    console.log('No origin remote configured. Prepared local gh-pages branch only.');
  } else {
    run('git', ['-C', tempDir, 'remote', 'set-url', 'origin', remoteUrl]);
    run('git', ['-C', tempDir, 'push', '--force', 'origin', 'gh-pages']);
    console.log('Published dist/ to the gh-pages branch.');
  }
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
