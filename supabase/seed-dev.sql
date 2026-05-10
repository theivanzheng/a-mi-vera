-- ============================================================
-- A Mi Vera — Datos semilla DEV
-- supabase/seed-dev.sql · Fase 5C.2
--
-- ⚠️  SOLO PARA ENTORNO DEV. NUNCA ejecutar en PROD.
--
-- Instrucciones:
--   1. Ejecutar DESPUÉS de schema-dev.sql.
--   2. Abrir Supabase Dashboard → proyecto DEV → SQL Editor.
--   3. Pegar y ejecutar.
--
-- Idempotencia:
--   Todos los INSERT usan ON CONFLICT (id) DO NOTHING.
--   Puedes re-ejecutar sin duplicar datos.
--   Para borrar todo y empezar desde cero:
--     DELETE FROM imagenes_producto;
--     DELETE FROM productos;
--     DELETE FROM categorias;
--   y volver a ejecutar este archivo.
--
-- Contenido:
--   4 categorías demo
--   8 productos demo (2 por categoría)
--   16 imágenes en imagenes_producto (2 por producto, URLs Unsplash)
--
-- Nota sobre UUIDs:
--   Los IDs son fijos (no gen_random_uuid()) para garantizar la
--   idempotencia del seed. En producción los IDs los genera la DB.
--
-- Nota sobre imágenes:
--   path = NULL (Storage se usa a partir de Fase 6).
--   url cumple el CHECK (url IS NOT NULL OR path IS NOT NULL).
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. CATEGORÍAS
-- ────────────────────────────────────────────────────────────

INSERT INTO categorias (id, nombre, slug, visible, orden)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'Pasión por el vino',  'pasion-por-el-vino',  true, 10),
  ('a0000000-0000-4000-8000-000000000002', 'Maestros cerveceros', 'maestros-cerveceros', true, 20),
  ('a0000000-0000-4000-8000-000000000003', 'Pasión por la madera','pasion-por-la-madera',true, 30),
  ('a0000000-0000-4000-8000-000000000004', 'Vivan los novios',    'vivan-los-novios',    true, 40)
ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 2. PRODUCTOS
-- destacado = true → aparece en la portada como producto destacado
-- nuevo = true     → lleva badge "Nuevo" en la tarjeta
-- ────────────────────────────────────────────────────────────

INSERT INTO productos
  (id, titulo, slug, descripcion, precio, categoria_id, stock, visible, destacado, nuevo, orden)
VALUES

  -- ── Pasión por el vino ──────────────────────────────────────

  (
    'b0000000-0000-4000-8000-000000000001',
    'Copa de vino grabada con nombre',
    'copa-vino-grabada-nombre',
    'Copa de cristal de alta calidad grabada a mano con el nombre o dedicatoria que elijas. Un regalo elegante para cualquier celebración especial.

Altura: 22 cm · Capacidad: 350 ml
Grabado incluido. Consulta personalizaciones antes de hacer el pedido por WhatsApp.',
    32.00,
    'a0000000-0000-4000-8000-000000000001',
    0, true, true, false, 10
  ),
  (
    'b0000000-0000-4000-8000-000000000002',
    'Set de dos copas con dedicatoria para novios',
    'set-dos-copas-dedicatoria-novios',
    'Dos copas de cristal grabadas con los nombres de la pareja y la fecha que elijas. Presentadas en caja de regalo.

Altura: 22 cm · Capacidad: 350 ml
Perfecto para bodas, aniversarios y pedidas de mano. Consulta diseños disponibles.',
    55.00,
    'a0000000-0000-4000-8000-000000000001',
    0, true, false, false, 20
  ),

  -- ── Maestros cerveceros ─────────────────────────────────────

  (
    'b0000000-0000-4000-8000-000000000003',
    'Jarra de cerveza personalizada 500 ml',
    'jarra-cerveza-personalizada-500ml',
    'Jarra de cerveza de cristal grueso grabada a mano con el nombre o frase que elijas. Perfecta para el amante de la cerveza artesanal.

Capacidad: 500 ml
Grabado incluido. Consulta personalizaciones antes de hacer el pedido.',
    25.00,
    'a0000000-0000-4000-8000-000000000002',
    0, true, false, true, 10
  ),
  (
    'b0000000-0000-4000-8000-000000000004',
    'Set de 4 posavasos de madera grabados',
    'set-posavasos-madera-grabados',
    'Set de 4 posavasos de madera de haya con grabado personalizado. Pueden llevar un nombre, fecha o diseño especial.

Diámetro: 9 cm · Espesor: 6 mm
Vienen en bolsita de organza. Grabado incluido.',
    18.00,
    'a0000000-0000-4000-8000-000000000002',
    0, true, false, false, 20
  ),

  -- ── Pasión por la madera ────────────────────────────────────

  (
    'b0000000-0000-4000-8000-000000000005',
    'Tabla de madera grabada con nombre y fecha',
    'tabla-madera-grabada-nombre-fecha',
    'Tabla de madera de haya de primera calidad con grabado personalizado. Ideal como regalo de boda, aniversario o estreno de hogar.

Medidas: 30 × 20 cm · Espesor: 1,5 cm
Grabado incluido. Consulta diseños disponibles antes de hacer el pedido.',
    40.00,
    'a0000000-0000-4000-8000-000000000003',
    0, true, true, false, 10
  ),
  (
    'b0000000-0000-4000-8000-000000000006',
    'Marco de fotos de madera con mensaje personalizado',
    'marco-fotos-madera-mensaje-personalizado',
    'Marco de fotos de madera natural con mensaje personalizado grabado en la parte inferior. Perfecto para guardar ese momento especial.

Tamaño de foto: 10 × 15 cm
Entrega en 3-5 días hábiles. Consulta personalizaciones por WhatsApp.',
    28.00,
    'a0000000-0000-4000-8000-000000000003',
    0, true, false, false, 20
  ),

  -- ── Vivan los novios ────────────────────────────────────────

  (
    'b0000000-0000-4000-8000-000000000007',
    'Caja de madera para alianzas personalizada',
    'caja-madera-alianzas-personalizada',
    'Caja de madera de pino lacada con los nombres de los novios y la fecha de la boda grabados en la tapa.

Medidas: 10 × 10 × 5 cm
Perfecta como portaalianzas o caja de recuerdo. Consulta acabados disponibles.',
    45.00,
    'a0000000-0000-4000-8000-000000000004',
    0, true, false, true, 10
  ),
  (
    'b0000000-0000-4000-8000-000000000008',
    'Botella de cava personalizada para bodas',
    'botella-cava-personalizada-bodas',
    'Botella de cava Brut personalizada con etiqueta exclusiva diseñada para tu celebración.

Contenido: 75 cl
Etiqueta con nombre, fecha y mensaje incluidos. Perfecta para bodas y eventos especiales.',
    35.00,
    'a0000000-0000-4000-8000-000000000004',
    0, true, false, false, 20
  )

ON CONFLICT (id) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- 3. IMÁGENES
-- 2 imágenes por producto (orden 1 y 2)
-- path = NULL — Storage se incorpora en Fase 6
-- ────────────────────────────────────────────────────────────

INSERT INTO imagenes_producto (id, producto_id, url, alt, orden)
VALUES

  -- Copa de vino grabada con nombre
  ('c0000000-0000-4000-8000-000000000001',
   'b0000000-0000-4000-8000-000000000001',
   'https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=800&auto=format&fit=crop',
   'Copa de vino grabada con nombre', 1),
  ('c0000000-0000-4000-8000-000000000002',
   'b0000000-0000-4000-8000-000000000001',
   'https://images.unsplash.com/photo-1523380744952-b7e00e6e2ffa?q=80&w=800&auto=format&fit=crop',
   'Copa de vino grabada con nombre — detalle', 2),

  -- Set de dos copas con dedicatoria
  ('c0000000-0000-4000-8000-000000000003',
   'b0000000-0000-4000-8000-000000000002',
   'https://images.unsplash.com/photo-1601055903647-8f1b61405e3a?q=80&w=800&auto=format&fit=crop',
   'Set de dos copas con dedicatoria para novios', 1),
  ('c0000000-0000-4000-8000-000000000004',
   'b0000000-0000-4000-8000-000000000002',
   'https://images.unsplash.com/photo-1582218413233-a38f32ac2dc8?q=80&w=800&auto=format&fit=crop',
   'Set de dos copas con dedicatoria para novios — detalle', 2),

  -- Jarra de cerveza personalizada
  ('c0000000-0000-4000-8000-000000000005',
   'b0000000-0000-4000-8000-000000000003',
   'https://images.unsplash.com/photo-1528699633788-424224dc89b5?q=80&w=800&auto=format&fit=crop',
   'Jarra de cerveza personalizada 500 ml', 1),
  ('c0000000-0000-4000-8000-000000000006',
   'b0000000-0000-4000-8000-000000000003',
   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
   'Jarra de cerveza personalizada 500 ml — detalle', 2),

  -- Set de 4 posavasos de madera
  ('c0000000-0000-4000-8000-000000000007',
   'b0000000-0000-4000-8000-000000000004',
   'https://images.unsplash.com/photo-1584443181878-1a93e36e7dd7?q=80&w=800&auto=format&fit=crop',
   'Set de 4 posavasos de madera grabados', 1),
  ('c0000000-0000-4000-8000-000000000008',
   'b0000000-0000-4000-8000-000000000004',
   'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=800&auto=format&fit=crop',
   'Set de 4 posavasos de madera grabados — detalle', 2),

  -- Tabla de madera grabada con nombre y fecha
  ('c0000000-0000-4000-8000-000000000009',
   'b0000000-0000-4000-8000-000000000005',
   'https://images.unsplash.com/photo-1481437156560-3205f6a55735?q=80&w=800&auto=format&fit=crop',
   'Tabla de madera grabada con nombre y fecha', 1),
  ('c0000000-0000-4000-8000-000000000010',
   'b0000000-0000-4000-8000-000000000005',
   'https://images.unsplash.com/photo-1584443181878-1a93e36e7dd7?q=80&w=800&auto=format&fit=crop',
   'Tabla de madera grabada con nombre y fecha — detalle', 2),

  -- Marco de fotos de madera
  ('c0000000-0000-4000-8000-000000000011',
   'b0000000-0000-4000-8000-000000000006',
   'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800&auto=format&fit=crop',
   'Marco de fotos de madera con mensaje personalizado', 1),
  ('c0000000-0000-4000-8000-000000000012',
   'b0000000-0000-4000-8000-000000000006',
   'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=800&auto=format&fit=crop',
   'Marco de fotos de madera con mensaje personalizado — detalle', 2),

  -- Caja de madera para alianzas
  ('c0000000-0000-4000-8000-000000000013',
   'b0000000-0000-4000-8000-000000000007',
   'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?q=80&w=800&auto=format&fit=crop',
   'Caja de madera para alianzas personalizada', 1),
  ('c0000000-0000-4000-8000-000000000014',
   'b0000000-0000-4000-8000-000000000007',
   'https://images.unsplash.com/photo-1601055903647-8f1b61405e3a?q=80&w=800&auto=format&fit=crop',
   'Caja de madera para alianzas personalizada — detalle', 2),

  -- Botella de cava personalizada
  ('c0000000-0000-4000-8000-000000000015',
   'b0000000-0000-4000-8000-000000000008',
   'https://images.unsplash.com/photo-1582218413233-a38f32ac2dc8?q=80&w=800&auto=format&fit=crop',
   'Botella de cava personalizada para bodas', 1),
  ('c0000000-0000-4000-8000-000000000016',
   'b0000000-0000-4000-8000-000000000008',
   'https://images.unsplash.com/photo-1512418490979-92798cec1380?q=80&w=800&auto=format&fit=crop',
   'Botella de cava personalizada para bodas — detalle', 2)

ON CONFLICT (id) DO NOTHING;
