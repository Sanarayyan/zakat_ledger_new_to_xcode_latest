import test from 'node:test';
import assert from 'node:assert/strict';
import { authenticationConfiguration } from '../src/services/authService.js';
test('native sign-in fails closed when real OAuth configuration is absent', () => {
    assert.throws(() => authenticationConfiguration('android', '', ''));
    assert.throws(() => authenticationConfiguration('android', 'your-client.apps.googleusercontent.com', ''));
    assert.throws(() => authenticationConfiguration('ios', 'configured.apps.googleusercontent.com', ''));
});
test('native Google ID tokens use the explicit server audience', () => {
    const google = authenticationConfiguration('ios', 'configured.apps.googleusercontent.com', 'ios.apps.googleusercontent.com').google;
    assert.equal(google.webClientId, google.iOSServerClientId);
    assert.equal(google.mode, 'online');
});
