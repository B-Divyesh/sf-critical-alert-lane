import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';

const importedReminder = (id: string, title: string) => ({
  id,
  title,
  note: '',
  nextAt: '2026-09-01T09:00:00.000Z',
  recurrence: 'daily',
  repeatMinutes: 5,
  escalationMinutes: 60,
  enabled: true,
  createdAt: '2026-08-28T09:00:00.000Z',
  updatedAt: '2026-08-28T09:00:00.000Z'
});

const importedBackup = (reminders: ReturnType<typeof importedReminder>[]) => ({
  version: 1,
  reminders,
  history: [],
  settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
  updatedAt: '2026-08-28T09:00:00.000Z'
});

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

test('@claim:offline-reload works offline after the first visit', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: /Keep critical Android reminders repeating/ })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await page.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still working')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add critical reminder' })).toBeVisible();
});

test('@claim:repeat-until-handled lets a sample reminder stay due until it is snoozed or acknowledged', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await expect(page.locator('.current-alert')).toContainText('Take evening medicine');
  await expect(page.locator('.current-alert')).toContainText('● REPEATING NOW');
  await expect(page.getByText('Daily · repeats every 5 min until handled')).toBeVisible();

  await page.getByRole('button', { name: 'Snooze' }).click();
  await expect(page.getByText(/Snoozed “Take evening medicine” for 10 minutes/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Acknowledge' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Reset demo' }).click();
  await expect(page.getByRole('button', { name: 'Acknowledge' })).toBeVisible();
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(page.getByRole('status')).toContainText('Acknowledged “Take evening medicine”.');
  await expect(page.getByRole('button', { name: 'Acknowledge' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Take evening medicine' }).last()).toBeVisible();
});

test('@claim:demo-isolation keeps sample actions separate from a real reminder lane', async ({ page }) => {
  await page.goto('/demo');
  await page.evaluate(async () => {
    const realData = {
      version: 1,
      reminders: [{ id: 'real-only', title: 'Real reminder stays private', note: '', nextAt: '2026-09-01T09:00:00.000Z', recurrence: 'daily', repeatMinutes: 5, escalationMinutes: 60, enabled: true, createdAt: '2026-08-28T09:00:00.000Z', updatedAt: '2026-08-28T09:00:00.000Z' }],
      history: [], settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' }, updatedAt: '2026-08-28T09:00:00.000Z'
    };
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('critical-alert-lane', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const transaction = request.result.transaction('state', 'readwrite');
        transaction.objectStore('state').put(realData, 'app-data');
        transaction.oncomplete = () => { request.result.close(); resolve(); };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await expect(page.getByText('Real reminder stays private')).toHaveCount(0);
  await page.getByRole('button', { name: 'Start for real' }).click();
  await page.waitForURL('http://127.0.0.1:4173/');
  await expect(page.getByRole('heading', { name: 'Real reminder stays private' })).toBeVisible();
  await expect(page.getByText('Take evening medicine')).toHaveCount(0);
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

test('@claim:safe-import repairs duplicate IDs and the Aa/BB Java hash collision during import', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  const confirmation = new Promise<string>(resolve => page.once('dialog', async dialog => {
    const message = dialog.message();
    await dialog.accept();
    resolve(message);
  }));
  await page.locator('#import-data').setInputFiles({
    name: 'unsafe-identities.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedBackup([
      importedReminder('duplicate', 'First duplicate'),
      importedReminder('duplicate', 'Second duplicate'),
      importedReminder('Aa', 'Aa collision'),
      importedReminder('BB', 'BB collision')
    ])))
  });

  expect(await confirmation).toContain('2 unsafe reminder ID(s) will be repaired');
  await expect(page.locator('#toast')).toContainText('2 reminder ID(s) repaired');
  await expect(page.getByRole('heading', { name: 'First duplicate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Second duplicate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Aa collision' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'BB collision' })).toBeVisible();

  const ids = await page.locator('.reminder-row').evaluateAll(rows => rows.map(row => row.getAttribute('data-id')));
  expect(ids).toContain('duplicate');
  expect(ids).toContain('duplicate~import-2');
  expect(ids).toContain('Aa');
  expect(ids).toContain('BB~import-4');
  expect(new Set(ids).size).toBe(4);

  await page.getByRole('button', { name: 'Edit Second duplicate' }).click();
  await page.getByLabel('What needs your answer?').fill('Edited second only');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.getByRole('heading', { name: 'First duplicate' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Edited second only' })).toBeVisible();
});

test('@claim:free-limit imports all reminders but arms only three on the free tier', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  const confirmation = new Promise<string>(resolve => page.once('dialog', async dialog => {
    const message = dialog.message();
    await dialog.accept();
    resolve(message);
  }));
  await page.locator('#import-data').setInputFiles({
    name: 'four-active-reminders.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(importedBackup([
      importedReminder('one', 'First active'),
      importedReminder('two', 'Second active'),
      importedReminder('three', 'Third active'),
      importedReminder('four', 'Fourth preserved')
    ])))
  });

  const confirmationMessage = await confirmation;
  expect(confirmationMessage).toContain('The free lane can arm 3 reminders');
  expect(confirmationMessage).toContain('1 additional reminder(s) will be imported paused, not deleted');
  await expect(page.locator('#toast')).toContainText('1 reminder(s) paused for the 3-active free limit');
  await expect(page.getByText('3 / 3 free active')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Fourth preserved' })).toBeVisible();
  const fourthRow = page.locator('.reminder-row[data-id="four"]');
  await expect(fourthRow).toContainText('‖ PAUSED');
  await expect(fourthRow).toContainText('Paused · free limit');
});

test('opens and closes dialogs from the keyboard', async ({ page }) => {
  await page.goto('/');
  const add = page.getByRole('button', { name: 'Add critical reminder' });
  await add.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Add critical reminder' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Add critical reminder' })).not.toBeVisible();
  await expect(add).toBeFocused();
  const settings = page.getByRole('button', { name: 'Settings' });
  await settings.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Settings & data' })).toBeVisible();
});

test('returns focus to an edited reminder after closing the editor', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add critical reminder' }).click();
  await page.getByLabel('What needs your answer?').fill('Check the oxygen tank');
  await page.getByLabel('First alert').fill('2026-09-01T09:00');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  const edit = page.getByRole('button', { name: 'Edit Check the oxygen tank' });
  await edit.click();
  await page.keyboard.press('Escape');
  await expect(edit).toBeFocused();
});

test('announces invalid quiet hours without mutating data or raising a page error', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Start').fill('');
  await page.getByRole('button', { name: 'Save quiet hours' }).click();
  await expect(page.locator('#quiet-form-error')).toHaveText('Enter both a start and end time for quiet hours.');
  await expect(page.getByLabel('Start')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByRole('dialog', { name: 'Settings & data' })).toBeVisible();
  await page.getByLabel('Start').fill('21:30');
  await page.getByRole('button', { name: 'Save quiet hours' }).click();
  await expect(page.getByRole('status')).toContainText('Quiet hours saved.');
  expect(errors).toEqual([]);
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

test('@claim:local-private keeps an ordinary reminder flow on the product origin', async ({ page }) => {
  const externalRequests: string[] = [];
  page.on('request', request => {
    const url = new URL(request.url());
    if (url.origin !== 'http://127.0.0.1:4173') externalRequests.push(url.href);
  });
  await page.goto('/demo');
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Delete Water the balcony plants' }).click();
  await expect(page.getByText('Water the balcony plants')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add critical reminder' }).click();
  await page.getByLabel('What needs your answer?').fill('Refill the medicine box');
  await page.getByLabel('First alert').fill('2026-09-01T09:00');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  await expect(page.getByRole('heading', { name: 'Refill the medicine box' }).first()).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Refill the medicine box' }).first()).toBeVisible();
  expect(externalRequests).toEqual([]);
});

test('legal pages are available', async ({ page }) => {
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1, name: 'Terms' })).toBeVisible();
});

test('@claim:apk-download publishes an installable Android package with its integrity digest', async ({ page, request }) => {
  await page.goto('/demo');
  const download = page.getByRole('link', { name: 'Download Android app (APK)' });
  await expect(download).toHaveAttribute('href', /critical-alert-lane-1\.0\.3\.apk$/);
  await expect(page.locator('.apk-proof code')).toHaveText(/^[a-f0-9]{64}$/);
  const href = await download.getAttribute('href');
  if (!href) throw new Error('Android download link has no URL.');
  const response = await request.get(href);
  expect(response.ok()).toBeTruthy();
  const apk = await response.body();
  expect(apk.byteLength).toBeGreaterThan(1_000_000);
  expect(createHash('sha256').update(apk).digest('hex')).toBe(await page.locator('.apk-proof code').textContent());
});

test('does not offer an APK download from inside the Android shell', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'androidBridge', { value: {} });
    Object.defineProperty(window, 'Capacitor', {
      value: {
        PluginHeaders: [{ name: 'ReminderScheduler', methods: [
          { name: 'status', rtype: 'promise' },
          { name: 'sync', rtype: 'promise' }
        ] }],
        nativePromise: (_plugin: string, method: string) => Promise.resolve(method === 'status'
          ? { notifications: 'granted', exactAlarms: 'granted' }
          : { ok: true })
      }
    });
  });
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Download Android app (APK)' })).toHaveCount(0);
  await expect(page.locator('.apk-proof')).toHaveCount(0);
});

test('@claim:one-time-license offers the registered one-time unlimited purchase through Sociobot', async ({ page }) => {
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Settings' }).click();
  const buy = page.getByRole('link', { name: 'Buy once · US$4.99' });
  await expect(buy).toHaveAttribute('href', 'https://api.sociobot.in/api/v1/products/critical-alert-lane/checkout');
  await expect(page.getByText('A US$4.99 one-time purchase adds unlimited active reminders. No subscription.')).toBeVisible();
});
