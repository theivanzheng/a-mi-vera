import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Download, Plus, X, Check } from 'lucide-react';
import { useAdminProducts } from '../../hooks/useAdminProducts';
import type { CreatedDraft, ProductTextFields, ImageEntry, ProductPatch } from '../../hooks/useAdminProducts';
import { useAdminCategories } from '../../hooks/useAdminCategories';
import { parseProductsExcel, downloadProductsTemplate } from '../../lib/productImport';
import { prepareImportImage } from '../../lib/storageApi';

type UpdateFn = (id: string, fields: ProductTextFields, images: ImageEntry[], oldPaths: string[]) => Promise<string | null>;
type PatchFn = (id: string, patch: ProductPatch) => Promise<string | null>;

// ── Fila de un producto en la rejilla (texto editable + fotos + publicar) ──
interface RowProps {
  draft: CreatedDraft;
  categoryNames: string[];
  updateProduct: UpdateFn;
  patchProduct: PatchFn;
  onPublished: () => void;
}

interface Slot { file: File; url: string; }

function ImportRow({ draft, categoryNames, updateProduct, patchProduct, onPublished }: RowProps) {
  const [title, setTitle] = useState(draft.title);
  const [price, setPrice] = useState(String(draft.price));
  const [cats, setCats] = useState<string[]>(draft.categories);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [preparing, setPreparing] = useState(0);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const MAX = 4;

  async function addFiles(files: FileList) {
    const room = MAX - slots.length - preparing;
    const take = Array.from(files).slice(0, room);
    if (take.length === 0) return;
    setError(null);
    setPreparing(p => p + take.length);
    for (const raw of take) {
      const { file, error: err } = await prepareImportImage(raw);
      setPreparing(p => p - 1);
      if (err) { setError(err); continue; }
      if (file) setSlots(prev => (prev.length < MAX ? [...prev, { file, url: URL.createObjectURL(file) }] : prev));
    }
  }

  function removeSlot(i: number) {
    setSlots(prev => {
      const s = prev[i];
      if (s) URL.revokeObjectURL(s.url);
      return prev.filter((_, j) => j !== i);
    });
  }

  function toggleCat(c: string) {
    setCats(prev => (prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]));
  }

  async function publish() {
    if (slots.length === 0) { setError('Añade al menos una foto.'); return; }
    setStatus('saving');
    setError(null);
    const fields: ProductTextFields = {
      title: title.trim() || draft.title,
      price,
      categories: cats,
      description: draft.description,
      novedadFija: draft.novedadFija,
      novedadHasta: draft.novedadHasta,
    };
    const images: ImageEntry[] = slots.map(s => ({ kind: 'file', file: s.file }));
    const upErr = await updateProduct(draft.id, fields, images, []);
    if (upErr) { setStatus('idle'); setError(upErr); return; }
    const pubErr = await patchProduct(draft.id, { visible: true });
    if (pubErr) { setStatus('idle'); setError(pubErr); return; }
    setStatus('done');
    onPublished();
  }

  const done = status === 'done';

  return (
    <div className={`import-row${done ? ' import-row--done' : ''}`}>
      <div className="import-row-fields">
        <input
          className="import-row-title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Nombre del producto"
          disabled={done}
        />
        <div className="import-row-line">
          <input
            className="import-row-price"
            type="number" min="0" step="0.01" inputMode="decimal"
            value={price}
            onChange={e => setPrice(e.target.value)}
            disabled={done}
          />
          <span className="import-row-eur">€</span>
        </div>
        <div className="import-row-cats">
          {categoryNames.map(c => (
            <button
              key={c}
              type="button"
              className={`admin-cat-chip${cats.includes(c) ? ' admin-cat-chip--on' : ''}`}
              onClick={() => toggleCat(c)}
              disabled={done}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="import-row-photos">
        {slots.map((s, i) => (
          <div key={i} className="import-photo">
            <img src={s.url} alt="" />
            {!done && (
              <button type="button" className="import-photo-x" onClick={() => removeSlot(i)} aria-label="Quitar foto">
                <X size={12} />
              </button>
            )}
          </div>
        ))}
        {Array.from({ length: preparing }).map((_, i) => (
          <div key={`p${i}`} className="import-photo import-photo--prep"><span>…</span></div>
        ))}
        {!done && slots.length + preparing < MAX && (
          <label className="import-photo import-photo--add" title="Añadir fotos">
            <Plus size={18} />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
              multiple
              hidden
              onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ''; }}
            />
          </label>
        )}
      </div>

      <div className="import-row-action">
        {done ? (
          <span className="import-row-published"><Check size={15} /> Publicado</span>
        ) : (
          <button
            type="button"
            className="import-row-publish"
            onClick={publish}
            disabled={status === 'saving' || slots.length === 0 || preparing > 0}
          >
            {status === 'saving' ? 'Publicando…' : 'Publicar'}
          </button>
        )}
        {error && <span className="import-row-error">{error}</span>}
      </div>
    </div>
  );
}

// ── Pantalla de importación ──────────────────────────────────────────────────
export default function ProductImport() {
  const navigate = useNavigate();
  const { bulkCreateHidden, updateProduct, patchProduct } = useAdminProducts();
  const { categoryNames } = useAdminCategories();
  const realCats = categoryNames.filter(c => c !== 'Todos' && c !== 'Novedades');

  const [phase, setPhase] = useState<'upload' | 'grid'>('upload');
  const [busy, setBusy] = useState(false);
  const [drafts, setDrafts] = useState<CreatedDraft[]>([]);
  const [notes, setNotes] = useState<string[]>([]);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);

  async function handleExcel(file: File) {
    setBusy(true);
    setNotes([]);
    const { items, notes: parseNotes, error } = await parseProductsExcel(file, realCats);
    if (error) { setNotes([error]); setBusy(false); return; }
    if (items.length === 0) {
      setNotes(['No se encontró ningún producto válido en el archivo.', ...parseNotes]);
      setBusy(false);
      return;
    }
    const { created, error: createErr } = await bulkCreateHidden(items.map(i => i.fields));
    setBusy(false);
    if (createErr) { setNotes([createErr, ...parseNotes]); return; }
    setDrafts(created);
    setNotes(parseNotes);
    setPhase('grid');
  }

  const total = drafts.length;
  const publishedCount = publishedIds.size;

  return (
    <div className="admin-product-form">
      <div className="admin-list-header">
        <h1>Importar productos</h1>
        <button type="button" className="admin-add-btn admin-add-btn--ghost" onClick={() => navigate('/admin/productos')}>
          <X size={16} /> Salir
        </button>
      </div>

      {phase === 'upload' ? (
        <div className="admin-form-section admin-import-card">
          <span className="admin-form-section-title">Paso 1 — Sube el Excel con los productos</span>
          <p className="admin-field-hint" style={{ marginTop: 0 }}>
            Solo el texto (nombre, precio, categorías, descripción, novedad). Las fotos las pondrás en el
            paso 2. Los productos se crean <strong>ocultos</strong> hasta que les añadas al menos una foto.
          </p>

          <div
            className={`admin-import-drop${dragOver ? ' is-over' : ''}${busy ? ' is-busy' : ''}`}
            onDragOver={e => { e.preventDefault(); if (!busy) setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f && !busy) handleExcel(f); }}
          >
            <Upload size={22} />
            {busy ? (
              <span>Creando productos…</span>
            ) : (
              <span>Arrastra el Excel o <label htmlFor="imp-excel" className="admin-import-browse">selecciónalo</label></span>
            )}
            <input
              id="imp-excel"
              type="file"
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              hidden
              disabled={busy}
              onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) handleExcel(f); }}
            />
          </div>

          <button type="button" className="admin-import-template-btn" onClick={() => downloadProductsTemplate()}>
            <Download size={14} /> Descargar plantilla de ejemplo
          </button>

          {notes.length > 0 && (
            <ul className="admin-import-notes">{notes.map((m, i) => <li key={i}>{m}</li>)}</ul>
          )}
        </div>
      ) : (
        <>
          <div className="admin-form-section">
            <span className="admin-form-section-title">Paso 2 — Arrastra las fotos a cada producto</span>
            <p className="admin-field-hint" style={{ marginTop: 0 }}>
              {publishedCount} de {total} publicados. Cada producto necesita al menos 1 foto para publicarse;
              los que dejes sin foto quedan <strong>ocultos</strong> (puedes terminarlos luego en Productos).
            </p>
            {notes.length > 0 && (
              <ul className="admin-import-notes">{notes.map((m, i) => <li key={i}>{m}</li>)}</ul>
            )}
          </div>

          <div className="import-grid">
            {drafts.map(d => (
              <ImportRow
                key={d.id}
                draft={d}
                categoryNames={realCats}
                updateProduct={updateProduct}
                patchProduct={patchProduct}
                onPublished={() => setPublishedIds(prev => new Set(prev).add(d.id))}
              />
            ))}
          </div>

          <div className="admin-form-actions">
            <button type="button" className="admin-submit-btn" onClick={() => navigate('/admin/productos')}>
              Terminar ({publishedCount}/{total} publicados)
            </button>
          </div>
        </>
      )}
    </div>
  );
}
