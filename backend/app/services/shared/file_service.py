"""
file_service.py
Utilitaires partagés pour la gestion de fichiers uploadés.
"""
import uuid
from pathlib import Path

from app.core.config import settings


def save_upload(file_bytes: bytes, filename: str, subfolder: str = "cvs") -> str:
    """
    Sauvegarde un fichier uploadé dans UPLOAD_DIR/{subfolder}/
    Retourne le nom du fichier sauvegardé (UUID + extension).
    """
    ext = Path(filename).suffix.lower() if filename else ".bin"
    unique_name = f"{uuid.uuid4().hex}{ext}"
    dest_dir = Path(settings.UPLOAD_DIR) / subfolder
    dest_dir.mkdir(parents=True, exist_ok=True)
    dest_path = dest_dir / unique_name
    dest_path.write_bytes(file_bytes)
    return unique_name


def delete_upload(filename: str, subfolder: str = "cvs") -> bool:
    """Supprime un fichier uploadé. Retourne True si supprimé."""
    path = Path(settings.UPLOAD_DIR) / subfolder / filename
    if path.exists():
        path.unlink()
        return True
    return False


def get_upload_path(filename: str, subfolder: str = "cvs") -> str:
    """Retourne le chemin absolu d'un fichier uploadé."""
    return str(Path(settings.UPLOAD_DIR) / subfolder / filename)
