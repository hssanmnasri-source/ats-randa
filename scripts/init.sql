-- Activer pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Vérifier
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';