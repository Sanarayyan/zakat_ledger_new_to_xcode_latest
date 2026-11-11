package com.muslimplus.app;

import android.app.Notification;
import android.content.Context;
import android.content.ContextWrapper;
import android.content.Intent;
import android.content.SharedPreferences;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import org.junit.Test;
import org.junit.runner.RunWith;
import static org.junit.Assert.*;

@RunWith(AndroidJUnit4.class)
public class AdhanNotificationTest {
    private static class TestContext extends ContextWrapper {
        Intent stopped;
        TestContext() { super(InstrumentationRegistry.getInstrumentation().getTargetContext()); }
        @Override public SharedPreferences getSharedPreferences(String name, int mode) {
            return super.getSharedPreferences("test_" + name, mode);
        }
        @Override public boolean stopService(Intent intent) { stopped = intent; return true; }
    }

    @Test public void stopActionDoesNotEraseFutureAlarmsOrMuteFutureAdhan() {
        TestContext context = new TestContext();
        AdhanPlugin.prefs(context).edit().putString("alarms", "[{\"id\":100,\"at\":9999999999999}]").putBoolean("sound", true).commit();
        new AdhanPlugin.StopReceiver().onReceive(context, new Intent());
        assertEquals(AdhanPlaybackService.class.getName(), context.stopped.getComponent().getClassName());
        assertEquals("[{\"id\":100,\"at\":9999999999999}]", AdhanPlugin.prefs(context).getString("alarms", ""));
        assertTrue(AdhanPlugin.prefs(context).getBoolean("sound", false));
    }

    @Test public void playingNotificationHasStopButtonAndSilentReminderDoesNot() {
        TestContext context = new TestContext();
        AdhanPlugin.prefs(context).edit().putString("stopTitle", "Stop Adhan").commit();
        Notification playing = AdhanPlugin.notification(context, "Asr", "Prayer time", true);
        assertEquals("Stop Adhan", playing.actions[0].title.toString());
        assertNotNull(playing.actions[0].actionIntent);
        Notification silent = AdhanPlugin.notification(context, "Asr", "Prayer time", false);
        assertTrue(silent.actions == null || silent.actions.length == 0);
    }
}
