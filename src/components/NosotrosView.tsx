import { Link } from 'react-router-dom';
import { Check, Trash2, Plus, ListChecks } from 'lucide-react';
import { usePageContext } from '../context/PageContent';
import EditableText from './editable/EditableText';
import EditableMedia from './editable/EditableMedia';
import type { NosotrosContent } from '../content/nosotros';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import HeaderVideo from '../../IdentidadVisual/Videos/web/Header.mp4';
import MaquinaVideo from '../../IdentidadVisual/Videos/web/Maquina.mp4';
import TallerVideo from '../../IdentidadVisual/Videos/web/Video3.mp4';
import PersonalizacionVideo from '../../IdentidadVisual/Videos/web/Video2.mp4';
import { whatsappLink } from '../lib/whatsapp';

/**
 * La página "Nosotros" (Conócenos). El mismo componente se usa en la web pública
 * y en el editor del admin; lo único que cambia es el `editing` del
 * PageContentProvider.
 */
export default function NosotrosView() {
  const { content, editing, setField } = usePageContext<NosotrosContent>();
  const ventajas = content.laser.ventajas;

  // ── Lista editable de ventajas del láser (solo en edición) ──
  const addVentaja = () => setField('laser.ventajas', [...ventajas, 'Nueva ventaja']);
  const removeVentaja = (i: number) =>
    setField('laser.ventajas', ventajas.filter((_, j) => j !== i));

  return (
    <>
      {/* Hero */}
      <header className="page-hero">
        <div className="page-hero-inner">
          <EditableMedia
            className="video-frame hero-video"
            path="hero.video"
            fallbackSrc={HeaderVideo}
            slug="nosotros"
          />
          <EditableText as="span" className="page-eyebrow" path="hero.eyebrow" />
          <EditableText as="h1" className="page-hero-title nosotros-hero-title" path="hero.titulo" multiline rich />
          <EditableText as="p" className="page-hero-sub" path="hero.subtitulo" multiline />
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola Cristina, me gustaría hacer un pedido personalizado.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            <EditableText as="span" path="hero.cta" />
          </a>
        </div>
      </header>

      <main>
        {/* 1 — Donde nace cada pieza */}
        <section className="nosotros-bloque nosotros-bloque--white">
          <div className="bloque-inner">
            <div className="bloque-head">
              <EditableText as="span" className="page-eyebrow" path="taller.eyebrow" />
              <EditableText as="h2" className="section-title" path="taller.titulo" />
            </div>
            <EditableMedia className="video-frame" path="taller.video" fallbackSrc={TallerVideo} slug="nosotros" />
            <div className="bloque-text">
              <EditableText as="p" path="taller.parrafo" multiline rich />
            </div>
          </div>
        </section>

        {/* 2 — Máquina de grabado láser */}
        <section className="nosotros-bloque">
          <div className="bloque-inner">
            <div className="bloque-head">
              <EditableText as="span" className="page-eyebrow" path="laser.eyebrow" />
              <EditableText as="h2" className="section-title" path="laser.titulo" />
            </div>
            <EditableMedia className="video-frame" path="laser.video" fallbackSrc={MaquinaVideo} slug="nosotros" />
            <div className="bloque-text">
              <EditableText as="p" path="laser.parrafo" multiline rich />

              {/* Lista de ventajas: diseño real en la web, bloque editable en el admin */}
              {!editing ? (
                <ul className="ventajas-list">
                  {ventajas.map((v, i) => (
                    <li key={i}>
                      <span className="ventaja-icon"><Check size={15} strokeWidth={2.5} /></span>
                      {v}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="ticker-block">
                  <div className="esc-block-head">
                    <span className="esc-block-label"><ListChecks size={15} /> Ventajas del láser</span>
                  </div>
                  <p className="esc-field-label">Puntos de la lista</p>
                  {ventajas.map((_, i) => (
                    <div key={i} className="ticker-item-edit">
                      <EditableText className="ticker-frase" path={`laser.ventajas.${i}`} />
                      <button
                        type="button"
                        className="ticker-del"
                        onClick={() => removeVentaja(i)}
                        disabled={ventajas.length === 1}
                        aria-label="Eliminar ventaja"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                  <button type="button" className="esc-add ticker-add" onClick={addVentaja}>
                    <Plus size={16} /> Añadir ventaja
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* 3 — Personalización 1 a 1 */}
        <section className="nosotros-bloque nosotros-bloque--white">
          <div className="bloque-inner">
            <div className="bloque-head">
              <EditableText as="span" className="page-eyebrow" path="personalizacion.eyebrow" />
              <EditableText as="h2" className="section-title" path="personalizacion.titulo" />
            </div>
            <EditableMedia className="video-frame" path="personalizacion.video" fallbackSrc={PersonalizacionVideo} slug="nosotros" />
            <div className="bloque-text">
              <EditableText as="p" path="personalizacion.parrafo" multiline rich />
            </div>
          </div>
        </section>
      </main>

      {/* CTA final */}
      <section className="page-cta">
        <EditableText as="h2" className="section-title centered" path="cta.titulo" />
        <EditableText as="p" path="cta.subtitulo" multiline />
        <a
          className="btn-whatsapp"
          href={whatsappLink('Hola Cristina, me gustaría información sobre un regalo personalizado.')}
          target="_blank"
          rel="noopener noreferrer"
        >
          <EditableText as="span" path="cta.boton" />
        </a>
      </section>

      {/* FOOTER — mismo que la portada */}
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
