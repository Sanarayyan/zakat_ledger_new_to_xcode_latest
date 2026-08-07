import assert from 'node:assert/strict';
import test from 'node:test';

import { selectVersionHubAction } from '../src/services/versionHubPolicy.mjs';

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
