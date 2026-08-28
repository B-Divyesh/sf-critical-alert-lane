package in.sociobot.criticalalertlane;

import static org.junit.Assert.assertEquals;
import org.junit.Test;

public class ReminderSchedulePolicyTest {
    @Test public void schedules_a_due_reminder_immediately_after_a_restart() {
        assertEquals(11_000L, ReminderSchedulePolicy.initialTrigger(5_000L, 10_000L, false, 0L));
    }

    @Test public void repeats_after_the_selected_interval_until_the_web_view_acknowledges_it() {
        assertEquals(610_000L, ReminderSchedulePolicy.nextTriggerAfterAlarm(5_000L, 10_000L, 10L, false, 0L));
    }

    @Test public void defers_a_due_repeat_to_the_end_of_quiet_hours() {
        assertEquals(40_000L, ReminderSchedulePolicy.nextTriggerAfterAlarm(5_000L, 10_000L, 10L, true, 40_000L));
    }
}
