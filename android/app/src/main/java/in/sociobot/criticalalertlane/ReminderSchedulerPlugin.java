package in.sociobot.criticalalertlane;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONObject;

@CapacitorPlugin(name = "ReminderScheduler", permissions = {
    @Permission(alias = "notifications", strings = { android.Manifest.permission.POST_NOTIFICATIONS })
})
public class ReminderSchedulerPlugin extends Plugin {
    @PluginMethod public void sync(PluginCall call) {
        JSONObject data = call.getObject("data");
        if (data == null || data.optInt("version", 0) != 1) { call.reject("Invalid reminder data."); return; }
        ReminderScheduler.replace(getContext(), data);
        call.resolve(status());
    }

    @PluginMethod public void getStatus(PluginCall call) { call.resolve(status()); }

    @PluginMethod public void requestNotifications(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU || ReminderScheduler.notificationsAllowed(getContext())) { call.resolve(status()); return; }
        getContext().getSharedPreferences("critical-alert-lane-native", 0).edit().putBoolean("asked-notifications", true).apply();
        requestPermissionForAlias("notifications", call, "notificationsResult");
    }

    @PermissionCallback private void notificationsResult(PluginCall call) { call.resolve(status()); }

    @PluginMethod public void openExactAlarmSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S && !ReminderScheduler.exactAlarmsAllowed(getContext())) {
            Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, Uri.parse("package:" + getContext().getPackageName()));
            getActivity().startActivity(intent);
        }
        call.resolve();
    }

    private JSObject status() {
        boolean asked = getContext().getSharedPreferences("critical-alert-lane-native", 0).getBoolean("asked-notifications", false);
        JSObject value = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU) value.put("notifications", ReminderScheduler.notificationsAllowed(getContext()) ? "granted" : "denied");
        else value.put("notifications", ReminderScheduler.notificationsAllowed(getContext()) ? "granted" : (asked ? "denied" : "prompt"));
        value.put("exactAlarms", Build.VERSION.SDK_INT < Build.VERSION_CODES.S ? "not-required" : (ReminderScheduler.exactAlarmsAllowed(getContext()) ? "granted" : "prompt"));
        return value;
    }
}
