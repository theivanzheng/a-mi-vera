-- ============================================================
-- A Mi Vera — Esquema COMPLETO e IDEMPOTENTE para PRODUCCIÓN
--
-- Reúne el esquema base + todas las migraciones (N:N de categorías,
-- novedades, campos del héroe, tabla de páginas). Todo con IF NOT EXISTS /
-- DROP ... IF EXISTS, así que es seguro ejecutarlo aunque PROD ya tenga
-- algunas tablas: crea lo que falte y no rompe lo existente.
--
-- Pasos:
--   1. Supabase Dashboard → proyecto PRODUCCIÓN → SQL Editor.
--   2. ⚠️ Revisa el email de is_admin() (abajo) para que sea el de la
--      cuenta admin de PROD.
--   3. Pega este archivo entero y ejecuta.
--   4. Después, copia los datos con:  npm run migrate:prod -- --go
-- ============================================================


-- ── Funciones ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ⚠️ EMAIL ADMIN DE PRODUCCIÓN — cámbialo si la cuenta admin de PROD usa otro.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT (auth.jwt() ->> 'email') = 'gestion.amivera@gmail.com';
$$;


-- ── Tablas ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categorias (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  visible    BOOLEAN     NOT NULL DEFAULT true,
  orden      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS productos (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT          NOT NULL,
  slug         TEXT          NOT NULL UNIQUE,
  descripcion  TEXT,
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  categoria_id UUID          REFERENCES categorias(id) ON DELETE SET NULL,
  stock        INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  visible      BOOLEAN       NOT NULL DEFAULT true,
  destacado    BOOLEAN       NOT NULL DEFAULT false,
  nuevo        BOOLEAN       NOT NULL DEFAULT false,
  orden        INTEGER       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);
-- Columnas de Novedades (migración 7B) — por si la tabla ya existía sin ellas
ALTER TABLE productos ADD COLUMN IF NOT EXISTS novedad_hasta TIMESTAMPTZ;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS novedad_fija  BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS imagenes_producto (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url         TEXT,
  path        TEXT,
  alt         TEXT,
  orden       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_imagen_origen CHECK (url IS NOT NULL OR path IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS producto_categorias (
  producto_id  UUID        NOT NULL REFERENCES productos(id)  ON DELETE CASCADE,
  categoria_id UUID        NOT NULL REFERENCES categorias(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (producto_id, categoria_id)
);

CREATE TABLE IF NOT EXISTS bloques_home (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         TEXT        NOT NULL CHECK (tipo IN ('hero', 'banner', 'featured')),
  titulo       TEXT,
  subtitulo    TEXT,
  imagen_url   TEXT,
  categoria_id UUID        REFERENCES categorias(id) ON DELETE SET NULL,
  visible      BOOLEAN     NOT NULL DEFAULT true,
  orden        INTEGER     NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE bloques_home ADD COLUMN IF NOT EXISTS pill_texto TEXT;
ALTER TABLE bloques_home ADD COLUMN IF NOT EXISTS cta_texto  TEXT;

CREATE TABLE IF NOT EXISTS paginas (
  slug        TEXT PRIMARY KEY,
  contenido   JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ── Índices ──────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_categoria_id ON productos (categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_visible      ON productos (visible);
CREATE INDEX IF NOT EXISTS idx_productos_orden        ON productos (orden);
CREATE INDEX IF NOT EXISTS idx_productos_created_at   ON productos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_novedad_hasta ON productos (novedad_hasta) WHERE novedad_hasta IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_imagenes_producto_id   ON imagenes_producto (producto_id);
CREATE INDEX IF NOT EXISTS idx_imagenes_orden         ON imagenes_producto (producto_id, orden);
CREATE INDEX IF NOT EXISTS idx_categorias_visible     ON categorias (visible);
CREATE INDEX IF NOT EXISTS idx_categorias_orden       ON categorias (orden);
CREATE INDEX IF NOT EXISTS idx_bloques_home_visible   ON bloques_home (visible);
CREATE INDEX IF NOT EXISTS idx_bloques_home_orden     ON bloques_home (orden);
CREATE INDEX IF NOT EXISTS idx_producto_categorias_categoria ON producto_categorias (categoria_id);


-- ── Triggers updated_at ──────────────────────────────────────
DROP TRIGGER IF EXISTS trg_categorias_updated_at ON categorias;
CREATE TRIGGER trg_categorias_updated_at   BEFORE UPDATE ON categorias   FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_productos_updated_at ON productos;
CREATE TRIGGER trg_productos_updated_at    BEFORE UPDATE ON productos    FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_bloques_home_updated_at ON bloques_home;
CREATE TRIGGER trg_bloques_home_updated_at BEFORE UPDATE ON bloques_home FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS paginas_set_updated_at ON paginas;
CREATE TRIGGER paginas_set_updated_at      BEFORE UPDATE ON paginas      FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ── RLS ──────────────────────────────────────────────────────
ALTER TABLE categorias          ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_producto   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_home        ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE paginas             ENABLE ROW LEVEL SECURITY;

-- categorias
DROP POLICY IF EXISTS "categorias_lectura_publica" ON categorias;
CREATE POLICY "categorias_lectura_publica" ON categorias FOR SELECT TO anon USING (visible = true);
DROP POLICY IF EXISTS "categorias_crud_admin" ON categorias;
CREATE POLICY "categorias_crud_admin" ON categorias FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- productos
DROP POLICY IF EXISTS "productos_lectura_publica" ON productos;
CREATE POLICY "productos_lectura_publica" ON productos FOR SELECT TO anon USING (visible = true);
DROP POLICY IF EXISTS "productos_crud_admin" ON productos;
CREATE POLICY "productos_crud_admin" ON productos FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- imagenes_producto
DROP POLICY IF EXISTS "imagenes_lectura_publica" ON imagenes_producto;
CREATE POLICY "imagenes_lectura_publica" ON imagenes_producto FOR SELECT TO anon
  USING (producto_id IN (SELECT id FROM productos WHERE visible = true));
DROP POLICY IF EXISTS "imagenes_crud_admin" ON imagenes_producto;
CREATE POLICY "imagenes_crud_admin" ON imagenes_producto FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- bloques_home
DROP POLICY IF EXISTS "bloques_home_lectura_publica" ON bloques_home;
CREATE POLICY "bloques_home_lectura_publica" ON bloques_home FOR SELECT TO anon USING (visible = true);
DROP POLICY IF EXISTS "bloques_home_crud_admin" ON bloques_home;
CREATE POLICY "bloques_home_crud_admin" ON bloques_home FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- producto_categorias
DROP POLICY IF EXISTS "producto_categorias_lectura_publica" ON producto_categorias;
CREATE POLICY "producto_categorias_lectura_publica" ON producto_categorias FOR SELECT TO anon
  USING (producto_id IN (SELECT id FROM productos WHERE visible = true));
DROP POLICY IF EXISTS "producto_categorias_crud_admin" ON producto_categorias;
CREATE POLICY "producto_categorias_crud_admin" ON producto_categorias FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());

-- paginas
DROP POLICY IF EXISTS "paginas_lectura_publica" ON paginas;
CREATE POLICY "paginas_lectura_publica" ON paginas FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "paginas_crud_admin" ON paginas;
CREATE POLICY "paginas_crud_admin" ON paginas FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());


-- ── Storage bucket: imagenes-productos ───────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes-productos', 'imagenes-productos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "storage_imagenes_lectura_publica" ON storage.objects;
CREATE POLICY "storage_imagenes_lectura_publica" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'imagenes-productos');
DROP POLICY IF EXISTS "storage_imagenes_insert_admin" ON storage.objects;
CREATE POLICY "storage_imagenes_insert_admin" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'imagenes-productos' AND is_admin());
DROP POLICY IF EXISTS "storage_imagenes_update_admin" ON storage.objects;
CREATE POLICY "storage_imagenes_update_admin" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'imagenes-productos' AND is_admin());
DROP POLICY IF EXISTS "storage_imagenes_delete_admin" ON storage.objects;
CREATE POLICY "storage_imagenes_delete_admin" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'imagenes-productos' AND is_admin());
