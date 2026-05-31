-- Manual Migration 002: Fase 2 — pgvector extension + legal_documents table
-- Descripción: Activa extensión pgvector y crea tabla con embeddings
-- Fecha: 2026-05-31

-- 1. Activar extensión pgvector (Neon DB la soporta nativamente)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Verificar que la extensión está activa
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
