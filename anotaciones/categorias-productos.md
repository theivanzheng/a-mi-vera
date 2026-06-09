# Categorías de productos — A Mi Vera

Documento de trabajo para la importación del catálogo (Fase 7B).
Fuente: `catalogo_amivera_manual_Ivan.xlsx` (46 productos) + fotos en `Fotos Productos/`.

---

## Reglas acordadas

- **11 categorías reales** (las que tiene la clienta en su tienda). "Todos" es la pestaña que muestra todo, no se asigna.
- **Novedades NO es una categoría real ni usa el booleano `nuevo`.** Funciona en dos vías combinadas:
  - **Automática:** los **10 productos más recientes** por `created_at` aparecen solos.
  - **Manual (fijado con caducidad):** al marcar "Novedades" en el admin (se muestra junto a las categorías), salta un aviso **"¿Durante cuánto tiempo?"** con opciones **7 / 15 / 30 días / Indefinido**. Se guardan dos campos en el producto:
    - 7/15/30 días → `novedad_hasta = now() + intervalo`, `novedad_fija = false`.
    - Indefinido → `novedad_fija = true` (se ignora `novedad_hasta`).
    - No fijado → `novedad_fija = false`, `novedad_hasta = null`.
- **Consulta del escaparate (sección Novedades):** `(novedad_fija = true OR novedad_hasta > now())` UNION `(top 10 por created_at)`, sin duplicar, solo `visible = true`.
- La caducidad **no necesita proceso en segundo plano**: al pasar la fecha, el producto deja de cumplir la condición y desaparece solo.
- A nivel de datos NO se guarda como fila en `producto_categorias` (no es una categoría real); vive en su propio campo `novedad_hasta`. En la UI del admin se presenta como un check junto a las categorías.
- Implicación de la importación: los 46 productos comparten `created_at` (hora de importación) y se importan SIN `novedad_hasta`. Novedades arranca neutra y se llena con lo que la clienta añada/fije después.
- Un producto puede pertenecer a **varias categorías** (relación muchos-a-muchos en Supabase).
- Entorno de importación: **DEV primero**.

---

## Categorías que ya tenía la clienta (24 productos colocados)

### Detalles con magia
- Números de madera para cumpleaños
- Caja de cartas personalizadas
- Abridores de botellas

### Regalos con foto
- Monederos personalizados para Mujer
- Carteras personalizadas para Hombre
- Cojines personalizados

### Pasión por la madera
- Caja de cartas personalizadas
- Cajas de madera rectangulares
- Cajas cuadradas de madera

### Pasión por el vino
- Cajas de vino (2 huecos)
- Caja de vino (tres huecos)
- Caja de copas de vino

### Maestros cerveceros
- Jarra de cerveza
- Abridores de botellas

### Especial primera comunión
- Pala para tarta
- Llave Disney
- Álbum de firmas de Scrapbook para Comunión

### Nuestros peques
- Bodys Bebé

### Somos de cava
- Caja de madera con Cava
- Juego de copas de cava para Novios

### Vivan los novios
- Porta Alianzas
- Ritual de la Arena
- Porta alianzas corazón

### Regalos únicos
- Espinilleras para fútbol
- Petacas personalizadas
- Tabla de madera

---

## Productos nuevos a categorizar (22) — recomendación

Estos 22 estaban en el Excel/fotos pero NO en la tienda actual de la clienta.
Propuesta de colocación usando **solo las 11 categorías existentes**.
No se marcan como `nuevo`. Novedades se gestiona por `created_at` (ver reglas).

| Producto | Categoría(s) recomendada(s) |
|---|---|
| Huchas Cajas Fuertes | Especial primera comunión, Nuestros peques |
| Rodaja de madera con foto | Regalos con foto, Pasión por la madera |
| Árbol de la Vida | Vivan los novios |
| Villa De Madera | Pasión por la madera |
| Guitarra porta púas | Regalos únicos, Pasión por la madera |
| Porta cables | Regalos únicos |
| Abanicos personalizados | Regalos con foto |
| Funkos de Madera | Nuestros peques |
| Corazón de madera | Vivan los novios, Pasión por la madera |
| Perchas Personalizadas | Especial primera comunión, Nuestros peques |
| Joyero de viaje Corazón | Regalos únicos |
| Joyero de viaje doble | Regalos únicos |
| Joyero de viaje | Regalos únicos |
| Cepillos de madera grabados | Detalles con magia, Pasión por la madera |
| Tabla de Madera para quesos | Pasión por el vino, Pasión por la madera |
| Noria blanca | Regalos con foto, Nuestros peques |
| Medalleros personalizados | Nuestros peques, Regalos únicos |
| Caja libro | Pasión por la madera, Regalos con foto |
| Huchas de Ahorro personalizadas | Detalles con magia, Regalos únicos |
| Caja de madera Somelier | Pasión por el vino |
| Azulejo serigrafiado | Regalos con foto |
| Pen Drive | Detalles con magia, Regalos con foto |

---

## Decisiones cerradas

- 22 productos nuevos: colocación de la tabla **validada**.
- Novedades: top 10 por `created_at` + fijado manual con caducidad (`novedad_hasta`), opciones 7/15/30/Indefinido. **Cerrado.**
- Multi-categoría: tabla `producto_categorias` (muchos-a-muchos). **Cerrado.**
- Estrategia de migración: **transición segura** (no corte limpio). El SQL crea la N:N y mantiene `productos.categoria_id` viva para no romper el código. En el paso 2 los hooks pasan a leer de `producto_categorias`; en un 3er SQL se hace `DROP COLUMN categoria_id`. **Cerrado.**
- Entorno: **DEV** primero.

## Orden de SQL (transición)

1. `supabase/migration-producto-categorias.sql` (este) — crea N:N + `novedad_hasta`. No toca `categoria_id`. ← AHORA
2. (paso 2 código) hooks leen de `producto_categorias`.
3. SQL futuro: `ALTER TABLE productos DROP COLUMN categoria_id;` una vez migrado el código y los datos.

## Construcción de los menús del admin

Usar las skills instaladas en `~/.agents/skills/`:
- `emil-design-eng`: easing fuerte (<300ms), GPU (transform/opacity), `scale(0.97)` al pulsar, popover de duración origin-aware, `prefers-reduced-motion`.
- `impeccable`: contraste, jerarquía, motion intencional, evitar "AI slop".

## Plan Fase 7B

1. ✅ SQL DEV: `producto_categorias` + `novedad_hasta` + `novedad_fija`. **Ejecutado en DEV OK.**
2. ✅ Capa de lectura (bloque 1+2): `db.ts`, `product.ts` (`categories[]` + novedad), `mapProductRow`, `useProducts` (SELECT N:N), `ProductContext` (fallback), `PublicStore` (filtra por `categories.includes` + sección Novedades = fijados vigentes + 10 recientes). `tsc` limpio.
3. ✅ Admin: `ProductForm` con chips multi-categoría + toggle "Mostrar en Novedades" + panel de duración (7/15/30/Indefinido, y "Mantener actual" en edición). Escritura N:N + novedad en `productsApi` (create/update). CSS con easing fuerte, scale al pulsar, reveal por grid-rows y `prefers-reduced-motion`. `tsc` + `eslint` limpios.
4. ⏳ Importador: lee Excel + `manifiesto_revision.csv`, sube fotos de `Fotos Productos/` a Storage, crea productos + imágenes + enlaces N:N.
5. ⏳ Validación en DEV antes de tocar PROD.
6. ⏳ SQL final de transición: `ALTER TABLE productos DROP COLUMN categoria_id;`
