"""Opaque, revocable application sessions. Raw tokens never enter the database."""
import hashlib
import secrets
from datetime import timedelta
from django.utils import timezone
from django.db import connection, transaction
from django.db.models import F
from .models import AccessSession, GoogleIdentity, LoginChallenge


def token_hash(token):
    return hashlib.sha256(token.encode()).hexdigest()


@transaction.atomic
def issue_session(email, subject):
    identity, _ = GoogleIdentity.objects.get_or_create(google_subject=subject, defaults={'user_email': email})
    if identity.user_email != email:
        raise ValueError('The account email has changed. Contact support to recover existing records.')
    AccessSession.objects.filter(expires_at__lte=timezone.now()).delete()
    token = secrets.token_urlsafe(32)
    session = AccessSession.objects.create(token_hash=token_hash(token), user_email=email,
        google_subject=subject, expires_at=timezone.now() + timedelta(days=7))
    return token, session


def new_login_challenge():
    LoginChallenge.objects.filter(expires_at__lte=timezone.now()).delete()
    nonce = secrets.token_urlsafe(32)
    challenge = LoginChallenge.objects.create(nonce_hash=token_hash(nonce), expires_at=timezone.now() + timedelta(minutes=10))
    return challenge, nonce


@transaction.atomic
def exchange_google_identity(info, challenge_id):
    if info.get('email_verified') is not True or not info.get('sub') or not info.get('email'):
        raise ValueError('A verified Google identity is required.')
    try:
        challenge = LoginChallenge.objects.select_for_update().get(pk=challenge_id, expires_at__gt=timezone.now())
    except (LoginChallenge.DoesNotExist, ValueError):
        raise ValueError('Login challenge is missing, expired or already used.')
    nonce = info.get('nonce')
    if not isinstance(nonce, str) or not secrets.compare_digest(challenge.nonce_hash, token_hash(nonce)):
        raise ValueError('Login nonce does not match.')
    challenge.delete()
    return issue_session(info['email'], info['sub'])


def authenticated_session(request):
    header = request.headers.get('Authorization', '')
    if not header.startswith('Bearer '):
        return None
    token = header[7:].strip()
    if not 40 <= len(token) <= 128:
        return None
    return AccessSession.objects.filter(token_hash=token_hash(token), expires_at__gt=timezone.now()).first()


def lock_account_for_write(session):
    # Call first inside atomic: deletion and saves serialize on the same identity.
    identity = GoogleIdentity.objects.filter(user_email=session.user_email, google_subject=session.google_subject)
    if connection.features.has_select_for_update:
        locked = identity.select_for_update().exists()
    else:
        # SQLite has no row locks. Start its write transaction before reading the session again.
        locked = identity.update(user_email=F('user_email'))
    return locked and AccessSession.objects.filter(pk=session.pk, expires_at__gt=timezone.now()).exists()
