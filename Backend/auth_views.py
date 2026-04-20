import hmac
import hashlib
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status


def _make_token():
    """Generate a stateless verifiable token from the admin password + secret key."""
    return hmac.new(
        settings.SECRET_KEY.encode("utf-8"),
        settings.ADMIN_PASSWORD.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


@api_view(["POST"])
def login(request):
    password = request.data.get("password", "")
    if password == settings.ADMIN_PASSWORD:
        return Response({"token": _make_token()})
    return Response(
        {"error": "Mot de passe incorrect."},
        status=status.HTTP_401_UNAUTHORIZED,
    )


@api_view(["POST"])
def logout(request):
    # Token is stateless — client just deletes it from localStorage
    return Response({"message": "Déconnecté."})
