export const UPDATE_TEST_KEY = 'versionhub_test_action';

export function updateTestResponse(action, currentVersion, latestVersion = '1.0.2') {
    if (!['optional', 'mandatory'].includes(action) || currentVersion === latestVersion) return null;
    return {
        updateAvailable: true, action, canContinue: action !== 'mandatory', latestVersion,
        title: 'Test: new app version available',
        description: 'The new version adds a Stop Adhan button to the Android prayer notification. This is a simulated update message.',
        testOnly: true,
    };
}
