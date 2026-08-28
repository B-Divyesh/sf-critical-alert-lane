package in.sociobot.criticalalertlane;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/** Durable, local-only scheduling for the Capacitor shell. The web view owns edits; this class owns delivery. */
public final class ReminderScheduler {
    static final String ACTION_REMINDER = "in.sociobot.criticalalertlane.REMINDER";
    private static final String CHANNEL_ID = "critical_reminders";
    private static final String PREFS = "critical-alert-lane-native";
    private static final String STATE = "reminder-state";

    private ReminderScheduler() {}

    static void replace(Context context, JSONObject data) {
        JSONObject old = read(context);
        cancelAll(context, old);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(STATE, data.toString()).apply();
        scheduleAll(context, data, System.currentTimeMillis());
    }

    static void reschedule(Context context) {
        JSONObject data = read(context);
        cancelAll(context, data);
        scheduleAll(context, data, System.currentTimeMillis());
    }

    static void handleAlarm(Context context, String id) {
        if (id == null || id.isEmpty()) return;
        JSONObject data = read(context);
        JSONObject reminder = findReminder(data, id);
        if (reminder == null || !reminder.optBoolean("enabled", false)) return;
        long now = System.currentTimeMillis();
        long dueAt = effectiveDueAt(reminder);
        if (dueAt > now) {
            schedule(context, id, dueAt);
        } else if (isQuietTime(data.optJSONObject("settings"), now)) {
            schedule(context, id, nextQuietEnd(data.optJSONObject("settings"), now));
        } else {
            showNotification(context, reminder);
            schedule(context, id, ReminderSchedulePolicy.nextTriggerAfterAlarm(dueAt, now, reminder.optLong("repeatMinutes", 5L), false, 0L));
        }
    }

    static JSONObject read(Context context) {
        String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(STATE, null);
        if (raw == null) return new JSONObject();
        try { return new JSONObject(raw); }
        catch (JSONException ignored) { return new JSONObject(); }
    }

    static void scheduleAll(Context context, JSONObject data, long now) {
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) return;
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder == null || !reminder.optBoolean("enabled", false)) continue;
            String id = reminder.optString("id", "");
            if (id.isEmpty()) continue;
            long dueAt = effectiveDueAt(reminder);
            boolean quiet = isQuietTime(data.optJSONObject("settings"), now);
            long trigger = ReminderSchedulePolicy.initialTrigger(dueAt, now, quiet, quiet ? nextQuietEnd(data.optJSONObject("settings"), now) : 0L);
            schedule(context, id, trigger);
        }
    }

    static void cancelAll(Context context, JSONObject data) {
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) return;
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder == null) continue;
            String id = reminder.optString("id", "");
            if (!id.isEmpty()) alarms.cancel(alarmIntent(context, id));
        }
    }

    private static void schedule(Context context, String id, long triggerAt) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pending = alarmIntent(context, id);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && alarms.canScheduleExactAlarms()) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        } else {
            alarms.set(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        }
    }

    private static PendingIntent alarmIntent(Context context, String id) {
        Intent intent = new Intent(context, ReminderAlarmReceiver.class).setAction(ACTION_REMINDER).putExtra("reminderId", id);
        return PendingIntent.getBroadcast(context, id.hashCode(), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static JSONObject findReminder(JSONObject data, String id) {
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) return null;
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder != null && id.equals(reminder.optString("id"))) return reminder;
        }
        return null;
    }

    private static long effectiveDueAt(JSONObject reminder) {
        long nextAt = parseTime(reminder.optString("nextAt"));
        long snoozedUntil = parseTime(reminder.optString("snoozedUntil", ""));
        return Math.max(nextAt, snoozedUntil);
    }

    private static long parseTime(String value) {
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSX", Locale.US);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date parsed = parser.parse(value);
            return parsed == null ? 0L : parsed.getTime();
        } catch (ParseException ignored) { return 0L; }
    }

    private static boolean isQuietTime(JSONObject settings, long now) {
        if (settings == null || !settings.optBoolean("quietEnabled", false)) return false;
        String start = settings.optString("quietStart", "");
        String end = settings.optString("quietEnd", "");
        if (start.equals(end) || start.length() != 5 || end.length() != 5) return false;
        Calendar current = Calendar.getInstance(); current.setTimeInMillis(now);
        int minute = current.get(Calendar.HOUR_OF_DAY) * 60 + current.get(Calendar.MINUTE);
        int startMinute = minutes(start), endMinute = minutes(end);
        return startMinute < endMinute ? minute >= startMinute && minute < endMinute : minute >= startMinute || minute < endMinute;
    }

    private static long nextQuietEnd(JSONObject settings, long now) {
        Calendar end = Calendar.getInstance(); end.setTimeInMillis(now);
        String endValue = settings == null ? "07:00" : settings.optString("quietEnd", "07:00");
        end.set(Calendar.HOUR_OF_DAY, Integer.parseInt(endValue.substring(0, 2)));
        end.set(Calendar.MINUTE, Integer.parseInt(endValue.substring(3, 5)));
        end.set(Calendar.SECOND, 0); end.set(Calendar.MILLISECOND, 0);
        if (end.getTimeInMillis() <= now) end.add(Calendar.DAY_OF_YEAR, 1);
        return end.getTimeInMillis();
    }

    private static int minutes(String value) { return Integer.parseInt(value.substring(0, 2)) * 60 + Integer.parseInt(value.substring(3, 5)); }

    private static void showNotification(Context context, JSONObject reminder) {
        if (!notificationsAllowed(context)) return;
        ensureChannel(context);
        Intent openApp = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent openPending = PendingIntent.getActivity(context, reminder.optString("id").hashCode(), openApp, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        String title = reminder.optString("title", "Critical reminder");
        String note = reminder.optString("note", "");
        Notification notification = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(note.isEmpty() ? "Open Critical Alert Lane to acknowledge or snooze." : note)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(note.isEmpty() ? "Open Critical Alert Lane to acknowledge or snooze." : note))
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PRIVATE)
            .setAutoCancel(false)
            .setOnlyAlertOnce(false)
            .setContentIntent(openPending)
            .build();
        NotificationManagerCompat.from(context).notify(reminder.optString("id").hashCode(), notification);
    }

    private static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Critical reminders", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Repeating reminders that need an explicit acknowledgement.");
        channel.enableVibration(true);
        ((NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE)).createNotificationChannel(channel);
    }

    static boolean notificationsAllowed(Context context) {
        return (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || context.checkSelfPermission(android.Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED)
            && NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    static boolean exactAlarmsAllowed(Context context) {
        return Build.VERSION.SDK_INT < Build.VERSION_CODES.S || ((AlarmManager) context.getSystemService(Context.ALARM_SERVICE)).canScheduleExactAlarms();
    }
}
