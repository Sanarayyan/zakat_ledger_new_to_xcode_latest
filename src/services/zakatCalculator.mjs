import Decimal from 'decimal.js';
import { validateGoldPrice } from './goldPriceService.mjs';
Decimal.set({ precision: 34, rounding: Decimal.ROUND_HALF_UP });
const factors = { '24K': '1', '22K': '0.916', '18K': '0.75' };
const rateFor = year => year === 'islamic' ? '0.025' : year === 'calendar' ? '0.02577' : '0';
export const roundMoney = value => new Decimal(value).toDecimalPlaces(2).toNumber();

function number(value, label) {
    if (typeof value === 'boolean' || (value !== null && typeof value === 'object')) throw new Error(`${label} must be a number.`);
    let result;
    try { result = new Decimal(value === '' || value == null ? 0 : value); } catch { throw new Error(`${label} must be a number.`); }
    if (!result.isFinite() || result.isNegative() || result.gt('9999999999.99') || result.decimalPlaces() > 6) throw new Error(`${label} must be a valid non-negative number (up to six decimal places).`);
    return result;
}

export function calculationCash(data, category, moneyType = 'quick') {
    const sum = values => values.reduce((total, value) => total.plus(number(value, 'Amount')), new Decimal(0));
    if (category === 'money' && moneyType === 'detailed') {
        const detailed = data.detailedMoney;
        return Decimal.max(0, sum(Object.values(detailed.financial)).plus(sum(Object.values(detailed.creditor))).minus(sum(Object.values(detailed.debtor)))).toString();
    }
    if (category === 'cattle') return sum([data.cattleTradeProfit, data.cattleMilkProfit, data.cattleWorkerProfit]).toString();
    return number(data.cash, 'Cash').toString();
}

export function cattleZakat(type, raw) {
    const count = Number(raw);
    const rules = type === 'camels' ? [[4,'0'],[9,'1 Sheep'],[14,'2 Sheep'],[19,'3 Sheep'],[24,'4 Sheep'],[35,'1 Female Camel (1 year old)'],[45,'1 Female Camel (2 years old)'],[60,'1 Female Camel (3 years old)'],[75,'1 Female Camel (4 years old)'],[120,'2 Female Camels']]
        : type === 'cows' ? [[29,'0'],[39,'1 One-Year-Old Calf'],[59,'1 Two-Year-Old Cow'],[69,'2 One-Year Calves'],[79,'1 One-Year Calf + 1 Two-Year Cow'],[89,'2 Two-Year Cows'],[99,'3 One-Year Calves']]
        : [[39,'0'],[120, type === 'goats' ? '1 Goat' : '1 Sheep'],[200,type === 'goats' ? '2 Goats' : '2 Sheep'],[300,type === 'goats' ? '3 Goats' : '3 Sheep']];
    return rules.find(([max]) => count <= max)?.[1] ?? (['goats','sheep'].includes(type) ? `${Math.floor(count / 100)} ${type === 'goats' ? 'Goats' : 'Sheep'}` : 'Increase according to Islamic rules');
}

export function validateCalculation(data) {
    if (!['gold','money','cattle','stocks'].includes(data.category)) throw new Error('Choose a calculation category.');
    if (!['islamic','calendar'].includes(data.yearType)) throw new Error('Choose a calculation year.');
    if (['stocks','cattle'].includes(data.category) && data.yearType !== 'islamic') throw new Error('Cattle and stocks use the Islamic year.');
    if (typeof data.hasHawl !== 'boolean') throw new Error('Confirm whether the wealth has been held for a full year.');
    if (data.currency && data.currency !== 'INR') throw new Error('Only INR is supported.');
    for (const field of ['goldRate','cash','cattle','stocksNumShares','stocksMarketPrice','stocksDividend','stocksNonHalalPct']) number(data[field], field);
    if (!number(data.cattle, 'Cattle').isInteger()) throw new Error('Cattle count must be a whole number.');
    if (number(data.stocksNonHalalPct, 'Percentage').gt(100)) throw new Error('Purification percentage cannot exceed 100.');
    if (!Array.isArray(data.goldEntries) || data.goldEntries.length > 100) throw new Error('Enter at most 100 gold entries.');
    for (const entry of data.goldEntries) if (number(entry.weight, 'Gold weight').gt(0) && !factors[entry.caliber]) throw new Error('Select a purity for each gold entry.');
    const c = data.category, share = data.stocksShareType;
    if (c === 'cattle' && !['camels','cows','sheep','goats'].includes(data.cattleType)) throw new Error('Choose a cattle type.');
    if (c === 'cattle' && ((data.cattleType === 'camels' && Number(data.cattle) > 120) || (data.cattleType === 'cows' && Number(data.cattle) > 99))) throw new Error('This herd size exceeds the implemented livestock table. Obtain a qualified calculation for larger herds.');
    if (c === 'stocks' && !['trading','investment','purification'].includes(share)) throw new Error('Choose a stock calculation type.');
    if (c === 'gold' && !data.goldEntries.some(e => number(e.weight, 'Gold weight').gt(0))) throw new Error('Enter a positive gold weight.');
    if (c === 'stocks' && (share === 'purification' ? !number(data.stocksDividend, 'Dividend').gt(0) : !number(data.stocksNumShares, 'Shares').gt(0) || !number(data.stocksMarketPrice, 'Share price').gt(0))) throw new Error('Enter positive stock values.');
    if (c === 'cattle' && !number(data.cattle, 'Cattle').gt(0) && !number(data.cash, 'Cash').gt(0)) throw new Error('Enter cattle or cattle profit.');
    if (['gold','money'].includes(c) || (c === 'stocks' && share !== 'purification') || (c === 'cattle' && Number(data.cash) > 0)) validateGoldPrice(data);
    const result = calculateZakat(data);
    if (['totalZakatPayable', 'goldValue', 'stocksTotalValue'].some(key => result[key] > 9999999999.99)) throw new Error('Asset value exceeds the supported calculation limit.');
}

export function calculateZakat(data) {
    const rate = new Decimal(rateFor(data.yearType));
    const price = new Decimal(data.goldRate || 0), cash = new Decimal(data.cash || 0), nisab = price.times('87.48');
    const weight = (data.goldEntries || []).reduce((total, e) => total.plus(new Decimal(e.weight || 0).times(factors[e.caliber] || 1)), new Decimal(0));
    const goldValue = weight.times(price), hawl = data.hasHawl !== false;
    const goldDue = weight.gte('87.48') && hawl ? roundMoney(goldValue.times(rate)) : 0;
    const cashDue = cash.gte(nisab) && hawl ? roundMoney(cash.times(rate)) : 0;
    const cattleDue = hawl ? cattleZakat(data.cattleType, data.cattle || 0) : '0';
    const stockValue = new Decimal(data.stocksNumShares || 0).times(data.stocksMarketPrice || 0);
    const base = stockValue.times(data.stocksShareType === 'investment' ? '0.25' : 1);
    const stockDue = stockValue.gte(nisab) && hawl ? roundMoney(base.times(rate)) : 0;
    const purification = roundMoney(new Decimal(data.stocksDividend || 0).times(data.stocksNonHalalPct || 0).div(100));
    const below = data.category === 'gold' ? weight.lt('87.48') : data.category === 'cattle' ? cattleDue === '0' && cash.lt(nisab) : data.category === 'stocks' ? data.stocksShareType !== 'purification' && stockValue.lt(nisab) : cash.lt(nisab);
    const payable = data.category === 'gold' ? goldDue : data.category === 'stocks' ? data.stocksShareType === 'purification' ? purification : stockDue : cashDue;
    return { goldValue: roundMoney(goldValue), goldWeight: weight.toNumber(), goldZakatAmount: goldDue, goldZakatWeight: goldDue ? weight.times(rate).toNumber() : 0,
        cashValue: cash.toNumber(), cashZakatAmount: cashDue, cattleZakatDue: cattleDue, stocksTotalValue: roundMoney(stockValue), stocksZakatableBase: roundMoney(base),
        stocksZakatAmount: stockDue, stocksPurificationAmount: purification, stocksPurificationAmt: purification, shareType: data.stocksShareType,
        totalZakatPayable: payable, isBelowNisab: below, hasHawl: hawl, moneyNisabValue: roundMoney(nisab), zakatRateDisplay: rate.times(100).toString(), category: data.category, yearType: data.yearType };
}
