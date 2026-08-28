import { DEFAULT_DATA, type AppData } from './types';

const DB_NAME = 'critical-alert-lane';
const STORE = 'state';
const KEY = 'app-data';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local storage.'));
  });
}

export async function loadData(): Promise<AppData> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readonly');
    const request = transaction.objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(request.result ? validateData(request.result) : structuredClone(DEFAULT_DATA));
    request.onerror = () => reject(request.error ?? new Error('Could not read reminders.'));
    transaction.oncomplete = () => db.close();
  });
}

export async function saveData(data: AppData): Promise<void> {
  data.updatedAt = new Date().toISOString();
  validateData(data);
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, 'readwrite');
    transaction.objectStore(STORE).put(data, KEY);
    transaction.oncomplete = () => { db.close(); resolve(); };
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not save reminders.'));
  });
}

export function validateData(value: unknown): AppData {
  if (!value || typeof value !== 'object') throw new Error('This file does not contain Critical Alert Lane data.');
  const data = value as Partial<AppData>;
  if (data.version !== 1 || !Array.isArray(data.reminders) || !Array.isArray(data.history) || !data.settings) {
    throw new Error('This export version is not supported.');
  }

  for (const reminder of data.reminders) {
    if (!isReminder(reminder)) {
      throw new Error('One or more reminders in this file are invalid.');
    }
  }
  for (const entry of data.history) {
    if (!isHistoryEntry(entry)) throw new Error('One or more history entries in this file are invalid.');
  }
  if (!isSettings(data.settings)) throw new Error('The quiet-hour settings in this file are invalid.');
  if (!isTimestamp(data.updatedAt)) throw new Error('This export has an invalid update time.');
  return data as AppData;
}

const RECURRENCES = new Set(['once', 'daily', 'weekdays', 'weekly']);
const REPEAT_MINUTES = new Set([5, 10, 15, 30, 60]);
const ESCALATION_MINUTES = new Set([60, 180, 360, 720, 1440]);
const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const ISO_TIMESTAMP = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

function isText(value: unknown, maxLength: number, allowEmpty = false): value is string {
  return typeof value === 'string' && value.length <= maxLength && (allowEmpty || value.trim().length > 0);
}

function isTimestamp(value: unknown): value is string {
  return typeof value === 'string' && ISO_TIMESTAMP.test(value) && Number.isFinite(Date.parse(value));
}

function isReminder(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const reminder = value as Record<string, unknown>;
  return isText(reminder.id, 200) &&
    isText(reminder.title, 80) &&
    isText(reminder.note, 240, true) &&
    isTimestamp(reminder.nextAt) &&
    typeof reminder.recurrence === 'string' && RECURRENCES.has(reminder.recurrence) &&
    typeof reminder.repeatMinutes === 'number' && REPEAT_MINUTES.has(reminder.repeatMinutes) &&
    typeof reminder.escalationMinutes === 'number' && ESCALATION_MINUTES.has(reminder.escalationMinutes) &&
    (reminder.snoozedUntil === undefined || isTimestamp(reminder.snoozedUntil)) &&
    (reminder.lastNotifiedAt === undefined || isTimestamp(reminder.lastNotifiedAt)) &&
    typeof reminder.enabled === 'boolean' &&
    isTimestamp(reminder.createdAt) && isTimestamp(reminder.updatedAt);
}

function isHistoryEntry(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Record<string, unknown>;
  return isText(entry.id, 200) && isText(entry.reminderId, 200) && isText(entry.title, 80) &&
    isTimestamp(entry.scheduledAt) && isTimestamp(entry.handledAt) && typeof entry.withinWindow === 'boolean';
}

function isSettings(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const settings = value as Record<string, unknown>;
  return typeof settings.quietEnabled === 'boolean' &&
    typeof settings.quietStart === 'string' && TIME.test(settings.quietStart) &&
    typeof settings.quietEnd === 'string' && TIME.test(settings.quietEnd);
}
