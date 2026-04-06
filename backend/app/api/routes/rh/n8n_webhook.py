"""
Routes n8n webhook — ATS RANDA
Expose les données pour les workflows n8n et reçoit les créneaux générés.
"""
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import os
import logging
import httpx

from app.core.database import get_db
from app.api.dependencies import require_rh
from app.models.db_models import Entretien

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/n8n", tags=["🔄 n8n Workflows"])

N8N_INTERNAL_URL = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678")


# ══════════════════════════════════════════════════════════
# ENDPOINT 0 — Génération complète côté backend
# n8n appelle cet endpoint : pas de Code node fragile
# Génère les créneaux ET les sauvegarde en une seule requête
# ══════════════════════════════════════════════════════════
@router.post("/generer-et-sauvegarder")
async def generer_et_sauvegarder(
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """
    Endpoint tout-en-un appelé par n8n (ou directement par le frontend via proxy).
    1. Récupère tous les RETAINED
    2. Génère les créneaux (logique Python)
    3. Sauvegarde en base → statut PROPOSE
    Retourne le nombre de créneaux créés.
    """
    from datetime import timedelta

    # 1. Récupérer les RETAINED
    result = await db.execute(text("""
        SELECT
            j.id        AS offre_id,
            j.titre     AS offre_titre,
            r.id        AS resultat_id,
            c.email     AS candidat_email,
            c.nom       AS candidat_nom,
            c.prenom    AS candidat_prenom
        FROM resultats r
        JOIN cvs cv       ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        JOIN job_offers j ON j.id = r.id_offre
        WHERE r.decision = 'RETAINED'
        AND j.statut = 'ACTIVE'
        ORDER BY j.id, r.score_final DESC
    """))
    rows = result.fetchall()

    if not rows:
        return {"success": True, "nb_crees": 0, "message": "Aucun candidat RETAINED trouvé"}

    # 2. Supprimer les anciens PROPOSE non confirmés
    await db.execute(text("DELETE FROM entretiens WHERE statut = 'PROPOSE' AND id_rh = :rh_id"),
                     {"rh_id": rh.id})

    exec_id = f"backend-{rh.id}-{int(datetime.now().timestamp())}"

    # 3. Générer les créneaux — prochain lundi 9h00
    now = datetime.now()
    day = now.weekday()  # 0=lundi
    days_until_monday = (7 - day) % 7 or 7
    slot = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)

    # Éviter weekend
    while slot.weekday() >= 5:
        slot += timedelta(days=1)

    DUREE = timedelta(minutes=30)
    PAUSE = timedelta(minutes=15)

    entretiens_crees = []
    for row in rows:
        # Vérifier qu'il n'y a pas déjà un entretien confirmé pour ce résultat
        existing = await db.execute(
            select(Entretien).where(
                Entretien.id_resultat == row.resultat_id,
                Entretien.statut.in_(["CONFIRME", "ENVOYE", "PLANIFIE"])
            )
        )
        if existing.scalars().first():
            continue

        ent = Entretien(
            id_resultat=row.resultat_id,
            id_offre=row.offre_id,
            id_rh=rh.id,
            date_entretien=slot,
            duree_minutes=30,
            type_entretien="presentiel",
            lieu="RANDA — ZI BIR EL KASAA BEN AROUS",
            statut="PROPOSE",
            email_candidat_envoye=False,
            email_envoye=False,
            n8n_execution_id=exec_id,
        )
        db.add(ent)
        entretiens_crees.append({
            "offre_id": row.offre_id,
            "email":    row.candidat_email,
            "date":     slot.isoformat(),
        })

        # Créneau suivant
        slot += DUREE + PAUSE
        # Pause déjeuner 12h → 14h
        if slot.hour >= 12 and slot.hour < 14:
            slot = slot.replace(hour=14, minute=0)
        # Fin de journée 18h → lendemain 9h
        if slot.hour >= 18:
            slot = (slot + timedelta(days=1)).replace(hour=9, minute=0)
            while slot.weekday() >= 5:
                slot += timedelta(days=1)

    await db.commit()
    logger.info(f"Génération backend: {len(entretiens_crees)} créneaux pour RH {rh.id}")

    return {
        "success":          True,
        "nb_crees":         len(entretiens_crees),
        "total_retained":   len(rows),
        "n8n_execution_id": exec_id,
        "entretiens":       entretiens_crees,
    }

N8N_SECRET = os.getenv("N8N_WEBHOOK_SECRET", "ats-randa-n8n-secret-2026")


def verify_n8n_secret(x_n8n_secret: Optional[str] = Header(None)):
    if x_n8n_secret != N8N_SECRET:
        raise HTTPException(401, "Webhook non autorisé")
    return True


# ══════════════════════════════════════════════════════════
# ENDPOINT 1 — Récupérer tous les RETAINED pour n8n
# ══════════════════════════════════════════════════════════
@router.get("/retained-candidates")
async def get_all_retained(
    db: AsyncSession = Depends(get_db),
    rh=Depends(require_rh),
):
    result = await db.execute(text("""
        SELECT
            j.id        AS offre_id,
            j.titre     AS offre_titre,
            j.langue_requise,
            r.id        AS resultat_id,
            r.score_final,
            c.id        AS candidat_id,
            c.nom       AS candidat_nom,
            c.prenom    AS candidat_prenom,
            c.email     AS candidat_email,
            c.telephone AS candidat_telephone,
            c.region    AS candidat_region
        FROM resultats r
        JOIN cvs cv       ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        JOIN job_offers j ON j.id = r.id_offre
        WHERE r.decision = 'RETAINED'
        AND j.statut = 'ACTIVE'
        ORDER BY j.id, r.score_final DESC
    """))
    rows = result.fetchall()

    offres = {}
    for row in rows:
        oid = row.offre_id
        if oid not in offres:
            offres[oid] = {
                "offre_id":    oid,
                "offre_titre": row.offre_titre,
                "langue":      row.langue_requise,
                "candidats":   [],
            }
        offres[oid]["candidats"].append({
            "resultat_id":  row.resultat_id,
            "candidat_id":  row.candidat_id,
            "nom":          row.candidat_nom,
            "prenom":       row.candidat_prenom,
            "email":        row.candidat_email,
            "telephone":    row.candidat_telephone,
            "region":       row.candidat_region,
            "score":        round(float(row.score_final or 0) * 100, 1),
        })

    offres_list = list(offres.values())
    total_candidats = sum(len(o["candidats"]) for o in offres_list)

    return {
        "total_offres":    len(offres_list),
        "total_candidats": total_candidats,
        "rh_id":           rh.id,
        "rh_email":        rh.email,
        "rh_nom":          f"{rh.prenom} {rh.nom}",
        "offres":          offres_list,
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 2 — n8n pousse les créneaux générés
# ══════════════════════════════════════════════════════════
class CreneauIn(BaseModel):
    resultat_id:    int
    offre_id:       int
    candidat_email: str
    candidat_nom:   str
    date_entretien: datetime
    duree_minutes:  int = 30
    type_entretien: str = "presentiel"
    lieu:           str = "RANDA — ZI BIR EL KASAA BEN AROUS"
    lien_visio:     Optional[str] = None


class CreneauxGeneresIn(BaseModel):
    n8n_execution_id: str
    rh_id:            int
    creneaux:         List[CreneauIn]


@router.post("/creneaux-generes")
async def receive_creneaux(
    data: CreneauxGeneresIn,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_n8n_secret),
):
    # Supprimer les anciens PROPOSE non confirmés pour éviter les doublons
    await db.execute(text("""
        DELETE FROM entretiens
        WHERE statut = 'PROPOSE'
        AND (n8n_execution_id IS NULL OR n8n_execution_id != :exec_id)
    """), {"exec_id": data.n8n_execution_id})

    entretiens_crees = []
    for creneau in data.creneaux:
        existing = await db.execute(
            select(Entretien).where(
                Entretien.id_resultat == creneau.resultat_id,
                Entretien.statut.in_(["CONFIRME", "ENVOYE", "PLANIFIE"])
            )
        )
        if existing.scalar_one_or_none():
            logger.info(f"Entretien déjà confirmé pour résultat {creneau.resultat_id} — skip")
            continue

        entretien = Entretien(
            id_resultat=creneau.resultat_id,
            id_offre=creneau.offre_id,
            id_rh=data.rh_id,
            date_entretien=creneau.date_entretien,
            duree_minutes=creneau.duree_minutes,
            type_entretien=creneau.type_entretien,
            lieu=creneau.lieu,
            lien_visio=creneau.lien_visio,
            statut="PROPOSE",
            email_candidat_envoye=False,
            email_envoye=False,
            n8n_execution_id=data.n8n_execution_id,
        )
        db.add(entretien)
        entretiens_crees.append({
            "offre_id": creneau.offre_id,
            "email":    creneau.candidat_email,
            "date":     creneau.date_entretien.isoformat(),
            "type":     creneau.type_entretien,
        })

    await db.commit()
    logger.info(f"n8n exec {data.n8n_execution_id} → {len(entretiens_crees)} entretiens créés")

    return {
        "success":          True,
        "nb_crees":         len(entretiens_crees),
        "n8n_execution_id": data.n8n_execution_id,
        "entretiens":       entretiens_crees,
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 3 — Lister les entretiens PROPOSE pour le RH
# ══════════════════════════════════════════════════════════
@router.get("/entretiens/propose")
async def get_proposed_entretiens(
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT
            e.id,
            e.id_resultat,
            e.id_offre,
            e.date_entretien,
            e.duree_minutes,
            e.type_entretien,
            e.lieu,
            e.lien_visio,
            e.statut,
            e.n8n_execution_id,
            j.titre  AS offre_titre,
            c.nom    AS candidat_nom,
            c.prenom AS candidat_prenom,
            c.email  AS candidat_email,
            c.telephone AS candidat_telephone
        FROM entretiens e
        JOIN job_offers j ON j.id = e.id_offre
        LEFT JOIN resultats r ON r.id = e.id_resultat
        LEFT JOIN cvs cv ON cv.id = r.id_cv
        LEFT JOIN candidates c ON c.id = cv.id_candidate
        WHERE e.id_rh = :rh_id
        AND e.statut = 'PROPOSE'
        ORDER BY e.id_offre, e.date_entretien
    """), {"rh_id": rh.id})

    rows = result.fetchall()

    offres = {}
    for row in rows:
        oid = row.id_offre
        if oid not in offres:
            offres[oid] = {
                "offre_id":    oid,
                "offre_titre": row.offre_titre,
                "entretiens":  [],
            }
        offres[oid]["entretiens"].append({
            "id":                 row.id,
            "date_entretien":     row.date_entretien.isoformat() if row.date_entretien else None,
            "duree_minutes":      row.duree_minutes,
            "type_entretien":     row.type_entretien,
            "lieu":               row.lieu,
            "lien_visio":         row.lien_visio,
            "statut":             row.statut,
            "candidat_nom":       row.candidat_nom,
            "candidat_prenom":    row.candidat_prenom,
            "candidat_email":     row.candidat_email,
            "candidat_telephone": row.candidat_telephone,
        })

    return {
        "total":          len(rows),
        "offres":         list(offres.values()),
        "peut_confirmer": len(rows) > 0,
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 4 — RH modifie un entretien avant confirmation
# ══════════════════════════════════════════════════════════
class EntretienUpdateIn(BaseModel):
    date_entretien: Optional[datetime] = None
    type_entretien: Optional[str] = None
    lieu:           Optional[str] = None
    lien_visio:     Optional[str] = None
    duree_minutes:  Optional[int] = None


@router.put("/entretiens/{entretien_id}")
async def update_entretien(
    entretien_id: int,
    data: EntretienUpdateIn,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Entretien).where(
            Entretien.id == entretien_id,
            Entretien.id_rh == rh.id,
            Entretien.statut == "PROPOSE",
        )
    )
    entretien = result.scalar_one_or_none()
    if not entretien:
        raise HTTPException(404, "Entretien introuvable ou déjà confirmé")

    if data.date_entretien is not None:  entretien.date_entretien = data.date_entretien
    if data.type_entretien is not None:  entretien.type_entretien = data.type_entretien
    if data.lieu is not None:            entretien.lieu = data.lieu
    if data.lien_visio is not None:      entretien.lien_visio = data.lien_visio
    if data.duree_minutes is not None:   entretien.duree_minutes = data.duree_minutes

    await db.commit()
    return {"success": True, "message": "Entretien mis à jour"}


# ══════════════════════════════════════════════════════════
# ENDPOINT 5 — RH confirme TOUS les entretiens PROPOSE
# ══════════════════════════════════════════════════════════
@router.post("/entretiens/confirmer-tout")
async def confirmer_tous(
    type_global: Optional[str] = None,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT
            e.id,
            e.id_offre,
            e.date_entretien,
            e.duree_minutes,
            e.type_entretien,
            e.lieu,
            e.lien_visio,
            j.titre AS offre_titre,
            c.nom, c.prenom, c.email,
            u.nom AS rh_nom, u.prenom AS rh_prenom, u.email AS rh_email
        FROM entretiens e
        JOIN job_offers j ON j.id = e.id_offre
        LEFT JOIN resultats r ON r.id = e.id_resultat
        LEFT JOIN cvs cv ON cv.id = r.id_cv
        LEFT JOIN candidates c ON c.id = cv.id_candidate
        LEFT JOIN users u ON u.id = e.id_rh
        WHERE e.id_rh = :rh_id
        AND e.statut = 'PROPOSE'
        ORDER BY e.id_offre, e.date_entretien
    """), {"rh_id": rh.id})

    rows = result.fetchall()
    if not rows:
        raise HTTPException(400, "Aucun entretien à confirmer")

    for row in rows:
        upd = await db.execute(select(Entretien).where(Entretien.id == row.id))
        ent = upd.scalar_one_or_none()
        if ent:
            ent.statut = "CONFIRME"
            if type_global:
                ent.type_entretien = type_global

    await db.commit()

    confirmed = []
    for row in rows:
        confirmed.append({
            "entretien_id":   row.id,
            "offre_titre":    row.offre_titre,
            "candidat_nom":   f"{row.prenom or ''} {row.nom or ''}".strip(),
            "candidat_email": row.email,
            "date":           row.date_entretien.strftime("%A %d %B %Y à %H:%M") if row.date_entretien else "",
            "date_iso":       row.date_entretien.isoformat() if row.date_entretien else "",
            "type":           type_global or row.type_entretien,
            "lieu":           row.lieu,
            "lien_visio":     row.lien_visio,
            "duree":          row.duree_minutes,
            "rh_nom":         f"{row.rh_prenom or ''} {row.rh_nom or ''}".strip(),
            "rh_email":       row.rh_email,
        })

    return {
        "success":   True,
        "confirmed": confirmed,
        "nb_emails": len(confirmed),
        "message":   f"{len(confirmed)} entretiens confirmés — envoi emails en cours",
    }


# ══════════════════════════════════════════════════════════
# ENDPOINT 6 — n8n confirme l'envoi des emails
# ══════════════════════════════════════════════════════════
class EmailSentIn(BaseModel):
    entretien_ids:    List[int]
    n8n_execution_id: str


@router.post("/entretiens/emails-envoyes")
async def mark_emails_sent(
    data: EmailSentIn,
    db: AsyncSession = Depends(get_db),
    authorized: bool = Depends(verify_n8n_secret),
):
    for eid in data.entretien_ids:
        result = await db.execute(select(Entretien).where(Entretien.id == eid))
        ent = result.scalar_one_or_none()
        if ent:
            ent.statut = "ENVOYE"
            ent.email_envoye = True
            ent.email_candidat_envoye = True

    await db.commit()
    return {"success": True, "nb_updated": len(data.entretien_ids)}


# ══════════════════════════════════════════════════════════
# ENDPOINT 7 — Dashboard calendrier complet
# ══════════════════════════════════════════════════════════
@router.get("/calendrier")
async def get_calendrier(
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(text("""
        SELECT
            e.id, e.statut, e.type_entretien,
            e.date_entretien, e.duree_minutes,
            e.lieu, e.lien_visio, e.email_candidat_envoye,
            j.titre AS offre_titre,
            j.id    AS offre_id,
            c.nom, c.prenom, c.email
        FROM entretiens e
        JOIN job_offers j ON j.id = e.id_offre
        LEFT JOIN resultats r ON r.id = e.id_resultat
        LEFT JOIN cvs cv ON cv.id = r.id_cv
        LEFT JOIN candidates c ON c.id = cv.id_candidate
        WHERE e.id_rh = :rh_id
        ORDER BY e.date_entretien ASC
    """), {"rh_id": rh.id})

    rows = result.fetchall()

    stats = {"PROPOSE": 0, "CONFIRME": 0, "ENVOYE": 0, "ANNULE": 0, "PLANIFIE": 0}
    events = []
    for row in rows:
        stats[row.statut] = stats.get(row.statut, 0) + 1
        events.append({
            "id":           row.id,
            "title":        f"{row.prenom or ''} {row.nom or ''} — {row.offre_titre}",
            "start":        row.date_entretien.isoformat() if row.date_entretien else None,
            "duree":        row.duree_minutes,
            "type":         row.type_entretien,
            "lieu":         row.lieu,
            "lien_visio":   row.lien_visio,
            "statut":       row.statut,
            "email_envoye": row.email_candidat_envoye,
            "offre_id":     row.offre_id,
            "offre_titre":  row.offre_titre,
            "email":        row.email,
        })

    return {"stats": stats, "total": len(events), "events": events}


# ══════════════════════════════════════════════════════════
# ENDPOINT 8 — Proxy : frontend → backend → n8n (évite CORS)
# Le frontend appelle /api/n8n/declencher-generation
# Le backend appelle http://n8n:5678/webhook/ats-generer-entretiens
# ══════════════════════════════════════════════════════════
@router.post("/declencher-generation")
async def declencher_generation(
    request: Request,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """
    Génère les créneaux directement via le backend Python (fiable, pas de CORS).
    Notifie n8n en parallèle si disponible (optionnel).
    """
    # Génération directe côté backend — robuste et sans dépendance au Code node n8n
    from datetime import timedelta

    # Supprimer les anciens PROPOSE
    await db.execute(text("DELETE FROM entretiens WHERE statut = 'PROPOSE' AND id_rh = :rh_id"),
                     {"rh_id": rh.id})

    result = await db.execute(text("""
        SELECT j.id AS offre_id, j.titre AS offre_titre,
               r.id AS resultat_id,
               c.email AS candidat_email,
               c.nom AS candidat_nom, c.prenom AS candidat_prenom
        FROM resultats r
        JOIN cvs cv       ON cv.id = r.id_cv
        JOIN candidates c ON c.id = cv.id_candidate
        JOIN job_offers j ON j.id = r.id_offre
        WHERE r.decision = 'RETAINED' AND j.statut = 'ACTIVE'
        ORDER BY j.id, r.score_final DESC
    """))
    rows = result.fetchall()

    if not rows:
        return {"success": True, "nb_crees": 0, "total": 0, "message": "Aucun candidat RETAINED actif"}

    exec_id = f"backend-{rh.id}-{int(datetime.now().timestamp())}"

    # Prochain lundi 9h00
    now = datetime.now()
    days_until_monday = (7 - now.weekday()) % 7 or 7
    slot = now.replace(hour=9, minute=0, second=0, microsecond=0) + timedelta(days=days_until_monday)
    while slot.weekday() >= 5:
        slot += timedelta(days=1)

    crees = 0
    for row in rows:
        existing = await db.execute(
            select(Entretien).where(
                Entretien.id_resultat == row.resultat_id,
                Entretien.statut.in_(["CONFIRME", "ENVOYE", "PLANIFIE"])
            )
        )
        if existing.scalars().first():
            continue

        db.add(Entretien(
            id_resultat=row.resultat_id,
            id_offre=row.offre_id,
            id_rh=rh.id,
            date_entretien=slot,
            duree_minutes=30,
            type_entretien="presentiel",
            lieu="RANDA — ZI BIR EL KASAA BEN AROUS",
            statut="PROPOSE",
            email_candidat_envoye=False,
            email_envoye=False,
            n8n_execution_id=exec_id,
        ))
        crees += 1

        slot += timedelta(minutes=45)
        if slot.hour >= 12 and slot.hour < 14:
            slot = slot.replace(hour=14, minute=0)
        if slot.hour >= 18:
            slot = (slot + timedelta(days=1)).replace(hour=9, minute=0)
            while slot.weekday() >= 5:
                slot += timedelta(days=1)

    await db.commit()

    return {"success": True, "nb_crees": crees, "total": len(rows), "n8n_execution_id": exec_id}


@router.post("/declencher-emails")
async def declencher_emails(
    confirmed: list,
    rh=Depends(require_rh),
):
    """
    Proxy vers le webhook n8n d'envoi des emails (si workflow SMTP configuré).
    Sinon, utiliser /envoyer-emails-backend.
    """
    try:
        async with httpx.AsyncClient(timeout=60.0) as client:
            resp = await client.post(
                f"{N8N_INTERNAL_URL}/webhook/ats-envoyer-emails",
                json={"confirmed": confirmed},
                headers={"Content-Type": "application/json"},
            )
            if resp.status_code >= 400:
                raise HTTPException(502, f"n8n a répondu {resp.status_code}")
            return {"success": True, "nb_emails": len(confirmed)}
    except httpx.ConnectError:
        raise HTTPException(503, "n8n n'est pas accessible")
    except httpx.TimeoutException:
        return {"success": True, "nb_emails": len(confirmed), "warning": "n8n timeout"}


# ══════════════════════════════════════════════════════════
# ENDPOINT 10 — Envoi emails via le mailer du backend
# N'utilise pas le noeud SMTP de n8n → pas de credentials à configurer
# ══════════════════════════════════════════════════════════
class EnvoyerEmailsIn(BaseModel):
    confirmed: List[dict]


@router.post("/envoyer-emails-backend")
async def envoyer_emails_backend(
    data: EnvoyerEmailsIn,
    rh=Depends(require_rh),
    db: AsyncSession = Depends(get_db),
):
    """
    Envoie les emails d'invitation directement via le mailer du backend (FastMail/SMTP).
    Appelé après confirmer-tout — évite de configurer SMTP dans n8n.
    """
    from app.core.mailer import send_entretien_invitation

    resultats = []
    for item in data.confirmed:
        ok = await send_entretien_invitation(
            candidat_email=item.get("candidat_email", ""),
            candidat_nom=item.get("candidat_nom", ""),
            offre_titre=item.get("offre_titre", ""),
            date_entretien=item.get("date_iso", ""),
            lieu=item.get("lieu", "RANDA — ZI BIR EL KASAA BEN AROUS"),
            type_entretien=item.get("type", "presentiel"),
            rh_nom=item.get("rh_nom", ""),
            rh_email=item.get("rh_email", ""),
        )

        # Marquer comme ENVOYE en base
        if ok and item.get("entretien_id"):
            result = await db.execute(
                select(Entretien).where(Entretien.id == item["entretien_id"])
            )
            ent = result.scalar_one_or_none()
            if ent:
                ent.statut = "ENVOYE"
                ent.email_envoye = True
                ent.email_candidat_envoye = True

        resultats.append({"email": item.get("candidat_email"), "sent": ok})

    await db.commit()
    nb_sent = sum(1 for r in resultats if r["sent"])

    return {
        "success":  True,
        "nb_sent":  nb_sent,
        "nb_total": len(resultats),
        "resultats": resultats,
    }
