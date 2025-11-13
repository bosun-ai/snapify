#!/usr/bin/env node
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import type { ArgumentsCamelCase, BuilderCallback } from 'yargs';
import pc from 'picocolors';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { render } from './render.js';
import type { BrowserName, RenderResult } from './types.js';
import { fileExists } from './utils/fs.js';

interface CliArgs {
  template: string;
  themeRoot?: string;
  layout?: string;
  data?: string;
  styles?: string;
  stylesFile?: string;
  viewport?: string;
  name?: string;
  baselineDir?: string;
  outputDir?: string;
  update?: boolean;
  browser?: BrowserName;
}

const renderBuilder: BuilderCallback<{}, CliArgs> = (cmd) =>
  cmd
        .positional('template', {
          describe: 'Template handle or path inside templates/',
          type: 'string'
        })
        .option('theme-root', {
          type: 'string',
          describe: 'Shopify theme directory (defaults to cwd).'
        })
        .option('layout', {
          type: 'string',
          describe: 'Override the layout file (without .liquid).'
        })
        .option('data', {
          type: 'string',
          describe: 'Inline JSON or path to a JSON file containing Liquid data context.'
        })
        .option('styles', {
          type: 'string',
          describe: 'Extra CSS string to inject into the head.'
        })
        .option('styles-file', {
          type: 'string',
          describe: 'Path to a CSS file to inline for the snapshot.'
        })
        .option('viewport', {
          type: 'string',
          describe: 'Viewport in the form WIDTHxHEIGHT (e.g. 1280x720).'
        })
        .option('browser', {
          type: 'string',
          choices: ['chromium', 'firefox', 'webkit'] as const,
          describe: 'Playwright browser to launch (defaults to chromium).'
        })
        .option('name', {
          type: 'string',
          describe: 'Custom snapshot name.'
        })
        .option('baseline-dir', {
          type: 'string',
          describe: 'Directory for baseline screenshots (defaults to .snapify/baseline).'
        })
        .option('output-dir', {
          type: 'string',
          describe: 'Directory for artifacts (defaults to .snapify/artifacts).'
        })
        .option('update', {
          type: 'boolean',
          default: false,
          describe: 'Rewrite the baseline snapshot.'
        });

yargs(hideBin(process.argv))
  .scriptName('snapify')
  .command<CliArgs>(
    'render <template>',
    'Render a Shopify template and capture a visual snapshot.',
    renderBuilder,
    async (argv: ArgumentsCamelCase<CliArgs>) => {
      try {
        const themeRoot = argv.themeRoot ? path.resolve(argv.themeRoot) : process.cwd();
        const data = await loadJson(argv.data);
        const styles = await loadStyles(argv.styles, argv.stylesFile);
        const viewport = parseViewport(argv.viewport);

        const result = await render({
          template: argv.template,
          themeRoot,
          layout: argv.layout,
          data,
          styles,
          viewport,
          browser: argv.browser,
          snapshot: {
            name: argv.name,
            baselineDir: argv.baselineDir,
            outputDir: argv.outputDir,
            update: argv.update
          }
        });

        logSuccess(result);
      } catch (error) {
        console.error(pc.red(`✖ ${(error as Error).message}`));
        process.exit(1);
      }
    }
  )
  .demandCommand(1)
  .help()
  .strict()
  .parse();

async function loadJson(payload?: string) {
  if (!payload) return undefined;
  try {
    const maybePath = path.resolve(payload);
    if (await fileExists(maybePath)) {
      const raw = await readFile(maybePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // noop
  }
  return JSON.parse(payload);
}

async function loadStyles(inline?: string, filePath?: string) {
  if (filePath) {
    const absolute = path.resolve(filePath);
    return await readFile(absolute, 'utf8');
  }
  return inline;
}

function parseViewport(value?: string) {
  if (!value) return undefined;
  const match = value.match(/^(\d+)x(\d+)$/i);
  if (!match) {
    throw new Error('Viewport must be in WIDTHxHEIGHT format, e.g. 1280x720');
  }
  return { width: Number(match[1]), height: Number(match[2]) };
}

function logSuccess(result: RenderResult) {
  console.log(pc.green('✔ Snapshot captured'));
  console.log(` html: ${result.htmlPath}`);
  console.log(` shot: ${result.screenshotPath}`);
  if (result.diffPath) {
    console.log(pc.yellow(` diff: ${result.diffPath}`));
  } else if (result.updatedBaseline) {
    console.log(pc.cyan(' baseline updated'));
  } else {
    console.log(pc.green(' baseline unchanged'));
  }
}

// fileExists imported from utils
