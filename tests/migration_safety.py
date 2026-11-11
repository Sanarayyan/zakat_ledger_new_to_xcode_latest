"""Rehearse migrations on a temporary SQLite backup; never migrate the source database."""
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import sys
import tempfile

root = Path(__file__).resolve().parents[1]
original = root / 'backend/db.sqlite3'
before_hash = hashlib.sha256(original.read_bytes()).hexdigest()
sys.path.insert(0, str(root / 'backend'))
os.environ['DJANGO_DEBUG'] = 'true'
os.environ['DJANGO_SETTINGS_MODULE'] = 'zakatledger.settings'

with tempfile.TemporaryDirectory(prefix='muslimplus-migrations-') as directory:
    copy = Path(directory) / 'rehearsal.sqlite3'
    with sqlite3.connect(f'file:{original}?mode=ro', uri=True) as source, sqlite3.connect(copy) as target:
        source.backup(target)
        columns = [row[1] for row in target.execute('PRAGMA table_info(zakat_calculations)')]
        column_sql = ','.join(f'"{column}"' for column in columns)
        rows = target.execute(f'SELECT {column_sql} FROM zakat_calculations ORDER BY id').fetchall()
    import django
    from django.conf import settings
    settings.DATABASES['default']['NAME'] = str(copy)
    django.setup()
    from django.core.management import call_command
    from django.db import connection
    stages = []
    for target in ['0004', '0001', '0004']:
        call_command('migrate', 'api', target, verbosity=0)
        # Compare through the same raw SQLite adapter; Django converts dates/decimals on reads.
        with sqlite3.connect(copy) as verified:
            assert verified.execute(f'SELECT {column_sql} FROM zakat_calculations ORDER BY id').fetchall() == rows, f'Existing rows changed migrating to {target}'
        stages.append(target)
    connection.close()

assert hashlib.sha256(original.read_bytes()).hexdigest() == before_hash, 'Original database changed'
print(json.dumps({'stages': stages, 'existing_rows_preserved': len(rows), 'original_database_unchanged': True}))
