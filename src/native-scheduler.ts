import { Capacitor, registerPlugin } from '@capacitor/core';
import type { AppData } from './types';

interface NativeSchedulerPlugin {
  sync(options: { data: AppData }): Promise<NativeSchedulerStatus>;
  getStatus(): Promise<NativeSchedulerStatus>;
  requestNotifications(): Promise<NativeSchedulerStatus>;
  openExactAlarmSettings(): Promise<void>;
}

export interface NativeSchedulerStatus {
  notifications: 'granted' | 'prompt' | 'denied' | 'not-required';
  exactAlarms: 'granted' | 'prompt' | 'not-required';
}

const plugin = registerPlugin<NativeSchedulerPlugin>('ReminderScheduler');

export const isNativeAndroid = () => Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

export async function syncNativeSchedule(data: AppData): Promise<NativeSchedulerStatus | null> {
  return isNativeAndroid() ? plugin.sync({ data }) : null;
}

export async function nativeScheduleStatus(): Promise<NativeSchedulerStatus | null> {
  return isNativeAndroid() ? plugin.getStatus() : null;
}

export async function requestNativeNotifications(): Promise<NativeSchedulerStatus | null> {
  return isNativeAndroid() ? plugin.requestNotifications() : null;
}

export async function openNativeExactAlarmSettings(): Promise<void> {
  if (isNativeAndroid()) await plugin.openExactAlarmSettings();
}
