package com.muslimplus.app;

import android.content.Context;
import android.hardware.GeomagneticField;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.Surface;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "QiblaCompass")
public class QiblaCompassPlugin extends Plugin implements SensorEventListener {
    private static final int[] FUSED_SENSORS = { Sensor.TYPE_ROTATION_VECTOR, Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR };
    private static final long SENSOR_TIMEOUT_MS = 2200;
    private final Handler handler = new Handler(Looper.getMainLooper());
    private SensorManager sensors;
    private boolean requested;
    private boolean running;
    private boolean active = true;
    private float declination;
    private float expectedFieldStrength;
    private int accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    private long lastSample;
    private long lastReliableSampleAt;
    private int nextFusedSensor;
    private final float[] matrix = new float[9];
    private final float[] screenMatrix = new float[9];
    private final float[] orientation = new float[3];
    private final float[] gravity = new float[3];
    private final float[] magnetic = new float[3];
    private long gravityAt;
    private long magneticAt;
    private final Runnable checkSensor = new Runnable() {
        @Override public void run() {
            if (!running || !requested || !active) return;
            long remaining = SENSOR_TIMEOUT_MS - (SystemClock.elapsedRealtime() - lastReliableSampleAt);
            if (remaining > 0) {
                handler.postDelayed(this, remaining);
            } else {
                registerNextSensors();
            }
        }
    };

    @Override public void load() {
        sensors = (SensorManager) getContext().getSystemService(Context.SENSOR_SERVICE);
    }

    @PluginMethod
    public void start(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            Double lat = call.getDouble("lat");
            Double lng = call.getDouble("lng");
            if (lat == null || lng == null || !Double.isFinite(lat) || !Double.isFinite(lng)
                || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
                call.reject("A valid location is required");
                return;
            }
            GeomagneticField field = new GeomagneticField(lat.floatValue(), lng.floatValue(), 0, System.currentTimeMillis());
            declination = field.getDeclination();
            expectedFieldStrength = field.getFieldStrength() / 1000; // Android sensor events use microteslas.
            requested = true;
            if (active && !running) registerSensors();
            JSObject result = new JSObject();
            result.put("available", running || !active);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void stop(PluginCall call) {
        getActivity().runOnUiThread(() -> {
            requested = false;
            unregisterSensors();
            call.resolve();
        });
    }

    private boolean register(int type) {
        Sensor sensor = sensors.getDefaultSensor(type);
        return sensor != null && sensors.registerListener(this, sensor, SensorManager.SENSOR_DELAY_GAME);
    }

    private void registerSensors() {
        if (sensors == null) return;
        nextFusedSensor = 0;
        boolean hasVertical = register(Sensor.TYPE_GRAVITY) || register(Sensor.TYPE_ACCELEROMETER);
        if (hasVertical && register(Sensor.TYPE_MAGNETIC_FIELD)) {
            monitorSensor();
            return;
        }
        unregisterSensors();
        registerNextSensors();
    }

    private void registerNextSensors() {
        if (sensors == null) return;
        while (nextFusedSensor < FUSED_SENSORS.length) {
            Sensor candidate = sensors.getDefaultSensor(FUSED_SENSORS[nextFusedSensor++]);
            if (candidate == null) continue;
            // Register the backup before dropping the current source.
            if (sensors.registerListener(this, candidate, SensorManager.SENSOR_DELAY_GAME)) {
                for (int type : new int[] { Sensor.TYPE_GRAVITY, Sensor.TYPE_ACCELEROMETER,
                        Sensor.TYPE_MAGNETIC_FIELD, Sensor.TYPE_ROTATION_VECTOR, Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR }) {
                    Sensor previous = sensors.getDefaultSensor(type);
                    if (previous != null && previous != candidate) sensors.unregisterListener(this, previous);
                }
                resetReadings();
                monitorSensor();
                return;
            }
        }
    }

    private void monitorSensor() {
        running = true;
        lastReliableSampleAt = SystemClock.elapsedRealtime();
        if (nextFusedSensor < FUSED_SENSORS.length) handler.postDelayed(checkSensor, SENSOR_TIMEOUT_MS);
    }

    private void unregisterSensors() {
        handler.removeCallbacks(checkSensor);
        if (sensors != null) sensors.unregisterListener(this);
        running = false;
        resetReadings();
    }

    private void resetReadings() {
        gravityAt = 0;
        magneticAt = 0;
        lastSample = 0;
        accuracy = SensorManager.SENSOR_STATUS_UNRELIABLE;
    }

    @Override protected void handleOnPause() {
        active = false;
        unregisterSensors();
    }

    @Override protected void handleOnResume() {
        active = true;
        if (requested && !running) registerSensors();
    }

    @Override protected void handleOnDestroy() {
        requested = false;
        unregisterSensors();
    }

    @Override
    @SuppressWarnings("deprecation") // getDefaultDisplay also supports API 24–29.
    public void onSensorChanged(SensorEvent event) {
        if (!running) return;
        int type = event.sensor.getType();
        if (type == Sensor.TYPE_ACCELEROMETER || type == Sensor.TYPE_GRAVITY) {
            System.arraycopy(event.values, 0, gravity, 0, 3);
            gravityAt = event.timestamp;
        } else if (type == Sensor.TYPE_MAGNETIC_FIELD) {
            System.arraycopy(event.values, 0, magnetic, 0, 3);
            magneticAt = event.timestamp;
        }
        if (event.timestamp - lastSample < 28_000_000L) return;

        boolean fused = type == Sensor.TYPE_ROTATION_VECTOR || type == Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR;
        if (type == Sensor.TYPE_MAGNETIC_FIELD || fused) accuracy = event.accuracy >= 0 ? event.accuracy : accuracy;
        boolean interference = false;
        if (fused) {
            SensorManager.getRotationMatrixFromVector(matrix, event.values);
        } else {
            if (gravityAt == 0 || magneticAt == 0 || Math.abs(gravityAt - magneticAt) > 200_000_000L
                || !SensorManager.getRotationMatrix(matrix, null, gravity, magnetic)) return;
            double measuredField = Math.sqrt(magnetic[0] * magnetic[0] + magnetic[1] * magnetic[1] + magnetic[2] * magnetic[2]);
            interference = measuredField < expectedFieldStrength * 0.5 || measuredField > expectedFieldStrength * 1.5;
        }

        int rotation = getActivity().getWindowManager().getDefaultDisplay().getRotation();
        int x = SensorManager.AXIS_X;
        int y = SensorManager.AXIS_Y;
        switch (rotation) {
            case Surface.ROTATION_90: x = SensorManager.AXIS_Y; y = SensorManager.AXIS_MINUS_X; break;
            case Surface.ROTATION_180: x = SensorManager.AXIS_MINUS_X; y = SensorManager.AXIS_MINUS_Y; break;
            case Surface.ROTATION_270: x = SensorManager.AXIS_MINUS_Y; y = SensorManager.AXIS_X; break;
            default: break;
        }
        if (!SensorManager.remapCoordinateSystem(matrix, x, y, screenMatrix)) return;
        SensorManager.getOrientation(screenMatrix, orientation);
        double heading = (Math.toDegrees(orientation[0]) + declination + 360) % 360;
        if (!Double.isFinite(heading)) return;

        lastSample = event.timestamp;
        float headingAccuracy = fused && event.values.length >= 5 ? event.values[4] : -1;
        boolean calibrated = isCalibrated(interference, accuracy, headingAccuracy);
        if (calibrated || interference) lastReliableSampleAt = SystemClock.elapsedRealtime();
        JSObject sample = new JSObject();
        sample.put("heading", heading);
        sample.put("level", matrix[8] > 0.85f);
        sample.put("calibrated", calibrated);
        notifyListeners("heading", sample);
    }

    static boolean isCalibrated(boolean interference, int accuracy, float headingAccuracy) {
        if (interference) return false;
        // Some fused sensors only report quality through the angular estimate.
        if (Float.isFinite(headingAccuracy) && headingAccuracy >= 0) return headingAccuracy <= Math.toRadians(15);
        return accuracy > SensorManager.SENSOR_STATUS_ACCURACY_LOW;
    }

    @Override public void onAccuracyChanged(Sensor sensor, int value) {
        int type = sensor.getType();
        if (type != Sensor.TYPE_ACCELEROMETER && type != Sensor.TYPE_GRAVITY && value >= 0) accuracy = value;
    }
}
