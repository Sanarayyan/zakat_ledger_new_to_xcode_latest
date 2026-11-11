package com.muslimplus.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONArray;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

@CapacitorPlugin(name = "Adhan")
public class AdhanPlugin extends Plugin {
    private static final int INEXACT = 0;
    private static final int EXACT = 1;
    private static final int ALARM_CLOCK = 2;
    private static final long MAX_SOUND_DELAY_MS = 60_000;
    static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences("adhan_alarms", Context.MODE_PRIVATE);
    }

    static boolean exactAllowed(Context context) {
        return Build.VERSION.SDK_INT < 31 || context.getSystemService(AlarmManager.class).canScheduleExactAlarms();
    }

    static PendingIntent alarmIntent(Context context, int id) {
        Intent intent = new Intent(context, AlarmReceiver.class).putExtra("id", id);
        return PendingIntent.getBroadcast(context, id, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    static int alarmMode(Context context, boolean sound) {
        if (!exactAllowed(context)) return INEXACT;
        return sound ? ALARM_CLOCK : EXACT;
    }

    static void arm(Context context, JSONObject alarm, int mode) throws Exception {
        long at = alarm.getLong("at");
        if (at <= System.currentTimeMillis()) return;
        AlarmManager manager = context.getSystemService(AlarmManager.class);
        PendingIntent intent = alarmIntent(context, alarm.getInt("id"));
        if (mode == ALARM_CLOCK) {
            PendingIntent show = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class),
                PendingIntent.FLAG_IMMUTABLE);
            manager.setAlarmClock(new AlarmManager.AlarmClockInfo(at, show), intent);
        } else if (mode == EXACT) {
            manager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent);
        } else {
            manager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, intent);
        }
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("exactAllowed", exactAllowed(getContext()));
        result.put("notificationsAllowed", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
        result.put("playing", prefs(getContext()).getBoolean("playing", false));
        result.put("lastError", prefs(getContext()).getString("lastError", ""));
        call.resolve(result);
    }

    @PluginMethod
    public void configure(PluginCall call) {
        boolean sound = call.getBoolean("sound", false);
        prefs(getContext()).edit().putBoolean("sound", sound).putBoolean("vibrate", call.getBoolean("vibrate", false)).apply();
        if (!sound) {
            getContext().stopService(new Intent(getContext(), AdhanPlaybackService.class));
            getContext().getSystemService(AlarmManager.class).cancel(alarmIntent(getContext(), 999));
            prefs(getContext()).edit().remove("test").apply();
        }
        call.resolve();
    }

    @PluginMethod
    public void requestExactPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 31 && !exactAllowed(getContext())) {
            getActivity().startActivity(new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                Uri.parse("package:" + getContext().getPackageName())));
        }
        call.resolve();
    }

    @PluginMethod
    public void schedule(PluginCall call) {
        JSArray alarms = call.getArray("alarms", new JSArray());
        boolean sound = call.getBoolean("sound", false);
        if (sound && alarms.length() > 0 && !exactAllowed(getContext())) {
            call.reject("Allow Alarms & reminders in phone settings to play Adhan on time.", "EXACT_ALARM_REQUIRED");
            return;
        }
        try {
            // Validate the complete replacement before cancelling existing alarms.
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                if (alarm.getInt("id") < 100 || alarm.getInt("id") > 500 || alarm.getLong("at") <= 0) {
                    throw new IllegalArgumentException("Invalid prayer alarm");
                }
                alarm.getString("title");
            }
            Context context = getContext();
            SharedPreferences settings = prefs(context);
            JSONArray old = new JSONArray(settings.getString("alarms", "[]"));
            AlarmManager manager = context.getSystemService(AlarmManager.class);
            int mode = alarmMode(context, sound);
            int oldMode = settings.getInt("alarmMode", -1);
            Map<Integer, Long> previous = new HashMap<>();
            for (int i = 0; i < old.length(); i++) {
                JSONObject alarm = old.getJSONObject(i);
                previous.put(alarm.getInt("id"), alarm.getLong("at"));
            }
            for (int i = 0; i < alarms.length(); i++) {
                JSONObject alarm = alarms.getJSONObject(i);
                int id = alarm.getInt("id");
                long nextAt = alarm.getLong("at");
                Long oldAt = previous.remove(id);
                if (oldAt != null && oldAt != nextAt && nextAt <= System.currentTimeMillis()) {
                    manager.cancel(alarmIntent(context, id));
                }
                if (mode != oldMode || oldAt == null || oldAt != nextAt) arm(context, alarm, mode);
            }
            for (int id : previous.keySet()) manager.cancel(alarmIntent(context, id));
            settings.edit().putString("alarms", alarms.toString()).putBoolean("sound", sound)
                .putInt("alarmMode", mode)
                .putBoolean("vibrate", call.getBoolean("vibrate", false))
                .putString("stopTitle", call.getString("stopTitle", "Stop Adhan")).remove("lastError").apply();
            if (!sound || alarms.length() == 0) context.stopService(new Intent(context, AdhanPlaybackService.class));
            call.resolve();
        } catch (Exception error) {
            call.reject("Could not schedule prayer reminders", error);
        }
    }

    @PluginMethod
    public void test(PluginCall call) {
        if (!exactAllowed(getContext())) {
            call.reject("Allow Alarms & reminders first, then try again.", "EXACT_ALARM_REQUIRED");
            return;
        }
        try {
            JSONObject alarm = new JSONObject().put("id", 999).put("at", System.currentTimeMillis() + 10000)
                .put("title", "Test Adhan").put("body", "Tap Stop Adhan to silence this test.");
            prefs(getContext()).edit().putString("test", alarm.toString())
                .putString("stopTitle", call.getString("stopTitle", "Stop Adhan")).apply();
            arm(getContext(), alarm, ALARM_CLOCK);
            call.resolve();
        } catch (Exception error) { call.reject("Could not schedule test", error); }
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getContext().stopService(new Intent(getContext(), AdhanPlaybackService.class));
        call.resolve();
    }

    static Notification notification(Context context, String title, String body, boolean playing) {
        SharedPreferences settings = prefs(context);
        boolean vibrate = settings.getBoolean("vibrate", false);
        String channelId = vibrate ? "prayer_vibrate_v2" : "prayer_silent_v2";
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (Build.VERSION.SDK_INT >= 26) {
            NotificationChannel channel = new NotificationChannel(channelId, vibrate ? "Prayer reminders with vibration" : "Prayer reminders", NotificationManager.IMPORTANCE_HIGH);
            channel.setSound(null, null); // Audio belongs to the stoppable service, never the OS channel.
            channel.enableVibration(vibrate);
            manager.createNotificationChannel(channel);
        }
        PendingIntent open = PendingIntent.getActivity(context, 0, new Intent(context, MainActivity.class),
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm).setContentTitle(title).setContentText(body)
            .setContentIntent(open).setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setPriority(NotificationCompat.PRIORITY_HIGH).setOnlyAlertOnce(true).setOngoing(playing)
            .setSilent(!vibrate).setAutoCancel(!playing);
        if (playing) {
            PendingIntent stop = PendingIntent.getBroadcast(context, 0, new Intent(context, StopReceiver.class),
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
            builder.addAction(android.R.drawable.ic_media_pause, settings.getString("stopTitle", "Stop Adhan"), stop);
        }
        return builder.build();
    }

    public static class StopReceiver extends BroadcastReceiver {
        @Override public void onReceive(Context context, Intent intent) {
            // Stop only the current playback. Leave all future alarms intact.
            context.stopService(new Intent(context, AdhanPlaybackService.class));
        }
    }

    public static class AlarmReceiver extends BroadcastReceiver {
        @Override public void onReceive(Context context, Intent intent) {
            try {
                // Never play an alert the user cannot see or stop.
                if (!NotificationManagerCompat.from(context).areNotificationsEnabled()) return;
                int id = intent.getIntExtra("id", -1);
                SharedPreferences settings = prefs(context);
                JSONObject alarm = null;
                if (id == 999) alarm = new JSONObject(settings.getString("test", "{}"));
                else {
                    JSONArray alarms = new JSONArray(settings.getString("alarms", "[]"));
                    for (int i = 0; i < alarms.length(); i++) if (alarms.getJSONObject(i).getInt("id") == id) alarm = alarms.getJSONObject(i);
                }
                if (alarm == null) return;
                long delay = System.currentTimeMillis() - alarm.getLong("at");
                if (delay < 0 || delay > 15 * 60 * 1000) return;
                String title = alarm.getString("title");
                String body = alarm.optString("body", "It is time for prayer.");
                boolean audible = id == 999 || (settings.getBoolean("sound", false) && settings.getInt("alarmMode", -1) == ALARM_CLOCK);
                if (audible && delay <= MAX_SOUND_DELAY_MS && exactAllowed(context)) {
                    try {
                        ContextCompat.startForegroundService(context, new Intent(context, AdhanPlaybackService.class)
                            .putExtra("title", title).putExtra("body", body));
                        return;
                    } catch (RuntimeException error) {
                        settings.edit().putString("lastError", "Android blocked background Adhan playback. Check Alarms & reminders permission.").apply();
                    }
                }
                context.getSystemService(NotificationManager.class).notify(id, notification(context, title, body, false));
            } catch (Exception error) {
                prefs(context).edit().putString("lastError", "A prayer reminder could not be shown.").apply();
            }
        }
    }

    public static class RestoreReceiver extends BroadcastReceiver {
        @Override public void onReceive(Context context, Intent intent) {
            String action = intent.getAction();
            if (!Intent.ACTION_BOOT_COMPLETED.equals(action) && !Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
                && !AlarmManager.ACTION_SCHEDULE_EXACT_ALARM_PERMISSION_STATE_CHANGED.equals(action)) return;
            try {
                SharedPreferences settings = prefs(context);
                int mode = alarmMode(context, settings.getBoolean("sound", false));
                JSONArray alarms = new JSONArray(settings.getString("alarms", "[]"));
                for (int i = 0; i < alarms.length(); i++) arm(context, alarms.getJSONObject(i), mode);
                settings.edit().putInt("alarmMode", mode).apply();
            } catch (Exception error) {
                prefs(context).edit().putString("lastError", "Reopen the app to restore prayer reminders.").apply();
            }
        }
    }
}
