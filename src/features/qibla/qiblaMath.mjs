const LAT = 21.422487;
const LNG = 39.826206;
const radians = degrees => degrees * Math.PI / 180;
export const normalizeHeading = degrees => ((degrees % 360) + 360) % 360;
export const headingDifference = (target, heading) => ((target - heading + 540) % 360) - 180;

export function qiblaBearing(lat, lng) {
    const delta = radians(LNG - lng);
    return normalizeHeading(Math.atan2(Math.sin(delta), Math.cos(radians(lat)) * Math.tan(radians(LAT)) - Math.sin(radians(lat)) * Math.cos(delta)) * 180 / Math.PI);
}

export function distanceToMakkah(lat, lng) {
    const a = Math.sin(radians(LAT - lat) / 2) ** 2
        + Math.cos(radians(lat)) * Math.cos(radians(LAT)) * Math.sin(radians(LNG - lng) / 2) ** 2;
    return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a))));
}

export function browserCompassHeading(event, screenAngle = 0) {
    if (Number.isFinite(event.webkitCompassHeading) && event.webkitCompassHeading >= 0) {
        return normalizeHeading(event.webkitCompassHeading);
    }
    if ((event.absolute || event.type === 'deviceorientationabsolute') && Number.isFinite(event.alpha)) {
        return normalizeHeading(360 - event.alpha + screenAngle);
    }
    return null;
}


// Keep the CSS angle continuous across north, and filter the shortest angular arc.
export function smoothHeading(previous, heading, weight = 0.45) {
    return previous === null ? headingDifference(normalizeHeading(heading), 0)
        : previous + headingDifference(normalizeHeading(heading), normalizeHeading(previous)) * weight;
}
