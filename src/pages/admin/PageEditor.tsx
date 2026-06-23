import { useState, useEffect, useMemo, useCallback, type ComponentType } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Italic, X, AlertCircle, Check } from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';
import { getPaginaContenido, upsertPaginaContenido } from '../../lib/paginasApi';
import { HOME_DEFAULTS, mergeHomeContent, type HomeContent } from '../../content/home';
import { NOSOTROS_DEFAULTS, mergeNosotrosContent, type NosotrosContent } from '../../content/nosotros';
import { PageContentProvider } from '../../context/PageContent';
import HomeView from '../../components/HomeView';
import NosotrosView from '../../components/NosotrosView';

// Contenido de una página: objeto JSON cualquiera (la forma la conoce su View).
type Contenido = Record<string, unknown>;

interface PaginaConfig {
  nombre: string;
  defaults: Contenido;
  merge: (stored: unknown) => Contenido;
  View: ComponentType;
}

// Páginas editables. Cada una aporta sus defaults, su merge y su vista. Añadir
// una página nueva = añadir aquí su entrada (más la fila en PaginasList).
const PAGINAS: Record<string, PaginaConfig> = {
  inicio: {
    nombre: 'Inicio',
    defaults: HOME_DEFAULTS as unknown as Contenido,
    merge: (s) => mergeHomeContent((s as Partial<HomeContent>) ?? null) as unknown as Contenido,
    View: HomeView,
  },
  nosotros: {
    nombre: 'Nosotros',
    defaults: NOSOTROS_DEFAULTS as unknown as Contenido,
    merge: (s) => mergeNosotrosContent((s as Partial<NosotrosContent>) ?? null) as unknown as Contenido,
    View: NosotrosView,
  },
};

// Set inmutable por ruta de puntos ('hero.titulo', 'laser.ventajas.0').
function setByPath(obj: Contenido, path: string, value: unknown): Contenido {
  const next = structuredClone(obj);
  const keys = path.split('.');
  let cursor: Record<string, unknown> = next;
  for (let i = 0; i < keys.length - 1; i++) cursor = cursor[keys[i]] as Record<string, unknown>;
  cursor[keys[keys.length - 1]] = value;
  return next;
}

export default function PageEditor() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();

  const pagina = PAGINAS[slug];

  const [saved, setSaved] = useState<Contenido>(() => pagina?.defaults ?? {});   // último estado guardado
  const [draft, setDraft] = useState<Contenido>(() => pagina?.defaults ?? {});   // borrador en edición
  const [hasStored, setHasStored] = useState(false);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  // ── Cargar contenido ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!pagina) return;
    // Reinicia a los defaults de ESTA página (evita mostrar la nueva vista con
    // datos de la anterior si se cambia de página sin desmontar el editor).
    setSaved(pagina.defaults);
    setDraft(pagina.defaults);
    setHasStored(false);
    if (!isSupabaseConfigured) { setLoading(false); return; }
    setLoading(true);
    let active = true;
    getPaginaContenido(slug).then(({ data }) => {
      if (!active) return;
      const merged = pagina.merge(data ?? null);
      setSaved(merged);
      setDraft(merged);
      setHasStored(data != null);
      setLoading(false);
    });
    return () => { active = false; };
  }, [slug, pagina]);

  const setField = useCallback((path: string, value: unknown) => {
    setDraft(prev => setByPath(prev, path, value));
    setJustSaved(false);
  }, []);

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const { error } = await upsertPaginaContenido(slug, draft);
    setSaving(false);
    if (error) {
      setError(error);
    } else {
      setSaved(draft);
      setHasStored(true);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    }
  }

  function handleDiscard() {
    setDraft(saved);
    setError(null);
  }

  // Botón cursiva: envuelve la selección del campo enfocado en *...*
  function toggleItalic() {
    const el = document.activeElement as (HTMLInputElement | HTMLTextAreaElement) | null;
    const path = el?.dataset?.editable;
    if (!el || !path || el.selectionStart == null || el.selectionEnd == null) return;
    const { selectionStart: a, selectionEnd: b, value } = el;
    if (a === b) return;
    const sel = value.slice(a, b);
    const wrapped = sel.startsWith('*') && sel.endsWith('*') && sel.length > 1
      ? sel.slice(1, -1)
      : `*${sel}*`;
    setField(path, value.slice(0, a) + wrapped + value.slice(b));
  }

  // Evita que los enlaces de la vista previa naveguen mientras se edita.
  function blockNav(e: React.MouseEvent) {
    const target = e.target as HTMLElement;
    if (target.closest('a')) e.preventDefault();
  }

  if (!pagina) {
    return (
      <div className="page-editor-msg">
        <AlertCircle size={32} />
        <p>Esta página todavía no es editable.</p>
        <button onClick={() => navigate('/admin/paginas')}>Volver</button>
      </div>
    );
  }

  if (loading) {
    return <div className="page-editor-msg"><p>Cargando…</p></div>;
  }

  const View = pagina.View;

  return (
    <div className="page-editor">
      {!hasStored && (
        <div className="page-editor-notice">
          <AlertCircle size={15} />
          Mostrando los textos por defecto — aún no has guardado contenido para esta página.
          Edita y pulsa <strong>Guardar</strong> para publicar tus cambios.
        </div>
      )}

      {/* Vista previa editable de la página */}
      <div className="page-editor-canvas" onClickCapture={blockNav}>
        <PageContentProvider value={{ content: draft, editing: true, hasStored, setField }}>
          <div className="store-container">
            <View />
          </div>
        </PageContentProvider>

        {/* Guardar todo (bloque al final del contenido) */}
        <div className="page-editor-save">
          {error && <p className="page-editor-save-error">{error}</p>}
          <button
            type="button"
            className={`page-editor-save-btn${justSaved ? ' is-saved' : ''}`}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Guardando…' : justSaved
              ? (<><Check size={18} /> Guardado</>)
              : 'Guardar todo'}
          </button>
          {!dirty && !saving && !justSaved && (
            <span className="page-editor-save-hint">No hay cambios sin guardar.</span>
          )}
        </div>
      </div>

      {/* Barra fina: herramientas y salida (el guardado es el botón grande) */}
      <div className="page-editor-bar">
        <span className="page-editor-bar-title">
          Editando: <strong>{pagina.nombre}</strong>
        </span>

        <div className="page-editor-bar-actions">
          <button
            type="button"
            className="page-editor-tool"
            title="Poner en cursiva el texto seleccionado"
            onMouseDown={(e) => { e.preventDefault(); toggleItalic(); }}
          >
            <Italic size={15} /> Cursiva
          </button>
          <button
            type="button"
            className="page-editor-btn page-editor-btn--ghost"
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            Descartar
          </button>
          <button
            type="button"
            className={`page-editor-btn ${justSaved ? 'page-editor-btn--saved' : 'page-editor-btn--primary'}`}
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            {saving ? 'Guardando…' : justSaved
              ? (<><Check size={15} /> Guardado</>)
              : 'Guardar'}
          </button>
          <button
            type="button"
            className="page-editor-exit"
            title="Salir"
            onClick={() => navigate('/admin/paginas')}
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Confirmación flotante al guardar */}
      {justSaved && (
        <div className="page-editor-toast" role="status">
          <span className="page-editor-toast-check"><Check size={15} /></span>
          Cambios guardados
        </div>
      )}
    </div>
  );
}
