export type Recurrence = 'once' | 'daily' | 'weekdays' | 'weekly';

export interface Reminder {
  id: string;
  title: string;
  note: string;
  nextAt: string;
  recurrence: Recurrence;
  repeatMinutes: number;
  escalationMinutes: number;
  snoozedUntil?: string;
  lastNotifiedAt?: string;
  enabled: boolean;
  pausedByFreeLimit?: true;
  createdAt: string;
  updatedAt: string;
}

export interface HistoryEntry {
  id: string;
  reminderId: string;
  title: string;
  scheduledAt: string;
  handledAt: string;
  withinWindow: boolean;
}

export interface Settings {
  quietEnabled: boolean;
  quietStart: string;
  quietEnd: string;
}

export interface AppData {
  version: 1;
  reminders: Reminder[];
  history: HistoryEntry[];
  settings: Settings;
  updatedAt: string;
}

export const DEFAULT_DATA: AppData = {
  version: 1,
  reminders: [],
  history: [],
  settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
  updatedAt: new Date(0).toISOString()
};
