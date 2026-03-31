# Re-export depuis core/mailer pour compatibilité
from app.core.mailer import (
    send_cv_received,
    send_application_received,
    send_decision_notification,
)

__all__ = [
    "send_cv_received",
    "send_application_received",
    "send_decision_notification",
]
