import type { Recurrence, Reminder, Settings } from './types';

export function effectiveDueAt(reminder: Reminder): Date {
  const next = new Date(reminder.nextAt);
  if (!reminder.snoozedUntil) return next;
  const snooze = new Date(reminder.snoozedUntil);
  return snooze > next ? snooze : next;
}

export function isDue(reminder: Reminder, now = new Date()): boolean {
  return reminder.enabled && effectiveDueAt(reminder).getTime() <= now.getTime();
}

export function nextOccurrence(from: string, recurrence: Recurrence, now = new Date()): string | null {
  if (recurrence === 'once') return null;
  const candidate = new Date(from);
  const advance = () => {
    if (recurrence === 'daily' || recurrence === 'weekdays') candidate.setDate(candidate.getDate() + 1);
    else candidate.setDate(candidate.getDate() + 7);
  };
  advance();
  if (recurrence === 'weekdays') {
    while (candidate.getDay() === 0 || candidate.getDay() === 6) advance();
  }
  while (candidate.getTime() <= now.getTime()) {
    advance();
    if (recurrence === 'weekdays') {
      while (candidate.getDay() === 0 || candidate.getDay() === 6) advance();
    }
  }
  return candidate.toISOString();
}

function minutesOfDay(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isQuietTime(settings: Settings, now = new Date()): boolean {
  if (!settings.quietEnabled || settings.quietStart === settings.quietEnd) return false;
  const current = now.getHours() * 60 + now.getMinutes();
  const start = minutesOfDay(settings.quietStart);
  const end = minutesOfDay(settings.quietEnd);
  return start < end ? current >= start && current < end : current >= start || current < end;
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
  }).format(new Date(value));
}

export function toLocalInput(value?: string): string {
  const date = value ? new Date(value) : new Date(Date.now() + 60 * 60 * 1000);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}
