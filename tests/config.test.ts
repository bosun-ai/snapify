import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { loadConfig } from '../src/config.js';

test('loadConfig returns undefined when no config present', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'snapify-noconfig-'));
  const result = await loadConfig(dir);
  assert.equal(result, undefined);
});

test('loadConfig reads config once and caches for same cwd', async () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'snapify-config-'));
  const file = path.join(dir, 'snapify.config.mjs');
  writeFileSync(file, 'export default { snapshot: { dir: "./__snapshots__" }, browser: "chromium" };', 'utf8');

  const first = await loadConfig(dir);
  const second = await loadConfig(dir);

  assert.ok(first);
  assert.equal(first, second, 'config should be cached for identical cwd');
  assert.equal(first?.snapshot?.dir, './__snapshots__');
  assert.equal(first?.browser, 'chromium');
});
