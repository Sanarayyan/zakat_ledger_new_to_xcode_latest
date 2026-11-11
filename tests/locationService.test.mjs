import assert from 'node:assert/strict';
import test from 'node:test';
import { getDevicePosition, getDeviceLocation, locationDisplayName, locationErrorMessage } from '../src/services/locationService.mjs';

const position = { coords: { latitude: 10, longitude: 76 } };

test('browser location asks through getCurrentPosition, without native permission calls', async () => {
    const geolocation = {
        checkPermissions: () => assert.fail('Native permission check called on web'),
        requestPermissions: () => assert.fail('Native permission request called on web'),
        getCurrentPosition: async () => position,
    };
    assert.equal(await getDevicePosition({ geolocation, native: false }), position);
});

test('Android approximate location works without precise location permission', async () => {
    const geolocation = {
        checkPermissions: async () => ({ location: 'denied', coarseLocation: 'granted' }),
        requestPermissions: () => assert.fail('Approximate permission is already granted'),
        getCurrentPosition: async options => {
            assert.equal(options.enableHighAccuracy, false);
            return position;
        },
    };
    assert.equal(await getDevicePosition({ geolocation, native: true }), position);
});

test('native request handles its own permission dialog without an early JS timeout', async () => {
    const geolocation = {
        checkPermissions: async () => ({ location: 'prompt' }),
        requestPermissions: () => assert.fail('Separate permission preflight is not needed'),
        getCurrentPosition: async options => {
            assert.equal(options.timeout, 30000);
            assert.equal(options.enableLocationFallback, true);
            return position;
        },
    };
    assert.equal(await getDevicePosition({ geolocation, native: true }), position);
});

test('setup tries an approximate fix with a short Android provider fallback', async () => {
    const geolocation = {
        checkPermissions: async () => ({ location: 'granted', coarseLocation: 'granted' }),
        getCurrentPosition: async options => {
            assert.deepEqual(options, {
                enableHighAccuracy: false, timeout: 8000, maximumAge: 300000, enableLocationFallback: false,
            });
            throw { code: 'OS-PLUG-GLOC-0010' };
        },
    };
    const deviceLocation = {
        getCurrentPosition: async options => {
            assert.deepEqual(options, { timeout: 4000 });
            return position;
        },
    };
    assert.equal(await getDevicePosition({ quick: true, native: true, android: true, geolocation, deviceLocation }), position);
    await assert.rejects(getDevicePosition({ quick: true, native: true, android: false, geolocation }),
        { code: 'OS-PLUG-GLOC-0010' });
});

test('disabled-service preflight does not block the native resolution request', async () => {
    const geolocation = {
        checkPermissions: async () => { throw { code: 'OS-PLUG-GLOC-0007' }; },
        getCurrentPosition: async () => position,
    };
    assert.equal(await getDevicePosition({ geolocation, native: true }), position);
});

test('Android provider fallback works when the primary location service fails', async () => {
    const geolocation = {
        checkPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: async () => { throw { code: 'OS-PLUG-GLOC-0015' }; },
    };
    assert.equal(await getDevicePosition({ geolocation, native: true, android: true,
        deviceLocation: { getCurrentPosition: async () => position } }), position);
});

test('failed Android providers keep diagnostic codes on the error and show useful user guidance', async () => {
    const geolocation = {
        checkPermissions: async () => ({ location: 'granted' }),
        getCurrentPosition: async () => { throw { code: 'OS-PLUG-GLOC-0010' }; },
    };
    await assert.rejects(getDevicePosition({ geolocation, native: true, android: true,
        deviceLocation: { getCurrentPosition: async () => { throw { code: 'DEVICE_LOCATION_TIMEOUT' }; } } }), error => {
        assert.equal(error.firstCode, 'OS-PLUG-GLOC-0010');
        assert.equal(error.code, 'DEVICE_LOCATION_TIMEOUT');
        assert.match(locationErrorMessage(error), /choose your city/);
        assert.doesNotMatch(locationErrorMessage(error), /OS-PLUG|DEVICE_LOCATION/);
        return true;
    });
});

test('failed GPS tries a bounded lower-accuracy position instead of a guessed city', async () => {
    const calls = [];
    const geolocation = {
        getCurrentPosition: async options => {
            calls.push(options);
            if (calls.length === 1) throw { code: 3 };
            return position;
        },
    };
    assert.equal(await getDevicePosition({ geolocation, native: false }), position);
    assert.equal(calls[1].enableHighAccuracy, false);
    assert.equal(calls[1].maximumAge, 60000);
});

test('denied permission stops and explains how to retry', async () => {
    let calls = 0;
    const geolocation = { getCurrentPosition: async () => { calls++; throw { code: 1 }; } };
    await assert.rejects(getDevicePosition({ geolocation, native: false }), error => error.code === 1);
    assert.equal(calls, 1);
    assert.match(locationErrorMessage({ code: 1 }), /settings/);
});

test('a failed city-name lookup retains the detected coordinates', async () => {
    const location = await getDeviceLocation({
        native: false,
        geolocation: { getCurrentPosition: async () => position },
        fetchImpl: async () => { throw new Error('City service offline'); },
    });
    assert.deepEqual(location, { lat: 10, lng: 76, city: 'Current location', source: 'device' });
});


test('precise permission requests high accuracy and uses the Android locality when available', async () => {
    const location = await getDeviceLocation({
        android: true, native: true,
        geolocation: {
            checkPermissions: async () => ({ location: 'granted', coarseLocation: 'granted' }),
            getCurrentPosition: async options => {
                assert.equal(options.enableHighAccuracy, true);
                return position;
            },
        },
        deviceLocation: { reverseGeocode: async ({ lat, lng }) => {
            assert.deepEqual({ lat, lng }, { lat: 10, lng: 76 });
            return { city: 'Kochi' };
        } },
        fetchImpl: () => assert.fail('The online lookup is unnecessary when Android has a city'),
    });
    assert.equal(location.city, 'Kochi');
});

test('legacy coordinates and provider codes are never rendered as a city', async () => {
    assert.equal(locationDisplayName({ city: '10.000, 76.000' }), 'Current location');
    assert.equal(locationDisplayName({ city: '7J2W+QM' }), 'Current location');
    const location = await getDeviceLocation({
        native: false,
        geolocation: { getCurrentPosition: async () => position },
        fetchImpl: async () => ({ ok: true, json: async () => ({ city: 'IN-KL', locality: 'Fort Kochi' }) }),
    });
    assert.equal(location.city, 'Fort Kochi');
});
