import { createServer } from 'node:http';
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, normalize, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
import { chromium } from '@playwright/test';

// Execute the web bundle embedded in an APK. This catches an APK that is
// signed and structurally valid but carries an older first-screen demo.
const apkPath = resolve(process.argv[2] ?? '');
if (!process.argv[2]) throw new Error('Usage: node scripts/verify-apk-demo.mjs <apk-path>');

const extraction = mkdtempSync(join(tmpdir(), 'critical-alert-lane-apk-'));
const publicRoot = join(extraction, 'assets/public');
const contentType = path => {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.json') || path.endsWith('.webmanifest')) return 'application/manifest+json; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.avif')) return 'image/avif';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
};
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

let server;
let browser;
try {
  execFileSync('unzip', ['-qq', apkPath, 'assets/public/*', '-d', extraction]);
  const root = resolve(publicRoot);
  server = createServer((request, response) => {
    const requested = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname);
    const normalized = normalize(requested).replace(/^[/\\]+/, '');
    let target = resolve(root, normalized || 'index.html');
    if (!target.startsWith(`${root}/`) && target !== root) {
      response.writeHead(400).end('Invalid path');
      return;
    }
    try {
      if (statSync(target).isDirectory()) target = join(target, 'index.html');
      response.writeHead(200, { 'Content-Type': contentType(target), 'Cache-Control': 'no-store' });
      response.end(readFileSync(target));
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolveServer, rejectServer) => {
    server.once('error', rejectServer);
    server.listen(0, '127.0.0.1', resolveServer);
  });
  const address = server.address();
  assert(address && typeof address !== 'string', 'Could not start the APK asset test server.');

  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(`page: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });

  const origin = `http://127.0.0.1:${address.port}`;
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await page.waitForURL(url => new URL(url).searchParams.get('demo') === '1');
  await page.getByText('Demo — sample data, nothing is saved').waitFor();
  assert(await page.locator('.reminder-row').count() === 3, 'APK demo does not load all three sample reminders.');

  for (const [name, control] of [
    ['due reminder', page.locator('.current-alert').getByRole('heading', { name: 'Take evening medicine' })],
    ['Acknowledge', page.getByRole('button', { name: 'Acknowledge' })],
    ['Snooze', page.getByRole('button', { name: 'Snooze' })]
  ]) {
    const box = await control.boundingBox();
    assert(box, `APK demo ${name} is not rendered.`);
    assert(box.y >= 0 && box.y + box.height <= 844, `APK demo ${name} is outside the first 390x844 viewport (y=${box.y}, height=${box.height}).`);
  }
  assert(errors.length === 0, `APK embedded demo emitted errors: ${errors.join(' | ')}`);
  await context.close();
  console.log(`APK demo viewport passed: ${basename(apkPath)}; due reminder, Acknowledge, and Snooze are inside 390x844 after one click.`);
} finally {
  await browser?.close();
  await new Promise(resolveServer => server?.close(resolveServer) ?? resolveServer());
  rmSync(extraction, { recursive: true, force: true });
}
