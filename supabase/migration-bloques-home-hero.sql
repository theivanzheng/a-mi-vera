-- ============================================================
-- A Mi Vera — Migración: campos hero en bloques_home
-- Fase 8A (editor de portada)
--
-- Instrucciones:
--   Abrir Supabase Dashboard → proyecto DEV → SQL Editor.
--   Pegar y ejecutar este archivo completo.
--   Repetir en PROD cuando el editor esté validado.
-- ============================================================

ALTER TABLE bloques_home
  ADD COLUMN IF NOT EXISTS pill_texto TEXT,   -- pastilla sobre el título ("NUEVA COLECCIÓN")
  ADD COLUMN IF NOT EXISTS cta_texto  TEXT;   -- texto del botón CTA ("Ver el catálogo")
