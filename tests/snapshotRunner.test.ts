import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtempSync } from 'node:fs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { PNG } from 'pngjs';
import { SnapshotRunner } from '../src/core/snapshotRunner.js';

interface Spec { width: number; height: number; color?: number; }

class StubSnapshotRunner extends SnapshotRunner {
  private specIndex = 0;
  constructor(private readonly specs: Spec[]) {
    super();
  }

  protected async launchBrowser() {
    const runner = this;
    return {
      async newContext() {
        return {
          async newPage() {
            return {
              async setContent() {},
              async waitForLoadState() {},
              async screenshot() {
                const spec = runner.consumeSpec();
                const png = new PNG({ width: spec.width, height: spec.height });
                const tone = spec.color ?? 0;
                for (let i = 0; i < png.data.length; i += 4) {
                  png.data[i] = tone;
                  png.data[i + 1] = tone;
                  png.data[i + 2] = tone;
                  png.data[i + 3] = 255;
                }
                return PNG.sync.write(png);
              }
            };
          },
          async route() {},
          async unroute() {},
          async close() {}
        };
      },
      async close() {}
    };
  }

  private consumeSpec() {
    const spec = this.specs[this.specIndex] ?? this.specs[this.specIndex - 1];
    this.specIndex += 1;
    if (!spec) {
      throw new Error('No screenshot specs provided');
    }
    return spec;
  }
}

function tmpDir(prefix: string) {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

function runnerOptions(root: string, name: string) {
  const snapshotDir = path.join(root, '__snapshots__');
  return {
    name,
    snapshotDir,
    snapshotPath: path.join(snapshotDir, `${name}.png`),
    snapshotHtmlPath: path.join(snapshotDir, `${name}.html`),
    newSnapshotPath: path.join(snapshotDir, `${name}.new.png`),
    newSnapshotHtmlPath: path.join(snapshotDir, `${name}.new.html`)
  };
}

test('capture updates the baseline when requested', async () => {
  const dir = tmpDir('snapify-runner-');
  const runner = new StubSnapshotRunner([{ width: 10, height: 20 }]);
  const options = runnerOptions(dir, 'update');
  const result = await runner.capture('<p>baseline</p>', { ...options, updateBaseline: true });
  assert.equal(result.status, 'updated');
  assert.equal(result.newScreenshotPath, undefined);
  assert.equal(result.htmlChanged, false);
  assert.ok(existsSync(options.snapshotPath), 'baseline should be written');
  assert.ok(existsSync(options.snapshotHtmlPath), 'html baseline should be written');
});

test('capture writes .new artifacts when screenshots diverge in size', async () => {
  const dir = tmpDir('snapify-runner-');
  const options = runnerOptions(dir, 'diff');
  const runnerUpdate = new StubSnapshotRunner([{ width: 12, height: 24, color: 0 }]);
  await runnerUpdate.capture('<p>baseline</p>', { ...options, updateBaseline: true });

  const runnerDiff = new StubSnapshotRunner([{ width: 20, height: 40, color: 255 }]);
  const result = await runnerDiff.capture('<p>changed</p>', options);
  assert.equal(result.status, 'changed');
  assert.ok(result.newScreenshotPath && existsSync(result.newScreenshotPath), 'new image should be generated');
  assert.equal(result.htmlChanged, true, 'html diff should be detected');
});

test('capture mismatch can be surfaced as a failing assertion for both HTML and PNG', async () => {
  const dir = tmpDir('snapify-runner-');
  const options = runnerOptions(dir, 'fail');
  const runnerUpdate = new StubSnapshotRunner([{ width: 16, height: 16, color: 0 }]);
  await runnerUpdate.capture('<p>baseline</p>', { ...options, updateBaseline: true });

  const runnerMismatch = new StubSnapshotRunner([{ width: 16, height: 16, color: 255 }]);
  const result = await runnerMismatch.capture('<p>changed html</p>', options);

  function ensureMatch() {
    if (result.htmlChanged || result.imageChanged) {
      throw new Error('Snapshot mismatch detected');
    }
  }

  assert.throws(ensureMatch, /Snapshot mismatch/, 'consumer checks should fail when HTML or PNG diverge');
});

test('capture skips diff output when screenshots match existing baselines', async () => {
  const dir = tmpDir('snapify-runner-');
  const options = runnerOptions(dir, 'match');
  const runnerUpdate = new StubSnapshotRunner([{ width: 16, height: 16 }]);
  await runnerUpdate.capture('<p>baseline</p>', { ...options, updateBaseline: true });

  const runnerSame = new StubSnapshotRunner([{ width: 16, height: 16 }]);
  const result = await runnerSame.capture('<p>baseline</p>', options);
  assert.equal(result.status, 'matched');
  assert.equal(result.newScreenshotPath, undefined);
  assert.equal(result.htmlChanged, false, 'html should match baseline');
});
