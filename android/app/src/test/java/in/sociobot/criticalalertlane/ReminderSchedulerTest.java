package in.sociobot.criticalalertlane;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotEquals;
import static org.junit.Assert.fail;

import android.app.AlarmManager;
import android.content.Context;
import android.content.Intent;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.robolectric.RobolectricTestRunner;
import org.robolectric.RuntimeEnvironment;
import org.robolectric.annotation.Config;
import org.robolectric.shadows.ShadowAlarmManager;
import org.robolectric.Shadows;
import org.json.JSONObject;

/** Regression tests for Android API selection and notification reconciliation identifiers. */
@RunWith(RobolectricTestRunner.class)
public class ReminderSchedulerTest {
    @Test public void usesExactAlarmOnAllSupportedPreAndroid12Devices() {
        assertTrue(ReminderScheduler.usesExactAlarm(23, false));
        assertTrue(ReminderScheduler.usesExactAlarm(30, false));
    }

    @Test public void needsExactAlarmPermissionOnlyOnAndroid12AndLater() {
        assertFalse(ReminderScheduler.usesExactAlarm(31, false));
        assertTrue(ReminderScheduler.usesExactAlarm(31, true));
        assertTrue(ReminderScheduler.usesExactAlarm(35, true));
    }

    @Test public void postedNotificationAndReconciliationUseTheSamePersistedIdentity() {
        Context context = RuntimeEnvironment.getApplication();
        int identity = ReminderScheduler.notificationId(context, "handled-reminder");
        assertEquals(identity, ReminderScheduler.notificationId(context, "handled-reminder"));
    }

    @Test public void replacementClearsEveryPostedNotificationFromTheOldState() {
        Context context = RuntimeEnvironment.getApplication();
        int[] ids = ReminderScheduler.notificationIdsForReminderIds(context, new String[] { "acknowledged", "snoozed", "deleted" });
        assertEquals(3, ids.length);
        assertEquals(ReminderScheduler.notificationId(context, "acknowledged"), ids[0]);
        assertEquals(ReminderScheduler.notificationId(context, "snoozed"), ids[1]);
        assertEquals(ReminderScheduler.notificationId(context, "deleted"), ids[2]);
        assertNotEquals(ids[0], ids[1]);
        assertNotEquals(ids[1], ids[2]);
    }

    @Test @Config(sdk = 30)
    public void distinctAaAndBbHashCollisionsScheduleIndependentPendingIntents() throws Exception {
        assertEquals("Aa".hashCode(), "BB".hashCode());
        Context context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("critical-alert-lane-native", Context.MODE_PRIVATE).edit().clear().commit();
        JSONObject data = new JSONObject("{\"reminders\":[" +
            "{\"id\":\"Aa\",\"enabled\":true,\"nextAt\":\"2099-08-28T05:30:39.123Z\"}," +
            "{\"id\":\"BB\",\"enabled\":true,\"nextAt\":\"2099-08-28T05:31:39.123Z\"}" +
            "],\"settings\":{\"quietEnabled\":false,\"quietStart\":\"22:00\",\"quietEnd\":\"07:00\"}}");

        ReminderScheduler.scheduleAll(context, data, 1_000L);
        int aaIdentity = ReminderScheduler.identityForReminder(context, "Aa");
        int bbIdentity = ReminderScheduler.identityForReminder(context, "BB");
        assertNotEquals(aaIdentity, bbIdentity);
        assertEquals(aaIdentity, ReminderScheduler.identityForReminder(context, "Aa"));
        assertEquals(bbIdentity, ReminderScheduler.identityForReminder(context, "BB"));

        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        assertEquals(2, Shadows.shadowOf(manager).getScheduledAlarms().size());
    }

    @Test @Config(sdk = 30)
    public void claim_native_background_repeat_rearms_from_persisted_state() throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("critical-alert-lane-native", Context.MODE_PRIVATE).edit().clear().commit();
        long now = System.currentTimeMillis();
        String dueAt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZ", Locale.US).format(new Date(now - 60_000L));
        String isoDueAt = dueAt.substring(0, dueAt.length() - 2) + ":" + dueAt.substring(dueAt.length() - 2);
        JSONObject data = new JSONObject("{\"version\":1,\"reminders\":[{" +
            "\"id\":\"background-repeat\",\"title\":\"Background repeat\",\"note\":\"\",\"enabled\":true," +
            "\"nextAt\":\"" + isoDueAt + "\",\"repeatMinutes\":5}]," +
            "\"settings\":{\"quietEnabled\":false,\"quietStart\":\"22:00\",\"quietEnd\":\"07:00\"}}");
        ReminderScheduler.replace(context, data);
        ReminderScheduler.handleAlarm(context, "background-repeat");
        long afterHandle = System.currentTimeMillis();

        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        long triggerAt = Shadows.shadowOf(manager).getNextScheduledAlarm().triggerAtTime;
        assertTrue(triggerAt >= afterHandle + 5 * 60_000L - 1_000L);
        assertTrue(triggerAt <= afterHandle + 5 * 60_000L + 1_000L);
    }

    @Test @Config(sdk = 30)
    public void claim_lifecycle_recovery_rearms_after_boot_clock_and_timezone_changes() throws Exception {
        Context context = RuntimeEnvironment.getApplication();
        context.getSharedPreferences("critical-alert-lane-native", Context.MODE_PRIVATE).edit().clear().commit();
        JSONObject data = new JSONObject("{\"version\":1,\"reminders\":[{" +
            "\"id\":\"recover-me\",\"title\":\"Recover me\",\"enabled\":true," +
            "\"nextAt\":\"2099-08-28T05:30:39.123Z\",\"repeatMinutes\":5}]," +
            "\"settings\":{\"quietEnabled\":false,\"quietStart\":\"22:00\",\"quietEnd\":\"07:00\"}}");
        ReminderScheduler.replace(context, data);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        String[] actions = { Intent.ACTION_BOOT_COMPLETED, Intent.ACTION_TIME_CHANGED, Intent.ACTION_TIMEZONE_CHANGED };
        for (String action : actions) {
            new ReminderRescheduleReceiver().onReceive(context, new Intent(action));
            assertEquals("Expected recovery for " + action, 1, Shadows.shadowOf(manager).getScheduledAlarms().size());
            assertEquals(4091578239123L, Shadows.shadowOf(manager).getNextScheduledAlarm().triggerAtTime);
        }
    }

    @Test public void duplicateReminderIdsAreRejectedBeforeNativeReplacement() throws Exception {
        JSONObject duplicate = new JSONObject("{\"reminders\":[{\"id\":\"duplicate\"},{\"id\":\"duplicate\"}]}");
        assertFalse(ReminderScheduler.hasUniqueReminderIds(duplicate));
        try {
            ReminderScheduler.replace(RuntimeEnvironment.getApplication(), duplicate);
            fail("Native replacement must reject duplicate reminder IDs.");
        } catch (IllegalArgumentException expected) {
            assertEquals("Reminder IDs must be unique.", expected.getMessage());
        }
    }

    @Test @Config(sdk = 23)
    public void realSchedulingPathRunsOnApi23AndParsesUtcTimestamps() throws Exception {
        scheduleAndAssertAlarm("2026-08-28T05:30:39.123Z", 1787895039123L);
    }

    @Test @Config(sdk = 30)
    public void realSchedulingPathRunsOnApi30AndParsesOffsetTimestamps() throws Exception {
        scheduleAndAssertAlarm("2026-08-28T11:00:39.123+05:30", 1787895039123L);
    }

    private void scheduleAndAssertAlarm(String nextAt, long expectedEpoch) throws Exception {
        assertEquals(expectedEpoch, ReminderScheduler.parseTime(nextAt));
        Context context = RuntimeEnvironment.getApplication();
        JSONObject data = new JSONObject("{\"reminders\":[{\"id\":\"compatibility\",\"enabled\":true,\"nextAt\":\"" + nextAt + "\"}],\"settings\":{\"quietEnabled\":false,\"quietStart\":\"22:00\",\"quietEnd\":\"07:00\"}}");
        ReminderScheduler.scheduleAll(context, data, expectedEpoch - 60_000L);
        AlarmManager manager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        ShadowAlarmManager shadow = Shadows.shadowOf(manager);
        assertEquals(1, shadow.getScheduledAlarms().size());
        assertEquals(expectedEpoch, shadow.getNextScheduledAlarm().triggerAtTime);
    }
}
