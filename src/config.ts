import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { fileExists } from './utils/fs.js';
import type { RenderOptions, SnapifyConfig, SnapshotOptions } from './types.js';

let cachedCwd: string | undefined;
let cachedConfig: Promise<SnapifyConfig | undefined> | undefined;

const CONFIG_CANDIDATES = [
  'snapify.config.mjs',
  'snapify.config.js',
  'snapify.config.cjs'
];

export async function loadConfig(cwd: string = process.cwd()): Promise<SnapifyConfig | undefined> {
  if (!cachedConfig || cachedCwd !== cwd) {
    cachedCwd = cwd;
    cachedConfig = readConfig(cwd);
  }
  return cachedConfig;
}

async function readConfig(cwd: string): Promise<SnapifyConfig | undefined> {
  for (const file of CONFIG_CANDIDATES) {
    const absolute = path.resolve(cwd, file);
    if (await fileExists(absolute)) {
      const mod = await import(pathToFileURL(absolute).href);
      return (mod.default ?? mod) as SnapifyConfig;
    }
  }
  return undefined;
}

export function mergeSnapshotOptions(base: SnapshotOptions | undefined, override: SnapshotOptions | undefined): SnapshotOptions | undefined {
  if (!base && !override) return undefined;
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    accept: override?.accept ?? override?.update ?? base?.accept ?? base?.update,
    dir: override?.dir ?? base?.dir
  };
}

export function mergeRenderOptions(config: SnapifyConfig | undefined, override: RenderOptions): RenderOptions {
  const mergedSnapshot = mergeSnapshotOptions(config?.snapshot, override.snapshot);
  return {
    ...config,
    ...override,
    template: override.template,
    themeRoot: override.themeRoot ?? config?.themeRoot,
    layout: override.layout ?? config?.layout,
    data: override.data ?? config?.data,
    styles: override.styles ?? config?.styles,
    viewport: override.viewport ?? config?.viewport,
    browser: override.browser ?? config?.browser,
    snapshot: mergedSnapshot
  };
}
