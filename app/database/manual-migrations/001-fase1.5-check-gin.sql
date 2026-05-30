-- Manual Migration 001: Fase 1.5 — Document schema hardening
-- Descripción: CHECK constraint para processing_status + índice GIN full-text
-- Aplicar después de drizzle-kit push
-- Fecha: 2026-05-30

-- 1. CHECK constraint para processing_status (Drizzle no genera CHECK en columna text)
ALTER TABLE documents DROP CONSTRAINT IF EXISTS chk_documents_processing_status;
ALTER TABLE documents ADD CONSTRAINT chk_documents_processing_status
  CHECK (processing_status IN (
    'pending', 'uploaded', 'ocr_processing', 'ocr_complete',
    'ocr_skipped', 'manual_review', 'error', 'retry_pending'
  ));

-- 2. Índice GIN full-text sobre ocr_text (Drizzle no soporta GIN nativo)
-- Requiere que la extensión pg_trgm esté disponible (Neon DB la incluye por defecto)
CREATE INDEX IF NOT EXISTS idx_documents_ocr_text
  ON documents USING gin(to_tsvector('spanish', COALESCE(ocr_text, '')));
