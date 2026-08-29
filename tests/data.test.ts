import { describe, expect, it } from 'vitest';
import { HISTORY_WINDOW_MS, javaStringHash, parseImportText, prepareImport, pruneExpiredHistory, validateData } from '../src/db';
import type { AppData } from '../src/types';

const reminder = (id: string, title = id) => ({
  id,
  title,
  note: '',
  nextAt: '2026-08-28T09:00:00.000Z',
  recurrence: 'daily' as const,
  repeatMinutes: 5,
  escalationMinutes: 60,
  enabled: true,
  createdAt: '2026-08-28T09:00:00.000Z',
  updatedAt: '2026-08-28T09:00:00.000Z'
});

const backup = (reminders: ReturnType<typeof reminder>[]) => ({
  version: 1 as const,
  reminders,
  history: [],
  settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
  updatedAt: '2026-08-28T09:00:00.000Z'
});

describe('import validation', () => {
  it('replaces malformed JSON parser details with a stable recovery message', () => {
    expect(() => parseImportText('{not-json')).toThrow(
      'This file is not a valid Critical Alert Lane export. Choose a Critical Alert Lane export and try again. Your current reminders were not changed.'
    );
  });

  it('rejects unrelated JSON', () => {
    expect(() => validateData({ hello: 'world' })).toThrow(/does not contain|not supported/);
  });

  it('accepts a version 1 export', () => {
    const value = { version: 1 as const, reminders: [], history: [], settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' }, updatedAt: new Date().toISOString() };
    expect(validateData(value)).toEqual(value);
  });

  it('rejects corrupt recurrence, repeat, escalation, timestamp, history, and quiet-hour fields before replacement', () => {
    const corrupt = {
      version: 1,
      reminders: [{
        id: 'reminder-1', title: 'Take medicine', note: '', nextAt: 'not-a-date', recurrence: 'not-a-recurrence',
        repeatMinutes: -1, escalationMinutes: 0, enabled: true, createdAt: '2026-08-28T09:00:00.000Z', updatedAt: '2026-08-28T09:00:00.000Z'
      }],
      history: [{ id: 'history-1', reminderId: 'reminder-1', title: 'Take medicine', scheduledAt: 'bad-time', handledAt: '2026-08-28T09:00:00.000Z', withinWindow: 'yes' }],
      settings: { quietEnabled: 'true', quietStart: '30:99', quietEnd: '07:00' },
      updatedAt: 'not-a-date'
    };
    expect(() => validateData(corrupt)).toThrow(/reminders.*invalid/i);
  });

  it('rejects malformed history even when reminders are valid', () => {
    const value = {
      version: 1 as const,
      reminders: [],
      history: [{ id: 'history-1', reminderId: 'reminder-1', title: 'Take medicine', scheduledAt: '2026-08-28T09:00:00.000Z', handledAt: 'not-a-time', withinWindow: true }],
      settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '7:00' },
      updatedAt: '2026-08-28T09:00:00.000Z'
    };
    expect(() => validateData(value)).toThrow(/history.*invalid/i);
  });

  it('deterministically remaps duplicate reminder IDs instead of merging rows', () => {
    const value = backup([reminder('duplicate', 'First duplicate'), reminder('duplicate', 'Second duplicate')]);
    const first = prepareImport(value);
    const second = prepareImport(value);

    expect(first.remappedReminderIds).toBe(1);
    expect(first.data.reminders.map(item => item.id)).toEqual(['duplicate', 'duplicate~import-2']);
    expect(second.data.reminders.map(item => item.id)).toEqual(first.data.reminders.map(item => item.id));
    expect(new Set(first.data.reminders.map(item => item.id)).size).toBe(2);
  });

  it('deterministically remaps the distinct Java Aa/BB hash collision', () => {
    expect(javaStringHash('Aa')).toBe(2112);
    expect(javaStringHash('BB')).toBe(2112);

    const prepared = prepareImport(backup([reminder('Aa'), reminder('BB')]));
    const ids = prepared.data.reminders.map(item => item.id);
    expect(ids).toEqual(['Aa', 'BB~import-2']);
    expect(new Set(ids.map(javaStringHash)).size).toBe(2);
    expect(prepared.remappedReminderIds).toBe(1);
  });

  it('preserves every imported reminder while pausing active entries beyond the free limit', () => {
    const prepared = prepareImport(backup([
      reminder('one'), reminder('two'), reminder('three'), reminder('four')
    ]), 3);

    expect(prepared.data.reminders).toHaveLength(4);
    expect(prepared.data.reminders.filter(item => item.enabled)).toHaveLength(3);
    expect(prepared.pausedReminderIds).toEqual(['four']);
    expect(prepared.data.reminders[3]).toMatchObject({ id: 'four', enabled: false, pausedByFreeLimit: true });
  });

  it('keeps the exact 30-day boundary and removes history one millisecond older', () => {
    const now = Date.parse('2026-08-29T12:00:00.000Z');
    const value: AppData = backup([]);
    value.history = [
      { id: 'inside', reminderId: 'one', title: 'Inside boundary', scheduledAt: '2026-07-30T12:00:00.000Z', handledAt: new Date(now - HISTORY_WINDOW_MS).toISOString(), withinWindow: true },
      { id: 'outside', reminderId: 'two', title: 'Outside boundary', scheduledAt: '2026-07-30T11:59:59.999Z', handledAt: new Date(now - HISTORY_WINDOW_MS - 1).toISOString(), withinWindow: false }
    ];

    expect(pruneExpiredHistory(value, now)).toBe(true);
    expect(value.history.map(entry => entry.id)).toEqual(['inside']);
    expect(pruneExpiredHistory(value, now)).toBe(false);
  });
});
