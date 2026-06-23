-- ============================================================
-- A Mi Vera — Migración: tabla "paginas" (contenido editable de páginas)
-- Fase 8B (editor de páginas en línea)
--
-- Una fila por página (slug: 'inicio', 'nosotros'…) con el contenido en JSONB.
-- Los valores por defecto viven en el código (src/content/*.ts); esta tabla
-- solo guarda lo que la admin sobreescriba. Si no hay fila, la web usa el código.
--
-- Instrucciones:
--   Supabase Dashboard → proyecto DEV → SQL Editor → pegar y ejecutar.
--   Repetir en PROD cuando el editor esté validado.
-- ============================================================

CREATE TABLE IF NOT EXISTS paginas (
  slug        TEXT PRIMARY KEY,
  contenido   JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Mantener updated_at al día en cada UPDATE
CREATE OR REPLACE FUNCTION paginas_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS paginas_set_updated_at ON paginas;
CREATE TRIGGER paginas_set_updated_at
  BEFORE UPDATE ON paginas
  FOR EACH ROW
  EXECUTE FUNCTION paginas_touch_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE paginas ENABLE ROW LEVEL SECURITY;

-- Lectura pública (la web lee el contenido)
DROP POLICY IF EXISTS "paginas_lectura_publica" ON paginas;
CREATE POLICY "paginas_lectura_publica"
  ON paginas
  FOR SELECT
  TO anon
  USING (true);

-- Escritura solo para la admin
DROP POLICY IF EXISTS "paginas_crud_admin" ON paginas;
CREATE POLICY "paginas_crud_admin"
  ON paginas
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
