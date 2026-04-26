import logging
from typing import Optional
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import settings

logger = logging.getLogger(__name__)


async def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an HTML email. Returns True on success."""
    if not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured, skipping email to %s", to_email)
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.SMTP_HOST,
            port=settings.SMTP_PORT,
            start_tls=True,
            username=settings.SMTP_USER,
            password=settings.SMTP_PASSWORD,
        )
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


async def send_welcome_email(to_email: str, full_name: str) -> None:
    html = f"""
    <h2>Welcome to {settings.APP_NAME}, {full_name}!</h2>
    <p>Your account has been created successfully. Start managing your pets today.</p>
    <p>Visit us at <a href="{settings.BASE_URL}">{settings.BASE_URL}</a></p>
    """
    await send_email(to_email, f"Welcome to {settings.APP_NAME}!", html)


async def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_url = f"{settings.BASE_URL}/reset-password?token={reset_token}"
    html = f"""
    <h2>Password Reset Request</h2>
    <p>Click the link below to reset your password. This link expires in 1 hour.</p>
    <p><a href="{reset_url}">Reset Password</a></p>
    <p>If you did not request this, please ignore this email.</p>
    """
    await send_email(to_email, "Reset your FurryFile password", html)
