// Screenshot a URL. Usage: node screenshot.mjs <url> [label] [--width=1440] [--height=900] [--viewport]
// Saves to ./temporary screenshots/screenshot-N.png (or screenshot-N-label.png), never overwriting.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(ROOT, 'temporary screenshots');

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => {
    const [k, v = 'true'] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);
const positional = args.filter((a) => !a.startsWith('--'));

const url = positional[0] || 'http://localhost:3000';
const label = positional[1] ? String(positional[1]).replace(/[^a-z0-9._-]+/gi, '-') : '';
const width = Number(flags.width) || 1440;
const height = Number(flags.height) || 900;
const fullPage = !flags.viewport;

fs.mkdirSync(OUT_DIR, { recursive: true });

// Auto-increment across every screenshot-N*.png already in the folder.
const next =
  fs
    .readdirSync(OUT_DIR)
    .map((f) => /^screenshot-(\d+)/.exec(f))
    .filter(Boolean)
    .reduce((max, m) => Math.max(max, Number(m[1])), 0) + 1;

const outPath = path.join(OUT_DIR, `screenshot-${next}${label ? `-${label}` : ''}.png`);

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 2 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts?.ready);
  // Let entrance animations and lazy images settle.
  await new Promise((r) => setTimeout(r, 600));
  await page.screenshot({ path: outPath, fullPage });
  console.log(outPath);
} finally {
  await browser.close();
}
