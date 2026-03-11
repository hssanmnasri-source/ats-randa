import pytesseract
from PIL import Image
import pdfplumber
import io
import logging

logger = logging.getLogger(__name__)

def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        text = pytesseract.image_to_string(
            image,
            lang="fra+eng",
            config="--psm 6"
        )
        logger.info(f"OCR image — {len(text)} caractères")
        return text.strip()
    except Exception as e:
        logger.error(f"Erreur OCR image: {e}")
        return ""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"

        # Si PDF scanné → OCR sur chaque page
        if not text.strip():
            logger.info("PDF scanné détecté → OCR")
            with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
                for page in pdf.pages:
                    img = page.to_image(resolution=300).original
                    page_text = pytesseract.image_to_string(
                        img,
                        lang="fra+eng",
                        config="--psm 6"
                    )
                    text += page_text + "\n"

        logger.info(f"PDF parsé — {len(text)} caractères")
        return text.strip()

    except Exception as e:
        logger.error(f"Erreur PDF: {e}")
        return ""

def extract_text(file_bytes: bytes, content_type: str) -> str:
    if content_type in ["image/jpeg", "image/jpg", "image/png", "image/webp"]:
        return extract_text_from_image(file_bytes)
    elif content_type == "application/pdf":
        return extract_text_from_pdf(file_bytes)
    return ""