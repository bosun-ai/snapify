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

test('layout tag can swap layouts or disable them', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const withAlt = await assembler.compose({ template: 'layout-override' });
  assert.match(withAlt, /Alternate Layout/, 'alternate layout should render');
  assert.match(withAlt, /class="content"/, 'content should pass through layout');

  const none = await assembler.compose({ template: 'layout-none' });
  assert.equal(none.trim(), '<div class="nolayout">Bare Output</div>', 'layout none should bypass wrapping layout');
});

test('paginate slices collections and exposes pagination metadata', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const products = Array.from({ length: 5 }, (_, index) => ({ title: `Product ${index + 1}` }));
  const html = await assembler.compose({
    template: 'paginate',
    layout: false,
    data: { products }
  });
  const normalized = stripWhitespace(html);
  assert.match(normalized, /PAGE:1\/3/, 'paginate should compute page counts');
  assert.match(normalized, /ITEMS:Product 1;Product 2;/, 'first page should include only first two items');
  assert.ok(!normalized.includes('Product 3;'), 'later items should be excluded from first page');
  assert.match(normalized, /"title":2/, 'parts should include numeric page links');
  assert.match(normalized, /"title":"Next"/, 'parts should expose navigation links');
});

test('tag link helpers build deterministic URLs', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({
    template: 'tag-links',
    layout: false,
    data: { collection: { handle: 'summer' }, current_tags: ['sale'] }
  });
  const normalized = stripWhitespace(html);
  assert.match(normalized, /href="\/collections\/summer\?q=sale"/, 'link_to_tag should target collection tags');
  assert.match(normalized, /Add<\/a>/, 'link_to_add_tag should render provided title');
  assert.match(normalized, /q=new%2Bsale/, 'link_to_add_tag should include additional tags when added');
  assert.match(normalized, /q=/, 'link_to_remove_tag should render href');
  assert.match(normalized, /<strong>sale<\/strong>/, 'highlight_active_tag should wrap active tag');
  assert.match(normalized, /\/collections\/summer\/products\/widget/, 'within should prefix with collection handle');
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

test('settings image handles hydrate into usable drops', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  const html = await assembler.compose({ template: 'settings-image-handle', layout: false });
  assert.match(html, /<img/, 'image_tag should render an img for handle-based settings');
  assert.match(html, /unit test/, 'placeholder should reference the handle asset');
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
  assert.match(html, /data-snapify-diagnostics/, 'diagnostics payload should be injected');
  assert.match(html, /not_implemented_filter/, 'missing filter should be recorded in diagnostics payload');
});

test('users can extend Liquid with custom tags and filters', async () => {
  const assembler = new TemplateAssembler(FIXTURE_THEME);
  assembler.extend((engine) => {
    engine.registerFilter('shout', (value: unknown) => String(value ?? '').toUpperCase());
    engine.registerTag('hello', {
      parse() {},
      async render() {
        return '<span data-custom="hello">hello</span>';
      }
    });
  });
  const html = await assembler.compose({ template: 'custom-constructs', layout: false });
  assert.match(html, /HI/, 'custom filter should apply');
  assert.match(html, /data-custom="hello"/, 'custom tag should render');
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
