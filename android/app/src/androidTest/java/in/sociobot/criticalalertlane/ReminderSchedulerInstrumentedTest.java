package in.sociobot.criticalalertlane;

import static org.junit.Assert.assertEquals;

import android.content.Context;
import android.content.Intent;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.json.JSONObject;
import org.junit.Test;
import org.junit.runner.RunWith;

/** Device regression for scheduling, alarm delivery, and lifecycle rescheduling. */
@RunWith(AndroidJUnit4.class)
public class ReminderSchedulerInstrumentedTest {
    @Test public void schedulesAndReconcilesAcrossLifecycleBroadcasts() throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        JSONObject future = state("device-lifecycle", "2099-08-28T05:30:39.123Z");
        ReminderScheduler.replace(context, future);
        assertEquals("device-lifecycle", ReminderScheduler.read(context)
            .getJSONArray("reminders").getJSONObject(0).getString("id"));

        ReminderRescheduleReceiver receiver = new ReminderRescheduleReceiver();
        receiver.onReceive(context, new Intent(Intent.ACTION_TIMEZONE_CHANGED));
        receiver.onReceive(context, new Intent(Intent.ACTION_TIME_CHANGED));

        JSONObject due = state("device-lifecycle", "2020-08-28T05:30:39.123Z");
        ReminderScheduler.replace(context, due);
        new ReminderAlarmReceiver().onReceive(context,
            new Intent(context, ReminderAlarmReceiver.class)
                .setAction(ReminderScheduler.ACTION_REMINDER)
                .putExtra("reminderId", "device-lifecycle"));
    }

    private static JSONObject state(String id, String nextAt) throws Exception {
        return new JSONObject("{\"reminders\":[{\"id\":\"" + id + "\",\"title\":\"Device check\",\"note\":\"\",\"enabled\":true,\"nextAt\":\"" + nextAt + "\",\"repeatMinutes\":5}],\"settings\":{\"quietEnabled\":false,\"quietStart\":\"22:00\",\"quietEnd\":\"07:00\"}}");
    }
}
