"""
keejob_importer.py
Import en masse de CVs Keejob depuis un dossier de PDFs.

Usage (depuis le dossier backend/) :
  python -m app.nlp.keejob_importer /chemin/vers/dossier/cvs
  python -m app.nlp.keejob_importer /chemin --agent-id 1
  python -m app.nlp.keejob_importer /chemin --dry-run

Gestion des erreurs : un CV qui plante n'arrête pas l'import.
"""

import asyncio
import argparse
import sys
from pathlib import Path
from datetime import datetime

import pdfplumber
from loguru import logger

# Rendre le package backend importable quand le script est lancé directement
sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

from app.core.database import AsyncSessionLocal
from app.models.db_models import CVStatus
from app.repositories import cv_repository, candidate_repository
from app.nlp.keejob_parser import parse_keejob_cv


# ══════════════════════════════════════════════════════════════════════════════
# EXTRACTION TEXTE
# ══════════════════════════════════════════════════════════════════════════════

def _extract_pdf_text(pdf_path: Path) -> str:
    """Extrait le texte de toutes les pages d'un PDF avec pdfplumber."""
    parts: list[str] = []
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text()
            if txt:
                parts.append(txt)
    return "\n".join(parts)


# ══════════════════════════════════════════════════════════════════════════════
# IMPORT D'UN SEUL CV
# ══════════════════════════════════════════════════════════════════════════════

async def import_single_cv(
    db,
    pdf_path: Path,
    agent_id: int | None,
    dry_run: bool = False,
) -> dict:
    """
    Traite un seul PDF Keejob.

    Returns:
        dict avec 'status': 'imported' | 'duplicate' | 'error' | 'dry_run'
    """
    result = {
        "fichier":      pdf_path.name,
        "status":       None,
        "cv_id":        None,
        "candidate_id": None,
        "email":        None,
        "erreur":       None,
    }

    try:
        # ── a. Extraction du texte ────────────────────────────────────────
        cv_text = _extract_pdf_text(pdf_path)
        if not cv_text.strip():
            result["status"] = "error"
            result["erreur"] = "PDF vide ou illisible (texte non extrait)"
            return result

        # ── b. Parsing ────────────────────────────────────────────────────
        entities = parse_keejob_cv(cv_text)
        result["email"] = entities.get("email")

        # Mode simulation : ne pas écrire en DB
        if dry_run:
            result["status"] = "dry_run"
            result["preview"] = {k: entities.get(k) for k in (
                "nom", "prenom", "email", "telephone",
                "niveau_etude", "experience_annees", "titre_poste",
            )}
            result["nb_competences"] = len(entities.get("competences", []))
            result["nb_experiences"]  = len(entities.get("experiences", []))
            return result

        # ── c. Candidat ───────────────────────────────────────────────────
        candidate_data: dict = {
            "nom":    entities.get("nom") or "Inconnu",
            "prenom": entities.get("prenom") or "Inconnu",
            "email":  entities.get("email"),
            "telephone": entities.get("telephone"),
            "adresse":   entities.get("adresse"),
        }
        # Estimation de la date de naissance à partir de l'âge
        if entities.get("age"):
            candidate_data["date_naissance"] = str(datetime.now().year - entities["age"])

        # Supprimer les None pour ne pas écraser d'éventuelles données existantes
        candidate_data = {k: v for k, v in candidate_data.items() if v is not None}

        candidate, created = await candidate_repository.get_or_create(db, candidate_data)
        result["candidate_id"] = candidate.id

        # ── d. Vérifier doublon ───────────────────────────────────────────
        if not created:
            _, existing = await cv_repository.list_by_candidate(db, candidate.id, 0, 1)
            if existing:
                result["status"] = "duplicate"
                return result

        # ── e. Créer le CV ────────────────────────────────────────────────
        cv = await cv_repository.create(db, {
            "id_candidate": candidate.id,
            "id_agent":     agent_id,
            "statut":       CVStatus.INDEXED,
            "fichier_pdf":  str(pdf_path),
            "cv_text":      cv_text,
            "cv_entities":  entities,
        })
        result["cv_id"] = cv.id

        # ── f. Compétences ────────────────────────────────────────────────
        if entities.get("competences"):
            await cv_repository.add_competences(db, cv.id, entities["competences"])

        # ── g. Expériences ────────────────────────────────────────────────
        if entities.get("experiences"):
            await cv_repository.add_experiences(db, cv.id, entities["experiences"])

        result["status"] = "imported"

    except Exception as exc:
        result["status"] = "error"
        result["erreur"] = str(exc)
        logger.exception(f"Erreur inattendue sur {pdf_path.name}: {exc}")

    return result


# ══════════════════════════════════════════════════════════════════════════════
# IMPORT D'UN DOSSIER COMPLET
# ══════════════════════════════════════════════════════════════════════════════

async def import_folder(
    folder_path: str,
    agent_id: int | None = None,
    dry_run: bool = False,
    keejob_only: bool = True,
) -> None:
    """
    Parcourt récursivement un dossier et importe tous les PDFs Keejob.

    Args:
        folder_path:  Chemin vers le dossier racine.
        agent_id:     ID de l'agent responsable de l'import (optionnel).
        dry_run:      Si True, simule sans écrire en DB.
        keejob_only:  Si True, importe uniquement les fichiers 'cv_keejob_*.pdf'.
    """
    folder = Path(folder_path)
    if not folder.exists():
        logger.error(f"Dossier introuvable : {folder_path}")
        sys.exit(1)

    # Trouver tous les PDFs
    if keejob_only:
        # Seulement les exports Keejob natifs (nommés cv_keejob_NNNNN.pdf)
        pdf_files = sorted(folder.rglob("cv_keejob_*.pdf"))
        logger.info("Mode : uniquement les exports Keejob (cv_keejob_*.pdf)")
    else:
        pdf_files = sorted(folder.rglob("*.pdf")) + sorted(folder.rglob("*.PDF"))
        logger.info("Mode : tous les PDFs du dossier")

    if not pdf_files:
        logger.warning(f"Aucun PDF trouvé dans : {folder_path}")
        return

    prefix = "[DRY RUN] " if dry_run else ""
    logger.info(f"{prefix}{len(pdf_files)} PDF(s) à traiter dans {folder_path}")

    stats = {"imported": 0, "duplicate": 0, "error": 0, "dry_run": 0}
    errors: list[dict] = []

    async with AsyncSessionLocal() as db:
        for idx, pdf_path in enumerate(pdf_files, 1):
            logger.info(f"[{idx:>4}/{len(pdf_files)}] {pdf_path.name}")

            result = await import_single_cv(db, pdf_path, agent_id, dry_run)
            status = result["status"]
            stats[status] = stats.get(status, 0) + 1

            if status == "imported":
                logger.success(
                    f"  ✓ CV #{result['cv_id']} | Candidat #{result['candidate_id']}"
                    f" | {result.get('email') or 'sans email'}"
                )
            elif status == "dry_run":
                p = result.get("preview", {})
                logger.info(
                    f"  ~ {p.get('prenom')} {p.get('nom')} | {p.get('email')}"
                    f" | Exp: {p.get('experience_annees')} ans"
                    f" | {result.get('nb_competences', 0)} compétences"
                    f" | {result.get('nb_experiences', 0)} expériences"
                )
            elif status == "duplicate":
                logger.warning(f"  ⚠ Doublon — Candidat #{result['candidate_id']} déjà en DB")
            elif status == "error":
                logger.error(f"  ✗ {result['erreur']}")
                errors.append({"fichier": result["fichier"], "erreur": result["erreur"]})

    # ── Résumé final ──────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("RÉSUMÉ D'IMPORT")
    logger.info("=" * 60)
    if dry_run:
        logger.info(f"[DRY RUN] {stats['dry_run']} CVs analysés — aucune écriture en DB")
    else:
        logger.success(f"✓ Importés  : {stats['imported']}")
        logger.warning(f"⚠ Doublons  : {stats['duplicate']}")
        logger.error  (f"✗ Erreurs   : {stats['error']}")
        logger.info   (f"  TOTAL     : {len(pdf_files)}")

    if errors:
        logger.info("\nDétail des erreurs :")
        for err in errors:
            logger.error(f"  - {err['fichier']}: {err['erreur']}")


# ══════════════════════════════════════════════════════════════════════════════
# POINT D'ENTRÉE CLI
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import en masse de CVs Keejob (PDF) vers la base ATS RANDA",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python -m app.nlp.keejob_importer /data/cvs
  python -m app.nlp.keejob_importer /data/cvs --agent-id 1
  python -m app.nlp.keejob_importer /data/cvs --dry-run
  python -m app.nlp.keejob_importer /data/cvs --all-pdfs
        """,
    )
    parser.add_argument("folder", help="Dossier contenant les PDFs Keejob (recherche récursive)")
    parser.add_argument("--agent-id", type=int, default=None, metavar="N",
                        help="ID de l'agent responsable de l'import")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simuler sans écrire en DB")
    parser.add_argument("--all-pdfs", action="store_true",
                        help="Importer tous les PDFs (pas seulement cv_keejob_*.pdf)")

    args = parser.parse_args()

    asyncio.run(import_folder(
        folder_path=args.folder,
        agent_id=args.agent_id,
        dry_run=args.dry_run,
        keejob_only=not args.all_pdfs,
    ))


if __name__ == "__main__":
    main()
