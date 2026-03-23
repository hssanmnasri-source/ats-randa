"""
mailer.py
Service d'envoi d'emails transactionnels — ATS RANDA.

Emails gérés :
  - send_cv_received()         → après upload/soumission CV candidat
  - send_application_received() → après candidature à une offre
  - send_decision_notification() → après décision RH (RETAINED / REFUSED)

Configuration (.env) :
  MAIL_ENABLED=true
  MAIL_USERNAME=ats.randa.noreply@gmail.com
  MAIL_PASSWORD=<app_password_gmail>
  MAIL_FROM=ats.randa.noreply@gmail.com
  MAIL_SERVER=smtp.gmail.com
  MAIL_PORT=587
  MAIL_FROM_NAME=ATS RANDA

Si MAIL_ENABLED=false (défaut), les fonctions loggent sans envoyer.
"""
from __future__ import annotations
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# ── HTML templates ────────────────────────────────────────────────────────────

_BASE_STYLE = """
<style>
  body { font-family: Arial, sans-serif; background: #F5F5F5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff;
               border-radius: 12px; overflow: hidden;
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #3D0C02, #8B1A1A);
            padding: 32px 24px; text-align: center; }
  .header img { height: 60px; }
  .header h1 { color: #F0D080; font-size: 22px; margin: 12px 0 0; }
  .content { padding: 32px 24px; color: #333; line-height: 1.6; }
  .highlight { color: #8B1A1A; font-weight: bold; }
  .badge { display: inline-block; padding: 6px 16px; border-radius: 20px;
           font-weight: bold; font-size: 14px; margin: 8px 0; }
  .badge-green  { background: #E8F5E9; color: #2E7D32; }
  .badge-red    { background: #FDECEA; color: #8B1A1A; }
  .badge-gold   { background: #FFF8E1; color: #8B6914; }
  .footer { background: #F8F0E8; padding: 16px 24px; text-align: center;
            color: #888; font-size: 12px; border-top: 1px solid #E8E0D0; }
  .divider { border: none; border-top: 2px solid #C9A84C; margin: 24px 0; }
</style>
"""


def _html_wrapper(title: str, body: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8">{_BASE_STYLE}</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏢 ATS RANDA</h1>
    </div>
    <div class="content">
      <h2 style="color:#8B1A1A">{title}</h2>
      <hr class="divider">
      {body}
    </div>
    <div class="footer">
      ATS RANDA — Applicant Tracking System<br>
      Ce message est automatique, merci de ne pas répondre.
    </div>
  </div>
</body>
</html>"""


def _get_fastmail():
    """Initialise FastMail. Retourne None si non configuré."""
    if not settings.MAIL_ENABLED or not settings.MAIL_USERNAME:
        return None
    try:
        from fastapi_mail import FastMail, ConnectionConfig
        conf = ConnectionConfig(
            MAIL_USERNAME=settings.MAIL_USERNAME,
            MAIL_PASSWORD=settings.MAIL_PASSWORD,
            MAIL_FROM=settings.MAIL_FROM,
            MAIL_PORT=settings.MAIL_PORT,
            MAIL_SERVER=settings.MAIL_SERVER,
            MAIL_FROM_NAME=settings.MAIL_FROM_NAME,
            MAIL_STARTTLS=True,
            MAIL_SSL_TLS=False,
            USE_CREDENTIALS=True,
        )
        return FastMail(conf)
    except Exception as e:
        logger.warning(f"FastMail init failed: {e}")
        return None


async def _send(recipients: list[str], subject: str, html_body: str) -> bool:
    """Envoie un email HTML. Retourne True si envoyé, False sinon."""
    fm = _get_fastmail()
    if fm is None:
        logger.info(f"[MAIL DISABLED] To: {recipients} | Subject: {subject}")
        return False
    try:
        from fastapi_mail import MessageSchema, MessageType
        message = MessageSchema(
            subject=subject,
            recipients=recipients,
            body=html_body,
            subtype=MessageType.html,
        )
        await fm.send_message(message)
        logger.info(f"[MAIL SENT] To: {recipients} | Subject: {subject}")
        return True
    except Exception as e:
        logger.error(f"[MAIL ERROR] To: {recipients} | {e}")
        return False


# ── Fonctions publiques ───────────────────────────────────────────────────────

async def send_cv_received(email: str, nom: str, prenom: str) -> bool:
    """Envoyé après upload ou soumission de CV par un candidat."""
    body = f"""
    <p>Bonjour <strong>{prenom} {nom}</strong>,</p>
    <p>Votre CV a bien été reçu et analysé par notre système ATS.</p>
    <p>Il est maintenant disponible pour être présenté aux recruteurs RANDA.</p>
    <br>
    <div class="badge badge-green">✅ CV enregistré avec succès</div>
    <br>
    <p>Vous pouvez consulter vos candidatures à tout moment depuis votre espace candidat.</p>
    <br>
    <p>Cordialement,<br><span class="highlight">L'équipe RH RANDA</span></p>
    """
    return await _send(
        recipients=[email],
        subject="✅ Votre CV a été reçu — ATS RANDA",
        html_body=_html_wrapper("CV reçu avec succès", body),
    )


async def send_application_received(
    email: str, nom: str, prenom: str, titre_offre: str
) -> bool:
    """Envoyé après candidature à une offre d'emploi."""
    body = f"""
    <p>Bonjour <strong>{prenom} {nom}</strong>,</p>
    <p>Votre candidature pour le poste :</p>
    <div class="badge badge-gold">💼 {titre_offre}</div>
    <p>a bien été enregistrée dans notre système.</p>
    <p>Notre équipe RH examinera votre profil dans les meilleurs délais.</p>
    <br>
    <p>Vous serez notifié(e) de toute évolution de votre dossier.</p>
    <br>
    <p>Cordialement,<br><span class="highlight">L'équipe RH RANDA</span></p>
    """
    return await _send(
        recipients=[email],
        subject=f"📨 Candidature reçue — {titre_offre}",
        html_body=_html_wrapper("Candidature enregistrée", body),
    )


async def send_decision_notification(
    email: str, nom: str, prenom: str, titre_offre: str, decision: str
) -> bool:
    """Envoyé quand le RH prend une décision RETAINED ou REFUSED."""
    if decision == "RETAINED":
        subject = f"🎉 Bonne nouvelle — {titre_offre}"
        title = "Votre candidature a été retenue !"
        badge = '<div class="badge badge-green">🎉 Candidature retenue</div>'
        body_text = f"""
        <p>Félicitations <strong>{prenom} {nom}</strong> !</p>
        <p>Nous avons le plaisir de vous informer que votre candidature pour le poste :</p>
        {badge}
        <div class="badge badge-gold">💼 {titre_offre}</div>
        <p>a été <strong style="color:#2E7D32">retenue</strong> par notre équipe RH.</p>
        <p>Nous vous contacterons très prochainement pour la suite du processus de recrutement.</p>
        """
    else:  # REFUSED
        subject = f"Réponse à votre candidature — {titre_offre}"
        title = "Réponse à votre candidature"
        badge = '<div class="badge badge-red">❌ Candidature non retenue</div>'
        body_text = f"""
        <p>Bonjour <strong>{prenom} {nom}</strong>,</p>
        <p>Après examen attentif de votre candidature pour le poste :</p>
        <div class="badge badge-gold">💼 {titre_offre}</div>
        {badge}
        <p>Nous vous remercions pour l'intérêt que vous portez à RANDA et
           vous encourageons à postuler pour d'autres opportunités correspondant
           à votre profil.</p>
        """

    body = body_text + """
    <br>
    <p>Cordialement,<br><span class="highlight">L'équipe RH RANDA</span></p>
    """
    return await _send(
        recipients=[email],
        subject=subject,
        html_body=_html_wrapper(title, body),
    )
