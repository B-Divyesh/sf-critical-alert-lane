package in.sociobot.criticalalertlane;

import android.annotation.SuppressLint;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;
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
    private static final String IDENTITIES = "reminder-identities";

    private ReminderScheduler() {}

    static void replace(Context context, JSONObject data) {
        if (!hasUniqueReminderIds(data)) throw new IllegalArgumentException("Reminder IDs must be unique.");
        JSONObject old = read(context);
        cancelAll(context, old);
        // Acknowledging, snoozing, editing, disabling, or deleting arrives as
        // a complete replacement from the web view. A posted non-auto-cancel
        // alert belongs to that old state, so remove it before arming the new
        // schedule. Otherwise it incorrectly survives a handled reminder.
        cancelNotifications(context, old);
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(STATE, data.toString()).apply();
        reconcileIdentityMap(context, data);
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
            if (!id.isEmpty()) {
                alarms.cancel(alarmIntent(context, id));
                // v1.0.2 and earlier used String.hashCode() without an Intent
                // data URI. Cancel that identity during the mapping migration.
                alarms.cancel(legacyAlarmIntent(context, id));
            }
        }
    }

    static void cancelNotifications(Context context, JSONObject data) {
        NotificationManagerCompat notifications = NotificationManagerCompat.from(context);
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) return;
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder == null) continue;
            String id = reminder.optString("id", "");
            if (id.isEmpty()) continue;
            int mappedId = notificationId(context, id);
            notifications.cancel(mappedId);
            if (mappedId != id.hashCode()) notifications.cancel(id.hashCode());
        }
    }

    static int[] notificationIdsForReminderIds(Context context, String[] reminderIds) {
        int[] values = new int[reminderIds.length];
        int count = 0;
        for (String id : reminderIds) if (id != null && !id.isEmpty()) values[count++] = notificationId(context, id);
        int[] result = new int[count];
        System.arraycopy(values, 0, result, 0, count);
        return result;
    }

    private static void schedule(Context context, String id, long triggerAt) {
        AlarmManager alarms = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        PendingIntent pending = alarmIntent(context, id);
        // setExactAndAllowWhileIdle is available from API 23. Android 12+
        // additionally gates it behind SCHEDULE_EXACT_ALARM; older supported
        // Android versions do not need that permission check.
        boolean exactAlarmPermissionGranted = Build.VERSION.SDK_INT < Build.VERSION_CODES.S || alarms.canScheduleExactAlarms();
        if (usesExactAlarm(Build.VERSION.SDK_INT, exactAlarmPermissionGranted)) {
            alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        } else if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        } else {
            alarms.set(AlarmManager.RTC_WAKEUP, triggerAt, pending);
        }
    }

    static boolean usesExactAlarm(int sdkInt, boolean exactAlarmPermissionGranted) {
        return sdkInt >= Build.VERSION_CODES.M && (sdkInt < Build.VERSION_CODES.S || exactAlarmPermissionGranted);
    }

    static int notificationId(Context context, String id) { return identityForReminder(context, id); }

    /**
     * Stable collision-free integer identity shared by AlarmManager and
     * NotificationManager. The complete mapping is persisted so process death,
     * reboot, and Java hash collisions cannot change or alias an identity.
     */
    static synchronized int identityForReminder(Context context, String id) {
        JSONObject identities = readIdentityMap(context);
        int existing = identities.optInt(id, 0);
        if (existing > 0) return existing;
        Set<Integer> used = identityValues(identities);
        int allocated = allocateIdentity(id, used);
        try { identities.put(id, allocated); }
        catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        writeIdentityMap(context, identities);
        return allocated;
    }

    static boolean hasUniqueReminderIds(JSONObject data) {
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) return true;
        Set<String> ids = new HashSet<>();
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder == null) continue;
            String id = reminder.optString("id", "");
            if (id.isEmpty() || !ids.add(id)) return false;
        }
        return true;
    }

    private static synchronized void reconcileIdentityMap(Context context, JSONObject data) {
        JSONObject old = readIdentityMap(context);
        JSONObject reconciled = new JSONObject();
        Set<Integer> used = new HashSet<>();
        JSONArray reminders = data.optJSONArray("reminders");
        if (reminders == null) { writeIdentityMap(context, reconciled); return; }
        for (int i = 0; i < reminders.length(); i++) {
            JSONObject reminder = reminders.optJSONObject(i);
            if (reminder == null) continue;
            String id = reminder.optString("id", "");
            if (id.isEmpty()) continue;
            int existing = old.optInt(id, 0);
            int identity = existing > 0 && used.add(existing) ? existing : allocateIdentity(id, used);
            used.add(identity);
            try { reconciled.put(id, identity); }
            catch (JSONException impossible) { throw new IllegalStateException(impossible); }
        }
        writeIdentityMap(context, reconciled);
    }

    private static int allocateIdentity(String id, Set<Integer> used) {
        int candidate = id.hashCode() & 0x7fffffff;
        if (candidate == 0) candidate = 1;
        while (used.contains(candidate)) candidate = candidate == Integer.MAX_VALUE ? 1 : candidate + 1;
        return candidate;
    }

    private static Set<Integer> identityValues(JSONObject identities) {
        Set<Integer> used = new HashSet<>();
        java.util.Iterator<String> keys = identities.keys();
        while (keys.hasNext()) {
            int value = identities.optInt(keys.next(), 0);
            if (value > 0) used.add(value);
        }
        return used;
    }

    private static JSONObject readIdentityMap(Context context) {
        String raw = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).getString(IDENTITIES, null);
        if (raw == null) return new JSONObject();
        try { return new JSONObject(raw); }
        catch (JSONException ignored) { return new JSONObject(); }
    }

    private static void writeIdentityMap(Context context, JSONObject identities) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().putString(IDENTITIES, identities.toString()).commit();
    }

    private static PendingIntent alarmIntent(Context context, String id) {
        Intent intent = new Intent(context, ReminderAlarmReceiver.class)
            .setAction(ACTION_REMINDER)
            .setData(Uri.parse("critical-alert-lane://reminder/" + Uri.encode(id)))
            .putExtra("reminderId", id);
        return PendingIntent.getBroadcast(context, identityForReminder(context, id), intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent legacyAlarmIntent(Context context, String id) {
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

    static long parseTime(String value) {
        if (value == null || value.isEmpty()) return 0L;
        // SimpleDateFormat's ISO-8601 `X` zone pattern is unavailable on API
        // 23. Normalize `Z` and ±HH:mm to the API-1 RFC-822 `Z` pattern.
        String normalized = value.endsWith("Z") ? value.substring(0, value.length() - 1) + "+0000" : value;
        if (normalized.matches(".*[+-]\\d{2}:\\d{2}$")) {
            normalized = normalized.substring(0, normalized.length() - 3) + normalized.substring(normalized.length() - 2);
        }
        try {
            SimpleDateFormat parser = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US);
            parser.setLenient(false);
            parser.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date parsed = parser.parse(normalized);
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

    @SuppressLint("MissingPermission") // Checked immediately before notify; SecurityException handles revocation races.
    private static void showNotification(Context context, JSONObject reminder) {
        if (!notificationsAllowed(context)) return;
        ensureChannel(context);
        Intent openApp = new Intent(context, MainActivity.class).setFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        String reminderId = reminder.optString("id");
        openApp.setData(Uri.parse("critical-alert-lane://open/" + Uri.encode(reminderId)));
        PendingIntent openPending = PendingIntent.getActivity(context, identityForReminder(context, reminderId), openApp, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
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
        try {
            NotificationManagerCompat.from(context).notify(notificationId(context, reminderId), notification);
        } catch (SecurityException ignored) {
            // Android may revoke notification permission between the check and
            // delivery. The next schedule remains armed and the in-app lane is
            // still available; never crash the background receiver.
        }
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
