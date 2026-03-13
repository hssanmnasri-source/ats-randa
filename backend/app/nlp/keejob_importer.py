"""
keejob_importer.py
Import en masse de CVs depuis un dossier.
Formats supportés : PDF (natif + scanné OCR), JPG/PNG (OCR), DOCX/DOC.

Usage (depuis le dossier backend/) :
  python -m app.nlp.keejob_importer /chemin/vers/dossier/cvs
  python -m app.nlp.keejob_importer /chemin --agent-id 1
  python -m app.nlp.keejob_importer /chemin --dry-run
  python -m app.nlp.keejob_importer /chemin --all-files   # inclut JPG, PNG, DOCX

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

# Langues OCR : arabe + français + anglais
_OCR_LANG = "ara+fra+eng"

# Extensions supportées
_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
_WORD_EXTS  = {".docx", ".doc"}
_PDF_EXTS   = {".pdf"}


# ══════════════════════════════════════════════════════════════════════════════
# EXTRACTION TEXTE — multi-format
# ══════════════════════════════════════════════════════════════════════════════

def _clean(text: str) -> str:
    """Supprime les null bytes rejetés par PostgreSQL UTF-8."""
    return text.replace('\x00', '')


def _extract_pdf_text(path: Path) -> str:
    """
    Extrait le texte d'un PDF.
    - Essaie d'abord pdfplumber (PDF natif/texte).
    - Si le texte est trop court (PDF scanné), bascule sur OCR Tesseract page par page.
    """
    parts: list[str] = []
    with pdfplumber.open(str(path)) as pdf:
        for page in pdf.pages:
            txt = page.extract_text() or ""
            txt = _clean(txt)
            if len(txt.strip()) > 30:
                parts.append(txt)
            else:
                # PDF scanné : convertir la page en image puis OCR
                try:
                    from pdf2image import convert_from_path
                    import pytesseract
                    images = convert_from_path(str(path), first_page=page.page_number,
                                               last_page=page.page_number, dpi=200)
                    for img in images:
                        ocr_txt = pytesseract.image_to_string(img, lang=_OCR_LANG)
                        cleaned = _clean(ocr_txt)
                        if cleaned.strip():
                            parts.append(cleaned)
                except Exception as e:
                    logger.debug(f"OCR page {page.page_number} échouée: {e}")
    return "\n".join(parts)


def _extract_image_text(path: Path) -> str:
    """OCR direct sur une image JPG/PNG."""
    import pytesseract
    from PIL import Image
    img = Image.open(str(path))
    text = pytesseract.image_to_string(img, lang=_OCR_LANG)
    return _clean(text)


def _extract_docx_text(path: Path) -> str:
    """Extrait le texte d'un fichier DOCX/DOC."""
    ext = path.suffix.lower()
    if ext == ".docx":
        import docx as docx_lib
        doc = docx_lib.Document(str(path))
        lines = [para.text for para in doc.paragraphs if para.text.strip()]
        return _clean("\n".join(lines))
    elif ext == ".doc":
        # .doc ancien format : essayer via antiword ou conversion
        import subprocess
        try:
            result = subprocess.run(
                ["antiword", str(path)], capture_output=True, text=True, timeout=15
            )
            if result.returncode == 0 and result.stdout.strip():
                return _clean(result.stdout)
        except FileNotFoundError:
            pass
        # Fallback: lire les bytes bruts et extraire les chaînes ASCII/UTF
        raw = path.read_bytes()
        text = raw.decode("latin-1", errors="ignore")
        # Garder uniquement les lignes avec assez de caractères imprimables
        lines = [l.strip() for l in text.splitlines() if len(l.strip()) > 10]
        return _clean("\n".join(lines))
    return ""


def extract_text(path: Path) -> str:
    """Dispatch vers le bon extracteur selon l'extension du fichier."""
    ext = path.suffix.lower()
    if ext in _PDF_EXTS:
        return _extract_pdf_text(path)
    elif ext in _IMAGE_EXTS:
        return _extract_image_text(path)
    elif ext in _WORD_EXTS:
        return _extract_docx_text(path)
    return ""


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
    Traite un seul fichier CV (PDF, image, Word).

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
        # ── a. Extraction du texte (PDF natif / OCR / DOCX) ──────────────
        cv_text = extract_text(pdf_path)
        if not cv_text.strip():
            result["status"] = "error"
            result["erreur"] = "Fichier vide ou illisible (texte non extrait)"
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

def _collect_files(folder: Path, keejob_only: bool, all_files: bool) -> list[Path]:
    """Collecte les fichiers à importer selon le mode choisi."""
    if keejob_only:
        logger.info("Mode : uniquement les exports Keejob (cv_keejob_*.pdf)")
        return sorted(folder.rglob("cv_keejob_*.pdf"))

    all_exts = _PDF_EXTS | _IMAGE_EXTS | (_WORD_EXTS if all_files else set())
    files: list[Path] = []
    for ext in all_exts:
        files.extend(folder.rglob(f"*{ext}"))
        files.extend(folder.rglob(f"*{ext.upper()}"))

    if all_files:
        logger.info(f"Mode : tous les fichiers (PDF + images + Word) — {len(files)} fichiers")
    else:
        logger.info(f"Mode : tous les PDFs du dossier — {len(files)} fichiers")
    return sorted(set(files))


async def import_folder(
    folder_path: str,
    agent_id: int | None = None,
    dry_run: bool = False,
    keejob_only: bool = True,
    all_files: bool = False,
) -> None:
    """
    Parcourt récursivement un dossier et importe tous les CVs.

    Args:
        folder_path:  Chemin vers le dossier racine.
        agent_id:     ID de l'agent responsable de l'import (optionnel).
        dry_run:      Si True, simule sans écrire en DB.
        keejob_only:  Si True, importe uniquement les fichiers 'cv_keejob_*.pdf'.
        all_files:    Si True, inclut images JPG/PNG et fichiers Word DOCX/DOC.
    """
    folder = Path(folder_path)
    if not folder.exists():
        logger.error(f"Dossier introuvable : {folder_path}")
        sys.exit(1)

    cv_files = _collect_files(folder, keejob_only, all_files)

    if not cv_files:
        logger.warning(f"Aucun fichier CV trouvé dans : {folder_path}")
        return

    prefix = "[DRY RUN] " if dry_run else ""
    logger.info(f"{prefix}{len(cv_files)} fichier(s) à traiter dans {folder_path}")

    stats = {"imported": 0, "duplicate": 0, "error": 0, "dry_run": 0}
    errors: list[dict] = []

    for idx, pdf_path in enumerate(cv_files, 1):
        logger.info(f"[{idx:>4}/{len(cv_files)}] {pdf_path.name}")

        # Session fraîche par CV : si un CV plante, la session suivante est propre
        async with AsyncSessionLocal() as db:
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
        logger.info   (f"  TOTAL     : {len(cv_files)}")

    if errors:
        logger.info("\nDétail des erreurs :")
        for err in errors:
            logger.error(f"  - {err['fichier']}: {err['erreur']}")


# ══════════════════════════════════════════════════════════════════════════════
# POINT D'ENTRÉE CLI
# ══════════════════════════════════════════════════════════════════════════════

def main() -> None:
    parser = argparse.ArgumentParser(
        description="Import en masse de CVs (PDF, images, Word) vers la base ATS RANDA",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemples :
  python -m app.nlp.keejob_importer /data/cvs
  python -m app.nlp.keejob_importer /data/cvs --agent-id 1
  python -m app.nlp.keejob_importer /data/cvs --dry-run
  python -m app.nlp.keejob_importer /data/cvs --all-pdfs
  python -m app.nlp.keejob_importer /data/cvs --all-files   # PDF + JPG/PNG + DOCX
        """,
    )
    parser.add_argument("folder", help="Dossier contenant les CVs (recherche récursive)")
    parser.add_argument("--agent-id", type=int, default=None, metavar="N",
                        help="ID de l'agent responsable de l'import")
    parser.add_argument("--dry-run", action="store_true",
                        help="Simuler sans écrire en DB")
    parser.add_argument("--all-pdfs", action="store_true",
                        help="Importer tous les PDFs (pas seulement cv_keejob_*.pdf)")
    parser.add_argument("--all-files", action="store_true",
                        help="Importer tous les formats : PDF + images (JPG/PNG) + Word (DOCX/DOC)")

    args = parser.parse_args()

    asyncio.run(import_folder(
        folder_path=args.folder,
        agent_id=args.agent_id,
        dry_run=args.dry_run,
        keejob_only=not (args.all_pdfs or args.all_files),
        all_files=args.all_files,
    ))


if __name__ == "__main__":
    main()
