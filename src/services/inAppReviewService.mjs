export const ReviewRequestResult = Object.freeze({
    REQUESTED: 'requested',
    UNAVAILABLE: 'unavailable',
    ALREADY_IN_PROGRESS: 'alreadyInProgress',
    FAILED: 'failed',
});

const waitFor = (durationMs) => new Promise((resolve) => setTimeout(resolve, durationMs));

export class InAppReviewService {
    constructor({
        gateway,
        delayMs = 500,
        wait = waitFor,
        onError,
    }) {
        this.gateway = gateway;
        this.delayMs = delayMs;
        this.wait = wait;
        this.onError = onError;
        this.requestInProgress = false;
    }

    async requestAfterSuccessfulAction() {
        if (this.requestInProgress) {
            return ReviewRequestResult.ALREADY_IN_PROGRESS;
        }

        this.requestInProgress = true;
        try {
            await this.wait(this.delayMs);
            if (!await this.gateway.isAvailable()) {
                return ReviewRequestResult.UNAVAILABLE;
            }

            await this.gateway.requestReview();
            return ReviewRequestResult.REQUESTED;
        } catch (error) {
            this.onError?.(error);
            return ReviewRequestResult.FAILED;
        } finally {
            this.requestInProgress = false;
        }
    }
}
