import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { calculateZakat, validateCalculation, calculationCash } from '../src/services/zakatCalculator.mjs';
import { marketPrice, validateGoldPrice } from '../src/services/goldPriceService.mjs';
const cases = JSON.parse(fs.readFileSync(new URL('./fixtures/zakat_cases.json', import.meta.url)));
const base = () => ({ category: 'money', yearType: 'islamic', hasHawl: true, currency: 'INR', goldEntries: [], cash: '0',
    goldRate: '100', goldRateSource: 'manual', goldRateCheckedAt: new Date().toISOString() });
for (const entry of cases) test(`financial regression: ${entry.name}`, () => {
    const data = { ...base(), ...entry.input };
    validateCalculation(data);
    const result = calculateZakat(data);
    for (const [key, expected] of Object.entries(entry.expected)) assert.equal(result[key], expected, key);
});
test('invalid financial values cannot be submitted', () => {
    for (const cash of [-1, 'NaN', 'Infinity', '12abc', {}, true]) assert.throws(() => validateCalculation({ ...base(), cash }));
    assert.throws(() => validateCalculation({ ...base(), category: 'gold', goldEntries: [{ weight: '100', caliber: '' }] }));
    assert.throws(() => validateCalculation({ ...base(), category: 'stocks', stocksShareType: 'purification', stocksDividend: 100, stocksNonHalalPct: 101 }));
});
test('detailed money and cattle profit preserve decimals and reject negative components', () => {
    assert.equal(calculationCash({ detailedMoney: { financial: { cash: '100.10', bank: '20.20' }, creditor: { loan: '0.30' }, debtor: { rent: '20.60' } } }, 'money', 'detailed'), '100');
    assert.throws(() => calculationCash({ detailedMoney: { financial: { cash: '-1' }, creditor: {}, debtor: {} } }, 'money', 'detailed'));
    assert.equal(calculationCash({ cattleTradeProfit: '0.10', cattleMilkProfit: '0.20' }, 'cattle'), '0.3');
});
test('gold quotes require positive finite current values and provenance', () => {
    const now = Date.now();
    for (const patch of [{ goldRate: 0 }, { goldRate: -1 }, { goldRate: NaN }, { goldRateSource: 'guess' }, { goldRateCheckedAt: new Date(now - 86400001).toISOString() }, { goldRateCheckedAt: new Date(now + 1).toISOString() }]) {
        assert.throws(() => validateGoldPrice({ ...base(), ...patch }, now));
    }
});
test('spot conversion has no undocumented retail premium and rejects bad provider data', () => {
    const now = Date.now();
    const gold = { price: 3110.34768, updatedAt: new Date(now).toISOString() };
    const exchange = { rates: { INR: 80 }, time_last_updated: Math.floor(now / 1000) };
    assert.equal(marketPrice(gold, exchange, now).goldRate, 8000);
    assert.throws(() => marketPrice({ ...gold, price: 'bad' }, exchange, now));
    assert.throws(() => marketPrice({ ...gold, updatedAt: 'bad' }, exchange, now));
    assert.throws(() => marketPrice(gold, { rates: { INR: -1 } }, now));
});
