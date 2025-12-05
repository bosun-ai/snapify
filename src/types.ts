import type { BrowserContextOptions, Page } from 'playwright';

export type BrowserName = 'chromium' | 'firefox' | 'webkit';

/**
 * Controls where snapshots are written and how the diff/baseline lifecycle should behave.
 */
export interface SnapshotOptions {
  /**
   * Unique name for the snapshot. If omitted we derive it from the template path.
   */
  name?: string;
  /** Directory to store baseline snapshots. */
  baselineDir?: string;
  /** Directory to store the latest run artifacts (diffs, html, screenshots). */
  outputDir?: string;
  /** Skip diffing and always write a fresh baseline. */
  update?: boolean;
  /** Capture the full scroll height (default true). */
  fullPage?: boolean;
}

/**
 * User-facing inputs accepted by {@link render}, mirroring the CLI flags with extra hooks for library consumers.
 */
export interface RenderOptions {
  /** Absolute or relative path to the Shopify theme root. */
  themeRoot?: string;
  /** Template file (inside templates/) to render, e.g. 'product'. */
  template: string;
  /** Optional override for the layout file (inside layout/). */
  layout?: string | false;
  /** Liquid data/context that should be provided when rendering. */
  data?: Record<string, unknown>;
  /** Additional CSS that should be appended to the compiled HTML. */
  styles?: string;
  /** Custom viewport configuration for Playwright. */
  viewport?: BrowserContextOptions['viewport'];
  /** Locale code (e.g. en.default) used for translations. */
  locale?: string;
  /** Which Playwright browser to launch (defaults to chromium). */
  browser?: BrowserName;
  /**
   * Optional callback to mutate the Playwright page prior to grabbing the screenshot.
   */
  beforeSnapshot?: (page: Page) => Promise<void> | void;
  snapshot?: SnapshotOptions;
}

/**
 * Artifacts produced by {@link render}, allowing callers to inspect HTML, screenshots, and diffs.
 */
export interface RenderResult {
  htmlPath: string;
  htmlBaselinePath?: string;
  htmlChanged?: boolean;
  screenshotPath: string;
  diffPath?: string;
  updatedBaseline?: boolean;
}

/** Public configuration shape for future snapify.config.ts files; currently mirrors {@link RenderOptions}. */
export interface SnapifyConfig extends RenderOptions {}

/**
 * Asset metadata captured during template assembly so the SnapshotRunner can fulfill Playwright requests offline.
 */
export interface RegisteredAsset {
  url: string;
  filePath: string;
  mimeType: string;
  body: Buffer;
  base64: string;
}
