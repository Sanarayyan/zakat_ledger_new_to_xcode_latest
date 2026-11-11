import assert from 'node:assert/strict';
import test from 'node:test';

import { selectVersionHubAction, validatedStoreUrl, versionHubPresentation } from '../src/services/versionHubPolicy.mjs';

test('selects no_action without showing an update', () => {
    assert.equal(selectVersionHubAction({
        action: 'no_action',
        updateAvailable: false,
        canContinue: true,
    }), 'no_action');
});

test('selects an optional dismissible update', () => {
    assert.equal(selectVersionHubAction({
        action: 'optional',
        updateAvailable: true,
        canContinue: true,
    }), 'optional');
});

test('selects a mandatory update', () => {
    assert.equal(selectVersionHubAction({
        action: 'mandatory',
        updateAvailable: true,
        canContinue: false,
    }), 'mandatory');
});

test('canContinue false always forces the update', () => {
    assert.equal(selectVersionHubAction({
        action: 'optional',
        updateAvailable: true,
        canContinue: false,
    }), 'mandatory');
});

test('mandatory flags work without separate update-available flags', () => {
    for (const payload of [{ canContinue: false }, { update_required: true }, { update_type: 'mandatory' }]) {
        assert.equal(selectVersionHubAction(payload), 'mandatory');
    }
    assert.equal(selectVersionHubAction({ update_available: true }), 'optional');
    for (const invalid of [null, [], 'mandatory', { update_required: 'true' }]) assert.equal(selectVersionHubAction(invalid), 'no_action');
});
test('only valid HTTPS platform store destinations are accepted', () => {
    const android = 'https://play.google.com/store/apps/details?id=com.muslimplus.app';
    const ios = 'https://apps.apple.com/in/app/example/id123456789';
    assert.equal(validatedStoreUrl(android, 'android'), android);
    assert.equal(validatedStoreUrl(ios, 'ios'), ios);
    for (const value of ['', 'javascript:alert(1)', 'https://evil.example/app',
        'https://play.google.com.evil.example/store/apps/details?id=com.muslimplus.app',
        'https://play.google.com/store/apps/details?id=another.app', 'http://play.google.com/store/apps/details?id=com.muslimplus.app',
        'https://user:password@play.google.com/store/apps/details?id=com.muslimplus.app', ios]) {
        assert.equal(validatedStoreUrl(value, 'android'), null, value);
    }
});
test('missing store destination permits recovery; real valid mandatory updates remain blocking', () => {
    const invalid = versionHubPresentation({ canContinue: false }, 'android');
    assert.equal(invalid.action, 'mandatory'); assert.equal(invalid.unavailable, true); assert.equal(invalid.mandatory, false);
    const valid = versionHubPresentation({ update_required: true, store_url: 'https://play.google.com/store/apps/details?id=com.muslimplus.app' }, 'android');
    assert.equal(valid.unavailable, false); assert.equal(valid.mandatory, true);
    assert.equal(versionHubPresentation({ action: 'mandatory', testOnly: true }, 'android').unavailable, true);
    assert.equal(versionHubPresentation({ action: 'mandatory', testOnly: true }, 'android', true).mandatory, true);
});
