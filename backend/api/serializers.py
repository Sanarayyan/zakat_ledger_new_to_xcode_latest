"""
ZakatLedger Serializers

A serializer does TWO things:
  1. Model → JSON  (when React asks for history, Django converts DB rows to JSON)
  2. JSON → Model  (when React sends data, Django converts JSON to a DB-saveable object)

Think of it as a TRANSLATOR between Python objects and JSON text.
"""

from rest_framework import serializers
from .models import ZakatCalculation
import json


class ZakatCalculationSerializer(serializers.ModelSerializer):
    """
    Handles converting ZakatCalculation model ↔ JSON.

    Used by:
      - GET  /api/calculations/  → Django reads DB rows, serializer converts to JSON list
      - POST /api/calculations/  → Django receives JSON, serializer saves to DB
    """

    # These are read-only computed fields added to the JSON output
    # 'source' tells DRF to call the model method to get the value
    input  = serializers.SerializerMethodField()
    result = serializers.SerializerMethodField()

    class Meta:
        model  = ZakatCalculation
        fields = [
            'id',               # Unique ID of this calculation
            'user_email',       # Who calculated
            'category',         # gold / money / cattle / stocks
            'year_type',        # islamic / calendar
            'gold_rate',        # Gold price at time of calculation
            'total_zakat',      # Final Zakat amount due
            'is_below_nisab',   # Was Zakat even mandatory?
            'zakat_rate_display', # "2.5" or "2.577"
            'input',            # Full form data (from get_input())
            'result',           # Full results (from get_result())
            'created_at',       # When was it calculated
        ]
        # These fields are set by Django automatically — React cannot override them
        read_only_fields = ['id', 'created_at', 'input', 'result']

    def get_input(self, obj):
        """Convert input_snapshot JSON string → Python dict for the response"""
        return obj.get_input()

    def get_result(self, obj):
        """Convert result_snapshot JSON string → Python dict for the response"""
        return obj.get_result()


class ZakatCalculationListSerializer(serializers.ModelSerializer):
    """
    Lightweight version for listing history — only the fields needed for the history table.
    Using a smaller serializer here means faster response and less data transferred.
    """
    class Meta:
        model  = ZakatCalculation
        fields = [
            'id',
            'user_email',
            'category',
            'year_type',
            'total_zakat',
            'is_below_nisab',
            'zakat_rate_display',
            'created_at',
        ]
