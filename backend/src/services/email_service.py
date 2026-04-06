from __future__ import annotations

import structlog

from src.core.config import get_settings

logger = structlog.get_logger()


class ResendEmailService:
    async def send_verification_email(self, email: str, token: str) -> None:
        settings = get_settings()
        try:
            import resend

            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send(
                {
                    "from": "JobRadar <noreply@jobradar.com.br>",
                    "to": email,
                    "subject": "Confirme seu email - JobRadar",
                    "html": f'<p>Clique <a href="https://app.jobradar.com.br/verify?token={token}">'
                    f"aqui</a> para confirmar.</p>",
                }
            )
        except Exception:  # noqa: BLE001
            await logger.awarning("Failed to send verification email", email=email)

    async def send_reset_password_email(self, email: str, token: str) -> None:
        settings = get_settings()
        try:
            import resend

            resend.api_key = settings.RESEND_API_KEY
            resend.Emails.send(
                {
                    "from": "JobRadar <noreply@jobradar.com.br>",
                    "to": email,
                    "subject": "Redefinir senha - JobRadar",
                    "html": f'<p>Clique <a href="https://app.jobradar.com.br/reset-password?token={token}">'
                    f"aqui</a> para redefinir.</p>",
                }
            )
        except Exception:  # noqa: BLE001
            await logger.awarning("Failed to send reset password email", email=email)
