"""Validated Zakat arithmetic. Monetary results use decimal half-up rounding."""
from datetime import datetime, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP

CALIBERS = {'24K': Decimal('1'), '22K': Decimal('0.916'), '18K': Decimal('0.75')}
GOLD_NISAB_GRAMS = Decimal('87.48')
ZAKAT_RATES = {'islamic': Decimal('0.025'), 'calendar': Decimal('0.02577')}
MAX_VALUE = Decimal('9999999999.99')


def amount(value, name, maximum=MAX_VALUE):
    if isinstance(value, bool) or isinstance(value, (dict, list)):
        raise ValueError(f'{name} must be a number.')
    try:
        number = Decimal(str(value if value not in ('', None) else 0))
    except (InvalidOperation, ValueError):
        raise ValueError(f'{name} must be a number.')
    if not number.is_finite() or number < 0 or number > maximum:
        raise ValueError(f'{name} must be between 0 and {maximum}.')
    if number.as_tuple().exponent < -6:
        raise ValueError(f'{name} supports up to six decimal places.')
    return number


def money(value):
    return value.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def validate_input(data):
    if not isinstance(data, dict):
        raise ValueError('A calculation must be a JSON object.')
    category, year = data.get('category'), data.get('yearType')
    if category not in ('gold', 'money', 'cattle', 'stocks'):
        raise ValueError('Choose a valid category.')
    if not isinstance(year, str) or year not in ZAKAT_RATES:
        raise ValueError('yearType must be "islamic" or "calendar".')
    if category in ('cattle', 'stocks') and year != 'islamic':
        raise ValueError('Cattle and stocks use the Islamic year in this calculator.')
    hawl = data.get('hasHawl', True)
    if not isinstance(hawl, bool):
        raise ValueError('hasHawl must be true or false.')
    clean = {'category': category, 'yearType': year, 'hasHawl': hawl, 'currency': 'INR'}
    if data.get('currency', 'INR') != 'INR':
        raise ValueError('This calculator currently supports INR only.')
    clean['stocksShareType'] = data.get('stocksShareType', '') if category == 'stocks' else ''
    if category == 'stocks' and clean['stocksShareType'] not in ('trading', 'investment', 'purification'):
        raise ValueError('Choose a valid stock calculation type.')
    fields = {'goldRate', 'cash', 'cattle', 'stocksNumShares', 'stocksMarketPrice', 'stocksDividend', 'stocksNonHalalPct'}
    for field in fields:
        clean[field] = str(amount(data.get(field, 0), field, Decimal('100') if field == 'stocksNonHalalPct' else MAX_VALUE))
    if Decimal(clean['cattle']) != Decimal(clean['cattle']).to_integral_value():
        raise ValueError('Cattle count must be a whole number.')
    clean['cattleType'] = data.get('cattleType', 'camels')
    if category == 'cattle' and clean['cattleType'] not in ('camels', 'cows', 'sheep', 'goats'):
        raise ValueError('Choose a valid cattle type.')
    if category == 'cattle' and ((clean['cattleType'] == 'camels' and Decimal(clean['cattle']) > 120) or (clean['cattleType'] == 'cows' and Decimal(clean['cattle']) > 99)):
        raise ValueError('This herd size exceeds the implemented livestock table. Obtain a qualified calculation for larger herds.')
    entries = data.get('goldEntries', [])
    if not isinstance(entries, list) or len(entries) > 100:
        raise ValueError('goldEntries must contain at most 100 entries.')
    clean['goldEntries'] = []
    for entry in entries:
        if not isinstance(entry, dict):
            raise ValueError('Each gold entry must be an object.')
        weight = amount(entry.get('weight', 0), 'Gold weight')
        if weight == 0:
            continue
        if not isinstance(entry.get('caliber'), str) or entry.get('caliber') not in CALIBERS:
            raise ValueError('Choose 24K, 22K or 18K for each gold entry.')
        clean['goldEntries'].append({'caliber': entry['caliber'], 'weight': str(weight)})
    price_needed = category in ('gold', 'money') or (category == 'stocks' and clean['stocksShareType'] != 'purification') or (category == 'cattle' and Decimal(clean['cash']) > 0)
    if price_needed:
        if not 0 < Decimal(clean['goldRate']) <= Decimal('99999999.99'):
            raise ValueError('A positive 24K gold price per gram is required.')
        if money(Decimal(clean['goldRate'])) != Decimal(clean['goldRate']):
            raise ValueError('Gold price supports at most two decimal places.')
        source = data.get('goldRateSource')
        if source not in ('market', 'manual'):
            raise ValueError('Confirm a market or manually checked gold price.')
        try:
            checked = datetime.fromisoformat(data.get('goldRateCheckedAt', '').replace('Z', '+00:00'))
            age = (datetime.now(timezone.utc) - checked).total_seconds()
        except (ValueError, TypeError, AttributeError):
            raise ValueError('The gold price needs a valid verification time.')
        if not 0 <= age <= 86400:
            raise ValueError('Gold price is stale. Refresh or confirm today\'s price.')
        clean.update(goldRateSource=source, goldRateCheckedAt=checked.isoformat())
    if category == 'gold' and not clean['goldEntries']:
        raise ValueError('Enter a positive gold weight.')
    if category == 'stocks':
        required = ('stocksDividend',) if clean['stocksShareType'] == 'purification' else ('stocksNumShares', 'stocksMarketPrice')
        if any(Decimal(clean[field]) <= 0 for field in required):
            raise ValueError('Enter positive stock values.')
    if category == 'cattle' and Decimal(clean['cattle']) == 0 and Decimal(clean['cash']) == 0:
        raise ValueError('Enter cattle or cattle profit.')
    return clean


def calculate(data, cattle_calculator):
    d = validate_input(data)
    category, share = d['category'], d['stocksShareType']
    rate = ZAKAT_RATES[d['yearType']]
    price, cash = Decimal(d['goldRate']), Decimal(d['cash'])
    weight = sum((Decimal(e['weight']) * CALIBERS[e['caliber']] for e in d['goldEntries']), Decimal(0))
    gold_value = weight * price
    nisab = price * GOLD_NISAB_GRAMS
    has_hawl = d['hasHawl']
    gold_due = money(gold_value * rate) if weight >= GOLD_NISAB_GRAMS and has_hawl else Decimal(0)
    cash_due = money(cash * rate) if cash >= nisab and has_hawl else Decimal(0)
    cattle_due = cattle_calculator(d['cattleType'], d['cattle']) if has_hawl else '0'
    stock_value = Decimal(d['stocksNumShares']) * Decimal(d['stocksMarketPrice'])
    base = stock_value * (Decimal('0.25') if share == 'investment' else 1)
    stock_due = money(base * rate) if stock_value >= nisab and has_hawl else Decimal(0)
    purification = money(Decimal(d['stocksDividend']) * Decimal(d['stocksNonHalalPct']) / 100)
    below = {'gold': weight < GOLD_NISAB_GRAMS, 'money': cash < nisab,
             'cattle': cattle_due == '0' and cash < nisab,
             'stocks': share != 'purification' and stock_value < nisab}[category]
    payable = {'gold': gold_due, 'money': cash_due, 'cattle': cash_due,
               'stocks': purification if share == 'purification' else stock_due}[category]
    if payable > MAX_VALUE or stock_value > MAX_VALUE or gold_value > MAX_VALUE:
        raise ValueError('Asset value exceeds the supported calculation limit.')
    result = {
        'calculationVersion': 2, 'goldValue': float(money(gold_value)), 'goldWeight': float(weight),
        'goldZakatAmount': float(gold_due), 'goldZakatWeight': float(weight * rate) if gold_due else 0,
        'cashValue': float(cash), 'cashZakatAmount': float(cash_due), 'cattleZakatDue': cattle_due,
        'stocksTotalValue': float(money(stock_value)), 'stocksZakatableBase': float(money(base)),
        'stocksZakatAmount': float(stock_due), 'stocksPurificationAmt': float(purification),
        'stocksPurificationAmount': float(purification), 'shareType': share,
        'totalZakatPayable': float(payable), 'isBelowNisab': below,
        'hasHawl': has_hawl, 'isEligible': (has_hawl and not below) or share == 'purification',
        'moneyNisabValue': float(money(nisab)), 'zakatRateDisplay': str(rate * 100).rstrip('0').rstrip('.'),
        'yearType': d['yearType'], 'category': category,
    }
    return result, d
