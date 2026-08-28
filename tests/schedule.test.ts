import { describe, expect, it } from 'vitest';
import { isDue, isQuietTime, nextOccurrence } from '../src/schedule';
import type { Reminder } from '../src/types';

const reminder = (overrides: Partial<Reminder> = {}): Reminder => ({
  id: 'one', title: 'Take medicine', note: '', nextAt: '2026-08-28T09:00:00.000Z', recurrence: 'daily', repeatMinutes: 10, escalationMinutes: 180, enabled: true, createdAt: '2026-08-20T00:00:00.000Z', updatedAt: '2026-08-20T00:00:00.000Z', ...overrides
});

describe('reminder schedule', () => {
  it('becomes due at its scheduled time', () => {
    expect(isDue(reminder(), new Date('2026-08-28T09:00:00.000Z'))).toBe(true);
    expect(isDue(reminder(), new Date('2026-08-28T08:59:59.000Z'))).toBe(false);
  });

  it('uses a later snooze time', () => {
    const item = reminder({ snoozedUntil: '2026-08-28T10:00:00.000Z' });
    expect(isDue(item, new Date('2026-08-28T09:30:00.000Z'))).toBe(false);
    expect(isDue(item, new Date('2026-08-28T10:00:00.000Z'))).toBe(true);
  });

  it('moves daily recurrence beyond the acknowledgement time', () => {
    expect(nextOccurrence('2026-08-27T09:00:00.000Z', 'daily', new Date('2026-08-29T10:00:00.000Z'))).toBe('2026-08-30T09:00:00.000Z');
  });

  it('skips weekends for weekday recurrence', () => {
    expect(nextOccurrence('2026-08-28T09:00:00.000Z', 'weekdays', new Date('2026-08-28T10:00:00.000Z'))).toBe('2026-08-31T09:00:00.000Z');
  });

  it('disables one-time reminders after acknowledgement', () => {
    expect(nextOccurrence('2026-08-28T09:00:00.000Z', 'once')).toBeNull();
  });

  it('handles quiet hours spanning midnight', () => {
    const settings = { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' };
    expect(isQuietTime(settings, new Date('2026-08-28T23:30:00'))).toBe(true);
    expect(isQuietTime(settings, new Date('2026-08-28T12:00:00'))).toBe(false);
  });
});
