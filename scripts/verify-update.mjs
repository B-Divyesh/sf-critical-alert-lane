import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { preview } from 'vite';

const workerPath = new URL('../dist/sw.js', import.meta.url);
if (!existsSync(workerPath)) {
  throw new Error('The production build is missing. Run `npm run build` before the update check.');
}
const original = readFileSync(workerPath, 'utf8');
const marker = original.match(/const VERSION = '([^']+)'/)?.[1];
if (!marker) throw new Error('Could not find the service-worker version marker.');

// This check deliberately owns an ephemeral preview server. A fixed port made
// it pass only when a verifier happened to have started another process first.
const server = await preview({ preview: { host: '127.0.0.1', port: 0, strictPort: true } });
const address = server.httpServer?.address();
if (!address || typeof address === 'string') {
  await server.close();
  throw new Error('The update check could not determine its preview server address.');
}
const origin = `http://127.0.0.1:${address.port}`;
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(`${origin}/demo/`);
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
  await server.close();
}
