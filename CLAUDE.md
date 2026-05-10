# CLAUDE.md — A Mi Vera

Instrucciones y contexto de proyecto para Claude Code.

---

## Protocolo de cierre de tarea

Al terminar cualquier tarea, devuelve siempre un resumen final con esta estructura exacta:

### Resumen de la tarea
Explica en 3-5 líneas qué se ha hecho.

### Archivos modificados
Lista cada archivo tocado e indica brevemente qué cambió en cada uno.

Formato:
- `ruta/del/archivo`: cambio realizado.

### Archivos creados
Lista los archivos nuevos creados, si los hay.

Formato:
- `ruta/del/archivo`: finalidad del archivo.

### Pruebas recomendadas
Indica los comandos o comprobaciones manuales que debo ejecutar.

Ejemplo:
- `npm run dev`
- `npm run build`
- Revisar `/`
- Revisar `/admin`
- Revisar `/producto/1000`

### Estado del proyecto
Indica en qué fase queda el proyecto después de esta tarea.

Ejemplo:
- Fase actual: Sistema global de estilos completado.
- Siguiente paso recomendado: Diseñar estructura del panel privado de administración.

**Reglas:**
- No des solo "hecho".
- No ocultes archivos modificados.
- No mezcles explicación técnica larga con el resumen final.
- El resumen debe ser claro para poder pegarlo en el README o compartirlo con otro asistente.

---

## Reglas de entornos y seguridad

Estas reglas son **obligatorias** y se aplican en todas las tareas que impliquen Supabase, variables de entorno o credenciales.

### Entornos

| Entorno | Cuándo usarlo | Variables |
|---------|--------------|-----------|
| **DEV** | Desarrollo, pruebas, migraciones, experimentación | `.env.local` (nunca en Git) |
| **PROD** | Solo features validadas y listas para la clienta | Panel de Vercel únicamente |

### Reglas que no se negocian

1. **Nunca usar PROD para pruebas.** Si necesitas probar algo, usa el entorno DEV.
2. **Nunca escribir datos reales en DEV.** Las bases de datos son completamente independientes.
3. **`service_role_key` nunca va en el frontend.** Solo en Edge Functions o backends de servidor. Si el código que estás escribiendo es TypeScript del cliente (Vite/React), `service_role_key` no tiene cabida ahí bajo ningún concepto.
4. **Nunca subir secretos a GitHub.** Ni en código, ni en comentarios, ni en logs. Solo `.env.example` (sin valores reales) va al repositorio.
5. **La única clave permitida en el frontend es `VITE_SUPABASE_ANON_KEY`.** Esta clave es pública por diseño, pero solo debe apuntar a DEV en local y a PROD en Vercel.

### Variables permitidas en el frontend (React/Vite)

```
VITE_SUPABASE_URL        ← URL del proyecto Supabase
VITE_SUPABASE_ANON_KEY   ← Clave pública anon (no da acceso admin)
```

Cualquier variable con prefijo `VITE_` es visible en el bundle del cliente. No pongas nada sensible con ese prefijo.

### Cómo leer variables de entorno en este proyecto

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
```

---

## Arquitectura del panel admin (Fase 4)

Decisiones de diseño tomadas antes de la implementación. No cambiar sin consenso.

### Rutas privadas

| Ruta | Vista |
|------|-------|
| `/login` | Login (visual) |
| `/admin` | → redirige a `/admin/dashboard` |
| `/admin/dashboard` | Dashboard |
| `/admin/productos` | ProductList |
| `/admin/productos/nuevo` | ProductForm (crear) |
| `/admin/productos/:id/editar` | ProductForm (editar) |
| `/admin/categorias` | CategoryList |
| `/admin/stock` | StockManager |
| `/admin/portada` | HomeEditor |

### Carpetas nuevas a crear

```
src/pages/admin/        ← vistas del panel
src/components/admin/   ← componentes exclusivos del panel
src/router/             ← PrivateRoute.tsx
src/hooks/              ← useProducts, useCategories, useStock
src/lib/                ← supabase.ts (vacío hasta Fase 5)
src/styles/admin-layout.css  ← layout, sidebar, bottom nav
```

### Reglas de implementación

- `PrivateRoute` comprueba `localStorage.getItem('amivera_admin_session')` en Fase 4. En Fase 5 se sustituye por sesión de Supabase Auth.
- `ProductForm` es el mismo componente para crear y editar. La presencia de `:id` en la URL determina el modo.
- Los hooks (`useProducts`, `useCategories`, `useStock`) devuelven datos del contexto en Fase 4. En Fase 5 devuelven datos de Supabase. La UI no cambia.
- No mezclar componentes del panel admin (`src/components/admin/`) con los de la tienda pública (`src/components/`).
- `AdminLayout` envuelve TODAS las páginas de `/admin/*`. Login tiene su propio layout simple.

### Tablas Supabase (diseñadas, no creadas todavía)

`products` · `product_images` · `categories` · `home_sections`
(sin tabla `stock` — no relevante para venta por WhatsApp sin carrito)

Bucket de Storage: `product-images` → carpeta `products/{product_id}/`

### Qué NO implementar en Fase 4

Supabase, auth real, carrito, pagos, cuentas de clientes, variantes de producto, analytics, tests.

---

## Arquitectura Supabase (Fase 5)

Decisiones tomadas en Fase 5A. No cambiar sin consenso.

### Tablas definitivas

| Tabla | Descripción |
|-------|-------------|
| `categories` | Categorías del catálogo |
| `products` | Productos con FK a categories |
| `product_images` | Imágenes de productos (1:many) |
| `home_sections` | Bloques editables de la portada |

No hay tabla `admin_users`. La admin se gestiona en Supabase Auth directamente.

### PKs y slugs

- Todos los PKs son UUID (`gen_random_uuid()`).
- `products.slug` y `categories.slug` son TEXT UNIQUE generados en el frontend.
- Las URLs públicas cambian: `/producto/:id` (entero) → `/producto/:slug`.
- `Product.id` cambia de `number` a `string` en TypeScript.

### Campos nullable por diseño

- `products.description` — puede crearse sin descripción
- `products.category_id` — nullable para migración masiva
- `product_images.storage_path` — NULL hasta Fase 6 (Storage)
- `home_sections.title/subtitle/image_url/link_url` — opcionales

### RLS

- `anon`: SELECT WHERE active = true (products, categories, home_sections)
- `authenticated`: SELECT + INSERT + UPDATE + DELETE sin restricción
- Bucket `product-images`: lectura pública, escritura solo authenticated

### Tipos TypeScript

- `src/types/db.ts` — capa DB (privada a hooks/lib)
- `src/types/product.ts` y `src/types/admin.ts` — capa UI (cambios mínimos)
- Los hooks transforman DB-shape → UI-shape. La UI no cambia.

### Hooks en Fase 5

`useProducts()` y `useCategories()` añaden `loading: boolean` y `error: string | null`.

### Auth (implementado en 5E.1)

- `src/context/AuthContext.tsx` — `AuthProvider` + `useAuth()` con `isAuthenticated`, `loading`, `login()`, `logout()`.
- Dual-path: Supabase Auth cuando `isSupabaseConfigured`; fallback a localStorage `amivera_admin_session` en dev sin Supabase.
- `Login.tsx` — llama a `login()`, muestra mensajes de error en español, estado `submitting`, aviso en modo sin Supabase.
- `PrivateRoute.tsx` — espera `loading` antes de redirigir; muestra `.admin-auth-loading` mientras verifica sesión.
- `AdminSidebar.tsx` y `AdminHeader.tsx` — llaman a `logout()` de `useAuth()`.
- CSS añadido: `.admin-auth-loading`, `.login-error`, `.login-warning`, `.login-btn:disabled`.

### Orden de implementación

- 5B: Infra DEV (tablas, RLS, bucket)
- 5C: Migración de datos (script manual)
- 5D: Lectura pública (useProducts read-only + routing a slugs)
- 5E: Auth + CRUD admin
- 5F: Validación + PROD

### Riesgos prioritarios al programar

1. ~~Buscar y reemplazar todos los `Number(id)` al iniciar 5D~~ — **hecho en Fase 5B-prep**
2. ~~Añadir loading states en PublicStore.tsx y ProductDetail.tsx~~ — **hecho en Fase 5D.1**
3. El script de migración debe manejar colisiones de slug
4. ~~Probar roles anon y authenticated en RLS antes de tocar PROD~~ — **resuelto en Fase 5E.3**
5. ~~Bug existente: precio muestra `$` en lugar de `€` en ProductDetail.tsx~~ — **corregido en Fase 5B-prep**

### Decisiones tomadas en Fase 5F (hardening DEV + preparación PROD)

- `vercel.json` creado con `rewrites` para SPA routing — sin él, F5 en cualquier ruta devuelve 404 en Vercel.
- `supabase.ts` añade `.trim()` a las variables de entorno — previene fallos silenciosos si hay espacios.
- `index.html` corregido: `lang="es"`, `title="A Mi Vera — Regalos personalizados"`, `meta description`.
- **Riesgo crítico detectado**: todo el código TypeScript (Fases 2–5E) nunca se ha committado a Git. El repo solo tiene la versión JSX de Fase 1. El primer paso obligatorio antes de PROD es `git add` + `git commit` de todo el código actual.
- Checklist de paso a PROD añadida al README.

### Decisiones tomadas en Fase 5E.3 (validación CRUD)

- `productsApi.ts` añade `translateDbError()`: convierte errores Postgres/RLS/JWT a mensajes en español.
- `updateProduct` comprueba el error del DELETE de imágenes antes de insertar (evita inconsistencia silenciosa).
- `refresh()` en `useAdminProducts` limpia el error cuando tiene éxito.
- `ProductForm` simplifica la condición de loading (evita spinner permanente con 0 productos en Supabase).
- `.admin-delete-error` muestra el error inline dentro del diálogo de confirmación de borrado.
- Riesgo aceptado: no hay transacciones atómicas en el cliente (supabase-js). La secuencia UPDATE productos → DELETE imágenes → INSERT imágenes tiene una ventana de inconsistencia si falla en medio. Solución completa requeriría una Edge Function o RPC. Queda como riesgo documentado para Fase 5F.

---

## Estado del proyecto

| Fase | Descripción | Estado |
|------|-------------|--------|
| Fase 1 | Prototipo inicial | ✅ Completada |
| Fase 2 | Migración a TypeScript | ✅ Completada |
| Fase 3 | Sistema global de estilos | ✅ Completada |
| Fase 3.5 | Separación de entornos DEV/PROD | ✅ Completada |
| Fase 4 | Panel privado de administración | ✅ Completada |
| Fase 5A | Diseño de arquitectura Supabase | ✅ Completada |
| Fase 5B-prep | Migración interna a UUID (frontend) | ✅ Completada |
| Fase 5C.1 | Esquema SQL DEV (tablas, RLS, Storage) | ✅ Completada |
| Fase 5C.2 | Seed de datos demo en Supabase DEV | ✅ Completada |
| Fase 5D.1 | Lectura pública desde Supabase (useProducts + fallback) | ✅ Completada |
| Fase 5D.2 | Migración de rutas públicas a slug (/producto/:slug) | ✅ Completada |
| Fase 5E.1 | Auth real Supabase (AuthContext, Login, PrivateRoute, logout) | ✅ Completada |
| Fase 5E.2A | CRUD admin productos desde Supabase | ✅ Completada |
| Fase 5E.3 | Validación y hardening CRUD en DEV | ✅ Completada |
| Fase 5E.2B | CRUD admin categorías desde Supabase | ✅ Completada |
| Fase 5F | Hardening DEV + preparación PROD | ✅ Completada |
| Fase 6 | Storage de imágenes | ⏳ Pendiente |
| Fase 7 | Importación masiva desde Excel | ⏳ Pendiente |
