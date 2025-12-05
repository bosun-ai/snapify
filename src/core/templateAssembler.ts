import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { Liquid } from 'liquidjs';
import type { TagImplOptions } from 'liquidjs/dist/template/tag-options-adapter.js';
import type { Tag } from 'liquidjs/dist/template/tag.js';
import type { TagToken, TopLevelToken } from 'liquidjs/dist/tokens/index.js';
import type { Context } from 'liquidjs/dist/context/context.js';
import type { Emitter } from 'liquidjs/dist/emitters/emitter.js';
import type { Template } from 'liquidjs/dist/template/template.js';
import type { RegisteredAsset, RenderOptions } from '../types.js';
import { fileExists } from '../utils/fs.js';
import { SNAPIFY_ASSET_HOST } from './constants.js';

const DEFAULT_LAYOUT = 'theme';
const DEFAULT_ROUTES = {
  root_url: '/',
  account_login_url: '/account/login',
  account_logout_url: '/account/logout',
  account_register_url: '/account/register',
  account_register: '/account/register',
  account_url: '/account',
  account_addresses_url: '/account/addresses',
  cart_url: '/cart',
  cart_add_url: '/cart/add',
  cart_change_url: '/cart/change',
  cart_update_url: '/cart/update',
  search_url: '/search',
  predictive_search_url: '/search/suggest',
  collections_url: '/collections',
  all_products_collection_url: '/collections/all',
  product_recommendations_url: '/recommendations/products'
} as const;
const DEFAULT_PLACEHOLDER_WIDTH = 1200;
const DEFAULT_PLACEHOLDER_HEIGHT = 800;
const DEFAULT_PLACEHOLDER_LABEL = 'Image';
const PLACEHOLDER_BG = '#DFE3EB';
const PLACEHOLDER_TEXT = '#5C6478';

interface InlineTagState extends Tag {
  templates?: Template[];
  args?: string;
}

interface FormTagState extends Tag {
  templates?: Template[];
  args?: string;
}

interface SectionTagState extends Tag {
  sectionHandle?: string;
}

interface InlineAsset {
  kind: 'asset';
  filename: string;
  content: string;
  mimeType: string;
  url?: string;
}

interface JsonTemplate {
  sections?: Record<string, JsonSection>;
  order?: string[];
  wrapper?: string;
}

interface JsonSection {
  type: string;
  disabled?: boolean;
  settings?: Record<string, unknown>;
  blocks?: Record<string, JsonSectionBlock>;
  block_order?: string[];
  custom_css?: string[];
}

interface JsonSectionBlock {
  type: string;
  settings?: Record<string, unknown>;
  disabled?: boolean;
}

interface SectionContext {
  id: string;
  type: string;
  settings: Record<string, unknown>;
  blocks: Array<{ id: string; type: string; settings: Record<string, unknown> }>;
  block_order: string[];
}

interface NavigationLink {
  title: string;
  url?: string;
  handle?: string;
  type?: string;
  links?: NavigationLink[];
}

interface LinkList {
  handle: string;
  title?: string;
  links: NavigationLink[];
}

interface ShopifyImage {
  src: string;
  url?: string;
  alt?: string;
  width?: number;
  height?: number;
  aspect_ratio?: number;
  original_width?: number;
  original_height?: number;
  id?: string;
  __snapifyHandle?: string;
}

interface PlaceholderDimensions {
  width?: number;
  height?: number;
}

/**
 * Compiles Shopify themes into deterministic HTML by recreating Liquid primitives and Shopify helpers.
 * Callers provide a theme root and then repeatedly invoke {@link TemplateAssembler.compose} with templates to render.
 */
export class TemplateAssembler {
  private engine: Liquid;
  private headInjections: string[] = [];
  private assetManifest = new Map<string, RegisteredAsset>();
  private assetFallbackInjected = false;
  private activeLocale = 'en.default';
  private assets: AssetService;
  private images: ImageService;
  private themeData: ThemeDataService;
  private sections: SectionRenderer;
  private readonly assetsDir: string;
  private readonly templatesDir: string;
  private readonly sectionsDir: string;
  private readonly blocksDir: string;
  private readonly layoutDir: string;
  private readonly configDir: string;
  private readonly localesDir: string;

  constructor(private readonly themeRoot: string) {
    this.assetsDir = path.join(this.themeRoot, 'assets');
    this.templatesDir = path.join(this.themeRoot, 'templates');
    this.sectionsDir = path.join(this.themeRoot, 'sections');
    this.blocksDir = path.join(this.themeRoot, 'blocks');
    this.layoutDir = path.join(this.themeRoot, 'layout');
    this.configDir = path.join(this.themeRoot, 'config');
    this.localesDir = path.join(this.themeRoot, 'locales');
    this.engine = new Liquid({
      root: this.themeRoot,
      partials: [
        path.join(this.themeRoot, 'snippets'),
        path.join(this.themeRoot, 'sections'),
        path.join(this.themeRoot, 'layout'),
        this.themeRoot
      ],
      layouts: [path.join(this.themeRoot, 'layout')],
      extname: '.liquid',
      cache: false,
      dynamicPartials: true,
      relativeReference: true,
      strictFilters: false,
      strictVariables: false
    });
    this.assets = new AssetService(this.assetsDir, this.headInjections, this.assetManifest, () => this.assetFallbackInjected = true, () => this.assetFallbackInjected = false);
    this.images = new ImageService();
    this.themeData = new ThemeDataService({ configDir: this.configDir, localesDir: this.localesDir });
    this.sections = new SectionRenderer({ engine: this.engine, themeRoot: this.themeRoot, sectionsDir: this.sectionsDir, blocksDir: this.blocksDir, themeData: this.themeData });
    registerShopifyPrimitives(this.engine, {
      assets: this.assets,
      images: this.images,
      translations: (key, replacements) => this.themeData.translate(this.activeLocale, key, replacements),
      sections: this.sections,
      headInjections: this.headInjections
    });
  }

  /**
   * Renders a template (Liquid or JSON) inside the configured theme root, applying Shopify conventions such as linklists, locales, and asset inlining.
   */
  async compose(options: RenderOptions) {
    this.activeLocale = await this.themeData.ensureReady(options.locale);
    this.headInjections.length = 0;
    this.assets.reset();
    const templateLookup = await this.resolveTemplate(options.template);
    const userData = options.data ?? {};
    const context = {
      settings: this.themeData.getSettings(),
      linklists: this.themeData.getLinklistsContext(),
      routes: { ...DEFAULT_ROUTES },
      ...userData
    };
    let bodyHtml = '';

    if (templateLookup.endsWith('.json')) {
      bodyHtml = await this.renderJsonTemplate(templateLookup, context);
    } else {
      bodyHtml = await this.engine.renderFile(templateLookup, context);
    }

    if (options.layout === false) {
      return this.decorateDeterministicHtml(bodyHtml, options.styles);
    }

    const layoutLookup = await this.resolveLayout(options.layout ?? DEFAULT_LAYOUT);
    const inlineHeader = this.assets.collectHeadMarkup(options.styles, this.assetFallbackInjected);
    const layoutScope = {
      ...context,
      content_for_layout: bodyHtml,
      content_for_header: inlineHeader
    };

    const html = await this.engine.renderFile(layoutLookup, layoutScope);
    if (inlineHeader && !html.includes(inlineHeader)) {
      return this.ensureHeadCarriesInlineCss(html, inlineHeader);
    }

    return html;
  }

  /**
   * Returns the asset manifest generated during the last {@link compose} call so SnapshotRunner can serve them via Playwright.
   */
  getAssetManifest() {
    return new Map(this.assetManifest);
  }

  private async renderJsonTemplate(relativePath: string, baseContext: Record<string, unknown>) {
    const template = await this.readJsonTemplate(relativePath);
    await this.themeData.hydrateJsonTemplate(template, this.images);
    if (!template.sections) {
      return '';
    }
    const order = template.order ?? Object.keys(template.sections);
    const renderedSections = [] as string[];

    for (const sectionId of order) {
      const definition = template.sections[sectionId];
      if (!definition || definition.disabled) continue;
      const markup = await this.sections.renderSectionFromDefinition(sectionId, definition, baseContext);
      renderedSections.push(markup);
    }

    const container = template.wrapper ?? 'main';
    return `<${container} data-snapify-template="${relativePath}">
${renderedSections.join('\n')}
</${container}>`;
  }


  private ensureHeadCarriesInlineCss(html: string, injection: string) {
    if (!injection.trim()) {
      return html;
    }
    if (/<head[^>]*>/i.test(html)) {
      return html.replace(/<head([^>]*)>/i, `<head$1>\n${injection}\n`);
    }

    return `${injection}\n${html}`;
  }

  private decorateDeterministicHtml(body: string, extraStyles?: string) {
    if (!extraStyles) {
      return body;
    }
    return `<style data-snapify-inline="user">${extraStyles}</style>\n${body}`;
  }

  private async resolveTemplate(template: string) {
    const withoutPrefix = sanitizeLookupInput(template, 'templates');
    const base = withoutPrefix.replace(/\.liquid$|\.json$/i, '');
    const candidates = [`${base}.liquid`, `${base}.json`, withoutPrefix];
    const seen = new Set<string>();

    for (const candidate of candidates) {
      const normalizedCandidate = removeLeadingSeparators(candidate);
      if (!normalizedCandidate || seen.has(normalizedCandidate)) {
        continue;
      }
      seen.add(normalizedCandidate);
      const abs = ensurePathInside(this.templatesDir, path.resolve(this.templatesDir, normalizedCandidate), 'template');
      if (await fileExists(abs)) {
        return normalizeLiquidPath(path.relative(this.themeRoot, abs));
      }
    }

    throw new Error(`Could not resolve template '${template}' inside templates/`);
  }

  private async resolveLayout(layout: string) {
    const withoutPrefix = sanitizeLookupInput(layout, 'layout');
    const sanitized = withoutPrefix.replace(/\.liquid$/i, '');
    const candidate = `${sanitized}.liquid`;
    const abs = ensurePathInside(this.layoutDir, path.resolve(this.layoutDir, candidate), 'layout');
    if (!(await fileExists(abs))) {
      throw new Error(`Unknown layout '${layout}'`);
    }
    return normalizeLiquidPath(path.relative(this.themeRoot, abs));
  }

  private async readJsonTemplate(relativePath: string): Promise<JsonTemplate> {
    const normalized = normalizeLiquidPath(relativePath).replace(/^\/+/, '');
    if (!normalized.startsWith('templates/')) {
      throw new Error(`JSON templates must live under templates/: ${relativePath}`);
    }
    const templateRelative = normalized.replace(/^templates\//, '');
    const abs = ensurePathInside(this.templatesDir, path.resolve(this.templatesDir, templateRelative), 'template');
    const file = await readFile(abs, 'utf8');
    return JSON.parse(file) as JsonTemplate;
  }
}

interface AssetServiceContract {
  assetUrl(filename: string): Promise<InlineAsset>;
  stylesheetTag(asset: InlineAsset | string): string;
  scriptTag(asset: InlineAsset | string): string;
  collectHeadMarkup(userStyles?: string, fallbackInjected?: boolean): string;
  reset(): void;
}

class AssetService implements AssetServiceContract {
  constructor(
    private readonly assetsDir: string,
    private readonly headInjections: string[],
    private readonly assetManifest: Map<string, RegisteredAsset>,
    private readonly markFallbackInjected: () => void,
    private readonly resetFallback: () => void
  ) {}

  reset() {
    this.headInjections.length = 0;
    this.assetManifest.clear();
    this.resetFallback();
  }

  async assetUrl(filename: string): Promise<InlineAsset> {
    const normalized = stripWrappingQuotes(filename.trim());
    if (!normalized) {
      throw new Error('asset_url requires a filename.');
    }
    const relativePath = removeLeadingSeparators(normalized);
    const abs = ensurePathInside(this.assetsDir, path.resolve(this.assetsDir, relativePath), 'asset');
    const buffer = await readFile(abs);
    const assetRelativePath = normalizeLiquidPath(path.relative(this.assetsDir, abs));
    const mime = getMimeType(assetRelativePath);
    const textContent = isTextMime(mime) ? buffer.toString('utf8') : '';
    const base64 = buffer.toString('base64');
    const assetUrl = this.buildAssetUrl(assetRelativePath, buffer);
    this.assetManifest.set(assetUrl, {
      url: assetUrl,
      filePath: abs,
      mimeType: mime,
      body: buffer,
      base64
    });

    const asset = {
      kind: 'asset',
      filename: assetRelativePath,
      content: textContent,
      mimeType: mime,
      url: assetUrl,
      toString() {
        return assetUrl;
      },
      [Symbol.toPrimitive]() {
        return assetUrl;
      }
    } satisfies InlineAsset & { toString(): string; [Symbol.toPrimitive](): string };

    return asset;
  }

  stylesheetTag(asset: InlineAsset | string) {
    const handle = ensureAsset(asset);
    const inline = `<style data-snapify-asset="${handle.filename}">\n${handle.content}\n</style>`;
    this.headInjections.push(inline);
    return inline;
  }

  scriptTag(asset: InlineAsset | string) {
    const handle = ensureAsset(asset);
    const inline = `<script data-snapify-asset="${handle.filename}">\n${handle.content}\n</script>`;
    this.headInjections.push(inline);
    return inline;
  }

  collectHeadMarkup(userStyles?: string, fallbackInjected?: boolean) {
    if (userStyles) {
      this.headInjections.push(`<style data-snapify-inline="user">\n${userStyles}\n</style>`);
    }
    this.injectAssetFallbackScript(fallbackInjected ?? false);
    return this.headInjections.join('\n');
  }

  private injectAssetFallbackScript(alreadyInjected: boolean) {
    if (alreadyInjected || !this.assetManifest.size) {
      return;
    }

    const manifestMap: Record<string, { mimeType: string; data: string }> = {};
    for (const [url, asset] of this.assetManifest.entries()) {
      manifestMap[url] = {
        mimeType: asset.mimeType,
        data: asset.base64
      };
    }

    const payload = JSON.stringify(manifestMap);
    const script = `(()=>{const host='${SNAPIFY_ASSET_HOST}';const manifest=${payload};const decoder=(entry)=>entry?atob(entry.data):null;const isSnapifyUrl=(url)=>typeof url==='string'&&url.startsWith(host);const inlineStyle=(node)=>{const entry=manifest[node.href];if(!entry)return;const css=decoder(entry);if(css==null)return;const style=document.createElement('style');style.setAttribute('data-snapify-fallback','style');style.textContent=css;node.replaceWith(style);};const inlineScript=(node)=>{const entry=manifest[node.src];if(!entry)return;const js=decoder(entry);if(js==null)return;const script=document.createElement('script');script.setAttribute('data-snapify-fallback','script');script.textContent=js;node.replaceWith(script);};const hydrate=()=>{document.querySelectorAll('link[rel="stylesheet"]').forEach((link)=>{if(isSnapifyUrl(link.href)){inlineStyle(link);}});document.querySelectorAll('script[src]').forEach((script)=>{if(isSnapifyUrl(script.src)){inlineScript(script);}});};document.addEventListener('error',(event)=>{const target=event.target;if(!(target instanceof Element))return;if(target.tagName==='LINK'&&isSnapifyUrl((target as HTMLLinkElement).href)){inlineStyle(target as HTMLLinkElement);}if(target.tagName==='SCRIPT'&&isSnapifyUrl((target as HTMLScriptElement).src)){inlineScript(target as HTMLScriptElement);}},true);if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',hydrate,{once:true});}else{hydrate();}})();`;
    const sanitized = script.replace(/<\/script/gi, '<\\/script');
    this.headInjections.push(`<script data-snapify-inline="asset-fallback">${sanitized}</script>`);
    this.markFallbackInjected();
  }

  private buildAssetUrl(filename: string, body: Buffer) {
    const hash = createHash('md5').update(body).digest('hex').slice(0, 10);
    const encoded = encodeURIComponent(filename);
    return `${SNAPIFY_ASSET_HOST}/assets/${encoded}?v=${hash}`;
  }
}

class ImageService {
  private imageCache = new Map<string, ShopifyImage>();

  async ensureImageObject(source: unknown, overrides?: PlaceholderDimensions): Promise<ShopifyImage | undefined> {
    if (!source) {
      return undefined;
    }
    if (typeof source === 'string') {
      if (source.startsWith('shopify://shop_images/')) {
        return this.buildImageDrop(source, overrides);
      }
      const normalized = normalizeExternalUrl(source);
      const drop: ShopifyImage = {
        src: normalized,
        url: normalized
      };
      if (overrides?.width) drop.width = overrides.width;
      if (overrides?.height) drop.height = overrides.height;
      return drop;
    }
    if (typeof source === 'object') {
      const image = { ...(source as ShopifyImage) } satisfies ShopifyImage;
      if (image.__snapifyHandle) {
        if (overrides?.width || overrides?.height) {
          return this.buildImageDrop(image.__snapifyHandle, overrides);
        }
        return image;
      }
      if (image.src?.startsWith('shopify://shop_images/')) {
        return this.buildImageDrop(image.src, {
          width: image.width ?? overrides?.width,
          height: image.height ?? overrides?.height
        });
      }
      if (!image.url && image.src) {
        image.url = image.src;
      }
      if (overrides?.width && !image.width) {
        image.width = overrides.width;
      }
      if (overrides?.height && !image.height) {
        image.height = overrides.height;
      }
      if (!image.alt && image.id) {
        image.alt = humanizeFilename(image.id);
      }
      return image;
    }
    return undefined;
  }

  async buildImageDrop(original: string, overrides?: PlaceholderDimensions): Promise<ShopifyImage | undefined> {
    const filename = original.replace('shopify://shop_images/', '').trim();
    if (!filename) {
      return undefined;
    }
    const dimensions = resolvePlaceholderDimensions(overrides);
    const cacheKey = `${original}|${dimensions.width}|${dimensions.height}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey);
    }
    const label = humanizeFilename(filename) || filename;
    const url = createPlaceholderDataUrl(dimensions.width, dimensions.height, label || filename);
    const drop: ShopifyImage = {
      src: url,
      url,
      alt: label,
      width: dimensions.width,
      height: dimensions.height,
      original_width: dimensions.width,
      original_height: dimensions.height,
      aspect_ratio: dimensions.width && dimensions.height ? dimensions.width / dimensions.height : undefined,
      id: filename,
      __snapifyHandle: original
    };
    this.imageCache.set(cacheKey, drop);
    return drop;
  }
}

class ThemeDataService {
  private themeSettings: Record<string, unknown> = {};
  private configuredSections = new Map<string, JsonSection>();
  private linklists = new Map<string, LinkList>();
  private navigationLoaded = false;
  private translations = new Map<string, Record<string, string>>();
  private settingsLoaded = false;
  private activeLocale = 'en.default';

  constructor(private readonly opts: { configDir: string; localesDir: string }) {}

  async ensureReady(locale?: string) {
    await this.ensureNavigation();
    await this.ensureThemeSettings();
    this.activeLocale = await this.setActiveLocale(locale);
    return this.activeLocale;
  }

  getSettings() {
    return this.themeSettings;
  }

  getLinklistsContext() {
    const context: Record<string, LinkList> = {};
    for (const [handle, list] of this.linklists.entries()) {
      context[handle] = cloneLinkList(list);
    }
    return context;
  }

  getConfiguredSection(id: string) {
    return this.configuredSections.get(id);
  }

  translate(locale: string, key: string, replacements: Record<string, unknown>) {
    const bundle = this.translations.get(locale) ?? {};
    const translation = bundle[key];
    if (!translation) return '';
    return interpolateTranslation(translation, replacements ?? {});
  }

  async hydrateJsonTemplate(template: JsonTemplate, images: ImageService = new ImageService()) {
    if (!template.sections) return;
    for (const section of Object.values(template.sections)) {
      if (!section) continue;
      await this.hydrateJsonSection(section, images);
    }
  }

  private async hydrateJsonSection(section: JsonSection, images: ImageService) {
    if (section.settings) {
      await this.hydrateValues(section.settings, undefined, images);
    }
    if (section.blocks) {
      for (const block of Object.values(section.blocks)) {
        if (block?.settings) {
          await this.hydrateValues(block.settings, undefined, images);
        }
      }
    }
  }

  private async hydrateValues(value: unknown, key: string | undefined, images: ImageService): Promise<unknown> {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        value[index] = await this.hydrateValues(value[index], key, images);
      }
      return value;
    }
    if (isPlainObject(value)) {
      const record = value as Record<string, unknown>;
      for (const [childKey, childValue] of Object.entries(record)) {
        record[childKey] = await this.hydrateValues(childValue, childKey, images);
      }
      return record;
    }
    if (typeof value === 'string') {
      if (key && looksLikeMenuKey(key) && this.linklists.has(value)) {
        return cloneLinkList(this.linklists.get(value)!);
      }
      if (value.startsWith('shopify://shop_images/')) {
        return (await images.buildImageDrop(value)) ?? value;
      }
      if (value.startsWith('shopify://')) {
        return normalizeShopifyUrl(value);
      }
    }
    return value;
  }

  private async ensureThemeSettings() {
    if (this.settingsLoaded) return;
    const settingsPath = path.join(this.opts.configDir, 'settings_data.json');
    if (!(await fileExists(settingsPath))) {
      this.settingsLoaded = true;
      return;
    }
    try {
      const raw = await readFile(settingsPath, 'utf8');
      const parsed = JSON.parse(raw);
      const current = parsed.current ?? parsed;
      const { sections, ...globals } = current;
      this.themeSettings = globals ?? {};
      await this.hydrateValues(this.themeSettings, undefined, new ImageService());

      if (sections && typeof sections === 'object') {
        for (const [id, definition] of Object.entries(sections as Record<string, JsonSection>)) {
          const normalized = this.normalizeConfiguredSection(id, definition as JsonSection);
          this.configuredSections.set(id, normalized);
        }
      }
    } catch {
      // ignore
    } finally {
      this.settingsLoaded = true;
    }
  }

  private async ensureNavigation() {
    if (this.navigationLoaded) return;
    const navPath = path.join(this.opts.configDir, 'navigation.json');
    if (await fileExists(navPath)) {
      try {
        const raw = await readFile(navPath, 'utf8');
        const parsed = JSON.parse(raw) as Record<string, LinkList>;
        for (const [handle, definition] of Object.entries(parsed)) {
          this.linklists.set(handle, normalizeLinkListDefinition(handle, definition));
        }
      } catch {
        // ignore malformed navigation data
      }
    }
    this.navigationLoaded = true;
  }

  private async setActiveLocale(locale?: string) {
    const fallback = 'en.default';
    const requested = sanitizeLocale(locale ?? this.activeLocale ?? fallback);
    const resolved = (await this.ensureLocaleTranslations(requested))
      ? requested
      : (await this.ensureLocaleTranslations(fallback) ? fallback : requested);
    this.activeLocale = resolved;
    return resolved;
  }

  private async ensureLocaleTranslations(locale: string) {
    if (this.translations.has(locale)) {
      return true;
    }
    const payload = await this.loadLocaleFile(locale);
    if (!payload) {
      return false;
    }
    this.translations.set(locale, payload);
    return true;
  }

  private async loadLocaleFile(locale: string) {
    const candidates = buildLocaleCandidates(locale);
    for (const candidate of candidates) {
      const abs = ensurePathInside(this.opts.localesDir, path.resolve(this.opts.localesDir, candidate), 'locale');
      if (!(await fileExists(abs))) continue;
      try {
        const raw = await readFile(abs, 'utf8');
        const parsed = JSON.parse(raw);
        return flattenTranslations(parsed);
      } catch {
        // ignore malformed locale file
      }
    }
    return undefined;
  }

  private normalizeConfiguredSection(sectionId: string, definition: JsonSection): JsonSection {
    const normalizedBlocks: Record<string, JsonSectionBlock> = {};
    if (definition.blocks) {
      for (const [blockId, block] of Object.entries(definition.blocks)) {
        normalizedBlocks[blockId] = {
          type: block.type,
          settings: block.settings ?? {},
          disabled: block.disabled
        };
      }
    }

    return {
      type: definition.type ?? sectionId,
      settings: definition.settings ?? {},
      blocks: normalizedBlocks,
      block_order: definition.block_order ?? Object.keys(normalizedBlocks)
    };
  }
}

class SectionRenderer {
  private readonly sectionsDir: string;
  private readonly blocksDir: string;
  constructor(private readonly opts: { engine: Liquid; themeRoot: string; sectionsDir: string; blocksDir: string; themeData: ThemeDataService }) {
    this.sectionsDir = opts.sectionsDir;
    this.blocksDir = opts.blocksDir;
  }

  buildSectionContext(sectionId: string, definition: JsonSection): SectionContext {
    const normalized: JsonSection = {
      type: definition.type ?? sectionId,
      settings: definition.settings ?? {},
      blocks: definition.blocks ?? {},
      block_order: definition.block_order ?? Object.keys(definition.blocks ?? {})
    };

    return {
      id: sectionId,
      type: normalized.type,
      settings: normalized.settings ?? {},
      block_order: normalized.block_order ?? Object.keys(normalized.blocks ?? {}),
      blocks: this.materializeBlocks(normalized)
    };
  }

  async renderSection(sectionType: string, ctx: unknown) {
    const base = this.normalizeCtx(ctx);
    const configured = this.opts.themeData.getConfiguredSection(sectionType);
    const sectionContext = configured
      ? this.buildSectionContext(sectionType, configured)
      : {
          id: `${sectionType}-static`,
          type: sectionType,
          settings: {},
          block_order: [],
          blocks: []
        };
    return this.renderSectionFromContext(sectionContext, { ...base, section: sectionContext });
  }

  async renderSectionFromDefinition(sectionId: string, definition: JsonSection, baseContext: Record<string, unknown>) {
    const sectionContext = this.buildSectionContext(sectionId, definition);
    const scope = { ...baseContext, section: sectionContext };
    return this.renderSectionFromContext(sectionContext, scope, definition.custom_css);
  }

  async renderSectionFromContext(sectionContext: SectionContext, scope: Record<string, unknown>, customCss?: string[]) {
    const templatePath = this.resolveSectionLookup(sectionContext.type);
    const markup = await this.opts.engine.renderFile(templatePath, scope);
    const css = Array.isArray(customCss) && customCss.length
      ? `\n<style data-section="${sectionContext.id}">\n${customCss.join('\n')}\n</style>`
      : '';
    const wrapper = [
      `id="shopify-section-${sectionContext.id}"`,
      'class="shopify-section"',
      `data-section="${sectionContext.id}"`,
      `data-section-type="${sectionContext.type}"`
    ].join(' ');
    return `<div ${wrapper}>\n${markup}\n</div>${css}`;
  }

  async renderSectionGroup(handle: string, ctx: unknown) {
    const groupPath = path.join(this.sectionsDir, `${sanitizeLookupInput(handle, 'sections').replace(/\.liquid$/i, '')}.json`);
    if (!(await fileExists(groupPath))) return '';
    const raw = await readFile(groupPath, 'utf8');
    let parsed: JsonTemplate;
    try {
      parsed = JSON.parse(raw) as JsonTemplate;
    } catch {
      return '';
    }
    await this.opts.themeData.hydrateJsonTemplate(parsed);
    const order = parsed.order ?? Object.keys(parsed.sections ?? {});
    const base = this.normalizeCtx(ctx);
    const rendered: string[] = [];
    for (const sectionId of order) {
      const definition = parsed.sections?.[sectionId];
      if (!definition || definition.disabled) continue;
      rendered.push(await this.renderSectionFromDefinition(sectionId, definition, base));
    }
    return rendered.join('\n');
  }

  async renderBlocks(ctx: unknown) {
    const base = this.normalizeCtx(ctx);
    const section = (base as Record<string, unknown>).section as SectionContext | undefined;
    if (!section || !section.blocks?.length) return '';
    const rendered: string[] = [];
    for (const blockId of section.block_order ?? []) {
      const block = section.blocks.find((b) => b.id === blockId);
      if (!block) continue;
      rendered.push(await this.renderBlock(block, section, base));
    }
    return rendered.join('\n');
  }

  private async renderBlock(block: SectionContext['blocks'][number], section: SectionContext, parentCtx: Record<string, unknown>) {
    if (block.type === '@app') {
      return `<div data-snapify-app-block="${section.id}-${block.id}">App block</div>`;
    }
    const blockTemplate = path.join(this.blocksDir, `${sanitizeLookupInput(block.type, 'blocks').replace(/\.liquid$/i, '')}.liquid`);
    if (await fileExists(blockTemplate)) {
      const scope = { ...parentCtx, section, block };
      return this.opts.engine.renderFile(normalizeLiquidPath(path.relative(this.opts.themeRoot, blockTemplate)), scope);
    }
    return `<div data-snapify-block="${block.id}"></div>`;
  }

  private materializeBlocks(definition: JsonSection) {
    const resolved: SectionContext['blocks'] = [];
    if (!definition.blocks) return resolved;
    const order = definition.block_order ?? Object.keys(definition.blocks);
    for (const blockId of order) {
      const block = definition.blocks[blockId];
      if (!block || block.disabled) continue;
      resolved.push({
        id: blockId,
        type: block.type,
        settings: block.settings ?? {}
      });
    }
    return resolved;
  }

  private resolveSectionLookup(sectionType: string) {
    const withoutPrefix = sanitizeLookupInput(sectionType, 'sections');
    const sanitized = withoutPrefix.replace(/\.liquid$/i, '');
    const candidate = `${sanitized}.liquid`;
    const abs = ensurePathInside(this.sectionsDir, path.resolve(this.sectionsDir, candidate), 'section');
    return normalizeLiquidPath(path.relative(this.opts.themeRoot, abs));
  }

  private normalizeCtx(ctx: unknown): Record<string, unknown> {
    if (ctx && typeof ctx === 'object' && 'getAll' in (ctx as Record<string, unknown>)) {
      const getter = (ctx as { getAll?: () => Record<string, unknown> }).getAll;
      if (typeof getter === 'function') {
        return getter.call(ctx) ?? {};
      }
    }
    return (ctx as Record<string, unknown>) ?? {};
  }
}

interface ShopifyPrimitiveServices {
  assets: AssetServiceContract;
  images: ImageService;
  translations: (key: string, replacements: Record<string, unknown>) => string;
  sections: SectionRenderer;
  headInjections: string[];
}

function registerShopifyPrimitives(engine: Liquid, services: ShopifyPrimitiveServices) {
  const assetFilter = services.assets.assetUrl.bind(services.assets);
  engine.registerFilter('asset_url', assetFilter);
  engine.registerFilter('stylesheet_tag', (asset: InlineAsset | string) => services.assets.stylesheetTag(asset));
  engine.registerFilter('script_tag', (asset: InlineAsset | string) => services.assets.scriptTag(asset));
  const resolveImage = async (asset: unknown, args: unknown[]) => services.images.ensureImageObject(asset, resolveDimensionOverrides(extractNamedArgs(args)));
  engine.registerFilter('image_url', async (asset: unknown, ...args: unknown[]) => {
    const image = await resolveImage(asset, args);
    return image?.url ?? image?.src ?? '';
  });
  engine.registerFilter('img_url', async (asset: unknown, ...args: unknown[]) => {
    const image = await resolveImage(asset, args);
    return image?.url ?? image?.src ?? '';
  });
  engine.registerFilter('image_tag', async (asset: unknown, ...args: unknown[]) => imageTagFilter(await resolveImage(asset, args), extractNamedArgs(args)));
  engine.registerFilter('img_tag', async (asset: unknown, ...args: unknown[]) => imageTagFilter(await resolveImage(asset, args), extractNamedArgs(args)));

  const translateFilter = (value: unknown, ...args: unknown[]) => translationFilter(value, args, services.translations);
  engine.registerFilter('t', translateFilter);
  engine.registerFilter('translate', translateFilter);

  const schemaTag: TagImplOptions = {
    parse(tagToken: TagToken, remainTokens: TopLevelToken[]) {
      const stream = this.liquid.parser.parseStream(remainTokens);
      stream
        .on('tag:endschema', () => {
          stream.stop();
        })
        .on('end', () => {
          throw new Error(`tag ${tagToken.name} not closed`);
        });
      stream.start();
    },
    render(_ctx: Context, _emitter: Emitter) {
      return '';
    }
  };

  const styleTag = createInlineBlockTag('style', (content) => `<style data-snapify-inline="style">${content}</style>`);
  const scriptTag = createInlineBlockTag('javascript', (content) => `<script data-snapify-inline="javascript">${content}</script>`);
  const formTag = createFormTag();

  const sectionTag: TagImplOptions = {
    parse(this: SectionTagState, tagToken: TagToken) {
      this.sectionHandle = tagToken.args?.trim();
    },
    async render(this: SectionTagState, ctx: Context) {
      const handle = normalizeSectionHandle(this.sectionHandle ?? '');
      if (!handle) return '';
      return services.sections.renderSection(handle, ctx.getAll());
    }
  };

  const sectionsTag: TagImplOptions = {
    parse(this: SectionTagState, tagToken: TagToken) {
      this.sectionHandle = tagToken.args?.trim();
    },
    async render(this: SectionTagState, ctx: Context) {
      const handle = normalizeSectionHandle(this.sectionHandle ?? '');
      if (!handle) return '';
      return services.sections.renderSectionGroup(handle, ctx.getAll());
    }
  };

  const contentForTag: TagImplOptions = {
    parse(this: InlineTagState, tagToken: TagToken) {
      this.templates = [];
      this.args = tagToken.args ?? '';
    },
    async render(this: InlineTagState, ctx: Context) {
      const slot = normalizeSectionHandle(this.args ?? '');
      if (slot !== 'blocks') return '';
      return services.sections.renderBlocks(ctx.getAll());
    }
  } as TagImplOptions;

  engine.registerTag('schema', schemaTag);
  engine.registerTag('style', styleTag);
  engine.registerTag('javascript', scriptTag);
  engine.registerTag('form', formTag);
  engine.registerTag('section', sectionTag);
  engine.registerTag('sections', sectionsTag);
  engine.registerTag('content_for', contentForTag);

  function createInlineBlockTag(tagName: string, renderWrapper: (content: string) => string): TagImplOptions {
    return {
      parse(this: InlineTagState, tagToken: TagToken, remainTokens: TopLevelToken[]) {
        this.templates = [];
        const parser = this.liquid.parser;
        const stream = parser.parseStream(remainTokens)
          .on(`tag:end${tagName}`, () => {
            stream.stop();
          })
          .on('template', (tpl) => {
            this.templates!.push(tpl as Template);
          })
          .on('end', () => {
            throw new Error(`tag ${tagToken.name} not closed`);
          });
        stream.start();
      },
      async render(this: InlineTagState, ctx: Context) {
        const templates = this.templates ?? [];
        const rendered = await renderChildTemplates(this.liquid, templates, ctx);
        const content = typeof rendered === 'string' ? rendered : String(rendered ?? '');
        return renderWrapper(content);
      }
    };
  }

  function createFormTag(): TagImplOptions {
    return {
      parse(this: FormTagState, tagToken: TagToken, remainTokens: TopLevelToken[]) {
        this.templates = [];
        this.args = tagToken.args ?? '';
        const parser = this.liquid.parser;
        const stream = parser.parseStream(remainTokens)
          .on('tag:endform', () => {
            stream.stop();
          })
          .on('template', (tpl) => {
            this.templates!.push(tpl as Template);
          })
          .on('end', () => {
            throw new Error('tag form not closed');
          });
        stream.start();
      },
      async render(this: FormTagState, ctx: Context, _emitter: Emitter, hash: Record<string, unknown>) {
        const templates = this.templates ?? [];
        const rendered = await renderChildTemplates(this.liquid, templates, ctx);
        const content = typeof rendered === 'string' ? rendered : String(rendered ?? '');
        const handle = extractHandleFromArgs(this.args ?? '');
        const attributes: Record<string, unknown> = {
          method: 'post',
          action: '/',
          'data-snapify-form': handle || 'generic'
        };
        Object.assign(attributes, hash);
        if (!attributes['data-snapify-form']) {
          attributes['data-snapify-form'] = handle || 'generic';
        }
        const attrs = serializeAttributes(attributes);
        return `<form ${attrs}>${content}</form>`;
      }
    };
  }
}

function imageTagFilter(image: ShopifyImage | undefined, named: Record<string, unknown>) {
  if (!image) return '';
  const src = image.url ?? image.src;
  if (!src) return '';
  const attributes: Record<string, unknown> = {
    loading: named.loading ?? 'lazy',
    ...named,
    src
  };
  if (!attributes.alt) {
    attributes.alt = image.alt ?? '';
  }
  const derivedWidth = normalizeDimension(named.width) ?? image.width;
  const derivedHeight = normalizeDimension(named.height) ?? image.height;
  if (derivedWidth) attributes.width = derivedWidth;
  if (derivedHeight) attributes.height = derivedHeight;
  return `<img ${serializeAttributes(attributes)}>`;
}

function translationFilter(value: unknown, args: unknown[], translateFn: (key: string, replacements: Record<string, unknown>) => string) {
  const named = extractNamedArgs(args);
  const key = typeof value === 'string' ? value : String(value ?? '').trim();
  if (!key) return '';
  const replacements: Record<string, unknown> = { ...(named ?? {}) };
  const fallback = typeof replacements.default === 'string' ? replacements.default : key;
  delete replacements.default;
  const translated = translateFn(key, replacements);
  return translated || fallback || '';
}

function stripWrappingQuotes(value: string) {
  return value.replace(/^['"`]/, '').replace(/['"`]$/, '');
}

function removeLeadingSeparators(value: string) {
  return value.replace(/^([./\\])+/, '');
}

function sanitizeLookupInput(value: string, subdir: string) {
  const normalized = normalizeLiquidPath(value).replace(/^\/+/, '');
  if (normalized.toLowerCase().startsWith(`${subdir.toLowerCase()}/`)) {
    return normalized.slice(subdir.length + 1);
  }
  return normalized;
}

function ensurePathInside(baseDir: string, targetPath: string, kind: string) {
  const relative = path.relative(baseDir, targetPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`Refusing to read ${kind} outside of ${baseDir}`);
  }
  return targetPath;
}

function normalizeLinkListDefinition(handle: string, definition: Partial<LinkList>): LinkList {
  const normalizedLinks = (definition.links ?? []).map((link, index) => normalizeNavigationLink(link, `${handle}-${index + 1}`));
  return {
    handle,
    title: definition.title ?? handle,
    links: normalizedLinks
  };
}

function normalizeNavigationLink(link: NavigationLink, fallbackHandle: string): NavigationLink {
  const handle = link.handle ?? slugifyHandle(link.title ?? fallbackHandle);
  const children = (link.links ?? []).map((child, index) => normalizeNavigationLink(child, `${handle}-${index + 1}`));
  return {
    title: link.title,
    url: link.url,
    type: link.type,
    handle,
    links: children
  };
}

function cloneLinkList(list: LinkList): LinkList {
  return JSON.parse(JSON.stringify(list)) as LinkList;
}

function looksLikeMenuKey(key?: string) {
  if (!key) {
    return false;
  }
  return /(menu|navigation|link_list)/i.test(key);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]';
}

function normalizeShopifyUrl(value: string) {
  const normalized = value.replace(/^shopify:\/\//, '');
  if (normalized.startsWith('pages/')) {
    return `/${normalized}`;
  }
  if (normalized.startsWith('blogs/')) {
    return `/${normalized}`;
  }
  if (normalized.startsWith('collections/')) {
    return `/${normalized}`;
  }
  if (normalized.startsWith('products/')) {
    return `/${normalized}`;
  }
  return value;
}

function slugifyHandle(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'link';
}

function sanitizeLocale(locale: string) {
  return locale.replace(/\.json$/i, '').toLowerCase();
}

function buildLocaleCandidates(locale: string) {
  const sanitized = sanitizeLocale(locale);
  const variants = new Set<string>();
  variants.add(sanitized);
  if (!sanitized.includes('.default')) {
    variants.add(`${sanitized}.default`);
  }
  if (sanitized.includes('.default')) {
    variants.add(sanitized.replace('.default', ''));
  }
  return Array.from(variants).map((variant) => `${variant}.json`);
}

function flattenTranslations(node: unknown, prefix = '', acc: Record<string, string> = {}) {
  if (node && typeof node === 'object' && !Array.isArray(node)) {
    for (const [key, value] of Object.entries(node)) {
      const next = prefix ? `${prefix}.${key}` : key;
      flattenTranslations(value, next, acc);
    }
    return acc;
  }
  if (Array.isArray(node)) {
    node.forEach((value, index) => {
      const next = `${prefix}.${index}`;
      flattenTranslations(value, next, acc);
    });
    return acc;
  }
  if (prefix) {
    acc[prefix] = node === undefined || node === null ? '' : String(node);
  }
  return acc;
}

function interpolateTranslation(template: string, replacements: Record<string, unknown>) {
  const sanitized = replacements ?? {};
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, token: string) => {
    const value = sanitized[token];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });
}

function extractNamedArgs(args: unknown[]) {
  const named: Record<string, unknown> = {};
  for (const arg of args) {
    if (Array.isArray(arg) && typeof arg[0] === 'string') {
      named[arg[0]] = arg[1];
      continue;
    }
    if (isPlainObject(arg)) {
      Object.assign(named, arg as Record<string, unknown>);
    }
  }
  return named;
}

function resolveDimensionOverrides(named: Record<string, unknown>): PlaceholderDimensions {
  return {
    width: normalizeDimension(named.width),
    height: normalizeDimension(named.height)
  };
}

function normalizeDimension(value: unknown): number | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return undefined;
  }
  return Math.round(numeric);
}

function resolvePlaceholderDimensions(overrides?: PlaceholderDimensions) {
  let width = normalizeDimension(overrides?.width);
  let height = normalizeDimension(overrides?.height);
  if (!width && !height) {
    width = DEFAULT_PLACEHOLDER_WIDTH;
    height = DEFAULT_PLACEHOLDER_HEIGHT;
  } else if (width && !height) {
    height = Math.max(1, Math.round(width * (DEFAULT_PLACEHOLDER_HEIGHT / DEFAULT_PLACEHOLDER_WIDTH)));
  } else if (!width && height) {
    width = Math.max(1, Math.round(height * (DEFAULT_PLACEHOLDER_WIDTH / DEFAULT_PLACEHOLDER_HEIGHT)));
  }
  return {
    width: width ?? DEFAULT_PLACEHOLDER_WIDTH,
    height: height ?? DEFAULT_PLACEHOLDER_HEIGHT
  } satisfies PlaceholderDimensions;
}

function createPlaceholderDataUrl(width: number, height: number, label: string) {
  const safeLabel = truncateLabel(label || DEFAULT_PLACEHOLDER_LABEL, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${PLACEHOLDER_BG}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${PLACEHOLDER_TEXT}" font-family="sans-serif" font-size="${Math.max(12, Math.round(Math.min(width, height) / 8))}">${escapeHtml(safeLabel)}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function truncateLabel(label: string, maxLength: number) {
  const trimmed = label.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function humanizeFilename(filename: string) {
  return filename
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeExternalUrl(url: string) {
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
}

function normalizeLiquidPath(relativePath: string) {
  return relativePath.replace(/\\/g, '/');
}

function ensureAsset(value: InlineAsset | string): InlineAsset {
  if (typeof value === 'string') {
    return {
      kind: 'asset',
      filename: 'inline.css',
      content: value,
      mimeType: 'text/plain'
    };
  }
  return value;
}

function normalizeSectionHandle(raw: string) {
  return raw.replace(/^['"`]|['"`]$/g, '').trim();
}

function extractHandleFromArgs(args: string) {
  const [first] = args.split(',');
  if (!first) return '';
  return normalizeSectionHandle(first);
}

function serializeAttributes(attrs: Record<string, unknown>) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => {
      if (value === true) {
        return key;
      }
      return `${key}="${escapeHtml(String(value))}"`;
    })
    .join(' ');
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });
}

function getMimeType(filename: string) {
  if (filename.endsWith('.css')) return 'text/css';
  if (filename.endsWith('.js')) return 'application/javascript';
  if (filename.endsWith('.json')) return 'application/json';
  return 'text/plain';
}

function isTextMime(mime: string) {
  return /^(text\/|application\/(javascript|json|xml))/i.test(mime);
}

async function renderChildTemplates(liquid: Liquid, templates: Template[], ctx: Context) {
  const iterator = liquid.renderer.renderTemplates(templates, ctx);
  return resolveGenerator(iterator);
}

async function resolveGenerator(iterable: unknown): Promise<unknown> {
  if (!iterable) {
    return '';
  }
  if (isPromiseLike(iterable)) {
    return iterable;
  }
  if (!isIterator(iterable)) {
    return iterable;
  }
  let result = iterable.next();
  while (!result.done) {
    const awaited = await resolveGenerator(result.value);
    result = iterable.next(awaited);
  }
  return result.value ?? '';
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return typeof value === 'object' && value !== null && typeof (value as PromiseLike<unknown>).then === 'function';
}

function isIterator(value: unknown): value is Iterator<unknown> {
  return typeof value === 'object' && value !== null && typeof (value as Iterator<unknown>).next === 'function';
}
