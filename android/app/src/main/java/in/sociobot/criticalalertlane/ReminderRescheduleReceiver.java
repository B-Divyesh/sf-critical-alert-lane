package in.sociobot.criticalalertlane;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Rebuilds every pending alarm after reboot and after the device time zone/clock changes. */
public class ReminderRescheduleReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) { ReminderScheduler.reschedule(context); }
}
