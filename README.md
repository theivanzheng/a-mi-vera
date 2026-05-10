# A Mi Vera — Tienda Online

Aplicación web de comercio electrónico para **A Mi Vera**, una tienda de regalos personalizados. Es una SPA (Single Page Application) 100% client-side, sin backend ni API externa. La venta se canaliza a través de WhatsApp.

---

## Stack tecnológico

| Capa | Tecnología | Versión |
|---|---|---|
| UI Framework | React | 19.2.4 |
| Build Tool | Vite (plugin Oxc) | 8.0.4 |
| Routing | React Router DOM | 7.14.0 |
| Iconos | Lucide React | 1.8.0 |
| Estilos | CSS plano con variables CSS | — |
| Gestión de estado | React Context API + localStorage | — |
| Lenguaje | JavaScript (JSX, sin TypeScript) | ES6 modules |
| Gestor de paquetes | npm | — |

No se usa TypeScript, Tailwind, Redux, ni ningún framework CSS externo.

---

## Arquitectura general

```
index.html
└── src/main.jsx                  ← Punto de entrada React
    └── App.jsx                   ← Router + ProductProvider wrapper
        ├── ProductContext.jsx    ← Estado global (Context API + localStorage)
        ├── Navbar.jsx            ← Navegación fija (top)
        └── Routes
            ├── /                 → PublicStore.jsx   (escaparate)
            ├── /producto/:id     → ProductDetail.jsx (ficha de producto)
            └── /admin            → AdminDashboard.jsx (panel de gestión)
```

La aplicación no tiene autenticación. La ruta `/admin` es accesible sin login.

---

## Estructura de ficheros

```
A Mi Vera/
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── .gitignore
├── IdentidadVisual/
│   ├── Logo_AmiVera.png
│   └── AmiVera Logo Transparent.png
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                 ← Variables CSS globales + fuente Outfit
    ├── App.css                   ← Todos los estilos de componentes
    ├── components/
    │   ├── Navbar.jsx
    │   └── ProductCard.jsx
    ├── context/
    │   └── ProductContext.jsx
    ├── pages/
    │   ├── PublicStore.jsx
    │   ├── ProductDetail.jsx
    │   └── AdminDashboard.jsx
    ├── data/
    │   └── products.json         ← 55 productos semilla (IDs 1000–1054)
    └── assets/
        ├── AmiVera_Hero_Background.mp4
        └── hero.png
```

---

## Estado global: ProductContext

**Fichero:** `src/context/ProductContext.jsx`

Centraliza el catálogo de productos. Combina los 55 productos de `products.json` con los productos añadidos dinámicamente por el admin. El estado se persiste en `localStorage` bajo la clave `amivera_products_v4`.

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

`extractCategories()` combina estas categorías maestras con las de los productos para evitar duplicados. Si se añade un producto con una categoría nueva, aparece después de las 12 predefinidas.

### Funciones expuestas por el contexto

- `products`: array completo de productos activos
- `categories`: array de strings de categorías (maestras + dinámicas)
- `addProduct(product)`: añade un producto, filtra imágenes vacías, persiste en localStorage

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

Los productos del seed usan URLs de Unsplash como placeholder. Los productos añadidos por admin almacenan imágenes como cadenas base64.

---

## Componentes

### Navbar (`src/components/Navbar.jsx`)

Barra de navegación fija en la parte superior (`position: fixed`, `z-index: 50`).

**Comportamiento:**
- **Escritorio:** logo centrado, iconos de usuario y bolsa a la derecha (no funcionales), icono de búsqueda.
- **Móvil:** icono hamburguesa (☰) que abre un drawer fullscreen con animación de 300ms.
- El drawer contiene: campo de búsqueda (con `useRef` para auto-focus) y listado de categorías.
- La búsqueda navega a `/?q=<término>` usando `useNavigate` de React Router.
- El filtrado por categoría navega a `/?category=<nombre>`.
- Iconos usados: `Menu`, `Search`, `User`, `ShoppingBag`, `X`, `ArrowLeft` (todos de Lucide React).

### ProductCard (`src/components/ProductCard.jsx`)

Tarjeta reutilizable de producto.

**Props:**
- `product`: objeto producto completo
- `disabledLink` (bool): desactiva la navegación al detalle (usado en el preview del admin)

**Muestra:** imagen principal del producto (primera del array con fallback), badge "DESTACADO", título, precio en €. Al hacer clic navega a `/producto/{id}`.

---

## Páginas

### PublicStore (`src/pages/PublicStore.jsx`)

Ruta `/`. Es el escaparate principal.

**Secciones:**
1. **Hero:** vídeo de fondo (`AmiVera_Hero_Background.mp4`) con overlay oscuro. Contiene pill badge, título, subtítulo y botón CTA.
2. **Catálogos por categoría:** para cada categoría (excepto "Todos") renderiza una sección con título y un contenedor de scroll horizontal con sus `ProductCard`.
3. **Resultados de búsqueda:** si el query param `q` está presente, muestra un grid de resultados filtrados en lugar de las secciones por categoría.

El filtrado lee los params de URL (`useSearchParams`) y filtra `products` del contexto.

### ProductDetail (`src/pages/ProductDetail.jsx`)

Ruta `/producto/:id`. Ficha de producto.

**Comportamiento:**
- Lee el `id` de los params de URL y busca el producto en el contexto.
- Hace scroll al top al cambiar de producto (`useEffect` + `window.scrollTo`).
- Muestra imagen a pantalla completa, título, precio (mostrado con símbolo `$`), botón de WhatsApp, texto promocional, descripción.
- **Botón WhatsApp:** abre `https://wa.me/34646555027` con un mensaje preformateado que incluye el nombre del producto y su URL.
- **"También te puede gustar":** grid 2 columnas con hasta 4 productos relacionados (misma categoría, excluyendo el actual) o aleatorios si no hay suficientes.

### AdminDashboard (`src/pages/AdminDashboard.jsx`)

Ruta `/admin`. Panel de gestión sin autenticación.

**Formulario de añadir producto:**
- Título (required)
- Precio en € (required, tipo number)
- Categoría (required, `<input>` con `<datalist>` de sugerencias)
- Descripción (textarea)
- 4 slots de imagen: `<input type="file" accept="image/*">` → conversión a base64 con `FileReader`. La imagen 1 es required.

**Funcionalidades:**
- **Preview en vivo:** toggle que muestra el producto en construcción dentro de un mockup de móvil (375×667px con biseles CSS simulados), alternando entre vista de tienda y vista de detalle.
- **Alerta de éxito:** notificación que se auto-descarta a los 3 segundos tras añadir un producto.
- Al guardar llama a `addProduct()` del contexto y resetea el formulario.

---

## Estilos

### Variables CSS globales (`src/index.css`)

```css
--primary:       #1A1A1A   /* negro casi puro */
--secondary:     #F5F5F7   /* gris muy claro */
--accent:        #E5B299   /* beige/melocotón — color de marca */
--text-main:     #2D2D2D
--text-light:    #6E6E73
--bg-gradient:   linear-gradient(...)
--border-radius: 12px
--transition:    cubic-bezier(...)
/* + sombras: --shadow-sm, --shadow-md, --shadow-lg */
```

Fuente: **Outfit** cargada desde Google Fonts, con fallback a fuentes del sistema.

### App.css

Contiene todos los estilos de componentes en un único fichero, organizado por secciones con comentarios:
- Navbar y drawer (animación slide de 300ms)
- Hero (vídeo de fondo + overlay)
- ProductCard y grid/scroll horizontal
- ProductDetail (imagen full-width, botón WhatsApp)
- AdminDashboard (formulario, preview mockup de móvil)
- Footer (fondo `#111827`, logo con filtro CSS invertido)

Diseño **mobile-first** sin framework CSS. Algunos media queries para tablet/desktop.

---

## Flujo de datos

```
products.json (seed)
       │
       ▼
ProductContext ──── localStorage (amivera_products_v4)
       │
       ├── PublicStore   (lee products, categories)
       ├── ProductDetail (lee products por id)
       ├── AdminDashboard (llama addProduct → actualiza context + localStorage)
       └── Navbar        (lee categories para el menú)
```

No hay llamadas fetch ni API. Todo el estado vive en memoria React y se sincroniza con localStorage al añadir productos.

---

## Integración WhatsApp

El botón de compra en `ProductDetail` construye una URL de este tipo:

```
https://wa.me/34646555027?text=Hola!%20Me%20interesa%20este%20producto...
```

El número de teléfono (+34 646 555 027) está hardcodeado en `ProductDetail.jsx`.

---

## Comandos de desarrollo

```bash
npm run dev       # Servidor de desarrollo Vite con HMR
npm run build     # Build de producción
npm run preview   # Preview del build de producción en local
npm run lint      # Análisis estático con ESLint
```

---

## Limitaciones conocidas y deuda técnica

- **Imágenes en base64:** los productos añadidos por admin guardan imágenes como base64 en localStorage, lo que puede saturar el almacenamiento del navegador con pocas imágenes grandes.
- **Sin autenticación:** `/admin` es pública.
- **Precio con símbolo incorrecto:** el seed y el admin usan `€`, pero `ProductDetail` muestra `$`.
- **Sin TypeScript:** no hay validación de tipos estática.
- **Iconos User y ShoppingBag no funcionales:** están presentes en Navbar como elementos visuales sin lógica de carrito ni cuenta de usuario.
- **No hay sistema de carrito:** cada producto se compra individualmente por WhatsApp.
- **Sin tests.**

---

## Decisiones de diseño relevantes

- **Sin backend:** la decisión de no tener servidor simplifica el despliegue y elimina costes de infraestructura. El negocio opera por WhatsApp, por lo que no se necesita pasarela de pago ni gestión de pedidos online.
- **localStorage como base de datos:** permite añadir productos sin deploy. Adecuado para un catálogo pequeño gestionado por un único admin.
- **CSS puro sin framework:** control total sobre el diseño visual de marca sin overhead de clases de utilidad.
- **React 19:** versión más reciente en el momento de desarrollo. Sin uso de Server Components (es una SPA pura).
