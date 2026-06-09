-- ============================================================
-- A Mi Vera — Migración Fase 7B
-- Multi-categoría (muchos-a-muchos) + Novedades por timestamp
--
-- Qué hace:
--   1. Crea la tabla intermedia producto_categorias.
--   2. Añade la columna novedad_hasta a productos.
--   3. RLS coherente con el resto del esquema (anon lee visible,
--      authenticated+is_admin() escribe).
--
-- Seguro de re-ejecutar: usa IF NOT EXISTS y DROP POLICY IF EXISTS.
-- Ejecutar en: Supabase Dashboard → proyecto DEV → SQL Editor.
--
-- Notas de diseño:
--   - producto_categorias es la nueva fuente de verdad de la relación
--     producto↔categoría. La columna productos.categoria_id se mantiene
--     por compatibilidad con el código actual y se retirará cuando los
--     hooks lean del muchos-a-muchos (paso 2 de la Fase 7B).
--   - Novedades NO es una categoría. Se calcula en el frontend como:
--       (novedad_fija = true OR novedad_hasta > now())      -- fijado manual
--       UNION  (los 10 productos con created_at más reciente) -- automático
--     sobre productos con visible = true. Por eso ambos campos viven en
--     productos y no en producto_categorias.
--   - La columna productos.nuevo (booleano) queda obsoleta; no se usa para
--     Novedades. No se elimina aquí para no romper el código existente.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. TABLA: producto_categorias  (relación muchos-a-muchos)
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS producto_categorias (
  producto_id  UUID        NOT NULL REFERENCES productos(id)  ON DELETE CASCADE,
  categoria_id UUID        NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (producto_id, categoria_id)
);

-- La PK ya indexa (producto_id, categoria_id). Para las búsquedas inversas
-- (¿qué productos tiene esta categoría?) hace falta un índice por categoria_id.
CREATE INDEX IF NOT EXISTS idx_producto_categorias_categoria
  ON producto_categorias (categoria_id);


-- ────────────────────────────────────────────────────────────
-- 2. COLUMNAS DE NOVEDADES: productos.novedad_hasta + novedad_fija
--
--    Fijado manual en Novedades con caducidad:
--      - 7 / 15 / 30 días → novedad_hasta = now() + intervalo, novedad_fija = false
--      - "Indefinido"     → novedad_fija = true (novedad_hasta se ignora)
--      - No fijado        → novedad_fija = false y novedad_hasta = NULL
--
--    novedad_fija evita usar una fecha-sentinel falsa para significar
--    "fijo para siempre": es explícito y honesto de leer.
-- ────────────────────────────────────────────────────────────
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS novedad_hasta TIMESTAMPTZ;

ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS novedad_fija BOOLEAN NOT NULL DEFAULT false;

-- Índice parcial: solo indexa los productos realmente fijados con fecha.
CREATE INDEX IF NOT EXISTS idx_productos_novedad_hasta
  ON productos (novedad_hasta)
  WHERE novedad_hasta IS NOT NULL;

-- Índice para el "top 10 más recientes" de Novedades.
CREATE INDEX IF NOT EXISTS idx_productos_created_at
  ON productos (created_at DESC);


-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY — producto_categorias
-- ────────────────────────────────────────────────────────────
ALTER TABLE producto_categorias ENABLE ROW LEVEL SECURITY;

-- Lectura pública: solo enlaces de productos visibles
DROP POLICY IF EXISTS "producto_categorias_lectura_publica" ON producto_categorias;
CREATE POLICY "producto_categorias_lectura_publica"
  ON producto_categorias
  FOR SELECT
  TO anon
  USING (
    producto_id IN (
      SELECT id FROM productos WHERE visible = true
    )
  );

-- CRUD solo para la admin
DROP POLICY IF EXISTS "producto_categorias_crud_admin" ON producto_categorias;
CREATE POLICY "producto_categorias_crud_admin"
  ON producto_categorias
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ────────────────────────────────────────────────────────────
-- 4. VERIFICACIÓN (opcional — ejecutar tras la migración)
-- ────────────────────────────────────────────────────────────
-- SELECT column_name, data_type, is_nullable
--   FROM information_schema.columns
--  WHERE table_name = 'productos' AND column_name = 'novedad_hasta';
--
-- SELECT tablename, policyname
--   FROM pg_policies
--  WHERE tablename = 'producto_categorias';
-- ============================================================
