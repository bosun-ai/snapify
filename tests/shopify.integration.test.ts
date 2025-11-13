import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TemplateAssembler } from '../src/core/templateAssembler.js';
import { render } from '../src/render.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_THEME = path.join(here, 'theme');
const SNAPSHOT_ROOT = path.join(here, '.snapshots');
const BASELINE_DIR = path.join(SNAPSHOT_ROOT, 'baseline');
const ARTIFACT_DIR = path.join(SNAPSHOT_ROOT, 'artifacts');

test('renders OS 2.0 JSON template with custom Shopify constructs', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'index' });

  assert.match(html, /Book a demo/, 'button label should render from section settings');
  assert.match(html, /cta-button/, 'relative render should output snippet markup');
  assert.match(html, /data-snapify-asset="main\.css"/, 'assets should inline CSS via stylesheet_tag');
  assert.match(html, /data-snapify-asset="app\.js"/, 'assets should inline JS via script_tag');
  assert.match(html, /data-snapify-inline="style"/, '{% style %} blocks should inline in head');
  assert.match(html, /data-snapify-inline="javascript"/, '{% javascript %} blocks should inline in head');
  assert.match(html, /data-snapify-form="contact"/, '{% form %} tag should emit inert form markup');
  assert.match(html, /data-section="hero"/, 'custom_css should attach section-specific inline style');
  assert.match(html, /id="shopify-section-hero" class="shopify-section"/, 'sections should be wrapped with Shopify container divs');
  assert.match(html, /href="data:text\/css;base64/, 'asset_url used in href should degrade to data URLs');
});

test('captures a snapshot for the fixture theme', { concurrency: false }, async (t) => {
  try {
    const result = await render({
      themeRoot: FIXTURE_THEME,
      template: 'index',
      browser: 'chromium',
      viewport: { width: 800, height: 600 },
      snapshot: {
        name: 'fixture-index',
        baselineDir: BASELINE_DIR,
        outputDir: ARTIFACT_DIR,
        update: true
      }
    });

    assert.ok(await pathExists(result.htmlPath), 'HTML artifact missing');
    assert.ok(await pathExists(result.screenshotPath), 'Screenshot artifact missing');
    assert.equal(result.diffPath, undefined, 'Diff should not be generated when forcing baseline updates');
    assert.equal(result.updatedBaseline, true, 'Baseline should refresh during integration run');
  } catch (error) {
    if (isPlaywrightLaunchError(error)) {
      t.diagnostic('Skipping snapshot capture: Playwright could not launch in this environment (requires Chromium permissions).');
      t.skip();
      return;
    }
    throw error;
  }
});

async function pathExists(target: string) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function isPlaywrightLaunchError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  return message.includes('bootstrap_check_in') || message.includes('Abort trap');
}
