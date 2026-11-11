package com.muslimplus.app;

import android.app.Notification;
import android.app.Service;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioFocusRequest;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.IBinder;
import android.os.PowerManager;
import android.os.Handler;

public class AdhanPlaybackService extends Service {
    private MediaPlayer player;
    private AudioManager audioManager;
    private AudioFocusRequest focusRequest;
    private final Handler handler = new Handler(android.os.Looper.getMainLooper());
    private final Runnable timeout = () -> stopSelf();
    private final AudioManager.OnAudioFocusChangeListener focusListener = change -> {
        if (change < 0) stopSelf();
    };

    @Override public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) { stopSelf(); return START_NOT_STICKY; }
        releasePlayer();
        String title = intent.getStringExtra("title");
        Notification notification = AdhanPlugin.notification(this, title, "Adhan is playing. Tap Stop Adhan to silence it.", true);
        startForeground(70001, notification);
        audioManager = (AudioManager) getSystemService(AUDIO_SERVICE);
        AudioAttributes attributes = new AudioAttributes.Builder().setUsage(AudioAttributes.USAGE_MEDIA)
            .setContentType(AudioAttributes.CONTENT_TYPE_MUSIC).build();
        int focus;
        if (Build.VERSION.SDK_INT >= 26) {
            focusRequest = new AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT)
                .setAudioAttributes(attributes).setOnAudioFocusChangeListener(focusListener).build();
            focus = audioManager.requestAudioFocus(focusRequest);
        } else focus = audioManager.requestAudioFocus(focusListener, AudioManager.STREAM_MUSIC, AudioManager.AUDIOFOCUS_GAIN_TRANSIENT);
        if (focus != AudioManager.AUDIOFOCUS_REQUEST_GRANTED) { stopSelf(); return START_NOT_STICKY; }
        try {
            player = new MediaPlayer();
            player.setAudioAttributes(attributes);
            player.setWakeMode(this, PowerManager.PARTIAL_WAKE_LOCK);
            android.content.res.AssetFileDescriptor file = getResources().openRawResourceFd(R.raw.adhan);
            player.setDataSource(file.getFileDescriptor(), file.getStartOffset(), file.getLength());
            file.close();
            player.setOnPreparedListener(media -> {
                AdhanPlugin.prefs(this).edit().putBoolean("playing", true).apply();
                media.start();
            });
            player.setOnCompletionListener(media -> stopSelf());
            player.setOnErrorListener((media, what, extra) -> { stopSelf(); return true; });
            player.prepareAsync();
            handler.removeCallbacks(timeout);
            handler.postDelayed(timeout, 5 * 60 * 1000);
        } catch (Exception error) { stopSelf(); }
        return START_NOT_STICKY;
    }

    private void releasePlayer() {
        if (player != null) { player.release(); player = null; }
        AdhanPlugin.prefs(this).edit().putBoolean("playing", false).apply();
    }

    @Override public void onDestroy() {
        handler.removeCallbacks(timeout);
        releasePlayer();
        if (audioManager != null) {
            if (Build.VERSION.SDK_INT >= 26 && focusRequest != null) audioManager.abandonAudioFocusRequest(focusRequest);
            else audioManager.abandonAudioFocus(focusListener);
        }
        stopForeground(true);
        super.onDestroy();
    }

    @Override public IBinder onBind(Intent intent) { return null; }
}
