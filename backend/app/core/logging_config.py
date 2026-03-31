"""
Logging structuré avec Loguru pour ATS RANDA.
Sortie JSON en production, format lisible en développement.
"""
import sys
import json
from pathlib import Path
from loguru import logger


def setup_logging(log_level: str = "INFO", log_to_file: bool = False) -> "logger":
    """Configure Loguru : stdout coloré + fichiers JSON avec rotation."""

    logger.remove()

    # ── Console ── format lisible (dev) ──────────
    logger.add(
        sys.stdout,
        level=log_level,
        format=(
            "<green>{time:HH:mm:ss}</green> | "
            "<level>{level: <8}</level> | "
            "<cyan>{module}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> | "
            "{message}"
        ),
        colorize=True,
    )

    # ── Fichiers JSON ── rotation quotidienne (prod) ──
    if log_to_file:
        Path("logs").mkdir(exist_ok=True)

        def _json_format(record: dict) -> str:
            data = {
                "timestamp": record["time"].isoformat(),
                "level": record["level"].name,
                "module": record["module"],
                "function": record["function"],
                "line": record["line"],
                "message": record["message"],
            }
            if record["extra"]:
                data["extra"] = record["extra"]
            if record["exception"]:
                data["exception"] = str(record["exception"])
            return json.dumps(data, ensure_ascii=False)

        # Tous les logs (rotation minuit, 30 jours, compressés)
        logger.add(
            "logs/ats_randa_{time:YYYY-MM-DD}.log",
            level=log_level,
            format=_json_format,
            rotation="00:00",
            retention="30 days",
            compression="gz",
            enqueue=True,
        )

        # Erreurs seulement (90 jours)
        logger.add(
            "logs/errors_{time:YYYY-MM-DD}.log",
            level="ERROR",
            format=_json_format,
            rotation="00:00",
            retention="90 days",
            compression="gz",
            enqueue=True,
        )

    return logger


app_logger = setup_logging()
