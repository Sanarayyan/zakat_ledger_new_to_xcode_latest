import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { createRequestScope } from '../src/services/requestScope.mjs';
import { calculateZakat } from '../src/services/zakatCalculator.mjs';
import { buildCalculationPayload, calculationYearType, createLedgerService } from '../src/services/ledgerService.mjs';
let backend, config;
before(async () => {
    if (!process.env.PHASE1_TEST_PYTHON) return;
    backend = spawn(process.env.PHASE1_TEST_PYTHON, ['-B', 'tests/backend_server.py'], { stdio: ['ignore','pipe','pipe'] });
    config = await new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Django integration server did not start')), 15000);
        let errors = '';
        backend.stderr.on('data', chunk => { errors += chunk; });
        backend.once('exit', code => { clearTimeout(timer); reject(new Error(`Django exited ${code}: ${errors}`)); });
        createInterface({ input: backend.stdout }).once('line', line => { clearTimeout(timer); resolve(JSON.parse(line)); });
    });
});
after(() => backend?.kill());
test('payload keeps only calculation inputs and effective category cash', () => {
    const data = buildCalculationPayload({ yearType: 'calendar', stocksMarketPrice: '1000', accessToken: 'private', recipient: 'private' }, 'stocks', '100.20');
    assert.equal(data.yearType, 'islamic');
    assert.equal(data.cash, '100.20');
    assert.equal(data.stocksMarketPrice, '1000');
    assert.equal('accessToken' in data, false);
    assert.equal('recipient' in data, false);
    assert.equal(calculationYearType({ yearType: 'calendar' }, 'money'), 'calendar');
});
test('real Django API saves, deduplicates, validates, lists and deletes through the JS service', { skip: !process.env.PHASE1_TEST_PYTHON && 'Set PHASE1_TEST_PYTHON to a Python with backend/requirements.txt installed.' }, async () => {
    const service = createLedgerService(config.url);
    const payload = { category: 'money', yearType: 'islamic', hasHawl: true, currency: 'INR', cash: '10000', goldRate: '100',
        goldRateSource: 'manual', goldRateCheckedAt: new Date().toISOString(), requestId: randomUUID() };
    const saved = await service.save(config.token, payload);
    assert.equal(saved.calculation.totalZakatPayable, 250);
    assert.equal((await service.save(config.token, payload)).id, saved.id);
    await assert.rejects(service.save(config.token, { ...payload, cash: '-1', requestId: randomUUID() }), error => error.status === 400);
    await assert.rejects(service.history('invalid-token'), error => error.status === 401);
    assert.equal((await service.history(config.token)).results[0].total_zakat, '250.00');
    await service.delete(config.token, saved.id);
    assert.equal((await service.history(config.token)).count, 0);
    await service.logout(config.token);
    await assert.rejects(service.history(config.token), error => error.status === 401);
    await assert.rejects(service.loginChallenge(), error => error.status === 503);
});

test('frontend and real backend agree on every shared result for all financial regressions', { skip: !process.env.PHASE1_TEST_PYTHON }, async () => {
    const service = createLedgerService(config.url);
    const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/zakat_cases.json', import.meta.url)));
    for (const entry of cases) {
        const payload = { yearType: 'islamic', hasHawl: true, currency: 'INR', cash: '0', goldEntries: [], cattleType: 'camels',
            goldRate: '100', goldRateSource: 'manual', goldRateCheckedAt: new Date().toISOString(), ...entry.input };
        const local = calculateZakat(payload), remote = (await service.save(config.parityToken, { ...payload, requestId: randomUUID() })).calculation;
        for (const key of Object.keys(local)) {
            if (local[key] !== undefined) assert.equal(local[key], remote[key], `${entry.name}: ${key}`);
        }
    }
});

test('late responses after account logout cannot populate another account’s screen', { skip: !process.env.PHASE1_TEST_PYTHON }, async () => {
    const scope = createRequestScope();
    const service = createLedgerService(config.url);
    const data = { category: 'money', yearType: 'islamic', hasHawl: true, currency: 'INR', cash: '10000', goldRate: '100',
        goldRateSource: 'manual', goldRateCheckedAt: new Date().toISOString() };
    const pending = scope.run(() => service.save(config.parityToken, { ...data, requestId: randomUUID() }));
    scope.invalidate();
    assert.equal(await pending, null);
    const failed = scope.run(() => service.history('invalid-token'));
    scope.invalidate();
    assert.equal(await failed, null);
});
