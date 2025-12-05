import assert from 'node:assert/strict';
import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
let hasBuilt = false;

function ensureBuild() {
  if (hasBuilt) return;
  execFileSync('npm', ['run', 'build'], { cwd: repoRoot, stdio: 'inherit' });
  hasBuilt = true;
}

test('package bin points to built CLI script', () => {
  ensureBuild();
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
  const binPath = pkg?.bin?.snapify;
  assert.ok(typeof binPath === 'string', 'snapify bin entry missing');
  const cliPath = path.join(repoRoot, binPath);
  assert.ok(existsSync(cliPath), `Expected CLI at ${cliPath}`);
  const firstLine = readFileSync(cliPath, 'utf8').split('\n')[0]?.trim();
  assert.equal(firstLine, '#!/usr/bin/env node', 'CLI is missing executable shebang');
});

test('npm-packed tarball exposes working CLI help', () => {
  ensureBuild();
  const packDir = mkdtempSync(path.join(tmpdir(), 'snapify-pack-'));
  const extractDir = path.join(packDir, 'pkg');
  mkdirSync(extractDir);
  try {
    const npmEnv = { ...process.env, npm_config_cache: path.join(packDir, 'cache') };
    const packBuffer = execFileSync('npm', ['pack', '--pack-destination', packDir], {
      cwd: repoRoot,
      encoding: 'utf8',
      env: npmEnv
    });
    const tarballName = packBuffer.trim().split('\n').pop()?.trim();
    assert.ok(tarballName, 'npm pack did not report a tarball path');
    const tarballPath = path.join(packDir, tarballName);
    execFileSync('tar', ['-xzf', tarballPath, '-C', extractDir]);
    const packageRoot = path.join(extractDir, 'package');
    const cliPath = path.join(packageRoot, 'dist', 'cli.js');
    const linkedNodeModules = path.join(packageRoot, 'node_modules');
    symlinkSync(path.join(repoRoot, 'node_modules'), linkedNodeModules, 'junction');
    assert.ok(existsSync(cliPath), 'Packed CLI missing');
    const helpOutput = execFileSync('node', [cliPath, '--help'], { encoding: 'utf8' });
    assert.match(helpOutput, /snapify render/, 'CLI help did not include render command');
  } finally {
    rmSync(packDir, { recursive: true, force: true });
  }
});
