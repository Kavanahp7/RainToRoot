"""Session and CSRF helpers shared by RainToRoot API routes."""

import hmac
import secrets
from functools import wraps

from flask import g, jsonify, request, session


def establish_session(farmer_id: int) -> str:
    """Start a signed browser session and return a CSRF token for API writes."""
    session.clear()
    session.permanent = True
    session["farmer_id"] = int(farmer_id)
    csrf_token = secrets.token_urlsafe(32)
    session["csrf_token"] = csrf_token
    return csrf_token


def clear_session() -> None:
    session.clear()


def require_auth(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        farmer_id = session.get("farmer_id")
        if not isinstance(farmer_id, int):
            return jsonify({"error": "Authentication is required."}), 401
        g.farmer_id = farmer_id
        return view(*args, **kwargs)

    return wrapped


def require_csrf(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        expected = session.get("csrf_token", "")
        received = request.headers.get("X-CSRF-Token", "")
        if not expected or not received or not hmac.compare_digest(expected, received):
            return jsonify({"error": "Invalid or missing CSRF token."}), 403
        return view(*args, **kwargs)

    return wrapped
