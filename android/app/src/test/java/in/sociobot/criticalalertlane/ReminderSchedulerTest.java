package in.sociobot.criticalalertlane;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;

import android.app.AlarmManager;
import android.content.Context;
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

    @Test public void postedNotificationAndReconciliationUseTheSameReminderId() {
        assertEquals("handled-reminder".hashCode(), ReminderScheduler.notificationId("handled-reminder"));
    }

    @Test public void replacementClearsEveryPostedNotificationFromTheOldState() {
        int[] ids = ReminderScheduler.notificationIdsForReminderIds(new String[] { "acknowledged", "snoozed", "deleted" });
        assertEquals(3, ids.length);
        assertEquals(ReminderScheduler.notificationId("acknowledged"), ids[0]);
        assertEquals(ReminderScheduler.notificationId("snoozed"), ids[1]);
        assertEquals(ReminderScheduler.notificationId("deleted"), ids[2]);
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
