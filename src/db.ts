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
    if (!reminder || typeof reminder.title !== 'string' || Number.isNaN(new Date(reminder.nextAt).getTime())) {
      throw new Error('One or more reminders in this file are invalid.');
    }
  }
  return data as AppData;
}
