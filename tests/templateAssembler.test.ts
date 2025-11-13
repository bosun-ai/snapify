import assert from 'node:assert/strict';
import test from 'node:test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TemplateAssembler } from '../src/core/templateAssembler.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_THEME = path.join(here, 'theme');

function stripWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

test('t filter resolves locale entries and fallbacks', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'i18n',
    layout: false,
    locale: 'en.default'
  });

  const normalized = stripWhitespace(html);
  assert.match(normalized, /data-i18n="Blog post"/, 'expected locale string');
  assert.match(normalized, /data-fallback="Fallback copy"/, 'expected default fallback string');
});

test('image filters generate deterministic SVG placeholders', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'media',
    layout: false
  });
  const normalized = stripWhitespace(html);
  assert.match(normalized, /data-image-url="data:image\/svg\+xml/,
    'image_url should inline SVG placeholder');
  assert.match(normalized, /<img[^>]+width="360"/,
    'image_tag should respect explicit width');
  assert.match(normalized, /<img[^>]+alt="[^"]+"/,
    'image_tag should provide an alt attribute');
});
