# Sistema de diseño — A Mi Vera

Documento de referencia del lenguaje visual actual de la tienda pública.
Pásalo a cualquier sesión o IA nueva para que mantenga la coherencia del diseño.

> **Fuente de verdad:** todos los tokens viven en `src/styles/variables.css`.
> Este `.md` los explica; si hay discrepancia, manda el CSS.

---

## 1. Concepto visual

Boutique artesanal, editorial y cálida. Estilo Zara / Massimo Dutti aplicado a
regalos personalizados hechos a mano. Off-white cálido (papel artesanal),
acentos en rosa apagado, titulares en serif itálica elegante, mucho aire y
bordes apenas redondeados.

Principios:
- **Cálido, no frío:** nunca blanco puro ni gris azulado en la tienda pública. Todo tira a beige/melocotón.
- **Editorial:** títulos en Playfair Display itálica; cuerpo en Source Sans 3.
- **Bordes sutiles:** radios pequeños (5px en imágenes de producto). Nada de esquinas muy redondeadas.
- **Movimiento suave:** reveal al cambiar de página, transiciones cortas en hovers.

---

## 2. Color

### Marca
| Token | Hex | Uso |
|-------|-----|-----|
| `--primary` | `#1A1A1A` | Negro cálido — texto principal, botones |
| `--secondary` | `#F5F5F7` | Gris muy claro — superficies secundarias |
| `--accent` | `#C4909A` | Rosa apagado — énfasis de marca, eyebrows |

### Fondos y superficies (tienda pública)
| Token | Hex | Uso |
|-------|-----|-----|
| `--bg-base` | `#FAF6F1` | **Fondo de página** (off-white cálido). También navbar y drawer (sólido). |
| `--surface-soft` | `#F2EBE4` | Caja de imagen de producto, sección Cristina |
| `--color-dark-deep` | `#2E1F28` | Footer, frase oscura, ticker |
| `--color-dark-mid` | `#4A2830` | Botones CTA, hover |
| `--color-text-mid` | `#7A5C68` | Precios, textos de apoyo, eyebrows secundarios |

### Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `--text-main` | `#3D2B35` | Cuerpo principal (cálido, no negro puro) |
| `--text-light` | `#6E6E73` | Texto secundario |
| `--color-text-muted` | `#6b7280` | Precios de cards |
| `--color-text-body` | `#374151` | Descripción de producto |

### Pill del hero
- Fondo: `#7A5C68` (malva/ciruela suave), texto blanco.

---

## 3. Tipografía

Se cargan desde Google Fonts en `src/styles/base.css`.

| Token | Familia | Uso |
|-------|---------|-----|
| `--font-display` | **Playfair Display** (serif) | Títulos, citas, links del drawer. Casi siempre **itálica**. |
| `--font-body` | **Source Sans 3** (sans-serif) | Cuerpo, botones, navegación, precios. |

Pesos cargados:
- Source Sans 3: `300, 400, 500, 600, 700`
- Playfair Display: `400/500/600/700` normal e **itálica** (`ital`)

### Escala y patrones de uso
| Elemento | Fuente | Tamaño aprox. | Notas |
|----------|--------|---------------|-------|
| Título hero (`.av-hero-title`) | Playfair itálica | ~2.4rem | Frase entre comillas |
| Título de sección (`.av-featured-title`, `.cat-page-title`) | Playfair itálica | 1.65–1.75rem | |
| Eyebrow (`.av-*-eyebrow`, `.nav-drawer-eyebrow`, `.cat-page-sub`) | Source Sans | 0.62–0.72rem | **MAYÚSCULAS**, `letter-spacing` 0.16–0.28em, color `--accent` o `--color-text-mid` |
| Cabecera de grupo catálogo (`.cat-group-title`) | Source Sans | 0.65rem | MAYÚSCULAS, tracking 0.28em |
| Nombre de producto | Source Sans | 0.78–0.82rem | line-height 1.3 |
| Precio | Source Sans | 0.72–0.78rem | color `--color-text-mid` |
| Links del drawer (`.nav-drawer-link`) | Playfair itálica | 1.65rem | |

**Regla:** titular → Playfair itálica. Etiqueta/eyebrow → Source Sans mayúsculas con mucho tracking. Cuerpo y UI → Source Sans.

---

## 4. Border radius

| Token | Valor | Uso |
|-------|-------|-----|
| `--radius-xs` | 4px | Badge "DESTACADO" |
| `--radius-sm` | 6px | Botones CTA, WhatsApp, promo text |
| `--radius-md` | 8px | Inputs, formularios |
| `--radius-lg` | 12px | Tarjetas admin |
| `--radius-pill` | 20px | Pill del hero, tabs |
| `--radius-full` | 36px | Mockup de móvil |

### ⭐ Regla de imágenes de producto
**Todas las imágenes de producto usan `border-radius: 5px` y formato cuadrado `1:1`.**
Es el radio "de referencia" de la tienda — el que se ve en el catálogo.
Aplica a:
- `.cat-card-img` (catálogo) → `5px`, `aspect-ratio: 1/1`
- `.av-feat-img` (Productos Destacados) → `5px`

No usar radios grandes (12–16px) en imágenes de producto.

---

## 5. Espaciado y layout

| Token | Valor | Uso |
|-------|-------|-----|
| `--navbar-height` | 60px | Altura navbar (las secciones sticky se anclan a esto) |
| `--max-width-store` | 1400px | Ancho máximo catálogo |
| `--max-width-pdp` | 800px | Ancho máximo ficha de producto |

Pautas de ritmo vertical:
- Hero (`.av-hero`): sin `min-height` forzado; `padding-bottom` ajustado (~1.25rem) para pegarlo al ticker.
- Cabecera de catálogo (`.cat-header`): padding superior reducido (~1rem) para acercarla al navbar.
- Secciones de contenido: ~3.5rem de separación entre grupos.
- Grid de catálogo: 2 columnas, gap 0.75rem.

---

## 6. Navbar y drawer

- **Navbar:** `position: fixed`, fondo **sólido** `rgb(250,246,241)` (= `--bg-base`), sin borde inferior. Logo a la izquierda, hamburguesa (icono Lucide `Menu`, `strokeWidth 1.5`) a la derecha.
- **Drawer:** se despliega de arriba abajo con `clip-path: inset()` (barrido). Mismo fondo sólido que el navbar para que sean indistinguibles. Tres secciones en orden: **Buscar → Páginas → Categorías**, cada una con su eyebrow en mayúsculas color `--accent`.
- **Importante:** el navbar es `position: fixed`. **No** animar `transform`, `filter` ni `will-change` en sus ancestros — rompen el posicionado fixed. Para animaciones de página usar solo `opacity` y `clip-path`.

---

## 7. Botones

| Tipo | Estilo |
|------|--------|
| CTA principal (`.av-hero-cta`) | Fondo `--color-dark-mid`, texto claro, `border-radius` pequeño (~6px), padding generoso, flecha `→` |
| Pills de categoría (drawer) | Borde fino `rgba(61,43,53,0.2)`, `border-radius: 20px`, texto pequeño en mayúsculas |
| Tabs de catálogo (`.cat-filter-tab`) | Sin fondo, subrayado inferior 2px en la activa, texto mayúsculas tracking 0.2em |

---

## 8. Movimiento

| Token | Valor | Uso |
|-------|-------|-----|
| `--transition` | `all 0.3s cubic-bezier(0.25,0.8,0.25,1)` | General |
| `--transition-quick` | `0.2s ease` | Hovers, micro-animaciones |
| `--transition-drawer` | `0.3s cubic-bezier(0.4,0,0.2,1)` | Apertura del menú |

- **Page reveal:** al cambiar de ruta, animación `pageReveal` (480ms, `opacity` + `clip-path`). Respeta `prefers-reduced-motion`. Ver `src/components/PageTransition.tsx` y `src/App.css`.
- **Scroll-spy catálogo:** la pestaña de la categoría visible se resalta y auto-centra; barra con fade lateral cuando hay overflow.
- Hover de imagen de producto: `scale(1.03)`, 400ms.

---

## 9. Sombras

`--shadow-xs` … `--shadow-xl` (de sutil a fuerte). En la tienda pública se usan con moderación; el diseño se apoya más en color y tipografía que en elevación.

---

## 10. Checklist rápida para mantener coherencia

- [ ] ¿Fondo cálido `--bg-base`, nunca blanco puro?
- [ ] ¿Titulares en Playfair **itálica**?
- [ ] ¿Eyebrows en Source Sans MAYÚSCULAS con tracking amplio?
- [ ] ¿Imágenes de producto a `5px` y `1:1`?
- [ ] ¿Colores tomados de tokens (`var(--…)`), no hex sueltos?
- [ ] ¿Animaciones de página solo con `opacity`/`clip-path` (navbar fixed)?
