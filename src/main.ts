import './styles.css';
import { loadData, saveData, validateData } from './db';
import { buyUrl, captureLicense, isOptimisticallyUnlocked, removeLicense, setLicense, verifyLicense } from './license';
import { icon } from './icons';
import { isNativeAndroid, nativeScheduleStatus, openNativeExactAlarmSettings, requestNativeNotifications, syncNativeSchedule, type NativeSchedulerStatus } from './native-scheduler';
import { effectiveDueAt, formatDateTime, isDue, isQuietTime, nextOccurrence, toLocalInput } from './schedule';
import type { AppData, Reminder } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
let data: AppData;
let unlocked = false;
let editingId: string | null = null;
let undoSnapshot: AppData | null = null;
let undoTimer = 0;
let nativeStatus: NativeSchedulerStatus | null = null;

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
}[char]!));

const activeReminders = () => data.reminders.filter(reminder => reminder.enabled);
const dueReminders = () => activeReminders().filter(reminder => isDue(reminder)).sort((a, b) =>
  effectiveDueAt(a).getTime() - effectiveDueAt(b).getTime());

async function saveAndSchedule(): Promise<void> {
  await saveData(data);
  try { nativeStatus = await syncNativeSchedule(data); }
  catch { /* Local browser data remains usable if the native bridge is unavailable. */ }
}

function statusText(reminder: Reminder): string {
  if (!reminder.enabled) return 'Handled · one-time';
  if (isDue(reminder)) return isQuietTime(data.settings) ? 'Due · quiet hours active' : 'Needs your answer';
  if (reminder.snoozedUntil && new Date(reminder.snoozedUntil) > new Date(reminder.nextAt)) {
    return `Snoozed until ${formatDateTime(reminder.snoozedUntil)}`;
  }
  return `Next ${formatDateTime(reminder.nextAt)}`;
}

function recurrenceLabel(reminder: Reminder): string {
  const labels = { once: 'One time', daily: 'Daily', weekdays: 'Weekdays', weekly: 'Weekly' };
  return `${labels[reminder.recurrence]} · repeats every ${reminder.repeatMinutes} min until handled`;
}

function reminderRow(reminder: Reminder): string {
  const due = isDue(reminder);
  return `<li class="reminder-row ${due ? 'is-due' : ''} ${!reminder.enabled ? 'is-handled' : ''}" data-id="${reminder.id}">
    <div class="row-copy">
      <span class="status-stamp">${due ? '● DUE' : reminder.enabled ? '○ QUEUED' : '✓ HANDLED'}</span>
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
  const due = dueReminders();
  const current = due[0];
  const handled = data.history.length;
  const onTime = data.history.filter(entry => entry.withinWindow).length;
  const reliability = handled ? Math.round((onTime / handled) * 100) : 0;

  app.innerHTML = `<header class="site-header">
      <a class="brand" href="/">${icon('tape')} <span>CRITICAL / LANE</span></a>
      <div class="header-actions">
        <span id="network-state" class="network-state" aria-live="polite">${navigator.onLine ? 'On device' : 'Offline · still working'}</span>
        <button id="open-settings" class="text-button" type="button">${icon('settings')} Settings</button>
      </div>
    </header>
    <main id="main">
      <section class="intro" aria-labelledby="page-title">
        <div class="intro-copy">
          <p class="eyebrow">ONE LANE. NO FEED.</p>
          <h1 id="page-title">Reminders that wait for an answer.</h1>
          <p class="lede">A private lane for the few things you cannot afford to bury. It repeats until you acknowledge or snooze it.</p>
          <button id="add-reminder" class="primary-button" type="button">${icon('plus')} Add critical reminder</button>
        </div>
        <figure class="hero-art">
          <picture>
            <source srcset="/art/hero-cassette-768.avif" type="image/avif" />
            <source media="(max-width: 600px)" srcset="/art/hero-cassette-512.webp" type="image/webp" />
            <source srcset="/art/hero-cassette-768.webp" type="image/webp" />
            <img src="/art/hero-cassette-768.jpg" width="768" height="768" alt="A collage of a cassette feeding one straight tape lane into a checked paper tab" fetchpriority="high" decoding="async" />
          </picture>
          <figcaption>One protected signal, pulled out of the noise.</figcaption>
        </figure>
      </section>

      <section class="now-section" aria-labelledby="now-title">
        <div class="section-heading">
          <div><p class="track-label">TRACK 01 / NOW</p><h2 id="now-title">Answer this</h2></div>
          ${due.length > 1 ? `<span class="queue-count">+${due.length - 1} waiting</span>` : ''}
        </div>
        ${current ? `<article class="current-alert" data-id="${current.id}">
          <div class="alert-copy">
            <span class="alert-state">● REPEATING NOW</span>
            <h3>${escapeHtml(current.title)}</h3>
            ${current.note ? `<p>${escapeHtml(current.note)}</p>` : ''}
            <dl><div><dt>Started</dt><dd>${formatDateTime(current.nextAt)}</dd></div><div><dt>Escalation window</dt><dd>${current.escalationMinutes / 60} hr</dd></div></dl>
            ${isQuietTime(data.settings) ? '<p class="quiet-note">Quiet hours mute notifications. This alert remains visible here.</p>' : ''}
          </div>
          <div class="answer-actions">
            <button id="acknowledge" class="primary-button acknowledge" type="button">${icon('check')} Acknowledge</button>
            <div class="snooze-line"><label for="snooze-minutes">Snooze for</label><select id="snooze-minutes"><option value="10">10 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option><option value="180">3 hours</option></select><button id="snooze" class="secondary-button" type="button">${icon('clock')} Snooze</button></div>
          </div>
        </article>` : `<div class="clear-state">
          <div class="clear-mark" aria-hidden="true">✓</div>
          <div><h3>The lane is clear.</h3><p>${activeReminders().length ? 'Nothing needs an answer right now.' : 'Add the first reminder worth breaking through the noise.'}</p></div>
        </div>`}
      </section>

      <section class="list-section" aria-labelledby="list-title">
        <div class="section-heading">
          <div><p class="track-label">TRACK 02 / QUEUE</p><h2 id="list-title">Your critical lane</h2></div>
          <span>${activeReminders().length}${unlocked ? '' : ' / 3 free'} active</span>
        </div>
        ${data.reminders.length ? `<ul class="reminder-list">${data.reminders.slice().sort((a,b) => Number(b.enabled) - Number(a.enabled) || +new Date(a.nextAt) - +new Date(b.nextAt)).map(reminderRow).join('')}</ul>` : `<div class="empty-tape"><span aria-hidden="true">A / 00:00</span><h3>No reminders recorded</h3><p>Keep this list short on purpose. Add medicine, a deadline, or the one call you must make.</p></div>`}
      </section>

      <section class="reliability" aria-labelledby="reliability-title">
        <div><p class="track-label">30-DAY SIGNAL CHECK</p><h2 id="reliability-title">${handled ? `${reliability}% handled in time` : 'Build a reliable streak'}</h2><p>${handled ? `${onTime} of ${handled} acknowledged reminders were handled inside their escalation window.` : 'Your acknowledgement rate appears here after you handle a reminder. History stays on this device.'}</p></div>
        <div class="meter" role="img" aria-label="${handled ? `${reliability} percent handled in time` : 'No acknowledgement history yet'}"><span style="--meter:${reliability}%"></span></div>
      </section>
    </main>
    <footer><p>Private by default. No account, ads, tracking, calendar, or contacts.</p><nav aria-label="Legal"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a></nav><small>Original generated collage · <a href="https://sociobot.in">A Sociobot utility</a></small></footer>
    ${editorDialog()}
    ${settingsDialog()}
    <div id="toast" class="toast" role="status" aria-live="polite" hidden></div>`;
  bindEvents();
}

function editorDialog(): string {
  const reminder = editingId ? data.reminders.find(item => item.id === editingId) : undefined;
  return `<dialog id="reminder-dialog" aria-labelledby="editor-title">
    <form id="reminder-form" class="dialog-sheet">
      <div class="dialog-heading"><div><p class="track-label">${reminder ? 'EDIT RECORDING' : 'NEW RECORDING'}</p><h2 id="editor-title">${reminder ? 'Edit reminder' : 'Add critical reminder'}</h2></div><button class="icon-button close-dialog" type="button" aria-label="Close">×</button></div>
      <input type="hidden" name="id" value="${reminder?.id ?? ''}" />
      <label>What needs your answer?<input name="title" required maxlength="80" autocomplete="off" value="${escapeHtml(reminder?.title ?? '')}" /></label>
      <label>Note <span>(optional)</span><textarea name="note" maxlength="240" rows="3">${escapeHtml(reminder?.note ?? '')}</textarea></label>
      <div class="form-grid"><label>First alert<input name="nextAt" type="datetime-local" required value="${toLocalInput(reminder?.nextAt)}" /></label><label>Schedule<select name="recurrence"><option value="once" ${reminder?.recurrence === 'once' ? 'selected' : ''}>One time</option><option value="daily" ${reminder?.recurrence === 'daily' ? 'selected' : ''}>Every day</option><option value="weekdays" ${reminder?.recurrence === 'weekdays' ? 'selected' : ''}>Weekdays</option><option value="weekly" ${reminder?.recurrence === 'weekly' ? 'selected' : ''}>Every week</option></select></label></div>
      <div class="form-grid"><label>Repeat until handled<select name="repeatMinutes"><option value="5">Every 5 min</option><option value="10" ${!reminder || reminder.repeatMinutes === 10 ? 'selected' : ''}>Every 10 min</option><option value="15" ${reminder?.repeatMinutes === 15 ? 'selected' : ''}>Every 15 min</option><option value="30" ${reminder?.repeatMinutes === 30 ? 'selected' : ''}>Every 30 min</option><option value="60" ${reminder?.repeatMinutes === 60 ? 'selected' : ''}>Every hour</option></select></label><label>Escalation window<select name="escalationMinutes"><option value="60">1 hour</option><option value="180" ${!reminder || reminder.escalationMinutes === 180 ? 'selected' : ''}>3 hours</option><option value="360" ${reminder?.escalationMinutes === 360 ? 'selected' : ''}>6 hours</option><option value="720" ${reminder?.escalationMinutes === 720 ? 'selected' : ''}>12 hours</option><option value="1440" ${reminder?.escalationMinutes === 1440 ? 'selected' : ''}>24 hours</option></select></label></div>
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
    <div class="dialog-heading"><div><p class="track-label">DECK CONTROLS</p><h2 id="settings-title">Settings & data</h2></div><button class="icon-button close-settings" type="button" aria-label="Close">×</button></div>
    <section><h3>Notifications</h3><p>${notificationCopy}</p><div class="button-row"><button id="enable-notifications" class="secondary-button" type="button" ${(isNativeAndroid() ? nativeNotifications : permission) === 'granted' || permission === 'unsupported' ? 'disabled' : ''}>${isNativeAndroid() ? 'Enable Android notifications' : 'Enable notifications'}</button>${isNativeAndroid() && nativeExactAlarms === 'prompt' ? '<button id="enable-exact-alarms" class="secondary-button" type="button">Allow exact alarms</button>' : ''}</div></section>
    <form id="quiet-form"><h3>Quiet hours</h3><label class="check-line"><input name="quietEnabled" type="checkbox" ${data.settings.quietEnabled ? 'checked' : ''} /> Mute notification repeats overnight</label><div class="form-grid"><label>Start<input name="quietStart" type="time" value="${data.settings.quietStart}" /></label><label>End<input name="quietEnd" type="time" value="${data.settings.quietEnd}" /></label></div><button class="secondary-button" type="submit">Save quiet hours</button></form>
    <section><h3>Your data</h3><p>Reminders and history live in IndexedDB on this device. Export is always free.</p><div class="button-row"><button id="export-data" class="secondary-button" type="button">Export JSON</button><label class="file-button">Import JSON<input id="import-data" type="file" accept="application/json,.json" /></label></div></section>
    <section class="license-panel"><span class="status-stamp">${unlocked ? '✓ FULL DECK' : 'FREE DECK'}</span><h3>${unlocked ? 'Unlimited lane unlocked' : 'Keep a bigger critical lane'}</h3><p>Free includes 3 active reminders and every safety feature. A US$4.99 one-time purchase adds unlimited active reminders. No subscription.</p>
      ${unlocked ? '<button id="remove-license" class="text-button" type="button">Remove license from this device</button>' : `<a class="primary-button buy-link" href="${buyUrl()}">Buy once · US$4.99</a><form id="license-form"><label>Have a license? Paste it<input name="license" required autocomplete="off" /></label><button class="secondary-button" type="submit">Restore purchase</button></form>`}
      <p class="fine-print">Sociobot/Dodo is the merchant of record. Refunds are handled there and revoke the license automatically.</p></section>
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

function bindEvents(): void {
  const editor = document.querySelector<HTMLDialogElement>('#reminder-dialog')!;
  const settings = document.querySelector<HTMLDialogElement>('#settings-dialog')!;
  const openEditor = (id: string | null) => { editingId = id; render(); document.querySelector<HTMLDialogElement>('#reminder-dialog')!.showModal(); window.setTimeout(() => document.querySelector<HTMLInputElement>('[name="title"]')?.focus(), 0); };
  document.querySelector('#add-reminder')?.addEventListener('click', () => openEditor(null));
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
  document.querySelector('#remove-license')?.addEventListener('click', () => { removeLicense(); unlocked = false; render(); showToast('License removed from this device.'); });
}

async function handleReminderSubmit(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  const values = new FormData(form);
  const id = String(values.get('id') || '');
  const existing = data.reminders.find(item => item.id === id);
  if (!existing && !unlocked && activeReminders().length >= 3) {
    form.querySelector('#form-error')!.textContent = 'The free deck holds 3 active reminders. Handle one, or unlock unlimited reminders in Settings.';
    return;
  }
  const now = new Date().toISOString();
  const reminder: Reminder = {
    id: existing?.id ?? crypto.randomUUID(),
    title: String(values.get('title')).trim(),
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
  data.history = data.history.filter(entry => Date.now() - new Date(entry.handledAt).getTime() < 30 * 86_400_000);
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
  data.settings = { quietEnabled: values.get('quietEnabled') === 'on', quietStart: String(values.get('quietStart')), quietEnd: String(values.get('quietEnd')) };
  await saveAndSchedule(); render(); showToast('Quiet hours saved.');
}

async function requestNotifications(): Promise<void> {
  if (isNativeAndroid()) {
    nativeStatus = await requestNativeNotifications();
    render();
    showToast(nativeStatus?.notifications === 'granted' ? 'Android notifications enabled. Background reminders are armed.' : 'Android notifications were not enabled. You can still use the in-app lane.');
    return;
  }
  if (!('Notification' in window)) { showToast('Notifications are not supported in this browser.'); return; }
  const permission = await Notification.requestPermission();
  render(); showToast(permission === 'granted' ? 'Notifications enabled.' : 'Notifications were not enabled. You can still use the in-app lane.');
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
    const imported = validateData(JSON.parse(await file.text()));
    if (!confirm(`Replace this device’s data with ${imported.reminders.length} reminder(s)? Export first if you need a backup.`)) return;
    data = imported; await saveAndSchedule(); render(); showToast('Import complete.');
  } catch (error) { showToast(error instanceof Error ? error.message : 'The import could not be read.'); }
}

async function restoreLicense(event: Event): Promise<void> {
  event.preventDefault();
  const form = event.currentTarget as HTMLFormElement;
  setLicense(String(new FormData(form).get('license')));
  try { unlocked = await verifyLicense(true); render(); showToast(unlocked ? 'Purchase restored. Unlimited reminders are unlocked.' : 'That license is not active.'); }
  catch { render(); showToast('License check is unavailable. Check your connection and try again.'); }
}

async function checkNotifications(): Promise<void> {
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
  captureLicense();
  unlocked = isOptimisticallyUnlocked();
  try {
    data = await loadData();
    nativeStatus = await nativeScheduleStatus();
    await syncNativeSchedule(data);
    render();
  }
  catch { data = { version: 1, reminders: [], history: [], settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' }, updatedAt: new Date().toISOString() }; render(); showToast('Local storage could not be read. Reminders may not persist in this browser.'); }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => { if (worker.state === 'installed' && navigator.serviceWorker.controller) showToast('An update is ready. Reopen the app to use it.'); });
      });
    }).catch(() => showToast('Offline setup did not finish. The app still works while this page is open.'));
  }
  window.addEventListener('online', () => { render(); showToast('Back online. Your reminders stayed on this device.'); });
  window.addEventListener('offline', () => { render(); showToast('Offline. The lane and your saved data still work.'); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      void nativeScheduleStatus().then(status => { if (status) { nativeStatus = status; render(); } });
      render();
      void checkNotifications();
    }
  });
  window.setInterval(() => { render(); void checkNotifications(); }, 30_000);
  void checkNotifications();
  if (localStorage.getItem('sb_license:critical-alert-lane')) {
    verifyLicense().then(valid => { if (valid !== unlocked) { unlocked = valid; render(); if (!valid) showToast('This license is no longer active. The free lane remains available.'); } }).catch(() => undefined);
  }
}

void init();
