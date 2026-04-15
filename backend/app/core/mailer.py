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

_LOGO_B64 = (
    "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"
    "RK5CYII="
)

# ── HTML templates ────────────────────────────────────────────────────────────

_BASE_STYLE = """
<style>
  body { font-family: Arial, sans-serif; background: #F5F5F5; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: #fff;
               border-radius: 12px; overflow: hidden;
               box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
  .header { background: linear-gradient(135deg, #3D0C02, #8B1A1A);
            padding: 32px 24px; text-align: center; }
  .header img { height: 80px; display: block; margin: 0 auto; }
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
      <img src="http://localhost/icon/logo-randa-200x133.png" alt="ATS RANDA" style="height:80px; display:block; margin:0 auto;">
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


async def send_seuil_alerte(
    rh_email: str,
    rh_nom: str,
    offre_titre: str,
    offre_id: int,
    nb_candidatures: int,
    seuil: int,
    matching_auto: bool,
) -> bool:
    """Envoi alerte RH quand le seuil de candidatures est atteint."""
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    action_url = f"{frontend_url}/rh/matching?offer={offre_id}"

    auto_block = (
        "<div style='background: #F0FFF4; border: 1px solid #52C41A; padding: 12px; "
        "border-radius: 8px; margin: 16px 0;'>"
        "<p style='margin: 0; color: #52C41A; font-weight: 600;'>Matching automatique active.</p></div>"
        if matching_auto else ""
    )

    body = f"""
    <p>Bonjour <strong>{rh_nom}</strong>,</p>
    <div style="background: #FFF8E6; border-left: 4px solid #C9A84C; padding: 16px; margin: 16px 0;">
      <p>L'offre <strong>"{offre_titre}"</strong> a atteint
         <strong style="color: #8B1A1A;">{nb_candidatures} candidatures</strong>
         (seuil : {seuil}).</p>
    </div>
    {auto_block}
    <div style="text-align: center; margin: 24px 0;">
      <a href="{action_url}"
         style="background: #8B1A1A; color: white; padding: 14px 32px;
                border-radius: 8px; text-decoration: none; font-weight: 700;">
        Lancer le Matching IA
      </a>
    </div>
    <p>Cordialement,<br><span class="highlight">L'equipe ATS RANDA</span></p>
    """
    return await _send(
        recipients=[rh_email],
        subject=f"Seuil atteint : {nb_candidatures} candidatures pour '{offre_titre}'",
        html_body=_html_wrapper("Seuil de candidatures atteint", body),
    )


async def send_entretien_invitation(
    candidat_email: str,
    candidat_nom: str,
    offre_titre: str,
    date_entretien,
    lieu: str,
    type_entretien: str,
    rh_nom: str,
    rh_email: str,
) -> bool:
    """Envoi invitation entretien au candidat retenu."""
    from datetime import datetime
    if isinstance(date_entretien, str):
        dt = datetime.fromisoformat(date_entretien.replace("Z", "+00:00"))
    else:
        dt = date_entretien

    date_str = dt.strftime("%A %d %B %Y a %H:%M")
    type_label = {
        "presentiel": "Entretien en presentiel",
        "visio": "Visioconference",
        "telephonique": "Telephonique",
    }.get(type_entretien, "Entretien")

    body = f"""
    <p>Bonjour <strong>{candidat_nom}</strong>,</p>
    <p>Suite a l'examen de votre candidature pour <strong>"{offre_titre}"</strong>,
       nous avons le plaisir de vous inviter a un entretien.</p>
    <div style="background: #FFF8E6; border: 2px solid #C9A84C; border-radius: 12px;
                padding: 20px; margin: 20px 0;">
      <h3 style="color: #8B1A1A;">Details de l'entretien</h3>
      <p><strong>Type :</strong> {type_label}</p>
      <p><strong>Date :</strong> <span style="color: #8B1A1A;">{date_str}</span></p>
      <p><strong>Lieu :</strong> {lieu} —
        <a href="https://www.google.com/maps/search/?api=1&amp;query=P6MJ%2BP49+Rue+Ahmed+Chaouchi+Ben+Arous"
           style="color: #8B1A1A;" target="_blank">
          RANDA — P6MJ+P49, Rue Ahmed Chaouki, Ben Arous
        </a>
      </p>
      <p><strong>Contact RH :</strong> {rh_nom} — <a href="mailto:{rh_email}" style="color:#8B1A1A;">{rh_email}</a></p>
    </div>
    <p>Cordialement,<br><span class="highlight">{rh_nom} — Equipe RH RANDA</span></p>
    """
    return await _send(
        recipients=[candidat_email],
        subject=f"Invitation entretien — {offre_titre}",
        html_body=_html_wrapper("Invitation a un entretien", body),
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
