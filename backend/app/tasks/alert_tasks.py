from celery import shared_task
import asyncio
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3)
def check_seuil_alerte(self, offer_id: int):
    try:
        asyncio.run(_check_seuil_async(offer_id))
    except Exception as exc:
        logger.error(f"Error check seuil offer {offer_id}: {exc}")
        raise self.retry(exc=exc, countdown=60)


async def _check_seuil_async(offer_id: int):
    from app.core.database import AsyncSessionLocal
    from app.models.db_models import JobOffer, Resultat, User
    from app.core.mailer import send_seuil_alerte
    from sqlalchemy import select, func

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(JobOffer).where(JobOffer.id == offer_id)
        )
        offer = result.scalar_one_or_none()

        if not offer or not offer.seuil_alerte:
            return
        if offer.alerte_envoyee:
            return

        nb_candidatures = await db.scalar(
            select(func.count(Resultat.id)).where(Resultat.id_offre == offer_id)
        )

        if nb_candidatures < offer.seuil_alerte:
            return

        logger.info(f"Offer {offer_id} — threshold {offer.seuil_alerte} reached ({nb_candidatures})")

        if not offer.id_rh:
            return

        rh_result = await db.execute(select(User).where(User.id == offer.id_rh))
        rh_user = rh_result.scalar_one_or_none()

        if not rh_user or not rh_user.email:
            return

        sent = await send_seuil_alerte(
            rh_email=rh_user.email,
            rh_nom=f"{rh_user.prenom} {rh_user.nom}",
            offre_titre=offer.titre,
            offre_id=offer_id,
            nb_candidatures=nb_candidatures,
            seuil=offer.seuil_alerte,
            matching_auto=offer.matching_auto,
        )

        if sent:
            offer.alerte_envoyee = True
            offer.date_alerte = datetime.now(timezone.utc)
            await db.commit()

        if offer.matching_auto and sent:
            logger.info(f"Offer {offer_id} — matching auto requested (trigger manually via /api/rh/offers/{offer_id}/matching)")
