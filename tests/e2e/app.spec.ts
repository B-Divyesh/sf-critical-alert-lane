import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

test('creates, persists, and acknowledges a due reminder', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add critical reminder' }).click();
  await page.getByLabel('What needs your answer?').fill('Call the clinic');
  await page.getByLabel('First alert').fill('2025-01-01T09:00');
  await page.getByLabel('Schedule').selectOption('daily');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  await expect(page.getByRole('heading', { name: 'Call the clinic' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Acknowledge' })).toBeVisible();
  await page.reload();
  await expect(page.getByText('Call the clinic').first()).toBeVisible();
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(page.getByRole('status')).toContainText('Acknowledged');
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
});

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Reminders that wait/ })).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still working')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add critical reminder' })).toBeVisible();
});

test('keeps whitespace-title recovery in the editor without a page error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Add critical reminder' }).click();
  await page.getByLabel('What needs your answer?').fill('   ');
  await page.getByLabel('First alert').fill('2026-09-01T09:00');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  await expect(page.locator('#form-error')).toHaveText('Enter what needs your answer. A title cannot be blank.');
  await expect(page.getByRole('dialog', { name: 'Add critical reminder' })).toBeVisible();
  await page.getByLabel('What needs your answer?').fill('Call the clinic');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  await expect(page.getByText('Call the clinic').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('keeps offline state visible and footer links touch-sized on a 390px phone', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still working')).toBeVisible();
  for (const link of [page.locator('.brand'), page.getByRole('link', { name: 'Privacy' }), page.getByRole('link', { name: 'Terms' }), page.getByRole('link', { name: 'A Sociobot utility' })]) {
    expect(await link.evaluate(element => element.getBoundingClientRect().height)).toBeGreaterThanOrEqual(44);
    expect(await link.evaluate(element => element.getBoundingClientRect().width)).toBeGreaterThanOrEqual(44);
  }
});

test('rejects a corrupt backup without replacing device data', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.locator('#import-data').setInputFiles({
    name: 'corrupt-critical-alert-lane.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1,
      reminders: [{ id: 'broken', title: 'Broken reminder', note: '', nextAt: 'not-a-time', recurrence: 'not-a-recurrence', repeatMinutes: -1, escalationMinutes: 0, enabled: true, createdAt: '2026-08-28T09:00:00.000Z', updatedAt: '2026-08-28T09:00:00.000Z' }],
      history: [], settings: { quietEnabled: true, quietStart: '25:00', quietEnd: '07:00' }, updatedAt: 'not-a-time'
    }))
  });
  await expect(page.locator('#toast')).toContainText(/reminders.*invalid/i);
  await expect(page.getByText('Broken reminder')).toHaveCount(0);
});

test('opens and closes dialogs from the keyboard', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add critical reminder' });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Add critical reminder' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Add critical reminder' })).not.toBeVisible();
  const settings = page.getByRole('button', { name: 'Settings' });
  await settings.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Settings & data' })).toBeVisible();
});

test('has no serious accessibility violations', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''))).toEqual([]);
  expect(errors).toEqual([]);
});

test('legal pages are available', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1, name: 'Terms' })).toBeVisible();
});

test('publishes an installable Android package with its integrity digest', async ({ page, request }) => {
  await page.goto('/');
  const download = page.getByRole('link', { name: 'Download Android app (APK)' });
  await expect(download).toHaveAttribute('href', /critical-alert-lane-1\.0\.1\.apk$/);
  await expect(page.locator('.apk-proof code')).toHaveText(/^[a-f0-9]{64}$/);
  const href = await download.getAttribute('href');
  if (!href) throw new Error('Android download link has no URL.');
  const response = await request.get(href);
  expect(response.ok()).toBeTruthy();
  const apk = await response.body();
  expect(apk.byteLength).toBeGreaterThan(1_000_000);
  expect(createHash('sha256').update(apk).digest('hex')).toBe(await page.locator('.apk-proof code').textContent());
});

test('offers the registered one-time unlimited purchase through Sociobot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  const buy = page.getByRole('link', { name: 'Buy once · US$4.99' });
  await expect(buy).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/critical-alert-lane/checkout');
  await expect(page.getByText('A US$4.99 one-time purchase adds unlimited active reminders. No subscription.')).toBeVisible();
});
