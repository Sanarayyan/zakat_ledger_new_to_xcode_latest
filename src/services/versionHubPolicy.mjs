export function selectVersionHubAction(data) {
    if (data?.action === 'mandatory' || data?.canContinue === false) {
        return 'mandatory';
    }

    if (data?.updateAvailable && data?.action === 'optional') {
        return 'optional';
    }

    return 'no_action';
}
