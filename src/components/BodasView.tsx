import { Link } from 'react-router-dom';
import { Check, Trash2, Plus } from 'lucide-react';
import { usePageContext } from '../context/PageContent';
import { useProducts } from '../hooks/useProducts';
import EditableText from './editable/EditableText';
import ProductCard from './ProductCard';
import type { BodasContent } from '../content/bodas';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import { whatsappLink } from '../lib/whatsapp';
import BodasHeroVideo from '../../IdentidadVisual/Videos/web/Video2.mp4';

// Categoría real del catálogo que la clienta usa para bodas — no packs
// inventados, solo los productos que ya existen bajo esta categoría.
const WEDDING_CATEGORY = 'Vivan los novios';

/**
 * Página "Bodas": muestra a los wedding planners los productos reales de la
 * categoría "Vivan los novios". El mismo componente se usa en la web pública
 * y en el editor del admin; solo cambia el `editing` del PageContentProvider.
 */
export default function BodasView() {
  const { content, editing, setField } = usePageContext<BodasContent>();
  const { products } = useProducts();
  const weddingProducts = products.filter(p => p.categories.includes(WEDDING_CATEGORY));
  const ventajas = content.ventajas.items;

  // ── Ventajas ──
  const addVentaja = () => setField('ventajas.items', [...ventajas, 'Nueva ventaja']);
  const removeVentaja = (i: number) => setField('ventajas.items', ventajas.filter((_, j) => j !== i));

  return (
    <>
      {/* Hero con vídeo de fondo */}
      <header className="page-hero bodas-hero">
        <video className="bodas-hero-video" src={BodasHeroVideo} autoPlay muted loop playsInline preload="metadata" aria-hidden="true" />
        <div className="bodas-hero-scrim" aria-hidden="true" />
        <div className="page-hero-inner">
          <EditableText as="span" className="page-eyebrow" path="hero.eyebrow" />
          <EditableText as="h1" className="page-hero-title" path="hero.titulo" multiline rich />
          <EditableText as="p" className="page-hero-sub" path="hero.subtitulo" multiline />
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola, organizo bodas y me gustaría información sobre vuestros productos.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <EditableText as="span" path="hero.cta" />
          </a>
        </div>
      </header>

      <main className="page-main">
        {/* Productos reales de la categoría "Vivan los novios" */}
        <section className="page-section">
          <EditableText as="h2" className="section-title centered" path="productosTitulo" />

          {weddingProducts.length > 0 ? (
            <div className="search-results-grid">
              {weddingProducts.map(product => (
                <ProductCard key={product.id} product={product} disabledLink={editing} />
              ))}
            </div>
          ) : (
            <p className="no-products">
              Aún no hay productos publicados en la categoría "{WEDDING_CATEGORY}".
            </p>
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
