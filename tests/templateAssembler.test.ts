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
  assert.match(normalized, /data-src="https:\/\/cdn.example.com\/logo.png"/,
    'external URLs should normalize to https scheme');
});

test('JSON templates render sections and normalize menu handles', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'json-home',
    layout: false
  });
  assert.match(html, /json-links/, 'section markup should render');
  assert.match(html, /Docs/, 'menu links should render');
  assert.match(html, /\/collections\/sale;\s*\/blogs\/news;\s*\/products\/demo/, 'Shopify URLs should normalize inside arrays');
});

test('JSON templates without sections short-circuit gracefully', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'json-empty',
    layout: false
  });
  assert.equal(html, '', 'no sections should result in empty markup');
});

test('{% section %} renders configured settings and Shopify URLs normalize', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'section-tag',
    layout: false
  });
  assert.match(html, /Configured Hero Headline/, 'section should use configured heading');
  assert.match(html, /href="\/pages\/demo"/, 'shopify:// links should normalize to storefront URLs');
});

test('navigation linklists are cloned into the Liquid context', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'linklists',
    layout: false
  });
  assert.match(html, /Docs/, 'top-level link should render');
  assert.match(html, /Sub Article/, 'child links should be available');
});

test('head markup is injected when a layout omits content_for_header', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'assets-inline',
    layout: 'missing-header',
    styles: '.from-test { color: red; }'
  });
  const headSegment = html.split('</head>')[0];
  assert.match(headSegment, /data-snapify-inline="user"/, 'user styles should inject into head');
  assert.match(headSegment, /data-snapify-inline="asset-fallback"/, 'asset fallback script should inject');
});

test('asset_url filter stringifies inline when used directly', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'asset-url', layout: false });
  assert.match(html, /https:\/\/snapify.local\/assets\/main.css/, 'asset_url should return a concrete URL');
});

test('form tag enforces a default data-snapify-form attribute', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'form-tag', layout: false });
  assert.match(html, /data-snapify-form="contact"/, 'form helper should inject data attribute');
});

test('inline block tags capture {% style %} and {% javascript %} contents', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'inline-blocks', layout: false });
  assert.match(html, /inline-block { color: blue; }/, 'style block should inline CSS');
  assert.match(html, /window.inlineBlock = true/, 'javascript block should inline JS');
});

test('image_tag accepts configured object drops and blank inputs', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'image-drop', layout: false });
  assert.match(html, /Inline drop/, 'object drops should honor provided alt text');
  assert.match(html, /width="200"/, 'overrides should propagate to placeholder regeneration');
  const imageCount = (html.match(/<img/g) ?? []).length;
  assert.equal(imageCount, 2, 'only configured drops should render images');
});

test('empty translation keys resolve to empty strings', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'translation-empty', layout: false });
  assert.match(html, /<span class="empty-translation"><\/span>/, 'empty translations should stay empty');
});

test('blank section handles render nothing', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'invalid-section', layout: false });
  assert.equal(html.trim(), '', 'invalid section handles should short-circuit');
});

test('asset filters throw when closing tags are missing', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  await assert.rejects(() => assembler.compose({ template: 'invalid-style', layout: false }), /tag style not closed/);
  await assert.rejects(() => assembler.compose({ template: 'invalid-form', layout: false }), /tag form not closed/);
  await assert.rejects(() => assembler.compose({ template: 'invalid-schema', layout: false }), /tag schema not closed/);
});

test('missing Shopify constructs surface diagnostics and placeholders', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'missing-constructs', layout: false });
  assert.match(html, /data-snapify-missing="paginate"/, 'paginate should stub with placeholder');
  assert.match(html, /data-snapify-diagnostics/, 'diagnostics payload should be injected');
  assert.match(html, /money_with_currency/, 'missing filter should be recorded in diagnostics payload');
});

test('content_for blocks render theme and app blocks with placeholders', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'content-for-blocks', layout: false });
  const normalized = stripWhitespace(html);
  assert.match(normalized, /theme-block-message/, 'theme block should render its template');
  assert.match(normalized, /data-snapify-app-block/, 'app block should fall back to placeholder');
  assert.match(normalized, /data-snapify-block="orphan"/, 'unknown blocks should render deterministic placeholder');
});

test('{% sections %} renders section groups in order', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'with-group', layout: false });
  const normalized = stripWhitespace(html);
  assert.match(normalized, /data-section="header-hero".*Configured Hero Headline/, 'group should render hero section');
  assert.ok(normalized.indexOf('Global assets head') < normalized.indexOf('Configured Hero Headline'), 'group order should be preserved');
});
