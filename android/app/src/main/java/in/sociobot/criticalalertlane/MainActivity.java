package in.sociobot.criticalalertlane;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(android.os.Bundle savedInstanceState) {
        registerPlugin(ReminderSchedulerPlugin.class);
        super.onCreate(savedInstanceState);
        ReminderScheduler.reschedule(this);
    }
}
