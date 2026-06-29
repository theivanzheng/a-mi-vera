import { Link } from 'react-router-dom';
import { Check, Trash2, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { usePageContext } from '../context/PageContent';
import EditableText from './editable/EditableText';
import type { BodasContent, Pack } from '../content/bodas';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import { whatsappLink } from '../lib/whatsapp';

const rid = () => Math.random().toString(36).slice(2, 8);

/**
 * Página "Bodas": vende packs de productos a wedding planners. El mismo
 * componente se usa en la web pública y en el editor del admin; solo cambia el
 * `editing` del PageContentProvider.
 */
export default function BodasView() {
  const { content, editing, setField } = usePageContext<BodasContent>();
  const packs = content.packs;
  const ventajas = content.ventajas.items;

  // ── Operaciones sobre los packs (solo en edición) ──
  const addPack = () =>
    setField('packs', [...packs, {
      id: rid(), titulo: 'Nuevo pack', precio: 'a consultar', recomendado: false,
      incluye: ['Detalle incluido'], cta: 'Quiero este pack',
    } as Pack]);
  const removePack = (i: number) => setField('packs', packs.filter((_, j) => j !== i));
  const movePack = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= packs.length) return;
    const next = [...packs];
    [next[i], next[j]] = [next[j], next[i]];
    setField('packs', next);
  };
  const setRecomendado = (i: number, val: boolean) => {
    // Exclusivo: marcar uno como recomendado desmarca los demás.
    setField('packs', packs.map((p, j) => ({
      ...p, recomendado: j === i ? val : (val ? false : p.recomendado),
    })));
  };
  const addIncluye = (i: number) => {
    const next = [...packs];
    next[i] = { ...next[i], incluye: [...next[i].incluye, 'Nuevo detalle'] };
    setField('packs', next);
  };
  const removeIncluye = (i: number, j: number) => {
    const next = [...packs];
    next[i] = { ...next[i], incluye: next[i].incluye.filter((_, k) => k !== j) };
    setField('packs', next);
  };

  // ── Ventajas ──
  const addVentaja = () => setField('ventajas.items', [...ventajas, 'Nueva ventaja']);
  const removeVentaja = (i: number) => setField('ventajas.items', ventajas.filter((_, j) => j !== i));

  return (
    <>
      {/* Hero */}
      <header className="page-hero bodas-hero">
        <div className="page-hero-inner">
          <EditableText as="span" className="page-eyebrow" path="hero.eyebrow" />
          <EditableText as="h1" className="page-hero-title" path="hero.titulo" multiline rich />
          <EditableText as="p" className="page-hero-sub" path="hero.subtitulo" multiline />
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola, organizo bodas y me gustaría información sobre vuestros packs.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <EditableText as="span" path="hero.cta" />
          </a>
        </div>
      </header>

      <main className="page-main">
        {/* Packs */}
        <section className="page-section">
          <EditableText as="h2" className="section-title centered" path="packsTitulo" />

          <div className="packs-grid">
            {packs.map((pack, i) => (
              <article key={pack.id} className={`pack-card${pack.recomendado ? ' pack-card--rec' : ''}`}>
                {editing ? (
                  <div className="esc-block-controls pack-card-controls">
                    <button type="button" onClick={() => movePack(i, -1)} disabled={i === 0} aria-label="Subir pack"><ChevronUp size={16} /></button>
                    <button type="button" onClick={() => movePack(i, 1)} disabled={i === packs.length - 1} aria-label="Bajar pack"><ChevronDown size={16} /></button>
                    <button type="button" onClick={() => removePack(i)} disabled={packs.length === 1} className="esc-block-del" aria-label="Eliminar pack"><Trash2 size={15} /></button>
                  </div>
                ) : (pack.recomendado && <span className="pack-badge">Recomendado</span>)}

                <EditableText as="h3" className="pack-title" path={`packs.${i}.titulo`} />
                <EditableText as="p" className="pack-price" path={`packs.${i}.precio`} />

                {editing && (
                  <label className="pack-rec-toggle">
                    <input type="checkbox" checked={pack.recomendado} onChange={e => setRecomendado(i, e.currentTarget.checked)} />
                    <span>Marcar como recomendado</span>
                  </label>
                )}

                {!editing ? (
                  <ul className="pack-incluye">
                    {pack.incluye.map((it, j) => (
                      <li key={j}><span className="ventaja-icon"><Check size={14} strokeWidth={2.5} /></span>{it}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="pack-incluye-edit">
                    <p className="esc-field-label">Qué incluye</p>
                    {pack.incluye.map((_, j) => (
                      <div key={j} className="ticker-item-edit">
                        <EditableText className="ticker-frase" path={`packs.${i}.incluye.${j}`} />
                        <button type="button" className="ticker-del" onClick={() => removeIncluye(i, j)} disabled={pack.incluye.length === 1} aria-label="Eliminar línea"><Trash2 size={15} /></button>
                      </div>
                    ))}
                    <button type="button" className="esc-add ticker-add" onClick={() => addIncluye(i)}><Plus size={16} /> Añadir línea</button>
                  </div>
                )}

                <a
                  className="btn-whatsapp small pack-cta"
                  href={whatsappLink(`Hola, me interesa el "${pack.titulo}" para una boda.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <EditableText as="span" path={`packs.${i}.cta`} />
                </a>
              </article>
            ))}
          </div>

          {editing && (
            <div className="esc-add-wrap">
              <button type="button" className="esc-add" onClick={addPack}><Plus size={16} /> Añadir pack</button>
            </div>
          )}
        </section>

        {/* Ventajas */}
        <section className="page-section">
          <EditableText as="h2" className="section-title centered" path="ventajas.titulo" />
          {!editing ? (
            <ul className="ventajas-list">
              {ventajas.map((v, i) => (
                <li key={i}><span className="ventaja-icon"><Check size={15} strokeWidth={2.5} /></span>{v}</li>
              ))}
            </ul>
          ) : (
            <div className="ticker-block">
              <p className="esc-field-label">Puntos de la lista</p>
              {ventajas.map((_, i) => (
                <div key={i} className="ticker-item-edit">
                  <EditableText className="ticker-frase" path={`ventajas.items.${i}`} />
                  <button type="button" className="ticker-del" onClick={() => removeVentaja(i)} disabled={ventajas.length === 1} aria-label="Eliminar ventaja"><Trash2 size={15} /></button>
                </div>
              ))}
              <button type="button" className="esc-add ticker-add" onClick={addVentaja}><Plus size={16} /> Añadir ventaja</button>
            </div>
          )}
        </section>
      </main>

      {/* CTA final */}
      <section className="page-cta">
        <EditableText as="h2" className="section-title centered" path="cta.titulo" />
        <EditableText as="p" path="cta.subtitulo" multiline />
        <a
          className="btn-whatsapp"
          href={whatsappLink('Hola, organizo bodas y quiero información para colaborar con A Mi Vera.')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <EditableText as="span" path="cta.boton" />
        </a>
      </section>

      {/* Footer */}
      <footer className="av-footer">
        <img src={LogotipoSvg} alt="A Mi Vera" className="av-footer-logo" />
        <nav className="av-footer-links">
          <Link to="/" className="av-footer-link">Inicio</Link>
          <Link to="/nosotros" className="av-footer-link">Nosotros</Link>
          <Link to="/catalogo" className="av-footer-link">Catálogo</Link>
        </nav>
        <p className="av-footer-copy">© {new Date().getFullYear()} A Mi Vera · Todos los derechos reservados</p>
      </footer>
    </>
  );
}
