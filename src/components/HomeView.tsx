import { Link } from 'react-router-dom';
import { ChevronUp, ChevronDown, Trash2, Plus, LayoutGrid, Megaphone } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import { usePageContext } from '../context/PageContent';
import EditableText from './editable/EditableText';
import EditableMedia from './editable/EditableMedia';
import { toSlug } from '../lib/slug';
import type { Escaparate, HomeContent } from '../content/home';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import CardAzul    from '../../IdentidadVisual/FotosHeader/Azul porcelana.png';
import CardBlush   from '../../IdentidadVisual/FotosHeader/Blush.png';
import CardCiruela from '../../IdentidadVisual/FotosHeader/CiruelaSuave.png';
import Hoja        from '../../IdentidadVisual/Rosas/Hoja.png';
import CristinaVideo from '../../IdentidadVisual/Videos/web/Header.mp4';
import { whatsappLink } from '../lib/whatsapp';

type Producto = ReturnType<typeof useProducts>['products'][number];

// Productos que muestra un escaparate según su fuente.
function productsForEscaparate(esc: Escaparate, products: Producto[]): Producto[] {
  if (esc.fuente === 'destacados') {
    const d = products.filter(p => p.destacado);
    return (d.length > 0 ? d : products).slice(0, 10);
  }
  if (esc.fuente === 'novedades') {
    return [...products]
      .filter(p => p.createdAt)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, 10);
  }
  return products
    .filter(p => (p.categories ?? []).some(c => toSlug(c) === esc.categoria))
    .slice(0, 10);
}

// Enlace "Ver todos" a la sección correspondiente del catálogo.
function verTodosLink(esc: Escaparate): string {
  if (esc.fuente === 'destacados') return '/catalogo#destacados';
  if (esc.fuente === 'novedades') return '/catalogo';
  return `/catalogo#${esc.categoria ?? ''}`;
}

const rid = () => Math.random().toString(36).slice(2, 8);

/**
 * La portada (home). El mismo componente se usa en la web pública y en el
 * editor del admin; lo único que cambia es el `editing` del PageContentProvider.
 */
export default function HomeView() {
  const { products, categories, loading } = useProducts();
  const { content, editing, setField } = usePageContext<HomeContent>();

  // Categorías reales para el selector (sin la categoría comodín "Todos").
  const cats = categories.filter(c => c.toLowerCase() !== 'todos');
  const escaparates = content.escaparates;

  const catName = (slug?: string) => cats.find(c => toSlug(c) === slug) ?? '';
  // Título "automático" que correspondería a la fuente actual de un escaparate.
  const autoTitleFor = (esc: Escaparate) =>
    esc.fuente === 'destacados' ? 'Productos Destacados'
    : esc.fuente === 'novedades' ? 'Novedades'
    : catName(esc.categoria);

  // ── Operaciones sobre la lista de escaparates (solo en edición) ──
  const changeFuente = (i: number, val: string) => {
    const esc = escaparates[i];
    // El título se actualiza solo si no se ha personalizado (= seguía siendo el automático).
    const tituloEsAutomatico = !esc.titulo.trim() || esc.titulo === autoTitleFor(esc);

    if (val.startsWith('cat:')) {
      const slug = val.slice(4);
      setField(`escaparates.${i}.fuente`, 'categoria');
      setField(`escaparates.${i}.categoria`, slug);
      if (tituloEsAutomatico) setField(`escaparates.${i}.titulo`, catName(slug));
    } else {
      setField(`escaparates.${i}.fuente`, val);
      setField(`escaparates.${i}.categoria`, undefined);
      if (tituloEsAutomatico) {
        setField(`escaparates.${i}.titulo`, val === 'destacados' ? 'Productos Destacados' : 'Novedades');
      }
    }
  };
  const moveEscaparate = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= escaparates.length) return;
    const next = [...escaparates];
    [next[i], next[j]] = [next[j], next[i]];
    setField('escaparates', next);
  };
  const removeEscaparate = (i: number) => {
    setField('escaparates', escaparates.filter((_, j) => j !== i));
  };
  const addEscaparate = () => {
    const slug = cats[0] ? toSlug(cats[0]) : '';
    const nuevo: Escaparate = { id: rid(), titulo: catName(slug), fuente: 'categoria', categoria: slug };
    setField('escaparates', [...escaparates, nuevo]);
  };

  // ── Frases del banner (ticker) ──
  const addTicker = () => setField('ticker', [...content.ticker, 'Nueva frase']);
  const removeTicker = (i: number) =>
    setField('ticker', content.ticker.filter((_, j) => j !== i));

  // Fila de tarjetas de producto (igual en público y en previsualización).
  const cardsRow = (items: Producto[]) => (
    <div className="av-featured-scroll">
      {loading ? (
        <p style={{ padding: '0 1rem', color: 'var(--color-text-mid)', fontSize: '0.85rem' }}>Cargando…</p>
      ) : items.length > 0 ? (
        items.map(p => (
          <Link key={p.id} to={`/producto/${p.slug}`} className="av-feat-card">
            <div className="av-feat-img">
              {p.images?.[0] && <img src={p.images[0]} alt={p.title} loading="lazy" />}
            </div>
            <div className="av-feat-name">{p.title}</div>
            <div className="av-feat-price">{p.price} €</div>
          </Link>
        ))
      ) : (
        <p className="esc-empty">Sin productos en esta fuente.</p>
      )}
    </div>
  );

  return (
    <>
      {/* HERO */}
      <section className="av-hero">
        <div className="av-cards-fan">
          <img src={CardAzul}    className="av-fan-card av-fan-card-1" alt="" aria-hidden="true" />
          <img src={CardBlush}   className="av-fan-card av-fan-card-2" alt="" aria-hidden="true" />
          <img src={CardCiruela} className="av-fan-card av-fan-card-3" alt="" aria-hidden="true" />
        </div>
        <EditableText as="h1" className="av-hero-title" path="hero.titulo" multiline rich />
        <div className="av-hero-pill-row">
          <div className="av-hero-pill-wrap">
            <img src={Hoja} className="av-hero-hoja" alt="" aria-hidden="true" />
            <EditableText as="span" className="av-hero-pill" path="hero.pill" />
          </div>
        </div>
        <EditableText as="p" className="av-hero-sub" path="hero.subtitulo" multiline />
        <Link to="/catalogo" className="av-hero-cta">
          <EditableText as="span" path="hero.cta" />
        </Link>
      </section>

      {/* TICKER / BANNER */}
      {editing ? (
        <div className="ticker-block">
          <div className="esc-block-head">
            <span className="esc-block-label"><Megaphone size={15} /> Cinta en movimiento</span>
          </div>
          {/* Previsualización en vivo de la cinta */}
          <div className="av-ticker ticker-preview" aria-hidden="true">
            <div className="av-ticker-track">
              {[...content.ticker, ...content.ticker].map((item, i) => (
                <span key={i} className="av-ticker-item">{item}</span>
              ))}
            </div>
          </div>
          <p className="esc-field-label">Frases que recorren la cinta</p>
          {content.ticker.map((_, i) => (
            <div key={i} className="ticker-item-edit">
              <EditableText className="ticker-frase" path={`ticker.${i}`} />
              <button
                type="button"
                className="ticker-del"
                onClick={() => removeTicker(i)}
                disabled={content.ticker.length === 1}
                aria-label="Eliminar frase"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" className="esc-add ticker-add" onClick={addTicker}>
            <Plus size={16} /> Añadir frase
          </button>
        </div>
      ) : (
        <div className="av-ticker" aria-hidden="true">
          <div className="av-ticker-track">
            {[...content.ticker, ...content.ticker].map((item, i) => (
              <span key={i} className="av-ticker-item">{item}</span>
            ))}
          </div>
        </div>
      )}

      {/* ESCAPARATES DE PRODUCTOS */}
      {escaparates.map((esc, i) => {
        const items = productsForEscaparate(esc, products);
        if (!editing) {
          if (items.length === 0) return null;
          return (
            <section key={esc.id} id={i === 0 ? 'destacados' : undefined} className="av-featured">
              <div className="av-featured-header">
                <EditableText as="h2" className="av-featured-title" path={`escaparates.${i}.titulo`} />
                <Link to={verTodosLink(esc)} className="av-featured-ver">Ver todos →</Link>
              </div>
              {cardsRow(items)}
            </section>
          );
        }
        // ── Modo edición: tarjeta autocontenida ──
        const selectValue = esc.fuente === 'categoria' ? `cat:${esc.categoria}` : esc.fuente;
        return (
          <div key={esc.id} className="esc-block">
            <div className="esc-block-head">
              <span className="esc-block-label"><LayoutGrid size={15} /> Escaparate</span>
              <div className="esc-block-controls">
                <button onClick={() => moveEscaparate(i, -1)} disabled={i === 0} aria-label="Subir"><ChevronUp size={16} /></button>
                <button onClick={() => moveEscaparate(i, 1)} disabled={i === escaparates.length - 1} aria-label="Bajar"><ChevronDown size={16} /></button>
                <button onClick={() => removeEscaparate(i)} disabled={escaparates.length === 1} aria-label="Eliminar" className="esc-block-del"><Trash2 size={15} /></button>
              </div>
            </div>

            <label className="esc-field-label">Mostrando</label>
            <select className="esc-select" value={selectValue} onChange={(e) => changeFuente(i, e.target.value)}>
              <option value="destacados">Destacados</option>
              <option value="novedades">Novedades</option>
              <optgroup label="Categoría">
                {cats.map((c) => (
                  <option key={c} value={`cat:${toSlug(c)}`}>{c}</option>
                ))}
              </optgroup>
            </select>

            <label className="esc-field-label">Título</label>
            <EditableText as="h3" className="av-featured-title esc-block-title" path={`escaparates.${i}.titulo`} />

            <label className="esc-field-label">Previsualización</label>
            {cardsRow(items)}
          </div>
        );
      })}

      {editing && (
        <div className="esc-add-wrap">
          <button className="esc-add" onClick={addEscaparate}>
            <Plus size={16} /> Añadir escaparate
          </button>
        </div>
      )}

      {/* CRISTINA */}
      <section className="av-cristina">
        <EditableText as="p" className="av-cristina-eyebrow" path="cristina.eyebrow" />
        <EditableText as="h2" className="av-cristina-title" path="cristina.titulo" />
        <EditableMedia className="av-cristina-video" path="cristina.video" fallbackSrc={CristinaVideo} slug="inicio" />
        <EditableText as="p" className="av-cristina-copy" path="cristina.parrafo" multiline rich />
        <Link to="/nosotros" className="av-link-cta">
          <EditableText as="span" path="cristina.cta" />
        </Link>
      </section>

      {/* FRASE OSCURA */}
      <section className="av-dark-quote">
        <EditableText as="p" className="av-dark-quote-text" path="fraseOscura.texto" multiline rich />
        <EditableText as="span" className="av-dark-quote-firma" path="fraseOscura.firma" />
      </section>

      {/* WHATSAPP CTA */}
      <section className="av-wa-cta">
        <EditableText as="p" className="av-wa-eyebrow" path="whatsapp.eyebrow" />
        <EditableText as="h2" className="av-wa-title" path="whatsapp.titulo" />
        <EditableText as="p" className="av-wa-sub" path="whatsapp.subtitulo" multiline />
        <a
          href={whatsappLink('Hola Cristina, me gustaría información sobre un regalo personalizado.')}
          className="av-wa-btn"
          target="_blank"
          rel="noopener noreferrer"
        >
          <EditableText as="span" path="whatsapp.boton" />
        </a>
      </section>

      {/* FOOTER */}
      <footer className="av-footer">
        <img src={LogotipoSvg} alt="A Mi Vera" className="av-footer-logo" />
        <nav className="av-footer-links">
          <Link to="/" className="av-footer-link">Inicio</Link>
          <Link to="/nosotros" className="av-footer-link">Nosotros</Link>
          <Link to="/catalogo" className="av-footer-link">Catálogo</Link>
        </nav>
        <p className="av-footer-copy">© {new Date().getFullYear()} A Mi Vera · Todos los derechos reservados</p>
        <a
          href="https://theivanzheng.com"
          target="_blank"
          rel="noopener noreferrer"
          className="av-footer-credit"
        >
          Diseño y desarrollo: @theivanzheng
        </a>
      </footer>
    </>
  );
}
