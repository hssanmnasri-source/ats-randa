import io
import logging

import pdfplumber
import pytesseract
from PIL import Image

logger = logging.getLogger(__name__)


def extract_text_from_image(file_bytes: bytes, multi_column: bool = False) -> str:
    """
    Extrait le texte d'une image via Tesseract OCR.

    Args:
        multi_column: Si True, utilise --psm 3 (segmentation automatique)
                      au lieu de --psm 6 (bloc uniforme) pour mieux gérer
                      les CVs à deux colonnes.
    """
    psm = "3" if multi_column else "6"
    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        text = pytesseract.image_to_string(
            image,
            lang="fra+eng+ara",
            config=f"--psm {psm}",
        )
        logger.info(f"OCR image (psm={psm}) — {len(text)} caractères")
        return text.strip()
    except Exception as e:
        logger.error(f"Erreur OCR image: {e}")
        return ""


def extract_text_from_pdf(file_bytes: bytes, multi_column: bool = False) -> str:
    """
    Extrait le texte d'un PDF.

    Pour les PDFs numériques, pdfplumber gère déjà les colonnes correctement.
    Pour les PDFs scannés (pas de couche texte), on passe en OCR Tesseract avec
    le PSM adapté au type de mise en page.

    Args:
        multi_column: Si True, utilise --psm 3 pour l'OCR des PDFs scannés
                      afin de mieux traiter les CVs à deux colonnes.
    """
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        # PDF scanné (pas de couche texte) → OCR page par page
        if not text.strip():
            psm = "3" if multi_column else "6"
            logger.info(f"PDF scanné détecté → OCR (psm={psm})")
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    img = page.to_image(resolution=300).original
                    page_text = pytesseract.image_to_string(
                        img,
                        lang="fra+eng+ara",
                        config=f"--psm {psm}",
                    )
                    text += page_text + "\n"

        logger.info(f"PDF parsé — {len(text)} caractères")
        return text.strip()

    except Exception as e:
        logger.error(f"Erreur PDF: {e}")
        return ""


def extract_text(
    file_bytes: bytes,
    content_type: str,
    multi_column: bool = False,
) -> str:
    """
    Point d'entrée unifié.

    Args:
        content_type: MIME type du fichier.
        multi_column: Passer True pour les CVs de source AGENT/CANDIDAT
                      susceptibles d'avoir une mise en page à deux colonnes.
    """
    if content_type in ("image/jpeg", "image/jpg", "image/png", "image/webp"):
        return extract_text_from_image(file_bytes, multi_column=multi_column)
    if content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes, multi_column=multi_column)
    return ""
