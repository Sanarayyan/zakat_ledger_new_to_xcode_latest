import Decimal from 'decimal.js';
export const GOLD_PRICE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function validateGoldPrice(data, now = Date.now()) {
    const price = Number(data.goldRate);
    const checked = Date.parse(data.goldRateCheckedAt);
    if (!Number.isFinite(price) || price <= 0 || price > 99999999.99) throw new Error('Enter a valid positive 24K gold price per gram in INR.');
    if (!['manual', 'market'].includes(data.goldRateSource) || !Number.isFinite(checked) || checked > now || now - checked > GOLD_PRICE_MAX_AGE_MS) {
        throw new Error('Gold price is missing or older than 24 hours. Refresh it or confirm today’s price.');
    }
}

async function readJson(url, signal) {
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`Price service unavailable (${response.status}).`);
    return response.json();
}

export function marketPrice(gold, exchange, now = Date.now()) {
    const price = Number(gold.price), rate = Number(exchange.rates?.INR);
    const goldTime = Date.parse(gold.updatedAt);
    const exchangeTime = exchange.time_last_updated ? Number(exchange.time_last_updated) * 1000 : Date.parse(exchange.date);
    if (![price, rate].every(value => Number.isFinite(value) && value > 0)
        || !Number.isFinite(goldTime) || goldTime > now || now - goldTime > GOLD_PRICE_MAX_AGE_MS
        || !Number.isFinite(exchangeTime) || exchangeTime > now || now - exchangeTime > 48 * 60 * 60 * 1000) {
        throw new Error('The price provider returned invalid or stale data. Confirm a current price manually.');
    }
    return { goldRate: new Decimal(gold.price).div('31.1034768').times(exchange.rates.INR).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(), goldRateSource: 'market',
        goldRateCheckedAt: new Date(Math.min(goldTime, exchangeTime)).toISOString() };
}

export async function fetchGoldPrice() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const [gold, exchange] = await Promise.all([
            readJson('https://api.gold-api.com/price/XAU', controller.signal),
            readJson('https://api.exchangerate-api.com/v4/latest/USD', controller.signal),
        ]);
        const result = marketPrice(gold, exchange);
        validateGoldPrice(result);
        return result;
    } finally { clearTimeout(timer); }
}
