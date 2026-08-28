import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

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
  await expect(page.getByText('Offline · still working')).toBeAttached();
  await expect(page.getByRole('button', { name: 'Add critical reminder' })).toBeVisible();
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
