# Animaciones — A Mi Vera

Patrones de animación reutilizables de la plataforma. Úsalos en lugar de inventar
animaciones nuevas, para que todo se sienta coherente.

> Principios: **sutil** (nada brusco), **rápido pero suave**, y **siempre** respetar
> `prefers-reduced-motion` (accesibilidad). Easing de marca:
> `cubic-bezier(0.22, 1, 0.36, 1)` (arranque ágil, frenado suave).

---

## 1. `reveal-rows` — aparición/desaparición por altura

Utilidad global (en `src/styles/base.css`). Hace que un bloque **aparezca o
desaparezca suavemente animando su altura**, empujando el contenido contiguo hacia
abajo o hacia arriba. Es la animación estándar para mostrar/ocultar paneles,
barras, avisos, secciones plegables, etc.

**Cómo funciona:** anima `grid-template-rows` de `0fr` (cerrado) a `1fr` (abierto)
+ opacidad. El truco de CSS Grid permite animar a altura automática sin saber la
altura final. El **único hijo directo** se recorta (`overflow: hidden`) mientras
colapsa.

**Markup (un único hijo directo que envuelve el contenido):**
```jsx
<div className={`reveal-rows${abierto ? ' is-open' : ''}`}>
  <div>
    … contenido a revelar …
  </div>
</div>
```

### Dos formas de controlarlo

**A) Toggle directo (lo más simple)** — cuando el bloque está siempre montado y
solo cambia su visibilidad según un booleano. La transición se reproduce en ambos
sentidos automáticamente:
```jsx
<div className={`reveal-rows${seleccion > 0 ? ' is-open' : ''}`}>
  <div>…acciones…</div>
</div>
```

**B) Montaje/desmontaje (entra y sale con animación)** — cuando el bloque se monta
y desmonta. Hace falta:
- abrir en el **frame siguiente** al montar (si no, nace ya abierto y no anima);
- retrasar el desmontaje hasta que termine el cierre (~280 ms).
```jsx
const [montado, setMontado] = useState(false); // controla el render
const [abierto, setAbierto] = useState(false);  // controla .is-open

useEffect(() => {                                // al montar → abrir tras un frame
  if (!montado) return;
  const id = requestAnimationFrame(() => setAbierto(true));
  return () => cancelAnimationFrame(id);
}, [montado]);

function cerrar() {                              // cerrar → desmontar al acabar
  setAbierto(false);
  setTimeout(() => setMontado(false), 280);
}

{montado && (
  <div className={`reveal-rows${abierto ? ' is-open' : ''}`}>
    <div>…contenido…</div>
  </div>
)}
```

**Notas:**
- El hijo directo puede llevar `margin-bottom`; al tener `overflow: hidden` queda
  dentro de la altura animada (no se escapa).
- Se pueden **anidar** (un `reveal-rows` dentro de otro): el exterior abierto (`1fr`)
  crece para acomodar al interior mientras este se anima.
- **Ejemplo real:** la barra de edición masiva de `/admin/productos`
  (`src/pages/admin/ProductList.tsx`): la barra entra con la forma B al pulsar
  "Seleccionar", y dentro, la transición pista↔acciones (selección 0↔1) usa la
  forma A.

---

## 2. `page-fade` — transición entre páginas (fade-up)

En `src/App.css`, aplicada por `PublicLayout` a cada cambio de ruta pública. El
contenido aparece desvaneciéndose mientras sube unos píxeles y "se asienta".

- `@keyframes pageFadeUp`: `opacity 0→1` + `translateY(14px → 0)`.
- Duración ~520 ms, mismo easing de marca.
- El navbar va **fuera** del contenedor animado (no se mueve con el `transform`).
- Respeta `prefers-reduced-motion`.

No usar `transform`/`filter` en contenedores que envuelvan elementos
`position: fixed` (rompe el fijado): por eso el navbar es persistente y solo se
anima el contenido.

---

## 3. Otros detalles ya en uso

- **Confirmación de guardado** (editor de páginas): botón que pasa a verde con un
  tic + toast "Cambios guardados" (`src/styles/pages.css`, `savedPop`/`toastInOut`).
- **Hover de tarjetas/botones**: transiciones cortas (~160–200 ms) de `transform`
  y color. Mantener esa duración para coherencia.

---

## Checklist al añadir una animación nueva
1. ¿Existe ya un patrón aquí que sirva? Reutilízalo.
2. Duración: 200–300 ms para micro-interacciones; 450–550 ms para transiciones de
   página.
3. Easing de marca `cubic-bezier(0.22, 1, 0.36, 1)` salvo motivo claro.
4. Añade el bloque `@media (prefers-reduced-motion: reduce)` que la desactive.
5. Si es reutilizable, hazla utilidad global (en `base.css`) y documéntala aquí.
