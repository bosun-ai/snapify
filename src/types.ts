import type { BrowserContextOptions, Page } from 'playwright';

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
}

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
  /**
   * Optional callback to mutate the Playwright page prior to grabbing the screenshot.
   */
  beforeSnapshot?: (page: Page) => Promise<void> | void;
  snapshot?: SnapshotOptions;
}

export interface RenderResult {
  htmlPath: string;
  screenshotPath: string;
  diffPath?: string;
  updatedBaseline?: boolean;
}

export interface SnapifyConfig extends RenderOptions {}
