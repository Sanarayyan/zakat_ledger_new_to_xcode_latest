"""Runs the actual Django app against an isolated in-memory database for JS API tests."""
import json
import os
import sys
from pathlib import Path
from wsgiref.simple_server import make_server, WSGIRequestHandler
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
os.environ['DJANGO_DEBUG'] = 'true'
os.environ['DJANGO_SETTINGS_MODULE'] = 'zakatledger.settings'
import django
django.setup()
from django.conf import settings
settings.DATABASES['default']['NAME'] = ':memory:'
from django.core.management import call_command
call_command('migrate', verbosity=0)
from api.authentication import issue_session
from django.core.wsgi import get_wsgi_application
token, session = issue_session('integration@example.test', 'integration-subject')
parity_token, _ = issue_session('parity@example.test', 'parity-subject')
class QuietHandler(WSGIRequestHandler):
    def log_message(self, *args):
        pass
server = make_server('127.0.0.1', 0, get_wsgi_application(), handler_class=QuietHandler)
print(json.dumps({'url': f'http://127.0.0.1:{server.server_port}', 'token': token, 'parityToken': parity_token}), flush=True)
server.serve_forever()
