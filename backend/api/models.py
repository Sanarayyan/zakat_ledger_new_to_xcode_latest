"""
ZakatLedger Database Models

A model = a database table.
Each class below = one table in db.sqlite3.

Django creates the actual table using:
  python manage.py makemigrations
  python manage.py migrate

After that you can open db.sqlite3 and literally SEE your data.
"""

from django.db import models
import json
import uuid


class AccountDeletionReceipt(models.Model):
    id = models.UUIDField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)


class LoginChallenge(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nonce_hash = models.CharField(max_length=64)
    expires_at = models.DateTimeField(db_index=True)


class GoogleIdentity(models.Model):
    google_subject = models.CharField(max_length=255, unique=True)
    user_email = models.EmailField(unique=True)


class AccessSession(models.Model):
    token_hash = models.CharField(max_length=64, unique=True)
    user_email = models.EmailField(db_index=True)
    google_subject = models.CharField(max_length=255)
    expires_at = models.DateTimeField(db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)


class ZakatCalculation(models.Model):
    """
    Saves every calculation result permanently.

    TABLE NAME: api_zakatcalculation (Django auto-names it)

    COLUMNS:
      id          → auto-generated unique number (1, 2, 3...)
      user_email  → who did the calculation (e.g. "ahmad@gmail.com")
      category    → what they calculated (gold / money / cattle / stocks)
      year_type   → islamic or calendar
      gold_rate   → live gold price used at that moment
      total_zakat → final amount due (e.g. 37147.50)
      is_below_nisab → True if no Zakat was due
      zakat_rate  → "2.5" or "2.577"
      input_data  → the full form data (saved as JSON text)
      result_data → the full result (saved as JSON text)
      created_at  → exact timestamp of calculation
    """

    # Who did the calculation — we use email (from Google login) as identifier
    # No foreign key needed yet — we'll add proper auth in Phase 3
    user_email = models.EmailField(
        max_length=255,
        db_index=True,  # Index = faster when filtering by email
        default='anonymous@zakatledger.app'
    )

    # What type of asset was calculated
    CATEGORY_CHOICES = [
        ('gold',    'Gold'),
        ('money',   'Money & Cash'),
        ('cattle',  'Cattle'),
        ('stocks',  'Stocks'),
    ]
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='gold'
    )

    # Islamic or Solar year
    YEAR_TYPE_CHOICES = [
        ('islamic',  'Islamic Lunar Year (2.5%)'),
        ('calendar', 'Solar Calendar Year (2.577%)'),
    ]
    year_type = models.CharField(
        max_length=20,
        choices=YEAR_TYPE_CHOICES,
        default='islamic'
    )

    # The live gold price in rupees used during THIS calculation
    # Important: gold price changes daily — we store what it was at calculation time
    gold_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )

    # ── RESULTS ──────────────────────────────────────────────────────────────

    # The main result — how much Zakat is due
    total_zakat = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )

    # Whether the user was below Nisab threshold
    is_below_nisab = models.BooleanField(default=False)

    # The rate used: "2.5" or "2.577"
    zakat_rate_display = models.CharField(max_length=10, default='2.5')

    # ── RAW DATA (full snapshot) ───────────────────────────────────────────
    # Store the complete input and output as JSON text.
    # This way we can show full history without losing any detail.
    # TextField has no size limit — perfect for JSON.
    input_snapshot  = models.TextField(default='{}')  # What the user entered
    result_snapshot = models.TextField(default='{}')  # What Django returned

    # When was this calculated?
    # auto_now_add=True means Django sets this automatically on creation
    created_at = models.DateTimeField(auto_now_add=True)
    request_id = models.UUIDField(null=True, blank=True)

    class Meta:
        db_table = 'zakat_calculations'  # Exact table name in SQLite
        ordering = ['-created_at']       # Newest first when listing
        constraints = [models.UniqueConstraint(fields=['user_email', 'request_id'], name='unique_user_calculation_request')]

    def __str__(self):
        # What shows in Django Admin panel
        return f"{self.user_email} | ₹{self.total_zakat} | {self.category} | {self.created_at.strftime('%Y-%m-%d %H:%M')}"

    def get_input(self):
        """Return input_snapshot as a Python dict (not raw JSON string)"""
        return json.loads(self.input_snapshot)

    def get_result(self):
        """Return result_snapshot as a Python dict (not raw JSON string)"""
        return json.loads(self.result_snapshot)
