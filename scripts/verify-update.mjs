import { readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const workerPath = new URL('../dist/sw.js', import.meta.url);
const original = readFileSync(workerPath, 'utf8');
const marker = original.match(/const VERSION = '([^']+)'/)?.[1];
if (!marker) throw new Error('Could not find the service-worker version marker.');

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto('http://127.0.0.1:4174/demo/');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  writeFileSync(workerPath, original.replace(`const VERSION = '${marker}'`, `const VERSION = '${marker}-update-check'`));
  await page.evaluate(async () => (await navigator.serviceWorker.getRegistration())?.update());
  await page.getByText('An update is ready. Reopen the app to use it.').waitFor();
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('button', { name: 'Add critical reminder' }).waitFor();
  console.log(`PASS: ${marker} detected an update and the updated demo reloaded offline.`);
} finally {
  writeFileSync(workerPath, original);
  await browser.close();
}
