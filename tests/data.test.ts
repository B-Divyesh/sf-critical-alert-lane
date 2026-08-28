import { describe, expect, it } from 'vitest';
import { validateData } from '../src/db';

describe('import validation', () => {
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
});
