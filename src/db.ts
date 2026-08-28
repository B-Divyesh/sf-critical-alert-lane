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
    const transaction = db.transaction(STORE, 'readwrite');
    const request = transaction.objectStore(STORE).get(KEY);
    let loaded = structuredClone(DEFAULT_DATA);
    request.onsuccess = () => {
      if (!request.result) return;
      const prepared = prepareImport(request.result);
      loaded = prepared.data;
      // Repair backups accepted by versions before v1.0.3 in place. This
      // avoids losing a user's lane if duplicate or Java-hash-colliding IDs
      // already reached IndexedDB before the invariant was added.
      if (prepared.remappedReminderIds > 0) transaction.objectStore(STORE).put(loaded, KEY);
    };
    request.onerror = () => reject(request.error ?? new Error('Could not read reminders.'));
    transaction.oncomplete = () => { db.close(); resolve(loaded); };
    transaction.onerror = () => reject(transaction.error ?? new Error('Could not read reminders.'));
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
  const data = validateStructure(value);
  const ids = new Set<string>();
  const hashes = new Set<number>();
  for (const reminder of data.reminders) {
    if (ids.has(reminder.id) || hashes.has(javaStringHash(reminder.id))) {
      throw new Error('Reminder IDs must be unique and safe for Android alarms.');
    }
    ids.add(reminder.id);
    hashes.add(javaStringHash(reminder.id));
  }
  return data;
}

function validateStructure(value: unknown): AppData {
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

export interface PreparedImport {
  data: AppData;
  remappedReminderIds: number;
  pausedReminderIds: string[];
}

/** Java's String.hashCode(), calculated over UTF-16 code units. */
export function javaStringHash(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (Math.imul(31, hash) + value.charCodeAt(index)) | 0;
  }
  return hash;
}

/**
 * Validate and normalize an external/legacy version-1 backup before it can be
 * saved. File order is the deterministic tie-breaker: the first safe ID stays
 * unchanged, and later duplicate/hash-colliding IDs receive stable suffixes.
 */
export function prepareImport(value: unknown, activeLimit?: number): PreparedImport {
  const data = structuredClone(validateStructure(value));
  const usedIds = new Set<string>();
  const usedHashes = new Set<number>();
  const firstCanonicalId = new Map<string, string>();
  let remappedReminderIds = 0;

  data.reminders.forEach((reminder, index) => {
    const originalId = reminder.id;
    let canonicalId = originalId;
    let attempt = 0;
    while (usedIds.has(canonicalId) || usedHashes.has(javaStringHash(canonicalId))) {
      attempt += 1;
      const suffix = `~import-${index + 1}${attempt === 1 ? '' : `-${attempt}`}`;
      canonicalId = `${originalId.slice(0, Math.max(1, 200 - suffix.length))}${suffix}`;
    }
    if (canonicalId !== originalId) {
      reminder.id = canonicalId;
      remappedReminderIds += 1;
    }
    if (!firstCanonicalId.has(originalId)) firstCanonicalId.set(originalId, canonicalId);
    usedIds.add(canonicalId);
    usedHashes.add(javaStringHash(canonicalId));
  });

  // A history reference to a distinct colliding ID follows that reminder's
  // repaired ID. Duplicate IDs are inherently ambiguous, so their history
  // remains attached to the deterministic first occurrence.
  for (const entry of data.history) {
    entry.reminderId = firstCanonicalId.get(entry.reminderId) ?? entry.reminderId;
  }

  const pausedReminderIds: string[] = [];
  if (activeLimit !== undefined) {
    let activeCount = 0;
    for (const reminder of data.reminders) {
      if (!reminder.enabled) continue;
      activeCount += 1;
      if (activeCount > activeLimit) {
        reminder.enabled = false;
        reminder.pausedByFreeLimit = true;
        pausedReminderIds.push(reminder.id);
      }
    }
  }

  return { data: validateData(data), remappedReminderIds, pausedReminderIds };
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
    (reminder.pausedByFreeLimit === undefined || reminder.pausedByFreeLimit === true) &&
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
