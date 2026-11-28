"""Secure, time-limited password reset routes for RainToRoot."""

import hashlib
import re
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlencode

from flask import Blueprint, jsonify, request
from mysql.connector import Error
from werkzeug.security import generate_password_hash

from backend.config.database import get_db_connection
from backend.services.email_service import (
    get_frontend_base_url,
    is_smtp_configured,
    send_password_reset_email,
)


password_reset_bp = Blueprint("password_reset", __name__)

RESET_TOKEN_TTL_MINUTES = 30
GENERIC_RESET_MESSAGE = (
    "If an account with that email exists, a password reset link has been sent."
)


def _hash_token(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def _valid_email(email: str) -> bool:
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email))


def _utcnow_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


@password_reset_bp.route("/api/password-reset/request", methods=["POST"])
def request_password_reset():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    email = data.get("email", "")
    email = email.strip().lower() if isinstance(email, str) else ""

    if not email or not _valid_email(email):
        return jsonify({"error": "Please enter a valid email address."}), 400

    if not is_smtp_configured():
        return jsonify({
            "error": "Password reset email service is not configured. Please configure SMTP settings on the server."
        }), 503

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, name, email FROM farmers WHERE LOWER(TRIM(email)) = %s LIMIT 1",
            (email,),
        )
        farmer = cursor.fetchone()
        if not farmer:
            return jsonify({"message": GENERIC_RESET_MESSAGE}), 200

        raw_token = secrets.token_urlsafe(32)
        token_hash = _hash_token(raw_token)
        expires_at = _utcnow_naive() + timedelta(minutes=RESET_TOKEN_TTL_MINUTES)

        cursor.execute(
            "UPDATE password_reset_tokens SET used_at = %s WHERE farmer_id = %s AND used_at IS NULL",
            (_utcnow_naive(), farmer["id"]),
        )
        cursor.execute(
            """INSERT INTO password_reset_tokens (farmer_id, token_hash, expires_at)
               VALUES (%s, %s, %s)""",
            (farmer["id"], token_hash, expires_at),
        )
        connection.commit()

        reset_query = urlencode({"reset_token": raw_token})
        reset_link = f"{get_frontend_base_url()}/?{reset_query}"

        try:
            send_password_reset_email(
                farmer["email"],
                farmer.get("name") or "Farmer",
                reset_link,
            )
        except Exception:
            cursor.execute(
                "DELETE FROM password_reset_tokens WHERE token_hash = %s",
                (token_hash,),
            )
            connection.commit()
            return jsonify({
                "error": "Unable to send password reset email right now. Please try again later."
            }), 503

        return jsonify({"message": GENERIC_RESET_MESSAGE}), 200
    except Error:
        if connection:
            connection.rollback()
        return jsonify({"error": "Unable to process password reset request."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@password_reset_bp.route("/api/password-reset/validate", methods=["GET"])
def validate_password_reset_token():
    raw_token = (request.args.get("token") or "").strip()
    if not raw_token:
        return jsonify({"valid": False, "error": "Password reset token is missing."}), 400

    token_hash = _hash_token(raw_token)
    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT expires_at, used_at FROM password_reset_tokens WHERE token_hash = %s LIMIT 1",
            (token_hash,),
        )
        record = cursor.fetchone()
        if not record:
            return jsonify({"valid": False, "error": "Invalid password reset link."}), 400
        if record["used_at"] is not None:
            return jsonify({"valid": False, "error": "This password reset link has already been used."}), 400
        if record["expires_at"] <= _utcnow_naive():
            return jsonify({"valid": False, "error": "This password reset link has expired. Please request a new one."}), 400
        return jsonify({"valid": True}), 200
    except Error:
        return jsonify({"valid": False, "error": "Unable to validate password reset link."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()


@password_reset_bp.route("/api/password-reset/confirm", methods=["POST"])
def confirm_password_reset():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Request body must be a JSON object."}), 400

    raw_token = data.get("token", "")
    raw_token = raw_token.strip() if isinstance(raw_token, str) else ""
    password = data.get("password", "") if isinstance(data.get("password", ""), str) else ""
    confirm_password = data.get("confirm_password")

    if not raw_token:
        return jsonify({"error": "Password reset token is missing."}), 400
    if len(password) < 8:
        return jsonify({"error": "Password must contain at least 8 characters."}), 400
    if confirm_password is not None and password != confirm_password:
        return jsonify({"error": "Passwords do not match."}), 400

    token_hash = _hash_token(raw_token)
    now = _utcnow_naive()

    connection = None
    cursor = None
    try:
        connection = get_db_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """SELECT id, farmer_id, expires_at, used_at
               FROM password_reset_tokens
               WHERE token_hash = %s
               LIMIT 1""",
            (token_hash,),
        )
        record = cursor.fetchone()
        if not record:
            return jsonify({"error": "Invalid password reset link."}), 400
        if record["used_at"] is not None:
            return jsonify({"error": "This password reset link has already been used."}), 400
        if record["expires_at"] <= now:
            return jsonify({"error": "This password reset link has expired. Please request a new one."}), 400

        password_hash = generate_password_hash(password)
        connection.start_transaction()
        cursor.execute(
            "UPDATE farmers SET password_hash = %s WHERE id = %s",
            (password_hash, record["farmer_id"]),
        )
        cursor.execute(
            "UPDATE password_reset_tokens SET used_at = %s WHERE farmer_id = %s AND used_at IS NULL",
            (now, record["farmer_id"]),
        )
        connection.commit()
        return jsonify({
            "message": "Your password has been reset successfully. You can now log in."
        }), 200
    except Error:
        if connection:
            connection.rollback()
        return jsonify({"error": "Unable to reset password."}), 500
    finally:
        if cursor:
            cursor.close()
        if connection:
            connection.close()
