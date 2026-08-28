package in.sociobot.criticalalertlane;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

public class ReminderAlarmReceiver extends BroadcastReceiver {
    @Override public void onReceive(Context context, Intent intent) {
        if (ReminderScheduler.ACTION_REMINDER.equals(intent.getAction())) {
            ReminderScheduler.handleAlarm(context, intent.getStringExtra("reminderId"));
        }
    }
}
