import assert from "node:assert/strict";
import test from "node:test";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { render } from "../src/render.js";
import { SNAPIFY_ASSET_HOST } from "../src/core/constants.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE_THEME = path.join(here, "theme");
const SNAPSHOT_DIR = path.join(here, "__snapshots__");

test(
	"captures baseline snapshot (html + image) for fixture",
	{ concurrency: false },
	async () => {
		const result = await render({
			themeRoot: FIXTURE_THEME,
			template: "index",
			browser: "chromium",
			viewport: { width: 800, height: 600 },
			snapshot: {
				name: "fixture-index",
				dir: SNAPSHOT_DIR,
				update: true,
			},
		});

		assert.ok(await pathExists(result.htmlPath), "HTML artifact missing");
		assert.ok(
			await pathExists(result.screenshotPath),
			"Screenshot artifact missing",
		);
		assert.equal(
			result.status,
			"updated",
			"Baseline should refresh during integration run",
		);
	},
);

test(
	"matches snapshot HTML and image against baseline",
	{ concurrency: false },
	async () => {
		const result = await render({
			themeRoot: FIXTURE_THEME,
			template: "index",
			browser: "chromium",
			viewport: { width: 800, height: 600 },
			snapshot: {
				name: "fixture-index",
				dir: SNAPSHOT_DIR,
				update: false,
			},
		});

		assert.equal(
			result.status,
			"matched",
			"Should not rewrite baseline during regression run",
		);

		const escapedHost = escapeRegExp(SNAPIFY_ASSET_HOST);
		const html = await readFile(result.htmlPath, "utf8");
		assert.equal(
			result.htmlChanged,
			false,
			"HTML should match stored baseline",
		);
		assert.match(
			html,
			/Book a demo/,
			"button label should render from section settings",
		);
		assert.match(
			html,
			new RegExp(`href="${escapedHost}\/assets\/main\.css`),
			"asset_url links should persist in HTML snapshot",
		);
		assert.match(
			html,
			/data-section="hero"/,
			"section wrappers should remain intact",
		);
	},
);

async function pathExists(target: string) {
	try {
		await access(target);
		return true;
	} catch {
		return false;
	}
}

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
