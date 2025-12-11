import assert from 'node:assert/strict';
import test from 'node:test';
import { assertSnapshot, SnapshotMismatchError } from '../src/assert.js';
import type { RenderResult } from '../src/types.js';

const base: RenderResult = {
  htmlPath: '/tmp/html.html',
  screenshotPath: '/tmp/shot.png',
  htmlChanged: false,
  imageChanged: false,
  status: 'matched'
};

test('assertSnapshot throws on PNG diff', () => {
  const result: RenderResult = { ...base, imageChanged: true, status: 'changed', newScreenshotPath: '/tmp/shot.new.png' };
  assert.throws(() => assertSnapshot(result), SnapshotMismatchError);
});

test('assertSnapshot warns (does not throw) on HTML drift with warn mode', () => {
  const result: RenderResult = { ...base, htmlChanged: true };
  let warned = false;
  assertSnapshot(result, { htmlMode: 'warn', warn: () => { warned = true; } });
  assert.equal(warned, true);
});

test('assertSnapshot ignores HTML drift when mode is ignore', () => {
  const result: RenderResult = { ...base, htmlChanged: true };
  assertSnapshot(result, { htmlMode: 'ignore' });
});

test('assertSnapshot throws on HTML drift when mode is fail', () => {
  const result: RenderResult = { ...base, htmlChanged: true };
  assert.throws(() => assertSnapshot(result, { htmlMode: 'fail' }), SnapshotMismatchError);
});
