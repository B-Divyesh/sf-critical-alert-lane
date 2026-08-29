import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseURL = 'https://critical-alert-lane.sociobot.in';
const result = {
  assertions: [],
  consoleErrors: [],
  pageErrors: [],
  requests: [],
  responseHeaders: {},
  axe: [],
};

function check(condition, label, detail = '') {
  result.assertions.push({ label, pass: Boolean(condition), detail });
  if (!condition) throw new Error(`${label}${detail ? `: ${detail}` : ''}`);
}

async function visible(locator) {
  return locator.isVisible().catch(() => false);
}

async function axe(page, name) {
  const scan = await new AxeBuilder({ page }).analyze();
  const severe = scan.violations.filter(item => ['serious', 'critical'].includes(item.impact ?? ''));
  result.axe.push({ name, total: scan.violations.length, seriousCritical: severe.map(item => item.id) });
  check(severe.length === 0, `axe ${name} has no serious/critical findings`, JSON.stringify(severe.map(item => item.id)));
}

function observe(page) {
  page.on('request', request => result.requests.push({ method: request.method(), type: request.resourceType(), url: request.url() }));
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  page.on('pageerror', error => result.pageErrors.push(error.message));
}

async function tabTo(page, selector, max = 30) {
  for (let index = 0; index < max; index += 1) {
    await page.keyboard.press('Tab');
    if (await page.locator(selector).evaluate((element) => element === document.activeElement).catch(() => false)) return true;
  }
  return false;
}

const browser = await chromium.launch({ headless: true });

try {
  const desktop = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const page = await desktop.newPage();
  observe(page);
  let response = await page.goto(`${baseURL}/`, { waitUntil: 'networkidle' });
  result.responseHeaders.root = await response.headers();
  check(response.status() === 200, 'live root returns 200', String(response.status()));
  check(await page.locator('html').getAttribute('lang') === 'en', 'root language is English');
  check(await page.locator('main').count() === 1, 'root has one main landmark');
  check(await page.locator('h1').count() === 1, 'root has one h1');
  check(await page.title() === 'Critical Alert Lane — repeating Android reminders', 'root title is product-specific', await page.title());
  await axe(page, 'desktop root');

  check(await tabTo(page, '.skip-link', 1), 'first Tab focuses skip link');
  const skipStyle = await page.locator('.skip-link').evaluate(element => {
    const style = getComputedStyle(element);
    return { outline: style.outline, background: style.backgroundColor };
  });
  check(skipStyle.background === 'rgb(243, 200, 75)', 'skip-link focus is visibly yellow', JSON.stringify(skipStyle));
  await page.keyboard.press('Enter');
  check(await page.locator('#page-title').evaluate(element => element === document.activeElement), 'skip link moves focus to the main heading');
  check(await tabTo(page, '#add-reminder'), 'keyboard reaches Add critical reminder');
  const addFocus = await page.locator('#add-reminder').evaluate(element => getComputedStyle(element).outline);
  check(addFocus.includes('4px'), 'focused Add button has designed outline', addFocus);
  await page.keyboard.press('Enter');
  check(await visible(page.getByRole('dialog', { name: 'Add critical reminder' })), 'Enter opens reminder editor');
  check(await page.getByLabel('What needs acknowledgement?').evaluate(element => element === document.activeElement), 'editor moves focus to title');
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => document.activeElement?.id === 'add-reminder');
  check(await page.locator('#add-reminder').evaluate(element => element === document.activeElement), 'Escape returns focus to opener');

  await page.getByRole('button', { name: 'Add critical reminder' }).click();
  await page.getByLabel('What needs acknowledgement?').fill('   ');
  await page.getByLabel('First alert').fill('2025-01-01T09:00');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  check((await page.locator('#form-error').innerText()).includes('title cannot be blank'), 'blank title shows actionable inline error');
  check(await page.getByLabel('What needs acknowledgement?').getAttribute('aria-invalid') === 'true', 'blank title is marked invalid');
  await page.getByLabel('What needs acknowledgement?').fill('<img src=x onerror=alert(1)> Call clinic');
  await page.getByLabel('Note (optional)').fill('<script>window.injected=true</script>');
  await page.getByLabel('Schedule').selectOption('weekdays');
  await page.getByLabel('Repeat until acknowledged').selectOption('60');
  await page.getByLabel('Acknowledgement window').selectOption('1440');
  await page.getByRole('button', { name: 'Arm reminder' }).click();
  const literalTitle = page.getByText('<img src=x onerror=alert(1)> Call clinic', { exact: true }).first();
  await literalTitle.waitFor({ state: 'visible' });
  check(await visible(literalTitle), 'boundary reminder saves with literal HTML-like title');
  check(await page.locator('script').filter({ hasText: 'window.injected=true' }).count() === 0, 'HTML-like note is not injected');
  check(await page.evaluate(() => !window.injected), 'HTML-like note does not execute');
  check(await visible(page.getByText('Weekdays · repeats every 60 min until acknowledged')), 'weekday and 60-minute boundary persist');
  check(await visible(page.getByText('24 hr')), '24-hour acknowledgement boundary renders');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByText('<img src=x onerror=alert(1)> Call clinic', { exact: true }).first().waitFor({ state: 'visible' });
  check(await visible(page.getByText('<img src=x onerror=alert(1)> Call clinic', { exact: true }).first()), 'created reminder persists after reload');
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await page.getByRole('button', { name: 'Undo' }).waitFor({ state: 'visible' });
  check((await page.getByRole('status').innerText()).includes('Acknowledged'), 'due reminder can be acknowledged');
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Acknowledge' }).waitFor({ state: 'visible' });
  check(await visible(page.getByRole('button', { name: 'Acknowledge' })), 'acknowledgement Undo restores due reminder');

  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.getByLabel('Start').fill('');
  await page.getByRole('button', { name: 'Save quiet hours' }).click();
  check((await page.locator('#quiet-form-error').innerText()).includes('Enter both'), 'invalid quiet hours announce recovery');
  await page.getByLabel('Start').fill('23:59');
  await page.getByLabel('End').fill('00:01');
  await page.getByRole('button', { name: 'Save quiet hours' }).click();
  await page.locator('#toast').filter({ hasText: 'Quiet hours saved' }).waitFor({ state: 'visible' });
  check((await page.getByRole('status').innerText()).includes('Quiet hours saved'), 'overnight quiet-hours boundary saves');
  await page.getByRole('button', { name: 'Open settings' }).click();
  await page.locator('#import-data').setInputFiles({ name: 'malformed.json', mimeType: 'application/json', buffer: Buffer.from('{not-json') });
  await page.locator('#toast').filter({ hasText: 'not a valid Critical Alert Lane export' }).waitFor({ state: 'visible' });
  check((await page.getByRole('status').innerText()).includes('not a valid Critical Alert Lane export'), 'malformed import gives actionable error');
  check(await visible(page.getByText('<img src=x onerror=alert(1)> Call clinic', { exact: true }).first()), 'malformed import preserves existing data');
  await axe(page, 'desktop settings with recovery message');
  await page.keyboard.press('Escape');

  await page.goto(`${baseURL}/?demo=1`, { waitUntil: 'networkidle' });
  check(await page.locator('.reminder-row').count() === 3, 'demo starts with three sample reminders');
  await page.locator('#snooze-minutes').selectOption('180');
  await page.getByRole('button', { name: 'Snooze' }).click();
  await page.locator('#toast').filter({ hasText: '180 minutes' }).waitFor({ state: 'visible' });
  check((await page.getByRole('status').innerText()).includes('180 minutes'), 'maximum snooze boundary works');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Acknowledge' }).waitFor({ state: 'visible' });
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await page.getByRole('button', { name: 'Undo' }).waitFor({ state: 'visible' });
  check((await page.getByRole('status').innerText()).includes('Acknowledged “Take evening medicine”'), 'demo acknowledgement works');
  await page.getByRole('button', { name: 'Undo' }).click();
  await page.getByRole('button', { name: 'Acknowledge' }).waitFor({ state: 'visible' });
  check(await visible(page.getByRole('button', { name: 'Acknowledge' })), 'demo acknowledgement can be undone');
  await axe(page, 'desktop populated demo');
  await page.screenshot({ path: '.factory/qa-evidence/live-desktop-demo.png', fullPage: true });

  for (const [path, title] of [['/privacy/', 'Privacy — Critical Alert Lane'], ['/terms/', 'Terms — Critical Alert Lane']]) {
    response = await page.goto(`${baseURL}${path}`, { waitUntil: 'networkidle' });
    check(response.status() === 200, `${path} returns 200`);
    check(await page.title() === title, `${path} has route title`, await page.title());
    check(await page.locator('h1').count() === 1, `${path} has one h1`);
    await axe(page, `desktop ${path}`);
  }
  check(result.consoleErrors.length === 0, 'normal desktop routes have no console errors', JSON.stringify(result.consoleErrors));
  check(result.pageErrors.length === 0, 'normal desktop routes have no page errors', JSON.stringify(result.pageErrors));
  response = await page.goto(`${baseURL}/not-a-real-route-qa`, { waitUntil: 'networkidle' });
  result.responseHeaders.notFound = await response.headers();
  check(response.status() === 404, 'unknown route returns HTTP 404', String(response.status()));
  check(await visible(page.getByRole('heading', { level: 1, name: 'Page not found' })), 'unknown route shows designed 404');
  await axe(page, 'desktop 404');
  const unexpectedConsoleErrors = result.consoleErrors.filter(message => !message.includes('server responded with a status of 404'));
  check(unexpectedConsoleErrors.length === 0, 'desktop flow has no unexpected console errors', JSON.stringify(unexpectedConsoleErrors));
  check(result.pageErrors.length === 0, 'desktop flow has no page errors after 404', JSON.stringify(result.pageErrors));
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const mobilePage = await mobile.newPage();
  observe(mobilePage);
  response = await mobilePage.goto(`${baseURL}/?demo=1`, { waitUntil: 'networkidle' });
  result.responseHeaders.mobileDemo = await response.headers();
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.body.scrollWidth <= innerWidth), '390px demo has no horizontal overflow');
  const targetBoxes = await mobilePage.locator('button:visible, a:visible, select:visible').evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { label: element.getAttribute('aria-label') || element.textContent?.trim() || element.tagName, width: box.width, height: box.height };
  }));
  const undersized = targetBoxes.filter(box => box.width < 44 || box.height < 44);
  check(undersized.length === 0, '390px visible controls meet 44px touch target', JSON.stringify(undersized));
  const motion = await mobilePage.evaluate(() => {
    const element = document.querySelector('.primary-button');
    const style = getComputedStyle(element);
    const milliseconds = value => value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000;
    return { transitionMs: milliseconds(style.transitionDuration), animationMs: milliseconds(style.animationDuration), scroll: getComputedStyle(document.documentElement).scrollBehavior };
  });
  check(motion.transitionMs <= 0.01, 'reduced motion removes transitions', JSON.stringify(motion));
  check(motion.animationMs <= 0.01, 'reduced motion removes animation', JSON.stringify(motion));
  check(motion.scroll === 'auto', 'reduced motion disables smooth scrolling', JSON.stringify(motion));
  await mobilePage.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  check(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), '200% text keeps page within viewport');
  await axe(mobilePage, 'mobile demo at 200% text');
  await mobilePage.evaluate(() => { document.documentElement.style.fontSize = ''; });
  await mobilePage.waitForFunction(() => Boolean(navigator.serviceWorker?.controller));
  await mobile.setOffline(true);
  await mobilePage.reload({ waitUntil: 'domcontentloaded' });
  check(await visible(mobilePage.getByText('Offline · still working')), 'live PWA reloads offline');
  check(await visible(mobilePage.getByRole('button', { name: 'Add critical reminder' })), 'offline demo remains usable');
  await mobile.setOffline(false);
  await mobilePage.screenshot({ path: '.factory/qa-evidence/live-mobile-offline.png', fullPage: false });
  await mobile.close();

  const external = [...new Set(result.requests.map(item => new URL(item.url).origin).filter(origin => origin !== baseURL))];
  check(external.length === 0, 'ordinary QA flow makes only same-origin requests', JSON.stringify(external));
  check(result.requests.filter(item => item.type === 'font').length === 0, 'ordinary QA flow loads no font requests');
} finally {
  await browser.close();
}

console.log(JSON.stringify(result, null, 2));
