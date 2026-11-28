"""SMTP email delivery helpers for RainToRoot password reset."""

import os
import smtplib
from email.message import EmailMessage


def is_smtp_configured() -> bool:
    """Return True when the minimum SMTP environment variables are set."""
    return all(
        os.getenv(key, "").strip()
        for key in ("SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD")
    )


def get_frontend_base_url() -> str:
    """Resolve the frontend base URL used in password-reset links."""
    explicit = os.getenv("FRONTEND_APP_URL", "").strip().rstrip("/")
    if explicit:
        return explicit

    origins = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
    first_origin = next(
        (origin.strip().rstrip("/") for origin in origins.split(",") if origin.strip()),
        "http://localhost:5173",
    )
    return first_origin


def send_password_reset_email(recipient_email: str, farmer_name: str, reset_link: str) -> None:
    """Send a password-reset email via configured SMTP credentials."""
    smtp_host = os.getenv("SMTP_HOST", "").strip()
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "").strip()
    smtp_password = os.getenv("SMTP_PASSWORD", "").strip()
    smtp_from = os.getenv("SMTP_FROM", "").strip() or smtp_user
    use_tls = os.getenv("SMTP_USE_TLS", "True").lower() in ("true", "1", "yes")

    if not smtp_host or not smtp_user or not smtp_password:
        raise RuntimeError("SMTP is not configured.")

    greeting_name = farmer_name.strip() or "Farmer"
    message = EmailMessage()
    message["Subject"] = "RainToRoot Password Reset Request"
    message["From"] = smtp_from
    message["To"] = recipient_email
    message.set_content(
        f"Hello {greeting_name},\n\n"
        "We received a request to reset your RainToRoot account password.\n"
        "Use the link below to set a new password (valid for 30 minutes):\n\n"
        f"{reset_link}\n\n"
        "If you did not request a password reset, you can safely ignore this email.\n\n"
        "— RainToRoot Team\n"
    )

    if smtp_port == 465:
        with smtplib.SMTP_SSL(smtp_host, smtp_port, timeout=15) as server:
            server.login(smtp_user, smtp_password)
            server.send_message(message)
    else:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
            if use_tls:
                server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(message)
