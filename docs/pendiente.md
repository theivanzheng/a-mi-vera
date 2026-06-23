# Hoja de ruta — A Mi Vera

Estado del proyecto y siguientes pasos. Documento vivo: actualízalo al cerrar cada punto.

_Última actualización: 2026-06-24._

---

## ✅ En producción

La web está **online con el catálogo real**.

- **Dominio:** `www.amivera13.es` (válido). Apex `amivera13.es` redirige a `www`.
- **Hosting:** Vercel, despliega automáticamente desde la rama `main`.
- **Backend:** Supabase PROD (`ckgqzvysghsblaxscyfy`), datos migrados desde DEV.
- **Variables en Vercel (Production):** `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`
  (publishable) apuntando a PROD. _Se incrustan al construir → tras cambiarlas hay que
  redeploy._

### Hecho recientemente
- Rediseño web completo (catálogo único, navbar/drawer, hero, escaparates).
- Páginas **Nosotros** y **Bodas/Wedding Planners** (estas dos con placeholders, ver abajo).
- **Editor de páginas en línea** desde el admin (Inicio + Nosotros editables) — ver
  [`editor-paginas.md`](editor-paginas.md). El editor ya es **genérico por slug**.
- Transición **fade-up** entre páginas con navbar persistente.
- Migración de datos DEV → PROD (tablas + Storage) y conexión del dominio.

---

## 🔧 Cierre fino del despliegue (rápido)

1. **DNS — apex.** Confirmar que `amivera13.es` (registro A) apunta a `216.150.1.1`
   (no a `34.175.243.32`). `www` ya está validado. SiteGround → DNS Zone Editor.
   _No tocar MX/TXT (correo)._
2. **Email admin en PROD.** En `supabase/schema-prod.sql`, la función `is_admin()` debe
   tener el email real de la clienta para que pueda **editar y guardar** páginas/productos
   desde el admin en producción. Verificar que coincide con la cuenta con la que entra.

---

## 🟡 Siguientes pasos (trabajo de producto)

### 1. Página **Bodas** — la menos terminada
`src/pages/Bodas.tsx` está estructurada pero es **estática y con placeholders**:
- Faltan **fotos reales**: intro, los 4 paquetes y la galería (6) muestran "Foto próximamente".
- **Hacerla editable** desde el admin replicando el patrón de Nosotros (rápido, el editor ya
  es genérico):
  1. `src/content/bodas.ts` (modelo + defaults + merge).
  2. `src/components/BodasView.tsx` (consume `usePageContext<BodasContent>()`, usa `Editable*`).
  3. Añadir la entrada al registro `PAGINAS` en `src/pages/admin/PageEditor.tsx`.
  4. Marcar `editable: true` en `src/pages/admin/PaginasList.tsx`.
  5. Página pública envuelta en `PageContentProvider` (editing=false) con su `useBodasContent()`.

### 2. Página **Wedding Planners**
`src/pages/WeddingPlanners.tsx`: igual que Bodas — copy de ejemplo y no editable. Finalizar
textos y hacerla editable con el mismo patrón.

### 3. Imágenes del hero editables
Las fotos del abanico del hero (`FotosHeader/*.png`) se cambian **a mano** sustituyendo el
archivo. Convertirlas en editables desde el admin (un `EditableMedia` de imagen) evitaría
tocar código para cambiarlas.

### 4. Pantalla de **Ajustes** en el admin
El número de WhatsApp está hardcodeado (`src/lib/whatsapp.ts`). Una pantalla de ajustes
permitiría cambiarlo (y otros datos globales) sin tocar código.

---

## 🟢 Backlog

- **Fase 7B** — importación masiva de productos con imágenes (subida a Storage desde CSV).
  Ver [`importacion-productos.md`](importacion-productos.md).
