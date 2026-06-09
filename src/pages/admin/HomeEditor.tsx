import { useState, useEffect, useRef } from 'react';
import { Check, Eye, EyeOff, Tag, ChevronUp, ChevronDown, PlayCircle, Layers, AlertCircle } from 'lucide-react';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getHeroBloque, upsertHeroBloque, HERO_DEFAULTS, type HeroData } from '../../lib/bloqueHomeApi';
import type { Category } from '../../types/product';

type HeroForm = Omit<HeroData, 'id'>;

function heroEqual(a: HeroForm, b: HeroForm): boolean {
  return a.titulo === b.titulo && a.subtitulo === b.subtitulo &&
    a.pill_texto === b.pill_texto && a.cta_texto === b.cta_texto;
}

export default function HomeEditor() {
  const { categories, saving: catSaving, updateCategory, reorderCategories } = useAdminCategories();

  // ── Hero state ─────────────────────────────────────────────────────────────
  const [heroId, setHeroId]       = useState<string | null>(null);
  const [heroBase, setHeroBase]   = useState<HeroForm>({ ...HERO_DEFAULTS });
  const [form, setForm]           = useState<HeroForm>({ ...HERO_DEFAULTS });
  const [heroLoading, setHeroLoading] = useState(isSupabaseConfigured);
  const [heroSaving, setHeroSaving]   = useState(false);
  const [heroError, setHeroError]     = useState<string | null>(null);
  const [heroSaved, setHeroSaved]     = useState(false);
  const [schemaError, setSchemaError] = useState(false);

  // ── Categories reorder state ───────────────────────────────────────────────
  const [localCats, setLocalCats]       = useState<Category[]>([]);
  const [orderChanged, setOrderChanged] = useState(false);
  const [orderSaving, setOrderSaving]   = useState(false);
  const [orderSaved, setOrderSaved]     = useState(false);
  const [orderError, setOrderError]     = useState<string | null>(null);

  // Ref to prevent sync overwriting user's in-progress reorder on refresh
  const orderChangedRef = useRef(false);

  // ── Load hero from Supabase ────────────────────────────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    getHeroBloque().then(({ data, error }) => {
      setHeroLoading(false);
      if (error) {
        // Likely schema not migrated yet
        if (error.toLowerCase().includes('column') || error.toLowerCase().includes('does not exist')) {
          setSchemaError(true);
        } else {
          setHeroError(error);
        }
        return;
      }
      if (data) {
        const base = { titulo: data.titulo, subtitulo: data.subtitulo, pill_texto: data.pill_texto, cta_texto: data.cta_texto };
        setHeroId(data.id);
        setHeroBase(base);
        setForm(base);
      }
    });
  }, []);

  // ── Sync localCats when categories refresh (but not during active reorder) ─
  useEffect(() => {
    if (!orderChangedRef.current) setLocalCats(categories);
  }, [categories]);

  // ── Hero handlers ──────────────────────────────────────────────────────────
  function setField(key: keyof HeroForm, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    setHeroSaved(false);
  }

  async function handleSaveHero(e: React.FormEvent) {
    e.preventDefault();
    if (heroEqual(form, heroBase)) return;
    setHeroSaving(true);
    setHeroError(null);
    const { id: newId, error } = await upsertHeroBloque({ id: heroId, ...form });
    setHeroSaving(false);
    if (error) {
      setHeroError(error);
    } else {
      if (newId && !heroId) setHeroId(newId);
      setHeroBase({ ...form });
      setHeroSaved(true);
      setTimeout(() => setHeroSaved(false), 2500);
    }
  }

  // ── Category handlers ──────────────────────────────────────────────────────
  function moveUp(index: number) {
    if (index === 0) return;
    orderChangedRef.current = true;
    setOrderChanged(true);
    setLocalCats(prev => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  }

  function moveDown(index: number) {
    if (index === localCats.length - 1) return;
    orderChangedRef.current = true;
    setOrderChanged(true);
    setLocalCats(prev => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  }

  function discardOrder() {
    orderChangedRef.current = false;
    setOrderChanged(false);
    setLocalCats(categories);
  }

  async function handleSaveOrder() {
    setOrderSaving(true);
    setOrderError(null);
    const err = await reorderCategories(localCats.map(c => c.id));
    setOrderSaving(false);
    if (err) {
      setOrderError(err);
    } else {
      orderChangedRef.current = false;
      setOrderChanged(false);
      setOrderSaved(true);
      setTimeout(() => setOrderSaved(false), 2500);
    }
  }

  async function handleToggleVisible(cat: Category) {
    await updateCategory(cat.id, { visible: !cat.visible });
  }

  // ── No Supabase ────────────────────────────────────────────────────────────
  if (!isSupabaseConfigured) {
    return (
      <div>
        <div className="admin-list-header"><h1>Portada</h1></div>
        <div className="admin-placeholder">
          <div className="admin-placeholder-icon"><AlertCircle size={40} /></div>
          <h2>Supabase no está configurado</h2>
          <p>El editor de portada requiere conexión a Supabase. Configura las variables de entorno en <code>.env.local</code>.</p>
        </div>
      </div>
    );
  }

  const heroChanged = !heroEqual(form, heroBase);

  return (
    <div>
      <div className="admin-list-header">
        <h1>Portada</h1>
      </div>

      {/* ── Migración pendiente ── */}
      {schemaError && (
        <div className="admin-home-migration-notice">
          <AlertCircle size={16} />
          <span>
            Ejecuta la migración en Supabase antes de usar este editor:{' '}
            <code>supabase/migration-bloques-home-hero.sql</code>
          </span>
        </div>
      )}

      {/* ══ Sección: Héroe ══════════════════════════════════════════════════ */}
      <section className="admin-home-section">
        <div className="admin-home-section-title">
          <PlayCircle size={16} />
          <span>Sección héroe</span>
        </div>
        <p className="admin-home-section-desc">
          Texto que aparece sobre el vídeo de portada.
        </p>

        {heroLoading ? (
          <p className="admin-loading-text">Cargando…</p>
        ) : (
          <form onSubmit={handleSaveHero} className="admin-home-form">
            <div className="admin-home-field">
              <label htmlFor="hero-pill">Texto destacado</label>
              <span className="admin-home-field-hint">La pastilla sobre el título. Déjalo vacío para ocultarla.</span>
              <input
                id="hero-pill"
                type="text"
                value={form.pill_texto}
                onChange={e => setField('pill_texto', e.target.value)}
                placeholder="NUEVA COLECCIÓN"
                disabled={heroSaving || schemaError}
              />
            </div>

            <div className="admin-home-field">
              <label htmlFor="hero-titulo">Título principal</label>
              <input
                id="hero-titulo"
                type="text"
                value={form.titulo}
                onChange={e => setField('titulo', e.target.value)}
                placeholder={HERO_DEFAULTS.titulo}
                disabled={heroSaving || schemaError}
                required
              />
            </div>

            <div className="admin-home-field">
              <label htmlFor="hero-subtitulo">Subtítulo</label>
              <textarea
                id="hero-subtitulo"
                rows={2}
                value={form.subtitulo}
                onChange={e => setField('subtitulo', e.target.value)}
                placeholder={HERO_DEFAULTS.subtitulo}
                disabled={heroSaving || schemaError}
              />
            </div>

            <div className="admin-home-field">
              <label htmlFor="hero-cta">Texto del botón</label>
              <input
                id="hero-cta"
                type="text"
                value={form.cta_texto}
                onChange={e => setField('cta_texto', e.target.value)}
                placeholder="Ver el catálogo"
                disabled={heroSaving || schemaError}
              />
            </div>

            {heroError && <p className="admin-form-error">{heroError}</p>}

            <div className="admin-home-actions">
              {heroSaved && (
                <span className="admin-home-saved">
                  <Check size={14} /> Guardado
                </span>
              )}
              <button
                type="submit"
                className="admin-home-save-btn"
                disabled={heroSaving || !heroChanged || schemaError}
              >
                {heroSaving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* ══ Sección: Categorías ═════════════════════════════════════════════ */}
      <section className="admin-home-section">
        <div className="admin-home-section-title">
          <Layers size={16} />
          <span>Categorías en portada</span>
        </div>
        <p className="admin-home-section-desc">
          Las categorías visibles aparecen en la portada en este orden. Ocultar una categoría también oculta todos sus productos.
        </p>

        {localCats.length === 0 ? (
          <p className="admin-loading-text">No hay categorías todavía.</p>
        ) : (
          <div className="admin-cat-reorder-list">
            {localCats.map((cat, i) => (
              <div
                key={cat.id}
                className={`admin-cat-reorder-item${!cat.visible ? ' admin-cat-reorder-item--hidden' : ''}`}
              >
                <div className="admin-cat-reorder-arrows">
                  <button
                    className="admin-cat-reorder-arrow"
                    onClick={() => moveUp(i)}
                    disabled={i === 0 || catSaving}
                    aria-label={`Subir ${cat.nombre}`}
                  >
                    <ChevronUp size={14} />
                  </button>
                  <button
                    className="admin-cat-reorder-arrow"
                    onClick={() => moveDown(i)}
                    disabled={i === localCats.length - 1 || catSaving}
                    aria-label={`Bajar ${cat.nombre}`}
                  >
                    <ChevronDown size={14} />
                  </button>
                </div>

                <Tag size={14} className="admin-cat-reorder-icon" />

                <span className="admin-cat-reorder-name">{cat.nombre}</span>

                {!cat.visible && (
                  <span className="admin-badge admin-badge--hidden" style={{ marginLeft: 'auto' }}>Oculta</span>
                )}

                <button
                  className={`admin-icon-btn${!cat.visible ? ' admin-icon-btn--muted' : ''}`}
                  onClick={() => handleToggleVisible(cat)}
                  disabled={catSaving}
                  aria-label={cat.visible ? `Ocultar ${cat.nombre}` : `Mostrar ${cat.nombre}`}
                  title={cat.visible ? 'Ocultar categoría y sus productos' : 'Mostrar categoría y sus productos'}
                  style={{ marginLeft: cat.visible ? 'auto' : '0' }}
                >
                  {cat.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
              </div>
            ))}
          </div>
        )}

        {orderError && <p className="admin-form-error" style={{ marginTop: '0.5rem' }}>{orderError}</p>}

        {orderChanged && (
          <div className="admin-home-actions" style={{ marginTop: '0.75rem' }}>
            {orderSaved && (
              <span className="admin-home-saved">
                <Check size={14} /> Orden guardado
              </span>
            )}
            <button
              className="admin-home-save-btn"
              onClick={handleSaveOrder}
              disabled={orderSaving || catSaving}
            >
              {orderSaving ? 'Guardando…' : 'Guardar orden'}
            </button>
            <button
              className="admin-home-discard-btn"
              onClick={discardOrder}
              disabled={orderSaving}
            >
              Descartar
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
