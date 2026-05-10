-- ============================================================
-- A Mi Vera — Esquema base de datos DEV
-- Supabase SQL Editor · Fase 5C.1 (rev. 1)
--
-- Instrucciones:
--   1. Abrir Supabase Dashboard → proyecto DEV → SQL Editor.
--   2. Sustituir 'PON_AQUI_EL_EMAIL_ADMIN_DEV' por el email real
--      de la cuenta admin antes de ejecutar.
--   3. Pegar este archivo completo y ejecutar.
--   4. El bucket de Storage se crea con el INSERT del final.
--      Si da error de permisos, créalo desde el Dashboard
--      (Storage → New bucket) y omite ese INSERT.
--
-- Nota sobre usuarios_admin:
--   No se crea tabla de administradores. Supabase Auth gestiona
--   la autenticación de forma nativa. Con un único admin, añadir
--   una tabla adicional solo duplica auth.users sin aportar nada.
--   En cambio sí se crea la función is_admin() que comprueba el
--   email del JWT en cada operación de escritura. Así, aunque en
--   el futuro existiesen más usuarios autenticados (clientes con
--   cuenta), ninguno podría escribir datos a menos que su email
--   esté explícitamente aprobado en is_admin().
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0A. FUNCIÓN: actualizar updated_at automáticamente
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ────────────────────────────────────────────────────────────
-- 0B. FUNCIÓN: comprobar si el usuario autenticado es la admin
--
-- Compara el email del JWT del usuario actual con el email
-- configurado aquí. Si no coincide, is_admin() devuelve false
-- y las políticas RLS bloquean la operación de escritura.
--
-- ⚠️  Sustituye 'PON_AQUI_EL_EMAIL_ADMIN_DEV' antes de ejecutar.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'email') = 'gestion.amivera@gmail.com';
$$;


-- ────────────────────────────────────────────────────────────
-- 1. TABLA: categorias
-- ────────────────────────────────────────────────────────────
CREATE TABLE categorias (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  visible    BOOLEAN     NOT NULL DEFAULT true,
  orden      INTEGER     NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_categorias_updated_at
  BEFORE UPDATE ON categorias
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 2. TABLA: productos
-- ────────────────────────────────────────────────────────────
CREATE TABLE productos (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo       TEXT          NOT NULL,
  slug         TEXT          NOT NULL UNIQUE,
  descripcion  TEXT,                                            -- nullable por diseño
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  categoria_id UUID          REFERENCES categorias(id) ON DELETE SET NULL, -- nullable para migración masiva
  stock        INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
  visible      BOOLEAN       NOT NULL DEFAULT true,
  destacado    BOOLEAN       NOT NULL DEFAULT false,
  nuevo        BOOLEAN       NOT NULL DEFAULT false,
  orden        INTEGER       NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_productos_updated_at
  BEFORE UPDATE ON productos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 3. TABLA: imagenes_producto
--
-- url  → URL externa (fases 4-5); NULL cuando el archivo está en Storage
-- path → ruta relativa en Storage (fase 6+); NULL hasta entonces
-- CHECK garantiza que siempre exista al menos uno de los dos.
-- ────────────────────────────────────────────────────────────
CREATE TABLE imagenes_producto (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  producto_id UUID        NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
  url         TEXT,
  path        TEXT,
  alt         TEXT,
  orden       INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT chk_imagen_origen CHECK (url IS NOT NULL OR path IS NOT NULL)
);


-- ────────────────────────────────────────────────────────────
-- 4. TABLA: bloques_home
-- ────────────────────────────────────────────────────────────
CREATE TABLE bloques_home (
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

CREATE TRIGGER trg_bloques_home_updated_at
  BEFORE UPDATE ON bloques_home
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ────────────────────────────────────────────────────────────
-- 5. ÍNDICES
-- (slug ya tiene índice implícito por UNIQUE)
-- ────────────────────────────────────────────────────────────
CREATE INDEX idx_productos_categoria_id ON productos (categoria_id);
CREATE INDEX idx_productos_visible      ON productos (visible);
CREATE INDEX idx_productos_orden        ON productos (orden);

CREATE INDEX idx_imagenes_producto_id   ON imagenes_producto (producto_id);
CREATE INDEX idx_imagenes_orden         ON imagenes_producto (producto_id, orden);

CREATE INDEX idx_categorias_visible     ON categorias (visible);
CREATE INDEX idx_categorias_orden       ON categorias (orden);

CREATE INDEX idx_bloques_home_visible   ON bloques_home (visible);
CREATE INDEX idx_bloques_home_orden     ON bloques_home (orden);


-- ────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY — activación
-- ────────────────────────────────────────────────────────────
ALTER TABLE categorias        ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE imagenes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE bloques_home      ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- 7. POLÍTICAS RLS — categorias
-- ────────────────────────────────────────────────────────────

-- Lectura pública: solo categorías visibles
CREATE POLICY "categorias_lectura_publica"
  ON categorias
  FOR SELECT
  TO anon
  USING (visible = true);

-- CRUD solo para la admin (is_admin() comprueba el email del JWT)
CREATE POLICY "categorias_crud_admin"
  ON categorias
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ────────────────────────────────────────────────────────────
-- 8. POLÍTICAS RLS — productos
-- ────────────────────────────────────────────────────────────

-- Lectura pública: solo productos visibles
CREATE POLICY "productos_lectura_publica"
  ON productos
  FOR SELECT
  TO anon
  USING (visible = true);

-- CRUD solo para la admin
CREATE POLICY "productos_crud_admin"
  ON productos
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ────────────────────────────────────────────────────────────
-- 9. POLÍTICAS RLS — imagenes_producto
-- ────────────────────────────────────────────────────────────

-- Lectura pública: solo imágenes de productos visibles
CREATE POLICY "imagenes_lectura_publica"
  ON imagenes_producto
  FOR SELECT
  TO anon
  USING (
    producto_id IN (
      SELECT id FROM productos WHERE visible = true
    )
  );

-- CRUD solo para la admin
CREATE POLICY "imagenes_crud_admin"
  ON imagenes_producto
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ────────────────────────────────────────────────────────────
-- 10. POLÍTICAS RLS — bloques_home
-- ────────────────────────────────────────────────────────────

-- Lectura pública: solo bloques visibles
CREATE POLICY "bloques_home_lectura_publica"
  ON bloques_home
  FOR SELECT
  TO anon
  USING (visible = true);

-- CRUD solo para la admin
CREATE POLICY "bloques_home_crud_admin"
  ON bloques_home
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());


-- ────────────────────────────────────────────────────────────
-- 11. STORAGE BUCKET: imagenes-productos
--
-- Nombre:    imagenes-productos
-- Público:   SÍ (las imágenes se sirven sin autenticación)
--
-- Estructura de carpetas recomendada:
--   imagenes-productos/productos/{producto_id}/{nombre-archivo}
--
-- Si el INSERT da error de permisos, crea el bucket desde el
-- Dashboard (Storage → New bucket, marcar como público) y
-- ejecuta solo las políticas que aparecen a continuación.
-- ────────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('imagenes-productos', 'imagenes-productos', true)
ON CONFLICT (id) DO NOTHING;

-- Lectura pública: cualquiera puede ver las imágenes
CREATE POLICY "storage_imagenes_lectura_publica"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'imagenes-productos');

-- Solo la admin puede subir imágenes
CREATE POLICY "storage_imagenes_insert_admin"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'imagenes-productos' AND is_admin());

-- Solo la admin puede actualizar imágenes
CREATE POLICY "storage_imagenes_update_admin"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'imagenes-productos' AND is_admin());

-- Solo la admin puede eliminar imágenes
CREATE POLICY "storage_imagenes_delete_admin"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'imagenes-productos' AND is_admin());
