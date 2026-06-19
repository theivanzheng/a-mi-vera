# Opciones de diseño — A Mi Vera

Registro de decisiones y opciones exploradas durante el rediseño visual.

---

## Estilo de referencia elegido

**"Quiet Luxury Editorial"** — el estilo visto en CAST Jewelry y Mily Group.

### Señas de identidad
- Tipografía dual: serif grande en itálica para títulos + sans-serif en mayúsculas con mucho espaciado para labels y nav
- Paleta de color contenida: cremas, beiges arena, neutros cálidos. Un oscuro que no es negro puro
- Espacio en blanco agresivo — nada se amontona
- CTAs sin relleno: flechas `→` o bordes finos en lugar de botones rellenos con bordes redondeados
- Navbar transparente o con efecto cristal al hacer scroll
- Fotografía a sangre, sin marcos

### Referentes visuales (buscar en Google)
- `Mily Group` — estética orgánica, navbar cristal, tipografía geométrica en mayúsculas
- `CAST Jewelry` — serif editorial, fondo oscuro contrastado con producto
- `Artifact Uprising` — sobria, emocional, mucho espacio en blanco
- `Rifle Paper Co` — floral, artesanal, colores cálidos
- `Sugar Paper Los Angeles` — papelería boutique, minimalista femenino

---

## Tipografía seleccionada

| Rol | Fuente | Uso |
|-----|--------|-----|
| Display / Títulos | **Playfair Display** (itálica, 400–500) | Frases grandes, headlines, citas |
| Body / UI | ~~Jost~~ → **Source Sans 3** (300–500, mayúsculas + letter-spacing 2-3px) | Navbar, etiquetas, botones, texto pequeño |

**Por qué Jost:** alternativa libre a Futura, geométrica y limpia. Es la más cercana al efecto del navbar de Mily Group. Produce el "glow" visual sobre fondos desenfocados/cristal sin ningún efecto adicional.

**Descartadas:**
- `Outfit` (actual) — demasiado genérica, sin carácter
- `SF Pro` — fuente de Apple, no disponible para web
- `Raleway` — considerada, demasiado art déco para este proyecto

---

## Paleta de color

### ✅ Opción elegida — "Ciruela cálido sobre crema" (punto medio)

El color del logo como acento, no como fondo. Evita el efecto "niña pequeña" del blush lleno.

| Token | Hex | Uso |
|-------|-----|-----|
| `--color-bg` | `#FAF6F1` | Fondo principal (crema cálido, no blanco) |
| `--color-surface` | `#F2EBE4` | Secciones alternas, cards |
| `--color-text` | `#3D2B35` | Texto principal (ciruela oscuro, no negro puro) |
| `--color-text-muted` | `#7A5C68` | Textos de apoyo, precios |
| `--color-accent` | `#C4909A` | Acento (rosa muted — muy contenido) |
| `--color-dark` | `#2E1F28` | Footer, hero oscuro |
| `--color-dark-mid` | `#4A2830` | Botones, hover, navbar sobre claro |

**Regla de uso del acento rosa:** solo en detalles puntuales (hover de links, separadores, pills). Nunca como color de fondo de sección.

---

### ❌ Opción descartada — "Blush completo"

Paleta extraída directamente del logo (fondo blush `#FDF5F6`, rosa `#C97A8A`, salvia `#8A9E7A`).

**Por qué descartada:** resultado demasiado "niña pequeña". Los tonos rosas como fondo de página llevan la marca hacia papelería infantil, alejándose del tono boutique artesanal que se busca.

---

## Sección "Banda de confianza" — opciones para inicio

### ✅ Elegidas (combinación)
- **Opción B — Frase sola:** Una sola frase en Playfair Display itálica centrada, mucho espacio. Uso: página de inicio.
- **Opción C — Foto + frase:** Imagen de los regalos o del taller con frase superpuesta. Uso: página Nosotros / transición entre secciones.

### ❌ Descartada
- **4 cuadros / pilares:** demasiado genérico, aspecto de template de IA. No transmite artesanía.

### Otras opciones consideradas
- **Ticker horizontal:** palabras clave en bucle sobre fondo oscuro. Guardada como opción complementaria (puede convivir con B o C).
- **Bullets editoriales con guión largo (—):** clara y legible, sin aspecto de lista. Válida para la página Nosotros.

---

## Logo

- Archivo disponible: PNG (logo con flores y lettering script)
- Conversión a SVG: **pendiente** — necesita archivo vectorial `.ai/.eps/.pdf` de Cristina, o se recrea en SVG desde cero
- Versiones necesarias:
  - Color original (sobre fondo claro)
  - Blanco (sobre hero oscuro / vídeo)
  - Ciruela oscuro `#3D2B35` (versión formal)

---

## Estructura de páginas acordada

### Navegación principal
- **Inicio** (`/`)
- **Nosotros** (`/nosotros`) ← nueva
- ~~Bodas~~ → pasa a ser categoría del catálogo, sin enlace en menú

### Página de inicio — secciones
1. Navbar (actualizar enlaces)
2. Hero — vídeo de fondo + título en Playfair itálica + CTA
3. Ticker horizontal (frases de marca)
4. Catálogo por categorías (carruseles, Bodas como una más)
5. Mini historia — bloque con foto/vídeo de Cristina + enlace a Nosotros
6. CTA final — frase + botón WhatsApp
7. Footer

### Página Nosotros — secciones
1. Hero — foto/vídeo de Cristina trabajando
2. Proceso — 3 pasos + vídeo de empaquetado
3. Compromisos — bullets editoriales (trato 1:1, 24h, pack especial)
4. Foto/vídeo de la xTool P2 grabando
5. CTA — "Cuéntame qué tienes en mente" + WhatsApp
6. Footer

---

## Pendiente de la clienta

| Qué | Para qué |
|-----|----------|
| Vídeo hero (en edición en FCP) | Hero de inicio — vertical 1080×1920, MP4 H.264, <8MB |
| Foto/vídeo de Cristina trabajando | Hero de Nosotros |
| Foto/vídeo xTool P2 grabando | Sección proceso en Nosotros |
| Vídeo de empaquetado | Sección proceso en Nosotros |
| Fotos de producto con buena luz | Cards del catálogo |
| Archivo vectorial del logo (.ai/.eps/.pdf) | Conversión a SVG |
| Textos en sus palabras | Quién es Cristina, el proceso, frases de marca |
| Decisión color accent | Confirmar `#C4909A` o ajustar |
