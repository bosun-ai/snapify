import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSnapshot } from '../src/assert.js';
import type { RenderResult } from '../src/types.js';

const base: RenderResult = {
  htmlPath: '/tmp/html.html',
  htmlBaselinePath: '/tmp/html.baseline.html',
  screenshotPath: '/tmp/shot.png'
};

test('assertSnapshot throws on PNG diff', () => {
  const result = { ...base, diffPath: '/tmp/diff.png' };
  assert.throws(() => assertSnapshot(result), /Snapshot mismatch/);
});

test('assertSnapshot warns (does not throw) on HTML drift with warn mode', () => {
  const result = { ...base, htmlChanged: true };
  let warned = false;
  assertSnapshot(result, { htmlMode: 'warn', warn: () => { warned = true; } });
  assert.equal(warned, true);
});

test('assertSnapshot ignores HTML drift when mode is ignore', () => {
  const result = { ...base, htmlChanged: true };
  assertSnapshot(result, { htmlMode: 'ignore' });
});

test('assertSnapshot throws on HTML drift when mode is fail', () => {
  const result = { ...base, htmlChanged: true };
  assert.throws(() => assertSnapshot(result, { htmlMode: 'fail' }), /HTML mismatch/);
});
