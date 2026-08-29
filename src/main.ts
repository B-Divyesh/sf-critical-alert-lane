import './styles.css';
import { clearData, loadData, parseImportText, prepareImport, pruneExpiredHistory, saveData, useStorageNamespace } from './db';
import { createDemoData } from './demo';
import { buyUrl, captureLicense, isOptimisticallyUnlocked, removeLicense, setLicense, verifyLicense } from './license';
import { icon } from './icons';
import { isNativeAndroid, nativeScheduleStatus, openNativeExactAlarmSettings, requestNativeNotifications, syncNativeSchedule, type NativeSchedulerStatus } from './native-scheduler';
import { effectiveDueAt, formatDateTime, isDue, isQuietTime, nextOccurrence, toLocalInput } from './schedule';
import type { AppData, Reminder } from './types';

declare const __NATIVE_BUILD__: boolean;
declare const __ANDROID_APK_SHA256__: string;

const app = document.querySelector<HTMLDivElement>('#app')!;
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const isDemo = /^\/demo\/?$/.test(window.location.pathname) || new URLSearchParams(window.location.search).get('demo') === '1';
if (isDemo) useStorageNamespace('demo');
let data: AppData;
let unlocked = false;
let editingId: string | null = null;
let undoSnapshot: AppData | null = null;
let undoTimer = 0;
let nativeStatus: NativeSchedulerStatus | null = null;
let editorReturnTarget: { kind: 'add' } | { kind: 'edit'; id: string } | null = null;
const ANDROID_APK = '/downloads/critical-alert-lane-1.0.6.apk';
const ANDROID_APK_SHA256 = __ANDROID_APK_SHA256__;
const BUILD_ID = 'release 1.0.6 · repair 14';
const ROUTE_FOCUS_KEY = 'critical-alert-lane:focus-heading';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]!));

const showAndroidDownload = () => !__NATIVE_BUILD__ && !isNativeAndroid();
const androidDownloadButton = () => showAndroidDownload()
  ? `<a class="secondary-button android-download" href="${ANDROID_APK}" download type="application/vnd.android.package-archive">Download Android app (APK)</a>`
  : '';
const androidDownloadProof = () => showAndroidDownload()
  ? `<details class="apk-proof"><summary>Verify the APK download</summary><p>Compare this SHA-256 value with the downloaded file to check that it arrived unchanged.</p><code>${ANDROID_APK_SHA256}</code></details>`
  : '';

const activeReminders = () => data.reminders.filter(reminder => reminder.enabled);
const dueReminders = () => activeReminders().filter(reminder => isDue(reminder)).sort((a, b) =>
  effectiveDueAt(a).getTime() - effectiveDueAt(b).getTime());

async function saveAndSchedule(): Promise<void> {
  await saveData(data);
  if (isDemo) return;
  try { nativeStatus = await syncNativeSchedule(data); }
  catch { /* Local browser data remains usable if the native bridge is unavailable. */ }
}

async function applyFreeLimit(): Promise<void> {
  let activeCount = 0;
  let changed = false;
  for (const reminder of data.reminders) {
    if (!reminder.enabled) continue;
    activeCount += 1;
    if (activeCount > 3) {
      reminder.enabled = false;
      reminder.pausedByFreeLimit = true;
      changed = true;
    }
  }
  if (changed) await saveAndSchedule();
}

function statusText(reminder: Reminder): string {
  if (reminder.pausedByFreeLimit) return 'Paused · free limit';
  if (!reminder.enabled) return 'Acknowledged · one-time';
  if (isDue(reminder)) return isQuietTime(data.settings) ? 'Due · quiet hours active' : 'Needs acknowledgement';
  if (reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date(reminder.nextAt)) {
    return `Snoozed until ${formatDateTime(reminder.snoozedUntil)}`;
  }
  return `Next ${formatDateTime(reminder.nextAt)}`;
}

function recurrenceLabel(reminder: Reminder): string {
  const labels = { once: 'One time', daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly' };
  return `${labels[reminder.recurrence]} · repeats every ${reminder.repeatMinutes} min until acknowledged`;
}

function reminderRow(reminder: Reminder): string {
  const due = isDue(reminder);
  return `<li class="reminder-row ${due ? 'is-due' : ''} ${!reminder.enabled ? 'is-handled' : ''}" data-id="${reminder.id}">
    <div class="row-copy">
      <span class="status-stamp">${due ? '● DUE' : reminder.enabled ? '○ QUEUED' : reminder.pausedByFreeLimit ? '‖ PAUSED' : '✓ HANDLED'}</span>
      <h3>${escapeHtml(reminder.title)}</h3>
      <p>${escapeHtml(statusText(reminder))}</p>
      <small>${escapeHtml(recurrenceLabel(reminder))}</small>
    </div>
    <div class="row-actions">
      <button class="icon-button edit-reminder" type="button" aria-label="Edit ${escapeHtml(reminder.title)}">${icon('edit')}</button>
      <button class="icon-button danger delete-reminder" type="button" aria-label="Delete ${escapeHtml(reminder.title)}">${icon('trash')}</button>
    </div>
  </li>`;
}

function render(): void {
  if (pruneExpiredHistory(data)) void saveData(data).catch(() => undefined);
  const due = dueReminders();
  const current = due[0];
  const handled = data.history.length;
  const onTime = data.history.filter(entry => entry.withinWindow).length;
  const reliability = handled ? Math.round((onTime / handled) * 100) : 0;

  app.innerHTML = `${isDemo ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved</strong><div><button id="reset-demo" class="demo-action" type="button">Reset demo</button><button id="start-real" class="demo-action" type="button">Start for real</button></div></aside>` : ''}<header class="site-header">
      <a class="brand" href="/">${icon('tape')} <span>CRITICAL / LANE</span></a>
      <div class="header-actions">
        <span id="network-state" class="network-state" aria-live="polite">${navigator.onLine ? 'On device' : 'Offline · still working'}</span>
        <button id="open-settings" class="text-button" type="button">${icon('settings')} Open settings</button>
      </div>
      <nav class="site-nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="/privacy/">Privacy</a></nav>
    </header>
    <main id="main">
      ${isDemo ? `<section class="demo-intro" aria-labelledby="page-title"><h1 id="page-title">Try a repeating critical reminder.</h1><p>Acknowledge or snooze the due sample below.</p></section>` : `<section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="eyebrow">REPEATING ANDROID REMINDERS</p>
          <h1 id="page-title">Keep critical Android reminders repeating.</h1>
          <p class="lede">For Android users overwhelmed by notifications, repeat medicine, deadline, and call reminders until you snooze or acknowledge them.</p>
          <div class="intro-primary"><a id="try-demo" class="primary-button" href="/?demo=1">Try it with sample data</a><span>Opens three isolated sample reminders.</span></div>
          <ul class="intro-facts" aria-label="Key facts"><li>Private: data stays on this device.</li><li>Offline after the first visit.</li><li>US$4.99 once for unlimited reminders.</li></ul>
          <div class="intro-actions"><button id="add-reminder" class="secondary-button" type="button">${icon('plus')} Add critical reminder</button>${androidDownloadButton()}</div>
          ${androidDownloadProof()}
        </div>
        <figure class="hero-art">
          <picture>
            <source srcset="/art/hero-cassette-768.avif" type="image/avif" />
            <source media="(max-width: 600px)" srcset="/art/hero-cassette-512.webp" type="image/webp" />
            <source srcset="/art/hero-cassette-768.webp" type="image/webp" />
            <img src="/art/hero-cassette-768.jpg" width="768" height="768" alt="A collage of a cassette feeding one straight tape lane into a checked paper tab" fetchpriority="high" decoding="async" />
          </picture>
          <figcaption>A cassette tape forms one lane ending at a checked reminder.</figcaption>
        </figure>
      </section>`}

      <section class="now-section" aria-labelledby="now-title">
        <div class="section-heading">
          <div><p class="track-label">DUE NOW</p><h2 id="now-title">Reminder needing acknowledgement</h2></div>
          ${due.length > 1 ? `<span class="queue-count">+${due.length - 1} waiting</span>` : ''}
        </div>
        ${current ? `<article class="current-alert" data-id="${current.id}">
          <div class="alert-copy">
            <span class="alert-state">● REPEATING NOW</span>
            <h3>${escapeHtml(current.title)}</h3>
            ${current.note ? `<p>${escapeHtml(current.note)}</p>` : ''}
            <dl><div><dt>Started</dt><dd>${formatDateTime(current.nextAt)}</dd></div><div><dt>Acknowledgement window</dt><dd>${current.escalationMinutes / 60} hr</dd></div></dl>
            ${isQuietTime(data.settings) ? '<p class="quiet-note">Quiet hours mute notifications. This alert remains visible here.</p>' : ''}
          </div>
          <div class="answer-actions">
            <button id="acknowledge" class="primary-button acknowledge" type="button">${icon('check')} Acknowledge</button>
            <div class="snooze-line"><label for="snooze-minutes">Snooze for</label><select id="snooze-minutes"><option value="10">10 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="180">3 hours</option></select><button id="snooze" class="secondary-button" type="button">${icon('clock')} Snooze</button></div>
          </div>
        </article>` : `<div class="clear-state">
          <div class="clear-mark" aria-hidden="true">✓</div>
          <div><h3>No reminders need acknowledgement now.</h3><p>${activeReminders().length ? 'Your next saved reminder is not due yet.' : 'Add a reminder to see it here when it is due.'}</p></div>
        </div>`}
      </section>

      <section class="list-section" aria-labelledby="list-title">
        <div class="section-heading">
          <div><p class="track-label">SAVED REMINDERS</p><h2 id="list-title">Your reminders</h2></div>
          <div class="list-summary"><span>${activeReminders().length}${unlocked ? '' : ' / 3 free'} active</span>${isDemo ? `<button id="add-reminder" class="secondary-button" type="button">${icon('plus')} Add critical reminder</button>` : ''}</div>
        </div>
        ${data.reminders.length ? `<ul class="reminder-list">${data.reminders.slice().sort((a,b) => Number(b.enabled) - Number(a.enabled) || +new Date(a.nextAt) - +new Date(b.nextAt)).map(reminderRow).join('')}</ul>` : `<div class="empty-tape"><span>NO SAVED REMINDERS</span><h3>No reminders saved</h3><p>Add medicine, a deadline, or the one call you must make.</p></div>`}
      </section>

      <section class="reliability" aria-labelledby="reliability-title">
        <div><p class="track-label">LAST 30 DAYS</p><h2 id="reliability-title">${handled ? `${reliability}% acknowledged in time` : '30-day acknowledgement rate'}</h2><p>${handled ? `${onTime} of ${handled} reminders were acknowledged inside their acknowledgement window.` : 'Your acknowledgement rate appears here after you acknowledge a reminder. History stays on this device.'}</p></div>
        <progress class="meter" value="${reliability}" max="100" aria-label="${handled ? `${reliability} percent acknowledged in time` : 'No acknowledgement history yet'}">${reliability}%</progress>
      </section>

      <section id="how-it-works" class="info-section how-section" aria-labelledby="how-title">
        <p class="track-label">THREE STEPS</p>
        <h2 id="how-title">How it works</h2>
        <ol class="how-list">
          <li><span>01</span><div><h3>Add a critical reminder</h3><p>Add the few reminders you cannot miss.</p></div></li>
          <li><span>02</span><div><h3>Choose the reminder schedule</h3><p>Choose a schedule and a 5–60 minute repeat.</p></div></li>
          <li><span>03</span><div><h3>Acknowledge the reminder</h3><p>Snooze or acknowledge each reminder when it appears.</p></div></li>
        </ol>
      </section>

      <section class="info-section limits-section" aria-labelledby="limits-title">
        <p class="track-label">CLEAR LIMITS</p>
        <h2 id="limits-title">Limits and privacy</h2>
        <div class="plain-columns">
          <div><h3>Kept on your device</h3><p>Reminder data stays in this browser on this device during normal use.</p><p>The app has no account, ads, analytics, calendar, or contacts.</p></div>
          <div><h3>Android notification permission</h3><p>Android asks for notification access only after you choose it in settings.</p><p>Without exact-alarm access, Android uses an inexact alarm.</p></div>
          <div><h3>Not for emergencies</h3><p>Device power rules can delay alerts. Keep another safeguard for urgent or life-safety duties.</p></div>
        </div>
      </section>

      <section class="info-section paid-section" aria-labelledby="paid-title">
        <div><p class="track-label">ONE-TIME LICENSE</p><h2 id="paid-title">Three reminders are free</h2><p>Free use arms three reminders and keeps extra imports paused.</p><p>Pay US$4.99 once for unlimited active reminders. There is no subscription.</p><p>Core reminder controls, accessibility, and data export stay free.</p></div>
        <div class="paid-actions"><a class="primary-button" href="${buyUrl()}">Buy once · US$4.99</a><button class="secondary-button open-license-settings" type="button">Restore a license</button><p>Dodo processes the payment and handles refunds through Sociobot checkout.</p></div>
      </section>
    </main>
    <footer><p>Repeat critical Android reminders until you snooze or acknowledge them.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><small><a href="https://sociobot.in">Built by Param Factory <span class="external-note">(external site)</span></a> · ${BUILD_ID} · Original generated collage</small></footer>
    ${editorDialog()}
    ${settingsDialog()}
    <div id="route-status" class="sr-only" aria-live="polite"></div>
    <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
  bindEvents();
}

function editorDialog(): string {
  const reminder = editingId ? data.reminders.find(item => item.id === editingId) : undefined;
  return `<dialog id="reminder-dialog" aria-labelledby="editor-title">
    <form id="reminder-form" class="dialog-sheet">
      <div class="dialog-heading"><div><p class="track-label">${reminder ? 'EDIT REMINDER' : 'NEW REMINDER'}</p><h2 id="editor-title">${reminder ? 'Edit reminder' : 'Add critical reminder'}</h2></div><button class="icon-button close-dialog" type="button" aria-label="Close">×</button></div>
      <input type="hidden" name="id" value="${reminder?.id ?? ''}" />
      <label>What needs acknowledgement?<input name="title" required maxlength="80" autocomplete="off" value="${escapeHtml(reminder?.title ?? '')}" /></label>
      <label>Note <span>(optional)</span><textarea name="note" maxlength="240" rows="3">${escapeHtml(reminder?.note ?? '')}</textarea></label>
      <div class="form-grid"><label>First alert<input name="nextAt" type="datetime-local" required value="${toLocalInput(reminder?.nextAt)}" /></label><label>Schedule<select name="recurrence"><option value="once" ${reminder?.recurrence === 'once' ? 'selected' : ''}>One time</option><option value="daily" ${reminder?.recurrence === 'daily' ? 'selected' : ''}>Every day</option><option value="weekdays" ${reminder?.recurrence === 'weekdays' ? 'selected' : ''}>Weekdays</option><option value="weekly" ${reminder?.recurrence === 'weekly' ? 'selected' : ''}>Every week</option></select></label></div>
      <div class="form-grid"><label>Repeat until acknowledged<select name="repeatMinutes"><option value="5">Every 5 min</option><option value="10" ${!reminder || reminder.repeatMinutes === 10 ? 'selected' : ''}>Every 10 min</option><option value="15" ${reminder?.repeatMinutes === 15 ? 'selected' : ''}>Every 15 min</option><option value="30" ${reminder?.repeatMinutes === 30 ? 'selected' : ''}>Every 30 min</option><option value="60" ${reminder?.repeatMinutes === 60 ? 'selected' : ''}>Every hour</option></select></label><label>Acknowledgement window<select name="escalationMinutes"><option value="60">1 hour</option><option value="180" ${!reminder || reminder.escalationMinutes === 180 ? 'selected' : ''}>3 hours</option><option value="360" ${reminder?.escalationMinutes === 360 ? 'selected' : ''}>6 hours</option><option value="720" ${reminder?.escalationMinutes === 720 ? 'selected' : ''}>12 hours</option><option value="1440" ${reminder?.escalationMinutes === 1440 ? 'selected' : ''}>24 hours</option></select></label></div>
      <p id="form-error" class="form-error" role="alert"></p>
      <div class="dialog-actions"><button class="secondary-button close-dialog" type="button">Cancel</button><button class="primary-button" type="submit">${reminder ? 'Save changes' : 'Arm reminder'}</button></div>
    </form>
  </dialog>`;
}

function settingsDialog(): string {
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  const nativeNotifications = nativeStatus?.notifications;
  const nativeExactAlarms = nativeStatus?.exactAlarms;
  const notificationCopy = isNativeAndroid()
    ? `Android notifications: ${nativeNotifications ?? 'checking'}. ${nativeExactAlarms === 'granted' || nativeExactAlarms === 'not-required' ? 'Native alarms are armed in the background.' : 'Allow exact alarms for the most reliable timing.'}`
    : `Permission: <strong>${permission}</strong>. The web build checks while open; Android schedules reminders after installation.`;
  return `<dialog id="settings-dialog" aria-labelledby="settings-title"><div class="dialog-sheet settings-sheet">
    <div class="dialog-heading"><div><p class="track-label">REMINDER SETTINGS</p><h2 id="settings-title">Settings and data</h2></div><button class="icon-button close-settings" type="button" aria-label="Close">×</button></div>
    <section><h3>Notifications</h3><p>${notificationCopy}</p><div class="button-row"><button id="enable-notifications" class="secondary-button" type="button" ${(isNativeAndroid() ? nativeNotifications : permission) === 'granted' || permission === 'unsupported' ? 'disabled' : ''}>${isNativeAndroid() ? 'Enable Android notifications' : 'Enable notifications'}</button>${isNativeAndroid() && nativeExactAlarms === 'prompt' ? '<button id="enable-exact-alarms" class="secondary-button" type="button">Allow exact alarms</button>' : ''}</div></section>
    <form id="quiet-form" novalidate><h3>Quiet hours</h3><label class="check-line"><input name="quietEnabled" type="checkbox" ${data.settings.quietEnabled ? 'checked' : ''} /> Mute notification repeats overnight</label><div class="form-grid"><label>Start<input name="quietStart" type="time" required aria-describedby="quiet-form-error" value="${data.settings.quietStart}" /></label><label>End<input name="quietEnd" type="time" required aria-describedby="quiet-form-error" value="${data.settings.quietEnd}" /></label></div><p id="quiet-form-error" class="form-error" role="alert"></p><button class="secondary-button" type="submit">Save quiet hours</button></form>
    <section><h3>Your data</h3><p>Reminders and history stay in this browser on this device. Export is always free.</p><div class="button-row"><button id="export-data" class="secondary-button" type="button">Export backup</button><label class="file-button">Import backup<input id="import-data" type="file" accept="application/json,.json" /></label></div></section>
    <section class="license-panel"><span class="status-stamp">${unlocked ? '✓ PAID PLAN' : 'FREE PLAN'}</span><h3>${unlocked ? 'Unlimited reminders active' : 'Add more active reminders'}</h3><p>Free includes 3 active reminders and every safety feature. A US$4.99 one-time purchase adds unlimited active reminders. No subscription.</p>
      ${unlocked ? '<button id="remove-license" class="text-button" type="button">Remove license from this device</button>' : `<a class="primary-button buy-link" href="${buyUrl()}">Buy once · US$4.99</a><form id="license-form"><label>Have a license? Paste it<input name="license" required autocomplete="off" /></label><button class="secondary-button" type="submit">Restore purchase</button></form>`}
      <p class="fine-print">Dodo processes the payment and handles refunds through Sociobot checkout. A refund makes the license inactive.</p></section>
    <button class="secondary-button close-settings" type="button">Close settings</button>
  </div></dialog>`;
}

function showToast(message: string, undo = false): void {
  const toast = document.querySelector<HTMLDivElement>('#toast')!;
  toast.innerHTML = `${escapeHtml(message)}${undo ? ' <button id="undo-action" type="button">Undo</button>' : ''}`;
  toast.hidden = false;
  window.clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => { toast.hidden = true; undoSnapshot = null; }, 6500);
  document.querySelector('#undo-action')?.addEventListener('click', async () => {
    if (!undoSnapshot) return;
    data = undoSnapshot; undoSnapshot = null; await saveAndSchedule(); render(); showToast('Action undone.');
  });
}

function announceRoute(label: string): void {
  const status = document.querySelector<HTMLElement>('#route-status');
  if (status) status.textContent = label;
}

function focusHeading(heading: HTMLElement): void {
  heading.setAttribute('tabindex', '-1');
  heading.focus({ preventScroll: true });
  announceRoute(heading.textContent?.trim() ?? 'Page section');
}

function restoreHashTarget(): void {
  if (!window.location.hash) return;
  const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
  if (!target) return;
  const heading = target.matches('h1, h2, h3') ? target : target.querySelector<HTMLElement>('h1, h2, h3');
  const stickyOffset = document.querySelector<HTMLElement>('.demo-banner')?.getBoundingClientRect().height ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - stickyOffset;
  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo({ top, behavior: 'auto' });
  document.documentElement.style.scrollBehavior = previousScrollBehavior;
  if (heading) focusHeading(heading);
}

function restoreRouteFocus(): void {
  window.requestAnimationFrame(() => {
    if (window.location.hash) {
      restoreHashTarget();
      return;
    }
    if (sessionStorage.getItem(ROUTE_FOCUS_KEY) !== '1') return;
    sessionStorage.removeItem(ROUTE_FOCUS_KEY);
    const heading = document.querySelector<HTMLElement>('main h1');
    if (heading) focusHeading(heading);
  });
  if (window.location.hash) window.setTimeout(restoreHashTarget, 50);
}

function configureDemoMetadata(): void {
  if (!isDemo) return;
  document.title = 'Demo — Critical Alert Lane';
  const description = 'Try three isolated sample reminders and acknowledge or snooze the due reminder.';
  document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[property="og:title"]')?.setAttribute('content', document.title);
  document.querySelector<HTMLMetaElement>('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]')?.setAttribute('content', document.title);
  document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]')?.setAttribute('content', description);
  const demoUrl = 'https://critical-alert-lane.sociobot.in/?demo=1';
  document.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.setAttribute('href', demoUrl);
  document.querySelector<HTMLMetaElement>('meta[property="og:url"]')?.setAttribute('content', demoUrl);
}

function bindEvents(): void {
  const editor = document.querySelector<HTMLDialogElement>('#reminder-dialog')!;
  const settings = document.querySelector<HTMLDialogElement>('#settings-dialog')!;
  const openEditor = (id: string | null) => {
    editorReturnTarget = id ? { kind: 'edit', id } : { kind: 'add' };
    editingId = id;
    render();
    document.querySelector<HTMLDialogElement>('#reminder-dialog')!.showModal();
    window.setTimeout(() => document.querySelector<HTMLInputElement>('[name="title"]')?.focus(), 0);
  };
  editor.addEventListener('close', () => {
    editingId = null;
    const target = editorReturnTarget;
    editorReturnTarget = null;
    window.requestAnimationFrame(() => {
      if (target?.kind === 'edit') {
        document.querySelector<HTMLElement>(`.reminder-row[data-id="${CSS.escape(target.id)}"] .edit-reminder`)?.focus();
      } else {
        document.querySelector<HTMLElement>('#add-reminder')?.focus();
      }
    });
  });
  document.querySelector('#add-reminder')?.addEventListener('click', () => openEditor(null));
  document.querySelector('.open-license-settings')?.addEventListener('click', () => {
    document.querySelector<HTMLDialogElement>('#settings-dialog')!.showModal();
    window.setTimeout(() => document.querySelector<HTMLInputElement>('#license-form input')?.focus(), 0);
  });
  document.querySelector('#reset-demo')?.addEventListener('click', async () => {
    data = createDemoData();
    await clearData();
    await saveData(data);
    render();
    showToast('Sample reminders reset.');
  });
  document.querySelector('#start-real')?.addEventListener('click', async () => {
    await clearData();
    window.location.assign('/');
  });
  document.querySelector('#how-title')?.setAttribute('tabindex', '-1');
  document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || url.hash || link.hasAttribute('download')) return;
    link.addEventListener('click', () => sessionStorage.setItem(ROUTE_FOCUS_KEY, '1'));
  });
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const hash = link.hash;
    if (!hash) return;
    event.preventDefault();
    history.pushState(null, '', hash);
    restoreHashTarget();
  }));
  if (isDemo) {
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach(link => {
      const href = link.getAttribute('href') ?? '';
      if (href.startsWith('#') || link.hasAttribute('download')) return;
      link.addEventListener('click', event => {
        event.preventDefault();
        void (async () => {
          try { await clearData(); }
          finally { window.location.assign(link.href); }
        })();
      });
    });
  }
  document.querySelectorAll<HTMLElement>('.edit-reminder').forEach(button => button.addEventListener('click', () => openEditor(button.closest<HTMLElement>('[data-id]')!.dataset.id!)));
  document.querySelectorAll<HTMLElement>('.delete-reminder').forEach(button => button.addEventListener('click', async () => {
    const id = button.closest<HTMLElement>('[data-id]')!.dataset.id!;
    const reminder = data.reminders.find(item => item.id === id)!;
    if (!confirm(`Delete “${reminder.title}”? This cannot be undone.`)) return;
    data.reminders = data.reminders.filter(item => item.id !== id); await saveAndSchedule(); render(); showToast('Reminder deleted.');
  }));
  document.querySelectorAll('.close-dialog').forEach(button => button.addEventListener('click', () => editor.close()));
  document.querySelector('#reminder-form')?.addEventListener('submit', handleReminderSubmit);
  document.querySelector('#open-settings')?.addEventListener('click', () => settings.showModal());
  document.querySelectorAll('.close-settings').forEach(button => button.addEventListener('click', () => settings.close()));
  document.querySelector('#acknowledge')?.addEventListener('click', acknowledgeCurrent);
  document.querySelector('#snooze')?.addEventListener('click', snoozeCurrent);
  document.querySelector('#quiet-form')?.addEventListener('submit', saveSettings);
  document.querySelector('#enable-notifications')?.addEventListener('click', requestNotifications);
  document.querySelector('#enable-exact-alarms')?.addEventListener('click', requestExactAlarms);
  document.querySelector('#export-data')?.addEventListener('click', exportData);
  document.querySelector<HTMLInputElement>('#import-data')?.addEventListener('change', importData);
  document.querySelector('#license-form')?.addEventListener('submit', restoreLicense);
  document.querySelector('#remove-license')?.addEventListener('click', async () => {
    removeLicense();
    unlocked = false;
    await applyFreeLimit();
    render();
    showToast('License removed from this device.');
  });
}

async function handleReminderSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const values = new FormData(form);
  const title = String(values.get('title') ?? '').trim();
  const error = form.querySelector<HTMLParagraphElement>('#form-error')!;
  const titleInput = form.elements.namedItem('title') as HTMLInputElement;
  error.textContent = '';
  titleInput.removeAttribute('aria-invalid');
  if (!title) {
    // `required` accepts spaces. Validate before changing in-memory data so the
    // editor remains usable and persistence can never be asked to save it.
    error.textContent = 'Enter what needs acknowledgement. A title cannot be blank.';
    titleInput.setAttribute('aria-invalid', 'true');
    titleInput.focus();
    return;
  }
  const id = String(values.get('id') || '');
  const existing = data.reminders.find(item => item.id === id);
  if (!unlocked && !existing?.enabled && activeReminders().length >= 3) {
    error.textContent = 'The free plan supports 3 active reminders. Acknowledge one, or buy unlimited reminders in settings.';
    return;
  }
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: existing?.id ?? crypto.randomUUID(),
    title,
    note: String(values.get('note')).trim(),
    nextAt: new Date(String(values.get('nextAt'))).toISOString(),
    recurrence: String(values.get('recurrence')) as Reminder['recurrence'],
    repeatMinutes: Number(values.get('repeatMinutes')),
    escalationMinutes: Number(values.get('escalationMinutes')),
    enabled: true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
  data.reminders = existing ? data.reminders.map(item => item.id === id ? reminder : item) : [...data.reminders, reminder];
  await saveAndSchedule(); editingId = null; render(); showToast(existing ? 'Reminder updated.' : 'Reminder armed.'); await checkNotifications();
}

async function acknowledgeCurrent(): Promise<void> {
  const reminder = dueReminders()[0];
  if (!reminder) return;
  undoSnapshot = structuredClone(data);
  const handledAt = new Date();
  data.history.unshift({ id: crypto.randomUUID(), reminderId: reminder.id, title: reminder.title, scheduledAt: reminder.nextAt, handledAt: handledAt.toISOString(), withinWindow: handledAt.getTime() <= new Date(reminder.nextAt).getTime() + reminder.escalationMinutes * 60_000 });
  pruneExpiredHistory(data, handledAt.getTime());
  const next = nextOccurrence(reminder.nextAt, reminder.recurrence, handledAt);
  reminder.enabled = Boolean(next);
  if (next) reminder.nextAt = next;
  delete reminder.snoozedUntil; delete reminder.lastNotifiedAt;
  reminder.updatedAt = handledAt.toISOString();
  await saveAndSchedule(); render(); showToast(`Acknowledged “${reminder.title}”.`, true);
}

async function snoozeCurrent(): Promise<void> {
  const reminder = dueReminders()[0];
  if (!reminder) return;
  const minutes = Number(document.querySelector<HTMLSelectElement>('#snooze-minutes')!.value);
  reminder.snoozedUntil = new Date(Date.now() + minutes * 60_000).toISOString();
  delete reminder.lastNotifiedAt;
  await saveAndSchedule(); render(); showToast(`Snoozed “${reminder.title}” for ${minutes} minutes.`);
}

async function saveSettings(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const values = new FormData(form);
  const quietStart = String(values.get('quietStart') ?? '');
  const quietEnd = String(values.get('quietEnd') ?? '');
  const error = form.querySelector<HTMLParagraphElement>('#quiet-form-error')!;
  const startInput = form.elements.namedItem('quietStart') as HTMLInputElement;
  const endInput = form.elements.namedItem('quietEnd') as HTMLInputElement;
  error.textContent = '';
  startInput.removeAttribute('aria-invalid');
  endInput.removeAttribute('aria-invalid');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(quietStart) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(quietEnd)) {
    error.textContent = 'Enter both a start and end time for quiet hours.';
    if (!quietStart) startInput.setAttribute('aria-invalid', 'true');
    if (!quietEnd) endInput.setAttribute('aria-invalid', 'true');
    (!quietStart ? startInput : endInput).focus();
    return;
  }
  data.settings = { quietEnabled: values.get('quietEnabled') === 'on', quietStart, quietEnd };
  await saveAndSchedule(); render(); showToast('Quiet hours saved.');
}

async function requestNotifications(): Promise<void> {
  if (isNativeAndroid()) {
    nativeStatus = await requestNativeNotifications();
    render();
    showToast(nativeStatus?.notifications === 'granted' ? 'Android notifications enabled. Background reminders are armed.' : 'Android notifications were not enabled. You can still use the reminder list.');
    return;
  }
  if (!('Notification' in window)) { showToast('Notifications are not supported in this browser.'); return; }
  const permission = await Notification.requestPermission();
  render(); showToast(permission === 'granted' ? 'Notifications enabled.' : 'Notifications were not enabled. You can still use the reminder list.');
}

async function requestExactAlarms(): Promise<void> {
  await openNativeExactAlarmSettings();
  showToast('Android alarm access is ready to allow in system settings. Return here when finished.');
}

function exportData(): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `critical-alert-lane-${new Date().toISOString().slice(0,10)}.json`; link.click(); URL.revokeObjectURL(link.href); showToast('Export downloaded.');
}

async function importData(event: Event): Promise<void> {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0]; if (!file) return;
  try {
    const prepared = prepareImport(parseImportText(await file.text()), unlocked ? undefined : 3);
    const identityWarning = prepared.remappedReminderIds
      ? ` ${prepared.remappedReminderIds} unsafe reminder ID(s) will be repaired so Android alarms stay separate.`
      : '';
    const limitWarning = prepared.pausedReminderIds.length
      ? ` The free plan can arm 3 reminders. ${prepared.pausedReminderIds.length} additional reminder(s) will be imported paused, not deleted.`
      : '';
    if (!confirm(`Replace this device’s data with ${prepared.data.reminders.length} reminder(s)?${identityWarning}${limitWarning} Export first if you need a backup.`)) return;
    data = prepared.data;
    await saveAndSchedule();
    render();
    const repairs = prepared.remappedReminderIds ? ` ${prepared.remappedReminderIds} reminder ID(s) repaired.` : '';
    const paused = prepared.pausedReminderIds.length ? ` ${prepared.pausedReminderIds.length} reminder(s) paused for the 3-active free limit.` : '';
    showToast(`Import complete.${repairs}${paused}`);
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'The import could not be read.');
  } finally {
    input.value = '';
  }
}

async function restoreLicense(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  setLicense(String(new FormData(form).get('license')));
  try {
    unlocked = await verifyLicense(true);
    if (!unlocked) await applyFreeLimit();
    render();
    showToast(unlocked ? 'Purchase restored. Unlimited reminders are unlocked.' : 'That license is not active.');
  }
  catch { render(); showToast('License check is unavailable. Check your connection and try again.'); }
}

async function checkNotifications(): Promise<void> {
  if (isDemo) return;
  if (isQuietTime(data.settings) || !('Notification' in window) || Notification.permission !== 'granted') return;
  const registration = await navigator.serviceWorker?.ready;
  if (!registration) return;
  const now = new Date();
  for (const reminder of dueReminders()) {
    if (reminder.lastNotifiedAt && now.getTime() - new Date(reminder.lastNotifiedAt).getTime() < reminder.repeatMinutes * 60_000) continue;
    await registration.showNotification(reminder.title, { body: reminder.note || 'Open Critical Alert Lane to acknowledge or snooze.', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: `reminder-${reminder.id}`, data: { url: '/' } });
    reminder.lastNotifiedAt = now.toISOString();
  }
  await saveData(data);
}

async function init(): Promise<void> {
  configureDemoMetadata();
  if (!isDemo) {
    captureLicense();
    unlocked = isOptimisticallyUnlocked();
  }
  try {
    data = await loadData();
    if (isDemo && !data.reminders.length && !data.history.length) {
      data = createDemoData();
      await saveData(data);
    }
    if (!isDemo) {
      nativeStatus = await nativeScheduleStatus();
      await syncNativeSchedule(data);
    }
    render();
    restoreRouteFocus();
  }
  catch { data = { version: 1, reminders: [], history: [], settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' }, updatedAt: new Date().toISOString() }; render(); restoreRouteFocus(); showToast('Local storage could not be read. Reminders may not persist in this browser.'); }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('An update is ready. Reopen the app to use it.'); });
      });
    }).catch(() => showToast('Offline setup did not finish. The app still works while this page is open.'));
  }
  window.addEventListener('online', () => { render(); showToast('Back online. Your reminders stayed on this device.'); });
  window.addEventListener('offline', () => { render(); showToast('Offline. Your reminders and saved data still work.'); });
  window.addEventListener('hashchange', restoreHashTarget);
  window.addEventListener('popstate', restoreRouteFocus);
  window.addEventListener('pageshow', () => {
    restoreRouteFocus();
    window.setTimeout(restoreHashTarget, 100);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      if (!isDemo) void nativeScheduleStatus().then(status => { if (status) { nativeStatus = status; render(); } });
      render();
      void checkNotifications();
    }
  });
  window.setInterval(() => { render(); void checkNotifications(); }, 30_000);
  void checkNotifications();
  if (!isDemo && localStorage.getItem('sb_license:critical-alert-lane')) {
    verifyLicense().then(async valid => {
      if (valid === unlocked) return;
      unlocked = valid;
      if (!valid) await applyFreeLimit();
      render();
      if (!valid) showToast('This license is no longer active. The free plan remains available.');
    }).catch(() => undefined);
  }
}

void init();
