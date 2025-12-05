import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "../src/render.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const THEME_ROOT = path.join(here, "theme");
const SNAPSHOT_ROOT = path.join(here, "__snapshots__");
const BASELINE_DIR = path.join(SNAPSHOT_ROOT, "baseline");
const ARTIFACT_DIR = path.join(SNAPSHOT_ROOT, "artifacts");
const skipInCi = process.env.CI === "true";
const maybeTest = skipInCi ? test.skip : test;

async function fileExists(target: string) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

maybeTest(
	"README example render matches baseline (HTML + PNG)",
	{ concurrency: false },
	async () => {
		const name = "readme-example";
		const baselineExists = await fileExists(
			path.join(BASELINE_DIR, `${name}.png`),
		);
		const updateFlag = process.env.SNAPIFY_UPDATE_BASELINES === "1";
		const update = updateFlag || (!baselineExists && process.env.CI !== "true");
		const result = await render({
			themeRoot: THEME_ROOT,
			template: "index",
			viewport: { width: 1280, height: 720 },
			snapshot: {
				name,
				baselineDir: BASELINE_DIR,
				outputDir: ARTIFACT_DIR,
				update,
			},
		});

		assert.equal(
			result.updatedBaseline,
			false,
			"should not rewrite baseline during regression run",
		);
		assert.equal(result.htmlChanged, false, "HTML should match baseline");
		assert.equal(result.diffPath, undefined, "image diff should be clean");

		const baselinePng = await readFile(path.join(BASELINE_DIR, `${name}.png`));
		const latestPng = await readFile(result.screenshotPath);
		assert.ok(
			baselinePng.equals(latestPng),
			"screenshot bytes should match baseline",
		);
	},
);

maybeTest(
	"examples/jest homepage example remains valid",
	{ concurrency: false },
	async () => {
		const name = "index-jest";
		const baselineExists = await fileExists(
			path.join(BASELINE_DIR, `${name}.png`),
		);
		const updateFlag = process.env.SNAPIFY_UPDATE_BASELINES === "1";
		const update = updateFlag || (!baselineExists && process.env.CI !== "true");
		const result = await render({
			themeRoot: THEME_ROOT,
			template: "index",
			snapshot: {
				name,
				baselineDir: BASELINE_DIR,
				outputDir: ARTIFACT_DIR,
				update,
			},
		});

		assert.equal(result.htmlChanged, false);
		assert.equal(result.updatedBaseline, false);
		assert.equal(result.diffPath, undefined);
	},
);
