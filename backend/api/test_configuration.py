import json
import os
from pathlib import Path
import subprocess
import sys
from django.test import SimpleTestCase


class ServiceConfigurationTests(SimpleTestCase):
    def test_postgresql_and_shared_cache_are_selected_without_connecting(self):
        root = Path(__file__).resolve().parents[1]
        env = {**os.environ, 'DJANGO_DEBUG': 'true', 'DJANGO_DB_ENGINE': 'postgresql',
            'POSTGRES_DB': 'disposable', 'POSTGRES_USER': 'test', 'POSTGRES_PASSWORD': 'test-only',
            'POSTGRES_HOST': 'unused.invalid', 'DJANGO_CACHE_LOCATION': 'rediss://unused.invalid:6379/1'}
        result = subprocess.run([sys.executable, '-B', '-c',
            'from zakatledger import settings; import json; print(json.dumps([settings.DATABASES["default"]["ENGINE"], settings.DATABASES["default"]["OPTIONS"], settings.CACHES["default"]["BACKEND"]]))'],
            cwd=root, env=env, capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(result.stdout), ['django.db.backends.postgresql', {'sslmode': 'verify-full'}, 'django.core.cache.backends.redis.RedisCache'])


    def test_direct_deployment_does_not_trust_forwarded_client_identity(self):
        from rest_framework.test import APIRequestFactory
        from rest_framework.throttling import AnonRateThrottle
        from django.test import override_settings
        from django.conf import settings

        with override_settings(REST_FRAMEWORK={**settings.REST_FRAMEWORK, 'NUM_PROXIES': 0}):
            factory = APIRequestFactory()
            request = factory.post('/api/auth/challenge/', REMOTE_ADDR='192.0.2.7',
                                   HTTP_X_FORWARDED_FOR='198.51.100.9')
            self.assertEqual(AnonRateThrottle().get_ident(request), '192.0.2.7')
        with override_settings(REST_FRAMEWORK={**settings.REST_FRAMEWORK, 'NUM_PROXIES': 1}):
            self.assertEqual(AnonRateThrottle().get_ident(request), '198.51.100.9')
