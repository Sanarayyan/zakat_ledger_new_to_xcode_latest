"""Serializes saved Zakat calculations for the history list."""

from rest_framework import serializers
from .models import ZakatCalculation
from decimal import Decimal, ROUND_HALF_UP


def history_result(obj):
    """Present legacy snapshots consistently without overwriting historical inputs."""
    result = obj.get_result()
    if result.get('calculationVersion') == 2:
        return result
    result = dict(result)
    below = obj.is_below_nisab
    if obj.category == 'cattle':
        cash = Decimal(str(result.get('cashValue', 0)))
        cash_below = cash < obj.gold_rate * Decimal('87.48')
        payable = 0 if cash_below else result.get('cashZakatAmount', obj.total_zakat)
        below = result.get('cattleZakatDue', '0') == '0' and cash_below
    elif below:
        payable = 0
    elif obj.category == 'gold':
        payable = result.get('goldZakatAmount', obj.total_zakat)
    elif obj.category == 'stocks':
        payable = result.get('stocksPurificationAmt', 0) if result.get('shareType') == 'purification' else result.get('stocksZakatAmount', obj.total_zakat)
    else:
        payable = result.get('cashZakatAmount', obj.total_zakat)
    result['isBelowNisab'] = below
    result['totalZakatPayable'] = float(Decimal(str(payable)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))
    result['legacySnapshot'] = True
    return result


class ZakatCalculationListSerializer(serializers.ModelSerializer):
    """History row. Legacy snapshots are corrected once per row, never rewritten in the DB."""

    class Meta:
        model  = ZakatCalculation
        fields = ['id', 'user_email', 'category', 'year_type', 'zakat_rate_display', 'created_at']

    def to_representation(self, obj):
        data = super().to_representation(obj)
        result = history_result(obj)
        data['total_zakat'] = f"{result['totalZakatPayable']:.2f}"
        data['is_below_nisab'] = result.get('isBelowNisab', obj.is_below_nisab)
        data['result'] = result
        return data
