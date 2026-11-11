package com.muslimplus.app;

import android.hardware.SensorManager;
import org.junit.Test;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

public class QiblaCompassPluginTest {
    @Test
    public void fusedEstimateCanConfirmHeadingWhenGenericAccuracyIsUnavailable() {
        assertTrue(QiblaCompassPlugin.isCalibrated(false, SensorManager.SENSOR_STATUS_UNRELIABLE, 0.1f));
        assertFalse(QiblaCompassPlugin.isCalibrated(false, SensorManager.SENSOR_STATUS_ACCURACY_HIGH, 0.5f));
        assertFalse(QiblaCompassPlugin.isCalibrated(true, SensorManager.SENSOR_STATUS_ACCURACY_HIGH, 0.1f));
        assertFalse(QiblaCompassPlugin.isCalibrated(false, SensorManager.SENSOR_STATUS_UNRELIABLE, -1));
    }
}
