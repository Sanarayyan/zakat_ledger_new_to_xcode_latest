import { Capacitor, registerPlugin } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
const DeviceLocation = registerPlugin('DeviceLocation');

function withTimeout(promise, ms) {
    let timer;
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            timer = setTimeout(() => reject(Object.assign(new Error('Location timed out'), { code: 3 })), ms);
        }),
    ]).finally(() => clearTimeout(timer));
}

export function isPermissionDenied(error) {
    return error?.code === 1 || ['LOCATION_PERMISSION_DENIED', 'OS-PLUG-GLOC-0003'].includes(error?.code);
}

export async function getDevicePosition({
    geolocation = Geolocation,
    native = Capacitor.isNativePlatform(),
    android = Capacitor.getPlatform() === 'android',
    deviceLocation = DeviceLocation,
    quick = false,
} = {}) {
    let highAccuracy = !quick;
    if (native) {
        // Android's checkPermissions also checks whether Location is switched on.
        // Let getCurrentPosition show the OS resolution dialog instead of exiting
        // before the native request gets a chance to resolve the settings.
        try {
            const permission = await geolocation.checkPermissions();
            if (permission.coarseLocation === 'granted' && permission.location !== 'granted') highAccuracy = false;
        } catch (error) {
            if (error.code !== 'OS-PLUG-GLOC-0007') throw error;
        }
    }
    try {
        const timeout = quick ? 8000 : native ? 30000 : 12000;
        const options = {
            enableHighAccuracy: highAccuracy, timeout, maximumAge: quick ? 300000 : 60000,
            enableLocationFallback: !quick,
        };
        // Let native requests handle permission and settings prompts before starting their timeout.
        return native ? await geolocation.getCurrentPosition(options)
            : await withTimeout(geolocation.getCurrentPosition(options), timeout + 1000);
    } catch (error) {
        if (isPermissionDenied(error)) throw error;
        if (quick && !(native && android)) throw error;
        try {
            if (native && android) return await deviceLocation.getCurrentPosition(quick ? { timeout: 4000 } : undefined);
            return await withTimeout(geolocation.getCurrentPosition({
                enableHighAccuracy: false, timeout: 15000, maximumAge: 60000,
            }), 16000);
        } catch (fallbackError) {
            fallbackError.firstCode = error.code;
            throw fallbackError;
        }
    }
}

export async function getDeviceLocation(options) {
    const { coords } = await getDevicePosition(options);
    const { latitude: lat, longitude: lng } = coords;
    let city;
    if (options?.android ?? Capacitor.getPlatform() === 'android') {
        try {
            const address = await withTimeout((options?.deviceLocation || DeviceLocation).reverseGeocode({ lat, lng }), options?.quick ? 800 : 2000);
            city = readablePlace(address?.city);
        } catch { /* The platform geocoder is optional. */ }
    }
    if (city) return { lat, lng, city, source: 'device' };
    const controller = new AbortController();
    const lookupTimeout = options?.quick ? 1500 : 4000;
    const timer = setTimeout(() => controller.abort(), lookupTimeout);
    try {
        const fetchImpl = options?.fetchImpl || globalThis.fetch;
        const data = await withTimeout((async () => {
            const response = await fetchImpl(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, { signal: controller.signal });
            return response.ok ? response.json() : null;
        })(), lookupTimeout + 500);
        city = [data?.city, data?.locality, data?.principalSubdivision].map(readablePlace).find(Boolean);
    } catch { /* Coordinates remain usable without a city-name service. */ }
    finally { clearTimeout(timer); controller.abort(); }
    return { lat, lng, city: city || 'Current location', source: 'device' };
}

function readablePlace(name) {
    return typeof name === 'string' && /\p{L}/u.test(name) && !/^[A-Z]{2,3}(?:-[A-Z0-9]{1,4})?$/.test(name.trim())
        && !/^[A-Z0-9]{2,8}\+[A-Z0-9]{2,3}(?:\s|$)/i.test(name.trim()) ? name.trim() : '';
}

export function locationDisplayName(location, lang = 'en') {
    if (!location) return '';
    const city = readablePlace(location.city);
    if (city && city !== 'Current location') return city;
    return lang === 'ml' ? 'നിലവിലെ സ്ഥലം' : 'Current location';
}

export function locationErrorMessage(error, lang = 'en') {
    const code = error?.code;
    let message;
    if (isPermissionDenied(error)) {
        message = lang === 'ml'
            ? 'ലൊക്കേഷൻ അനുമതി നൽകുക. ഫോൺ അല്ലെങ്കിൽ ബ്രൗസർ സെറ്റിങ്സിൽ ഇത് മാറ്റാം.'
            : 'Location permission is blocked. Allow location in app settings, then retry.';
    } else if (['OS-PLUG-GLOC-0007', 'OS-PLUG-GLOC-0009', 'DEVICE_LOCATION_DISABLED'].includes(code)) {
        message = 'Phone Location services are off or unavailable. Turn on Location in phone settings, then retry.';
    } else if ([3, 'OS-PLUG-GLOC-0010', 'DEVICE_LOCATION_TIMEOUT'].includes(code)) {
        message = 'Your phone did not return a GPS position in time. Try near a window or choose your city below.';
    } else if (['OS-PLUG-GLOC-0014', 'OS-PLUG-GLOC-0015', 'OS-PLUG-GLOC-0016'].includes(code)) {
        message = 'The phone location service could not start. Check that Location is turned on, or choose your city below.';
    } else {
        message = lang === 'ml'
            ? 'ലൊക്കേഷൻ കണ്ടെത്താനായില്ല. വീണ്ടും ശ്രമിക്കുക, അല്ലെങ്കിൽ നഗരം തിരഞ്ഞെടുക്കുക.'
            : 'The device could not provide a location. Retry or choose your city below.';
    }
    return message;
}
