package in.sociobot.criticalalertlane;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;
import static org.junit.Assert.assertEquals;


import org.junit.Test;

/** Regression tests for Android API selection and notification reconciliation identifiers. */
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
}
