# Editor de páginas en línea — A Mi Vera

Cómo funciona la edición de contenido de las páginas públicas desde el admin, y
cómo se integra cada elemento editable. Páginas editables: **Inicio** (`/`) y
**Nosotros** (`/nosotros`).

> Complementa a [`sistema-diseno.md`](sistema-diseno.md). Si hay duda sobre
> estilos, manda el sistema de diseño; sobre edición, manda este documento y el
> código.

---

## 1. La idea

La página pública y la pantalla de edición son **el mismo componente**
(`HomeView`). Lo único que cambia es un "modo edición": en la web se muestra el
texto/vídeo; en el editor cada elemento se vuelve un campo editable sobre la
propia página.

Ruta del editor: `/admin/paginas/:slug/editar` (a pantalla completa, fuera del
`AdminLayout`, protegida por login). Listado: `/admin/paginas`.

---

## 2. Flujo de datos

```
src/content/home.ts        → forma del contenido + VALORES POR DEFECTO (textos actuales)
        │
        ├─ web pública:  useHomeContent()  → lee de Supabase y fusiona con los defaults
        │                                    (si no hay fila, usa los defaults → se ve igual)
        │
        └─ editor:       PageEditor carga el contenido en un "borrador" (draft),
                         lo edita en memoria y lo guarda con upsertPaginaContenido()

Supabase:  tabla `paginas`  (slug TEXT PK, contenido JSONB)   ← migration-paginas.sql
```

- **Los defaults viven en el código.** La tabla `paginas` solo guarda lo que la
  admin sobreescribe. Si una página no tiene fila, la web usa el código → nunca
  quedan huecos vacíos.
- `mergeHomeContent(stored)` fusiona lo guardado sobre los defaults, sección a
  sección. Los arrays (ticker, escaparates) se reemplazan enteros si vienen
  guardados; si no, default.

Archivos clave:
- `src/content/home.ts` — `HomeContent`, `HOME_DEFAULTS`, `mergeHomeContent`.
- `src/lib/paginasApi.ts` — `getPaginaContenido(slug)` / `upsertPaginaContenido(slug, contenido)`.
- `src/hooks/useHomeContent.ts` — lectura pública (`{ content, loading, hasStored }`).
- `src/context/PageContent.tsx` — `PageContentProvider` + `usePageContext()` (`content`, `editing`, `hasStored`, `setField`).
- `src/components/HomeView.tsx` — la portada compartida (pública + editor).
- `src/pages/admin/PageEditor.tsx` — la pantalla de edición (borrador, guardar, barra, toast).

---

## 3. Piezas editables (cuándo usar cada una)

### `EditableText` — un texto suelto
`src/components/editable/EditableText.tsx`

```tsx
<EditableText as="h1" className="av-hero-title" path="hero.titulo" multiline rich />
```
- `path`: ruta de puntos dentro del contenido (`"hero.titulo"`, `"escaparates.0.titulo"`).
- `as`: etiqueta en la web (`h1`, `h2`, `p`, `span`…). Por defecto `span`.
- `multiline`: permite varias líneas (`\n` → `<br>` en la web).
- `rich`: interpreta `*cursiva*` → Playfair itálica (`<em class="av-em">`) en la web.
- **Vista**: renderiza el texto con saltos de línea y cursiva (`renderText`).
- **Edición**: textarea que crece y envuelve el texto (nunca recorta), con
  aspecto claro de campo editable.

### `EditableMedia` — un vídeo
`src/components/editable/EditableMedia.tsx`

```tsx
<EditableMedia className="av-cristina-video" path="cristina.video" fallbackSrc={CristinaVideo} slug="inicio" />
```
- `path`: dónde se guarda la URL del vídeo en el contenido.
- `fallbackSrc`: vídeo del proyecto que se usa si aún no se ha subido ninguno.
- `slug`: para la ruta en Storage (`paginas/{slug}/…`).
- **Vista**: reproduce el vídeo (el guardado o el fallback) en bucle, silenciado.
- **Edición**: botón "Cambiar vídeo" → sube a Storage (`uploadPageMedia`) → guarda
  la URL en el contenido (se publica al **Guardar**).

### Lista editable (array) — patrón de bloque
No es un componente único: es un patrón. Se usa para arrays como la **cinta**
(frases) y los **escaparates**. Cada elemento se edita con `EditableText` por
índice (`path={`array.${i}.campo`}`) y las operaciones de la lista (añadir,
quitar, reordenar) se hacen reemplazando el array entero:

```tsx
const add    = () => setField('array', [...content.array, nuevo]);
const remove = (i) => setField('array', content.array.filter((_, j) => j !== i));
const move   = (i, dir) => { const a = [...content.array]; [a[i], a[i+dir]] = [a[i+dir], a[i]]; setField('array', a); };
```
En **edición** se renderiza como un bloque-tarjeta (`.esc-block` / `.ticker-block`)
con controles; en **vista** se renderiza el diseño real (carrusel / cinta animada).

---

## 4. Mapa de la portada (Inicio)

| Sección | Qué se edita | Componente / patrón |
|--------|--------------|---------------------|
| **Hero** | título, pastilla, subtítulo, texto del botón | `EditableText` (`hero.*`); título y frase admiten `*cursiva*` |
| **Hero — fotos del abanico** | *(aún no editable)* | imágenes del proyecto (pendiente: `EditableMedia` de imagen) |
| **Cinta en movimiento** | lista de frases | bloque `.ticker-block` (array `ticker`) + previsualización en vivo |
| **Escaparates de productos** | título + fuente (Destacados / Novedades / categoría) | bloque `.esc-block` por escaparate (array `escaparates`); los productos salen de la fuente, no se pican a mano |
| **Cristina** | eyebrow, título, párrafo (`*cursiva*`), CTA | `EditableText` (`cristina.*`) |
| **Cristina — vídeo** | sustituir el vídeo | `EditableMedia` (`cristina.video`) |
| **Frase oscura** | frase, firma | `EditableText` (`fraseOscura.*`) |
| **CTA WhatsApp** | eyebrow, título, subtítulo, botón | `EditableText` (`whatsapp.*`) |

### Mapa de Nosotros (`/nosotros`)

| Sección | Qué se edita | Componente / patrón |
|--------|--------------|---------------------|
| **Hero** | vídeo, eyebrow, título (`*cursiva*`), subtítulo, texto botón | `EditableMedia` (`hero.video`) + `EditableText` (`hero.*`) |
| **Bloques: taller / láser / personalización** | eyebrow, título, párrafo (`*cursiva*`) + vídeo | `EditableText` (`<bloque>.*`) + `EditableMedia` (`<bloque>.video`) |
| **Ventajas del láser** | lista de puntos | bloque editable (array `laser.ventajas`) con añadir/quitar, reusa las clases del ticker |
| **CTA final** | título, subtítulo, botón | `EditableText` (`cta.*`) |

Los vídeos de Nosotros usan `EditableMedia` con `className="video-frame"`, que conserva
el marco 16:9 de la web y añade el botón "Cambiar vídeo". Se suben a `paginas/nosotros/`.

La barra inferior del editor: **Cursiva** (envuelve la selección en `*…*`),
**Descartar**, **Guardar**. Y un botón grande **"Guardar todo"** al final. Al
guardar: botón en verde con tic + toast "Cambios guardados".

---

## 5. Cómo añadir cosas

### Un campo de texto nuevo
1. Añádelo a `HomeContent` y a `HOME_DEFAULTS` en `src/content/home.ts` (y al
   `mergeHomeContent` si es una sección nueva).
2. En `HomeView`, sustituye el literal por `<EditableText path="seccion.campo" … />`.

### Un vídeo nuevo
1. Añade un campo opcional al contenido (ej. `cristina.video?: string`).
2. En `HomeView`, usa `<EditableMedia path="…" fallbackSrc={ASSET} slug="inicio" />`.

### Una lista nueva (tipo cinta/escaparates)
1. Añade el array al contenido + default.
2. En `HomeView`, renderiza el bloque de edición (add/remove/reorder con
   `setField('array', …)`) y la vista pública real; cada item con `EditableText`
   por índice.

### Una página editable nueva
*(Inicio y Nosotros ya están hechas; este es el patrón para la siguiente.)*
1. `src/content/<pagina>.ts` con su `…Content`, defaults y `merge…`.
2. Un `…View` que consuma `usePageContext<…Content>()` y use `Editable*`.
3. En `PageEditor`, añade una entrada al registro `PAGINAS`:
   `{ nombre, defaults, merge, View }`. El editor ya es **genérico** — carga,
   edita (borrador) y guarda por slug sin tocar nada más.
4. Añade la entrada en `PaginasList` (marcar `editable: true`).
5. La página pública (`src/pages/<Pagina>.tsx`) envuelve su `…View` en
   `PageContentProvider` con `editing: false`, usando su hook `use…Content()`.

---

## 6. Notas e infraestructura

- **Tabla**: `supabase/migration-paginas.sql` (ejecutar en DEV y luego en PROD).
  RLS: lectura pública (`anon`), escritura solo admin (`is_admin()`).
- **Vídeos**: se suben al bucket `imagenes-productos`, carpeta `paginas/{slug}/`.
  Máximo 30 MB; tipos MP4/WEBM/MOV. Conviene subir vídeos ya optimizados.
  La escritura en Storage la permite solo la admin autenticada.
- **Huérfanos**: si subes un vídeo y luego descartas, el archivo queda en Storage
  sin referenciar (caso límite aceptado, igual que con las imágenes de producto).
- **Anclas de catálogo**: los escaparates enlazan a `/catalogo#<slug>` con
  `toSlug()` (`src/lib/slug.ts`), la misma función que genera los ids de sección
  del catálogo, para que coincidan siempre.
- **Aviso de defaults**: si la página no tiene contenido guardado (`hasStored`
  es `false`), el editor muestra un banner amarillo avisando de que se ven los
  textos por defecto.
