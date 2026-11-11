package com.muslimplus.app;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Address;
import android.location.Geocoder;
import android.location.Location;
import android.os.Build;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/** Device-provider fallback when the Google location service cannot return a fix. */
@CapacitorPlugin(name = "DeviceLocation")
public class DeviceLocationPlugin extends Plugin {
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Set<Request> requests = new HashSet<>();

    @PluginMethod
    public void getCurrentPosition(PluginCall call) {
        handler.post(() -> new Request(call).start());
    }

    @PluginMethod
    @SuppressWarnings("deprecation") // Android 12 and earlier provide a synchronous lookup.
    public void reverseGeocode(PluginCall call) {
        Double lat = call.getDouble("lat");
        Double lng = call.getDouble("lng");
        if (lat == null || lng == null || !Double.isFinite(lat) || !Double.isFinite(lng)
            || Math.abs(lat) > 90 || Math.abs(lng) > 180 || !Geocoder.isPresent()) {
            call.reject("Place lookup unavailable");
            return;
        }
        Geocoder geocoder = new Geocoder(getContext());
        if (Build.VERSION.SDK_INT >= 33) {
            geocoder.getFromLocation(lat, lng, 1, new Geocoder.GeocodeListener() {
                @Override public void onGeocode(List<Address> addresses) { resolvePlace(call, addresses); }
                @Override public void onError(String error) { call.reject("Place lookup unavailable"); }
            });
        } else {
            new Thread(() -> {
                try {
                    resolvePlace(call, geocoder.getFromLocation(lat, lng, 1));
                } catch (IOException | IllegalArgumentException e) {
                    call.reject("Place lookup unavailable");
                }
            }, "DevicePlaceLookup").start();
        }
    }

    private void resolvePlace(PluginCall call, List<Address> addresses) {
        JSObject result = new JSObject();
        if (addresses != null && !addresses.isEmpty()) {
            Address address = addresses.get(0);
            String city = address.getLocality();
            if (city == null || city.isEmpty()) city = address.getSubAdminArea();
            result.put("city", city);
        }
        call.resolve(result);
    }

    private class Request implements LocationListener, Runnable {
        private final PluginCall call;
        private final LocationManager manager = (LocationManager) getContext().getSystemService(Context.LOCATION_SERVICE);
        private boolean finished;

        Request(PluginCall call) { this.call = call; }

        @SuppressWarnings("MissingPermission")
        void start() {
            boolean fine = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            boolean coarse = ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
            if (!fine && !coarse) {
                call.reject("Location permission is blocked", "LOCATION_PERMISSION_DENIED");
                return;
            }
            requests.add(this);
            int providers = 0;
            Location recent = null;
            for (String provider : new String[] { LocationManager.NETWORK_PROVIDER, LocationManager.GPS_PROVIDER }) {
                if (!fine && provider.equals(LocationManager.GPS_PROVIDER)) continue;
                try {
                    if (!manager.isProviderEnabled(provider)) continue;
                    Location cached = manager.getLastKnownLocation(provider);
                    long age = cached == null ? Long.MAX_VALUE : android.os.SystemClock.elapsedRealtimeNanos() - cached.getElapsedRealtimeNanos();
                    if (cached != null && age >= 0 && age < 300_000_000_000L
                        && (recent == null || cached.getTime() > recent.getTime())) recent = cached;
                    manager.requestLocationUpdates(provider, 1000, 0, this, Looper.getMainLooper());
                    providers++;
                } catch (SecurityException | IllegalArgumentException ignored) { }
            }
            if (recent != null) onLocationChanged(recent);
            else if (providers == 0) fail("No enabled location provider is available", "DEVICE_LOCATION_DISABLED");
            else handler.postDelayed(this, Math.max(1000, Math.min(call.getInt("timeout", 30000), 30000)));
        }

        @Override
        public void onLocationChanged(Location location) {
            if (finished) return;
            finish();
            JSObject coords = new JSObject();
            coords.put("latitude", location.getLatitude());
            coords.put("longitude", location.getLongitude());
            coords.put("accuracy", location.getAccuracy());
            JSObject result = new JSObject();
            result.put("coords", coords);
            result.put("timestamp", location.getTime());
            call.resolve(result);
        }

        @Override public void run() { fail("Device GPS and network providers did not return a position", "DEVICE_LOCATION_TIMEOUT"); }
        @Override public void onStatusChanged(String provider, int status, Bundle extras) { }
        @Override public void onProviderEnabled(String provider) { }
        @Override public void onProviderDisabled(String provider) { }

        void fail(String message, String code) {
            if (finished) return;
            finish();
            call.reject(message, code);
        }

        void finish() {
            finished = true;
            handler.removeCallbacks(this);
            manager.removeUpdates(this);
            requests.remove(this);
        }
    }

    @Override
    protected void handleOnDestroy() {
        handler.post(() -> {
            for (Request request : new HashSet<>(requests)) request.fail("Location request stopped", "DEVICE_LOCATION_CANCELLED");
        });
    }
}
