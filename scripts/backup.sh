#!/bin/bash
# ════════════════════════════════════════
# ATS RANDA — Backup PostgreSQL
# Usage  : ./scripts/backup.sh
# Cron   : 0 2 * * * /path/to/scripts/backup.sh
# ════════════════════════════════════════

set -e

BACKUP_DIR="./backups"
CONTAINER="ats_postgres"
DB_NAME="${POSTGRES_DB:-ats_db}"
DB_USER="${POSTGRES_USER:-ats_user}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/ats_randa_${DATE}.sql.gz"
MAX_BACKUPS=7

mkdir -p "$BACKUP_DIR"

echo "🗄️  Backup ATS RANDA — $(date)"
echo "    Base    : $DB_NAME"
echo "    Fichier : $BACKUP_FILE"

docker exec "$CONTAINER" \
    pg_dump -U "$DB_USER" "$DB_NAME" \
    | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "✅ Backup créé ($SIZE)"

# Supprimer les anciens au-delà de MAX_BACKUPS
ls -t "$BACKUP_DIR"/*.sql.gz 2>/dev/null \
    | tail -n +$((MAX_BACKUPS + 1)) \
    | xargs rm -f 2>/dev/null || true

echo "📋 Backups disponibles :"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null || echo "    (aucun)"
