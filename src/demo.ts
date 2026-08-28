import type { AppData, Reminder } from './types';

const now = new Date();
const minutesFromNow = (minutes: number) => new Date(now.getTime() + minutes * 60_000).toISOString();

function reminder(values: Pick<Reminder, 'id' | 'title' | 'note' | 'nextAt' | 'recurrence' | 'repeatMinutes' | 'escalationMinutes'>): Reminder {
  const timestamp = now.toISOString();
  return { ...values, enabled: true, createdAt: timestamp, updatedAt: timestamp };
}

/** Realistic, shipped sample data for the isolated catalog demo. */
export function createDemoData(): AppData {
  return {
    version: 1,
    reminders: [
      reminder({
        id: 'demo-evening-medicine',
        title: 'Take evening medicine',
        note: 'Take the blue inhaler after dinner.',
        nextAt: minutesFromNow(-10),
        recurrence: 'daily',
        repeatMinutes: 5,
        escalationMinutes: 180
      }),
      reminder({
        id: 'demo-insurance-call',
        title: 'Call the insurance case worker',
        note: 'Ask about the specialist referral before Friday.',
        nextAt: minutesFromNow(95),
        recurrence: 'once',
        repeatMinutes: 10,
        escalationMinutes: 360
      }),
      reminder({
        id: 'demo-water-plants',
        title: 'Water the balcony plants',
        note: 'Use the saved rainwater first.',
        nextAt: minutesFromNow(24 * 60),
        recurrence: 'weekly',
        repeatMinutes: 30,
        escalationMinutes: 720
      })
    ],
    history: [],
    settings: { quietEnabled: true, quietStart: '22:00', quietEnd: '07:00' },
    updatedAt: now.toISOString()
  };
}
