import assert from 'node:assert/strict';
import test from 'node:test';
import { qiblaBearing, distanceToMakkah, headingDifference, smoothHeading, browserCompassHeading } from '../src/features/qibla/qiblaMath.mjs';

test('Qibla points north from south of Makkah and south from north of it', () => {
    assert.equal(qiblaBearing(10, 39.826206), 0);
    assert.equal(qiblaBearing(30, 39.826206), 180);
    assert.equal(distanceToMakkah(21.422487, 39.826206), 0);
    assert.ok(Math.abs(qiblaBearing(51.5074, -0.1278) - 119) < 1);
});

test('compass smoothing follows the short path across north', () => {
    assert.equal(headingDifference(1, 359), 2);
    assert.equal(headingDifference(359, 1), -2);
});

test('a single compass update reaches its exact bearing on either side of north', () => {
    assert.equal(smoothHeading(350, 10, 1), 370);
    assert.equal(smoothHeading(10, 350, 1), -10);
});

test('browser compass rejects relative or missing sensor values', () => {
    assert.equal(browserCompassHeading({ alpha: 0, absolute: false }), null);
    assert.equal(browserCompassHeading({ alpha: null, absolute: true }), null);
    assert.equal(browserCompassHeading({ alpha: 90, absolute: true }), 270);
    assert.equal(browserCompassHeading({ webkitCompassHeading: 15 }), 15);
});
