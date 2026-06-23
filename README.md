# A Mi Vera — Tienda Online

Aplicación web de comercio electrónico para **A Mi Vera**, una tienda de regalos personalizados. SPA construida con React + TypeScript. La venta se canaliza a través de WhatsApp. En evolución activa hacia Supabase como backend.

> 🟢 **En producción:** [www.amivera13.es](https://www.amivera13.es) — Vercel (deploy desde `main`) + Supabase PROD.
> **Estado y siguientes pasos → [`docs/pendiente.md`](docs/pendiente.md).**

---

## Estado actual del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Prototipo inicial (React + JSX + localStorage) | ✅ Completada |
| Fase 2 | Migración a TypeScript | ✅ Completada |
| Fase 3 | Sistema global de estilos CSS | ✅ Completada |
| Fase 3.5 | Separación de entornos DEV / PROD | ✅ Completada |
| Fase 4 | Panel privado de administración | ✅ Completada |
| Fase 5A | Diseño arquitectura Supabase | ✅ Completada |
| Fase 5B–5D | Supabase DEV: schema, seed, lectura pública + slugs | ✅ Completada |
| Fase 5E.1 | Supabase Auth real (login / logout) | ✅ Completada |
| Fase 5E.2A | CRUD admin productos en Supabase | ✅ Completada |
| Fase 5E.2B | CRUD admin categorías en Supabase | ✅ Completada |
| Fase 5F | Hardening DEV + preparación PROD | ✅ Completada |
| Fase 6A | Storage de imágenes — subida real desde admin | ✅ Completada |
| Fase 6B | UX admin productos + paths legibles en Storage | ✅ Completada |
| Fase 7 | Importación masiva desde Excel | ⏳ Pendiente |

---

## Checklist paso a PROD

Pasos obligatorios antes de conectar el proyecto al Supabase de producción y al dominio real.

### 1. Git — comprometer TODO el código

> **Crítico.** Solo los archivos de Fase 1 (JSX) están en Git. Todo el código TypeScript de Fases 2–5F está **sin rastrear**.

```bash
# Desde la raíz del proyecto
git add index.html vercel.json src/ supabase/ CLAUDE.md
git status                       # revisar que no hay archivos sensibles
git commit -m "Fases 2–5F: TypeScript, Supabase, admin CRUD, hardening"
```

Archivos que **nunca** deben subir: `.env.local`, cualquier archivo con claves reales.

### 2. Supabase PROD — crear el esquema

En el SQL Editor del **proyecto Supabase PROD** (el de la clienta), ejecutar:

```sql
-- 1. Schema completo (tablas, índices, RLS, Storage)
-- Contenido de: supabase/schema-dev.sql
-- ⚠️ NO ejecutar seed-dev.sql en PROD
```

Verificar tras ejecutar:
- Tablas `categorias`, `productos`, `imagenes_producto`, `home_sections` existen.
- RLS activado en todas las tablas.
- Bucket `imagenes-productos` creado y público.

### 3. Supabase PROD — crear la cuenta de admin

En Supabase PROD → Authentication → Users → Invite user:
- Email: el correo real de la admin.
- La admin recibirá un email de invitación para establecer su contraseña.

Verificar que `is_admin()` funciona con ese email:
```sql
-- Ejecutar en SQL Editor de PROD con el email real
SELECT is_admin();   -- debe devolver TRUE cuando hay sesión activa
```

Si la función `is_admin()` comprueba el email con `auth.jwt() ->> 'email' = 'correo@dominio.com'`, confirmar que el email en el SQL coincide exactamente con el de la cuenta creada.

### 4. Vercel — configurar variables de entorno PROD

En Vercel → proyecto `amivera` → Settings → Environment Variables, añadir **solo para `Production`**:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase **PROD** |
| `VITE_SUPABASE_ANON_KEY` | Anon key del proyecto Supabase **PROD** |

No añadir `service_role_key` ni ninguna otra clave con privilegios elevados.

### 5. Deploy

```bash
git push origin main    # Vercel despliega automáticamente desde main
```

O desde el panel de Vercel → Deployments → Redeploy si ya estaba conectado.

### 6. Validación post-deploy (en el dominio real)

| Comprobación | Cómo verificar |
|---|---|
| Tienda carga productos reales | Abrir `/` — deben aparecer los productos de PROD |
| Slugs funcionan | Hacer clic en un producto — URL debe ser `/producto/nombre-del-producto` |
| Recarga directa no da 404 | Ir a `/producto/nombre-del-producto` y recargar con F5 |
| Login funciona | Ir a `/login` — autenticarse con el email real de la admin |
| Panel admin carga | Tras login, `/admin/dashboard` debe mostrar datos reales |
| CRUD de producto funciona | Crear un producto de prueba, editarlo, borrarlo |
| Categorías visibles | `/admin/categorias` muestra las categorías de PROD |
| Logout funciona | Botón Cerrar sesión → redirige a `/login` |
| Sesión expira correctamente | Sesión de Supabase dura 1 hora por defecto — verificar que redirige a login |
| Sin datos DEV visibles | La tienda no debe mostrar los productos seed del entorno DEV |

### Riesgos a vigilar antes del paso a PROD

| Riesgo | Mitigación |
|---|---|
| `is_admin()` rechaza a la admin | Confirmar que el email en la función SQL coincide exactamente con el de Auth |
| Variables apuntan a DEV en Vercel | Revisar que `VITE_SUPABASE_URL` es la URL del proyecto PROD, no DEV |
| Productos sin imágenes | En Fase 6 (Storage) se añadirán imágenes reales; de momento las URLs pueden estar vacías |
| Slug duplicado al crear producto | `productsApi.ts` traduce el error de constraint único a mensaje en español |
| RLS bloquea la lectura pública | Verificar que la política `anon` de SELECT está creada en PROD |

---

## Integración Supabase

### Flujo de lectura pública

```
Tienda pública (/) y (/producto/:slug)
  └── useProducts()
        ├── Supabase configurado → SELECT productos WHERE visible = true (anon key, RLS)
        └── Sin Supabase → ProductContext (localStorage v6)
```

### Flujo de autenticación admin

```
/login → Login.tsx → useAuth().login(email, password)
  ├── Supabase configurado → supabase.auth.signInWithPassword()
  └── Sin Supabase → localStorage 'amivera_admin_session' (modo dev)

/admin/* → PrivateRoute → useAuth().isAuthenticated
  └── Redirige a /login si no hay sesión activa
```

### Flujo CRUD admin (productos)

```
/admin/productos → ProductList → useAdminProducts()
/admin/productos/nuevo → ProductForm → useAdminProducts()
/admin/productos/:id/editar → ProductForm → useAdminProducts()

useAdminProducts()
  ├── Supabase configurado (sesión autenticada):
  │     Lee:    getAdminProducts() → SELECT todos (sin filtro visible)
  │     Crea:   createProduct()    → INSERT productos + imagenes_producto
  │     Edita:  updateProduct()    → UPDATE productos + DELETE/INSERT imagenes
  │     Borra:  deleteProduct()    → DELETE productos (CASCADE limpia imágenes)
  │     RLS: authenticated + is_admin() → acceso completo
  └── Sin Supabase:
        Fallback a ProductContext (localStorage v6)
```

### Diferencia lectura pública / escritura autenticada

| | Lectura pública | Escritura admin |
|---|---|---|
| Hook | `useProducts()` | `useAdminProducts()` |
| Filtro | `visible = true` | Sin filtro (ve todos) |
| Rol Supabase | `anon` | `authenticated` |
| RLS | `*_lectura_publica` | `*_crud_admin` + `is_admin()` |
| Auth requerida | No | Sí (Supabase Auth) |

### Variables de entorno

```
VITE_SUPABASE_URL        ← URL del proyecto Supabase DEV (en .env.local)
VITE_SUPABASE_ANON_KEY   ← Clave pública anon DEV (en .env.local)
```

Sin estas variables el frontend funciona en modo local (localStorage). En Vercel apuntan a PROD.

### Flujo de categorías

```
/admin/categorias → CategoryList → useAdminCategories()
  ├── Supabase configurado:
  │     Lee:    getAdminCategories() → SELECT categorias ORDER BY orden
  │     Crea:   createCategory()     → INSERT categorias (genera slug desde nombre y asigna orden automático al final)
  │     Edita:  updateCategory()     → UPDATE nombre/visible (regenera slug si cambia nombre)
  │     Oculta: updateCategory(id, { visible: false }) → visible toggle sin borrar
  │     Borra:  deleteCategory()     → verifica COUNT productos, luego DELETE
  └── Sin Supabase:
        Lee:    categorías de ProductContext (MAESTRAS_CATEGORIAS + productos locales)
        Escribe: devuelve aviso "Conecta Supabase"

/admin/productos/nuevo → ProductForm → useAdminCategories().categoryNames
  → El selector de categoría usa la lista real de Supabase (no la derivada de productos)

### Decisión UX: campo `orden` oculto en admin

- `categorias.orden` sigue existiendo en Supabase y se sigue usando para leer las categorías ordenadas.
- El panel de la clienta ya no muestra ni permite editar ese campo en `/admin/categorias`.
- Al crear una categoría nueva, el frontend calcula automáticamente el siguiente `orden` para colocarla al final de la lista.
- Motivo: evitar confusión en la UI del cliente y mantener la ordenación como detalle interno.
```

### Relación producto → categoría

- `productos.categoria_id` es una FK nullable a `categorias.id`
- `ON DELETE SET NULL`: borrar una categoría pone `categoria_id = NULL` en sus productos (Postgres lo permite)
- El frontend lo impide antes de llegar a la DB: `deleteCategory()` verifica con COUNT si la categoría tiene productos y devuelve un error en español si es así
- Motivo: un producto sin categoría queda "huérfano" — no aparece en ningún filtro del escaparate
- Para eliminar una categoría con productos: reasignar los productos a otra categoría primero, luego eliminarla
- Mejora futura prevista: antes de borrar una categoría, ofrecer en el panel admin una acción de "reasignar productos" que permita mover de una sola vez todos los productos de esa categoría a otra categoría ya existente, evitando tener que editarlos uno a uno manualmente

### Gestión de errores en el CRUD admin

`productsApi.ts` traduce los errores de Postgres/RLS/JWT a mensajes en español antes de llegar a la UI:

| Error Postgres | Mensaje en español |
|---|---|
| `duplicate key … slug` | "Ya existe un producto con un título muy similar…" |
| `violates row-level security` | "Sin permisos… Tu sesión puede haber expirado" |
| `jwt expired` | "Tu sesión ha expirado. Vuelve a iniciar sesión." |
| `chk_imagen_origen` | "Cada imagen necesita una URL válida." |

### Flujo de imágenes (Fase 6A / 6B)

```
Admin abre ProductForm
  └── Selecciona archivo (JPG/PNG/WEBP, máx 5 MB)
        │
        ▼
  validateImageFile()     ← validación en cliente antes de cualquier llamada de red
        │
        ▼ handleSubmit
  uploadImage(productId, productSlug, file) → Storage bucket "imagenes-productos"
        │   ruta (Fase 6B): productos/{slug}-{shortId}/{uuid}_{nombre}.{ext}
        │   Ejemplo:        productos/copa-vino-grabada-a1b2c3d4/ab12cd34_copa.jpg
        ▼
  INSERT imagenes_producto (path = ruta Storage, url = NULL)
        │
        ▼
  mapProductRow() → getPublicImageUrl(path) → URL pública para la tienda
```

**Compatibilidad con datos anteriores a Fase 6:**
- Filas con `url` (no nulo) y `path` (nulo) → se usan como URL externa directamente.
- Filas con `path` (no nulo) → se convierten a URL pública con `getPublicUrl()`.
- `mapProductRow` siempre produce `Product.images: string[]` con URLs públicas.
- Paths con el formato antiguo (`productos/{uuid}/...`) siguen funcionando sin cambios.

**`Product.imagePaths`** — campo opcional añadido en Fase 6A:
- Array alineado con `Product.images` que contiene la ruta de Storage de cada imagen.
- `null` si la imagen es una URL externa (datos pre-Fase 6).
- Solo el formulario de admin lo usa; la tienda pública lo ignora.

**Carpetas virtuales vacías en Storage:**
Al borrar un producto, los archivos físicos se eliminan del bucket. Sin embargo, Supabase Storage puede mostrar visualmente la carpeta vacía en el Dashboard. Este comportamiento es esperado y no requiere acción: la carpeta virtual desaparece automáticamente al crear el siguiente archivo con esa ruta, o puede ignorarse. Lo relevante es que no queden archivos huérfanos.

**Reglas de subida/borrado:**

| Operación | Flujo |
|---|---|
| Crear | Subir archivos → INSERT producto → INSERT imagenes; si falla → borrar archivos y producto |
| Editar | Subir nuevos archivos → UPDATE producto → DELETE+INSERT imagenes; si OK → borrar archivos viejos |
| Borrar | GET paths → DELETE producto (CASCADE) → borrar archivos (best-effort) |

### Riesgo aceptado: no hay transacciones en el cliente

La operación de editar un producto ejecuta en secuencia:
1. UPDATE `productos`
2. DELETE imágenes antiguas de `imagenes_producto`
3. INSERT imágenes nuevas

Si el paso 2 o 3 falla, el error se devuelve al usuario pero el paso 1 ya se ejecutó. No hay rollback posible desde el cliente con `supabase-js`. Solución completa: una Edge Function o RPC que envuelva los tres pasos en una transacción SQL. Previsto para Fase 5F si se detecta en validación real.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| UI Framework | React | 19.2.4 |
| Lenguaje | TypeScript (TSX) | ES2020 |
| Build Tool | Vite (plugin Oxc) | 8.0.4 |
| Routing | React Router DOM | 7.14.0 |
| Iconos | Lucide React | 1.8.0 |
| Estilos | CSS plano con variables CSS (`src/styles/`) | — |
| Gestión de estado | React Context API + localStorage | — |
| Gestor de paquetes | npm | — |
| Hosting | Vercel | — |
| Backend (próximo) | Supabase (DB + Auth + Storage) | — |

No se usa Tailwind, Redux, ni ningún framework CSS externo.

---

## Arquitectura general

```
index.html
└── src/main.tsx                  ← Punto de entrada React
    └── App.tsx                   ← Router + ProductProvider wrapper
        ├── ProductContext.tsx    ← Estado global (Context API + localStorage)
        ├── Navbar.tsx            ← Navegación fija (top)
        └── Routes
            ├── /                 → PublicStore.tsx    (escaparate)
            ├── /producto/:id     → ProductDetail.tsx  (ficha de producto)
            └── /admin            → AdminDashboard.tsx (panel de gestión)
```

La ruta `/admin` es accesible sin autenticación (pendiente de proteger en Fase 4).

---

## Estructura de ficheros

```
A Mi Vera/
├── index.html
├── package.json
├── vite.config.ts              ← Configuración de Vite
├── tsconfig.json               ← Orquestador de referencias TypeScript
├── tsconfig.app.json           ← Compilación de src/ (strict mode)
├── tsconfig.node.json          ← Compilación de vite.config.ts
├── eslint.config.js            ← ESLint 9 con typescript-eslint
├── .env.example                ← Plantilla de variables (segura para Git)
├── .gitignore
├── CLAUDE.md                   ← Instrucciones y protocolo para Claude Code
├── IdentidadVisual/
│   ├── Logo_AmiVera.png
│   └── AmiVera Logo Transparent.png
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.tsx                ← Monta React en #root
    ├── App.tsx                 ← BrowserRouter + ProductProvider + rutas
    ├── index.css               ← Orquestador: importa los 4 ficheros de styles/
    ├── App.css                 ← Vacío (import de legacy, no eliminar)
    ├── vite-env.d.ts           ← Declaraciones de tipos de assets (PNG, MP4…)
    ├── types/
    │   └── product.ts          ← Interfaces Product y ProductFormData
    ├── styles/
    │   ├── variables.css       ← Design tokens: colores, radios, sombras, fuentes
    │   ├── base.css            ← Google Fonts + reset de elementos HTML
    │   ├── layout.css          ← Navbar, hero, catálogo, cards, PDP, footer
    │   └── admin.css           ← Panel de administración
    ├── components/
    │   ├── Navbar.tsx
    │   └── ProductCard.tsx
    ├── context/
    │   └── ProductContext.tsx
    ├── pages/
    │   ├── PublicStore.tsx
    │   ├── ProductDetail.tsx
    │   └── AdminDashboard.tsx
    ├── data/
    │   └── products.json       ← 55 productos semilla (IDs 1000–1054)
    └── assets/
        └── AmiVera_Hero_Background.mp4
```

---

## Tipos TypeScript

**Fichero:** `src/types/product.ts`

```typescript
interface Product {
  id: number;
  title: string;
  price: number;
  category: string;
  description: string;
  images: string[];
}

interface ProductFormData {
  title: string;
  price: string;   // string mientras se edita en el input; se convierte a number al guardar
  category: string;
  description: string;
  image1: string;
  image2: string;
  image3: string;
  image4: string;
}
```

---

## Estado global: ProductContext

**Fichero:** `src/context/ProductContext.tsx`

Centraliza el catálogo de productos. Combina los 55 productos de `products.json` con los productos añadidos dinámicamente por el admin. El estado se persiste en `localStorage` bajo la clave `amivera_products_v4`.

### API pública del contexto

El contexto expone su estado a través del hook `useProductContext()`:

```typescript
const { products, categories, addProduct } = useProductContext();
```

- `products: Product[]` — array completo de productos activos
- `categories: string[]` — categorías maestras + dinámicas, en orden predefinido
- `addProduct(formData: ProductFormData): void` — añade producto, filtra imágenes vacías, persiste en localStorage

Usar `useProductContext()` fuera de `ProductProvider` lanza un error en tiempo de ejecución.

### Categorías maestras (hardcodeadas)

El contexto define 12 categorías fijas en este orden:

1. Todos
2. Detalles con magia
3. Regalos con foto
4. Pasión por la madera
5. Pasión por el vino
6. Maestros cerveceros
7. Especial primera comunión
8. Regalos únicos
9. Novedades
10. Nuestros peques
11. Somos de cava
12. Vivan los novios

`extractCategories()` combina estas categorías con las de los productos para evitar duplicados. Las categorías añadidas ad-hoc aparecen al final de la lista.

### Estructura de un producto

```json
{
  "id": 1000,
  "title": "Nombre del producto",
  "price": 31,
  "category": "Nombre de categoría",
  "description": "Descripción multilineal del producto",
  "images": ["url_o_base64_imagen_1", "url_o_base64_imagen_2"]
}
```

Los productos del seed (`products.json`) usan URLs de Unsplash como placeholder. Los productos añadidos desde el admin se almacenan como cadenas base64.

---

## Componentes

### Navbar (`src/components/Navbar.tsx`)

Barra de navegación fija en la parte superior (`position: fixed`, `z-index: var(--z-navbar)`).

```typescript
interface NavbarProps {
  isProductDetail?: boolean; // muestra flecha ← en lugar de hamburguesa
}
```

**Comportamiento:**
- Hamburguesa (☰) → abre un drawer fullscreen con animación de 300ms.
- El drawer contiene búsqueda (con `useRef<HTMLInputElement>` para auto-focus) y listado de categorías.
- La búsqueda navega a `/?q=<término>` mediante `useNavigate`.
- El filtrado por categoría hace scroll al `id` de la sección correspondiente.
- Los iconos `User` y `ShoppingBag` son visuales (sin funcionalidad de momento).
- Iconos: `Menu`, `Search`, `User`, `ShoppingBag`, `X`, `ArrowLeft` (Lucide React).

### ProductCard (`src/components/ProductCard.tsx`)

Tarjeta reutilizable de producto.

```typescript
interface ProductCardProps {
  product: Product;
  disabledLink?: boolean; // desactiva la navegación (usado en el preview del admin)
}
```

Muestra la primera imagen del array `product.images` con fallback a placeholder, badge "DESTACADO", título y precio en €. Navega a `/producto/{id}` al hacer clic.

---

## Páginas

### PublicStore (`src/pages/PublicStore.tsx`)

Ruta `/`. Escaparate principal.

**Secciones:**
1. **Hero:** vídeo de fondo (`AmiVera_Hero_Background.mp4`) con overlay oscuro, pill badge, título, subtítulo y botón CTA.
2. **Catálogos por categoría:** una sección por cada categoría con scroll horizontal de `ProductCard`. El id de cada sección es `cat-{nombre}`.
3. **Resultados de búsqueda:** si el query param `?q=` está presente (leído con `useLocation` + `URLSearchParams`), muestra un grid filtrado en lugar de los carruseles.

### ProductDetail (`src/pages/ProductDetail.tsx`)

Ruta `/producto/:id`. Ficha de producto.

El `id` se lee con `useParams<{ id: string }>()` y se convierte a número para buscar en el array de productos. Hace scroll al top en cada cambio de producto via `useEffect`.

**Secciones:**
- Imagen grande, título, precio (actualmente muestra `$` — bug conocido, debe ser `€`).
- Botón WhatsApp que abre `https://wa.me/34646555027` con mensaje preformateado.
- Texto promocional fijo.
- Descripción multilineal.
- Grid 2 columnas de "También te puede gustar" (misma categoría o aleatorios).

### AdminDashboard (`src/pages/AdminDashboard.tsx`)

Ruta `/admin`. Panel de gestión sin autenticación (se protegerá en Fase 4).

El estado del formulario usa el tipo `ProductFormData`. Las imágenes se convierten a base64 con `FileReader` y se almacenan en localStorage.

**Funcionalidades:**
- Formulario con título, precio, categoría (con `<datalist>`), descripción y 4 slots de imagen.
- Preview en vivo dentro de un mockup de móvil (375×667px), alternando entre vista de card y vista de detalle.
- Alerta de éxito con auto-dismiss de 3 segundos.

---

## Estilos

El sistema de estilos está organizado en `src/styles/` y cargado desde `src/index.css` como único punto de entrada.

### Estructura

| Fichero | Contenido |
|---|---|
| `src/index.css` | Orquestador — solo 4 líneas `@import` |
| `src/styles/variables.css` | Todos los design tokens del sistema |
| `src/styles/base.css` | Google Fonts (Outfit) + reset HTML (`*`, `body`, `img`, `a`, `button`) |
| `src/styles/layout.css` | Navbar, hero, catálogo, cards, PDP, footer |
| `src/styles/admin.css` | Panel de administración completo |

### Design tokens principales (`src/styles/variables.css`)

```css
/* Colores de marca */
--primary:   #1A1A1A;
--secondary: #F5F5F7;
--accent:    #E5B299;   /* beige/melocotón */

/* Colores base */
--color-white: #ffffff;
--color-black: #000000;

/* Superficies */
--color-surface:     #f3f4f6;  /* fondos de imagen, contenedores neutros */
--color-surface-alt: #f8f9fa;  /* fondo del panel admin */

/* Texto */
--text-main:        #2D2D2D;
--text-light:       #6E6E73;
--color-text-muted: #6b7280;
--color-text-body:  #374151;
--color-text-dark:  #111827;

/* Radios */
--radius-xs: 4px;   --radius-sm: 6px;
--radius-md: 8px;   --radius-lg: 12px;
--radius-pill: 20px; --radius-full: 36px;

/* Sombras */
--shadow-xs / --shadow-sm / --shadow-md / --shadow-lg / --shadow-xl

/* Layout */
--navbar-height: 60px;
--max-width-store: 1400px;
--max-width-pdp: 800px;

/* Z-index */
--z-navbar: 50;   --z-drawer: 100;

/* Transiciones */
--transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
--transition-quick: 0.2s ease;
--transition-drawer: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

Fuente: **Outfit** (Google Fonts, pesos 300–700), con fallback a fuentes del sistema.

---

## Flujo de datos

```
products.json (seed, 55 productos)
       │
       ▼
ProductContext ──── localStorage (amivera_products_v4)
       │
       ├── PublicStore    (lee products, categories)
       ├── ProductDetail  (lee products por id)
       ├── AdminDashboard (llama addProduct → actualiza context + localStorage)
       └── Navbar         (lee categories para el menú del drawer)
```

Actualmente sin llamadas fetch ni API. Todo el estado vive en memoria React y se sincroniza con localStorage. Esto cambiará en Fase 5 cuando se conecte Supabase.

---

## Integración WhatsApp

El botón de compra en `ProductDetail.tsx` construye la siguiente URL:

```
https://wa.me/34646555027?text=Hola%2C%20me%20interesa%20encargar%3A%20{título}
```

El número de teléfono (+34 646 555 027) está hardcodeado en `src/pages/ProductDetail.tsx`.

---

## Entornos

El proyecto usa dos proyectos Supabase completamente separados para proteger los datos reales de la clienta durante el desarrollo.

### DEV — Entorno de desarrollo

- **Cuándo usarlo:** para desarrollar features, probar integraciones, hacer migraciones de esquema y testear la UI.
- **Base de datos:** proyecto Supabase propio del equipo. Contiene datos ficticios o semilla.
- **Variables:** se configuran en `.env.local` (fichero local, nunca sube a Git).

### PROD — Entorno de producción

- **Cuándo usarlo:** únicamente cuando una feature está validada y lista para la clienta.
- **Base de datos:** proyecto Supabase de la clienta. Contiene datos reales.
- **Variables:** se configuran **exclusivamente** en Vercel → Settings → Environment Variables.

> **Regla absoluta: nunca usar PROD para pruebas. Nunca escribir datos reales en DEV.**

### Archivos SQL del proyecto

Los archivos SQL viven en la carpeta `supabase/` y se ejecutan en el SQL Editor del Dashboard de Supabase DEV.

| Archivo | Propósito | Cuándo ejecutar |
|---|---|---|
| `supabase/schema-dev.sql` | Crea tablas, índices, RLS y Storage | Una vez, al crear el proyecto DEV |
| `supabase/seed-dev.sql` | Inserta 4 categorías y 8 productos demo | Después del schema; solo en DEV |

> **⚠️ `seed-dev.sql` es exclusivo de DEV.** Contiene datos ficticios de prueba (nombres reales de productos pero sin precios ni imágenes definitivas) y no debe ejecutarse en el proyecto Supabase de producción. Los datos reales los gestiona la admin desde el panel de administración.

### Configuración local (desarrollo)

```bash
cp .env.example .env.local
# Editar .env.local con las claves del proyecto DEV — nunca las de PROD
```

Contenido de `.env.local`:
```
VITE_SUPABASE_URL=https://<tu-proyecto-dev>.supabase.co
VITE_SUPABASE_ANON_KEY=<tu-anon-key-dev>
```

### Variables en Vercel (producción)

En Vercel → Settings → Environment Variables, añadir únicamente para el entorno `Production`:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase PROD |
| `VITE_SUPABASE_ANON_KEY` | Anon key del proyecto Supabase PROD |

### Claves que NUNCA van a GitHub

| Clave | Motivo |
|---|---|
| `.env.local` completo | Contiene credenciales reales — está en `.gitignore` |
| `VITE_SUPABASE_ANON_KEY` con valor real | Solo en `.env.local` o panel de Vercel |
| `service_role_key` | Clave de acceso total — solo en backend/Edge Functions, **nunca en el frontend** |
| Contraseñas de base de datos | Acceso directo a PostgreSQL — solo en herramientas seguras del equipo |

---

## Comandos de desarrollo

```bash
npm run dev       # Servidor de desarrollo Vite con HMR
npm run build     # Build de producción
npm run preview   # Preview del build de producción en local
npm run lint      # Análisis estático con ESLint + typescript-eslint
npx tsc --noEmit  # Verificación de tipos TypeScript sin emitir ficheros
```

---

## Flujo de lectura pública (Fase 5D)

```
Visitante abre la tienda
        │
        ▼
PublicStore.tsx / ProductDetail.tsx
        │
        ▼ llama a
useProducts()                           ← src/hooks/useProducts.ts
        │
        ├─ Si VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY están en .env.local
        │        │
        │        ▼
        │   supabase.from('productos')
        │     .select('id, titulo, precio, categorias(nombre), imagenes_producto(url, path, orden)')
        │     .eq('visible', true)
        │     .order('orden')
        │        │
        │        ▼
        │   RLS anon → solo productos con visible = true
        │        │
        │        ▼
        │   mapRow() → Product[]   (UI shape)
        │
        └─ Si las variables NO están configuradas (fallback)
                 │
                 ▼
            useProductContext() → datos de localStorage / products.json
```

La UI (componentes, rutas, estilos) no sabe si los datos vienen de Supabase o de localStorage.
El admin CRUD sigue usando `useProductContext()` y localStorage en esta fase.

---

## Glosario Supabase

Términos usados en el esquema de base de datos (`supabase/schema-dev.sql`) y en el panel de Supabase.

### Slug

Un slug es una versión del nombre de un producto o categoría transformada para usarse en URLs. Solo contiene letras minúsculas, números y guiones; sin espacios ni caracteres especiales.

Ejemplo: `"Pasión por el vino"` → `"pasion-por-el-vino"`

**Por qué las URLs públicas usan slug y no id:**
El `id` es un UUID interno (`b0000000-0000-4000-8000-000000000001`) diseñado para la base de datos, no para personas. Un slug como `/producto/copa-vino-grabada-nombre` es legible, memorable y más amigable para los buscadores (SEO).

**Diferencia entre id interno y slug público:**

| Propiedad | `id` | `slug` |
|---|---|---|
| Formato | UUID (`xxxxxxxx-xxxx-...`) | Texto legible (`copa-vino-grabada`) |
| Generado por | Base de datos / `crypto.randomUUID()` | Transformación del título |
| Dónde aparece | Nunca en la URL pública; en el admin sí | URL pública (`/producto/:slug`) |
| Cambia si... | Nunca (clave primaria estable) | Si cambia el título (con cuidado) |
| Debe ser único | Siempre (obligatorio) | Siempre (obligatorio, forzado por Supabase UNIQUE) |

El frontend busca primero por slug y, si no encuentra, busca por id. Esto permite compatibilidad con enlaces antiguos que aún usen UUID.

### Storage Bucket

Un bucket es un contenedor de archivos dentro de Supabase Storage (similar a una carpeta raíz en Dropbox o Google Drive). En este proyecto se usa el bucket `imagenes-productos` para guardar las fotos de los artículos.

Cada imagen se guarda en una ruta con esta estructura:
```
imagenes-productos/productos/{id-del-producto}/{nombre-del-archivo}
```

El bucket está configurado como **público**, lo que significa que cualquier persona puede ver las imágenes a través de su URL, pero solo la admin puede subir, modificar o eliminar archivos.

### RLS (Row Level Security)

RLS es el sistema de permisos fila a fila de PostgreSQL (la base de datos que usa Supabase). Cuando RLS está activado en una tabla, cada consulta pasa por un filtro automático que decide qué filas puede ver o modificar el usuario que hace la petición.

Sin RLS, cualquiera con la clave `anon` podría leer toda la tabla sin restricciones. Con RLS, se puede establecer, por ejemplo, que los visitantes solo vean los productos marcados como `visible = true`.

Las reglas de filtrado se llaman **políticas** (policies) y se definen en SQL. En este proyecto hay dos tipos:

- `lectura_publica` → permite que visitantes sin cuenta vean datos visibles.
- `crud_admin` → permite que la admin cree, edite y elimine datos.

### anon

`anon` es el rol que usa Supabase para cualquier petición que llega **sin autenticación**: visitantes de la tienda, bots, peticiones desde el frontend antes de iniciar sesión. La clave `VITE_SUPABASE_ANON_KEY` del frontend identifica al proyecto pero no da privilegios de escritura por sí sola. Las políticas RLS con `TO anon` controlan exactamente qué puede leer ese rol.

### authenticated

`authenticated` es el rol que usa Supabase cuando el usuario **ha iniciado sesión** con Supabase Auth. En cuanto alguien se autentica (con email y contraseña, por ejemplo), sus peticiones pasan a usar este rol.

**Importante: `authenticated` no equivale automáticamente a admin.**

Si en el futuro la tienda tuviese cuentas de clientes (para guardar pedidos favoritos, por ejemplo), esos clientes también serían `authenticated`. Si las políticas dijeran simplemente `TO authenticated USING (true)`, cualquier cliente registrado podría editar o eliminar productos.

Por eso este esquema usa la función `is_admin()`, que comprueba el email del usuario autenticado. Solo si el email coincide con el de la admin se permite la operación de escritura. El rol `authenticated` es una condición necesaria pero no suficiente para tener acceso de administración.

---

## Limitaciones conocidas y deuda técnica

- **Imágenes en base64:** los productos añadidos desde el admin se almacenan como base64 en localStorage. Saturará el almacenamiento del navegador con pocas imágenes grandes. Se resolverá en Fase 6 con Supabase Storage.
- **Admin sin autenticación:** la ruta `/admin` es pública. Se protegerá en Fase 4 con Supabase Auth.
- **Precio con símbolo incorrecto:** `PublicStore` y el admin muestran `€`, pero `ProductDetail` muestra `$`. Bug pendiente de corregir.
- **Sin carrito:** cada producto se compra individualmente por WhatsApp.
- **Iconos `User` y `ShoppingBag` no funcionales:** presentes en la navbar como elementos visuales.
- **Sin tests:** no hay tests unitarios ni de integración.

---

## Decisiones de diseño relevantes

- **TypeScript desde Fase 2:** tipado estricto con `strict: true` en tsconfig. Permite escalar con seguridad hacia Supabase (los tipos de la DB se integrarán directamente). Se usa `interface` sobre `type` para modelos de datos.
- **Hook `useProductContext()`:** en lugar de exportar el contexto directamente, se expone a través de un hook que lanza error si se usa fuera del provider. Patrón más seguro y con mejor DX.
- **CSS puro con design tokens:** un fichero `variables.css` centraliza todos los valores visuales. Permite cambiar la identidad de marca completa editando un solo fichero, sin overhead de frameworks.
- **localStorage como base de datos transitoria:** permite añadir y visualizar productos sin deploy ni backend. Adecuado para la fase de prototipo; se sustituirá por Supabase en Fase 5.
- **SPA sin Server Components:** despliegue estático en Vercel. La arquitectura de cliente puro es suficiente para este caso de uso (tienda de catálogo + WhatsApp).
- **Venta por WhatsApp:** el negocio no requiere pasarela de pago ni gestión de pedidos online, por lo que no se añade esa complejidad.
