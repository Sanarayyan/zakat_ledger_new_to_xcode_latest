import assert from 'node:assert/strict';
import test from 'node:test';

import {
    InAppReviewService,
    ReviewRequestResult,
} from '../src/services/inAppReviewService.mjs';

test('waits 500 ms and requests a review when available', async () => {
    let waited;
    let requests = 0;
    const service = new InAppReviewService({
        gateway: {
            isAvailable: async () => true,
            requestReview: async () => { requests += 1; },
        },
        wait: async (duration) => { waited = duration; },
    });

    assert.equal(await service.requestAfterSuccessfulAction(), ReviewRequestResult.REQUESTED);
    assert.equal(waited, 500);
    assert.equal(requests, 1);
});

test('does not request when native review is unavailable', async () => {
    let requests = 0;
    const service = new InAppReviewService({
        gateway: {
            isAvailable: async () => false,
            requestReview: async () => { requests += 1; },
        },
        wait: async () => {},
    });

    assert.equal(await service.requestAfterSuccessfulAction(), ReviewRequestResult.UNAVAILABLE);
    assert.equal(requests, 0);
});

test('ignores a second request while one is pending', async () => {
    let releaseWait;
    const service = new InAppReviewService({
        gateway: {
            isAvailable: async () => true,
            requestReview: async () => {},
        },
        wait: () => new Promise((resolve) => { releaseWait = resolve; }),
    });

    const first = service.requestAfterSuccessfulAction();
    assert.equal(
        await service.requestAfterSuccessfulAction(),
        ReviewRequestResult.ALREADY_IN_PROGRESS,
    );
    releaseWait();
    assert.equal(await first, ReviewRequestResult.REQUESTED);
});

test('reports native failures without throwing', async () => {
    const failure = new Error('native failure');
    let reported;
    const service = new InAppReviewService({
        gateway: {
            isAvailable: async () => { throw failure; },
            requestReview: async () => {},
        },
        wait: async () => {},
        onError: (error) => { reported = error; },
    });

    assert.equal(await service.requestAfterSuccessfulAction(), ReviewRequestResult.FAILED);
    assert.equal(reported, failure);
});
