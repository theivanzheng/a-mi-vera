import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import HeaderVideo from '../../IdentidadVisual/Videos/web/Header.mp4';
import MaquinaVideo from '../../IdentidadVisual/Videos/web/Maquina.mp4';
import TallerVideo from '../../IdentidadVisual/Videos/web/Video3.mp4';
import PersonalizacionVideo from '../../IdentidadVisual/Videos/web/Video2.mp4';
import { whatsappLink } from '../lib/whatsapp';

// ── Contenido de ejemplo (placeholder) ───────────────────────────────────────
// Editable desde el admin (Páginas → Nosotros) cuando se conecte a Supabase.

const LASER_VENTAJAS = [
  'Precisión milimétrica en cada grabado',
  'Graba sobre madera, metacrilato, cuero, metal y más',
  'Acabados limpios, nítidos y duraderos',
  'Lo último en tecnología de grabado láser',
];

// Marco con formato de vídeo. Reproduce el vídeo si recibe `src`; si no, muestra
// el estado "próximamente".
const VideoFrame = ({
  src,
  poster,
  label = 'Vídeo próximamente',
  className = '',
}: {
  src?: string;
  poster?: string;
  label?: string;
  className?: string;
}) => (
  <div className={`video-frame ${className}`.trim()}>
    {src ? (
      <video
        src={src}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
      />
    ) : (
      <span className="video-frame-coming">
        <span className="video-frame-play"><Play size={22} strokeWidth={1.5} /></span>
        {label}
      </span>
    )}
  </div>
);

const Nosotros = () => {
  // Al entrar (la home usa scrollRestoration manual), abrir siempre arriba.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="store-container">
      <Navbar />

      {/* Hero */}
      <header className="page-hero">
        <div className="page-hero-inner">
          <VideoFrame className="hero-video" src={HeaderVideo} />
          <span className="page-eyebrow">Nosotros</span>
          <h1 className="page-hero-title nosotros-hero-title">Detrás de cada regalo,<br />una historia</h1>
          <p className="page-hero-sub">
            En A Mi Vera convertimos ideas en regalos personalizados hechos a mano. Sin prisa,
            sin moldes, con cariño en cada detalle.
          </p>
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola Cristina, me gustaría hacer un pedido personalizado.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hacer pedido por WhatsApp
          </a>
        </div>
      </header>

      <main>
        {/* 1 — Donde nace cada pieza */}
        <section className="nosotros-bloque nosotros-bloque--white">
          <div className="bloque-inner">
            <div className="bloque-head">
              <span className="page-eyebrow">El taller</span>
              <h2 className="section-title">Donde nace cada pieza</h2>
            </div>
            <VideoFrame src={TallerVideo} />
            <div className="bloque-text">
              <p>
                Cada pieza pasa por nuestras manos de principio a fin. Diseñamos contigo la idea, la
                grabamos con mimo y la rematamos a mano hasta que queda perfecta. Nada de producción
                en serie: aquí cada regalo se piensa, se prueba y se cuida como si fuera para nosotros.
              </p>
            </div>
          </div>
        </section>

        {/* 2 — Máquina de grabado láser */}
        <section className="nosotros-bloque">
          <div className="bloque-inner">
            <div className="bloque-head">
              <span className="page-eyebrow">Tecnología</span>
              <h2 className="section-title">Nuestra máquina de grabado láser</h2>
            </div>
            <VideoFrame src={MaquinaVideo} />
            <div className="bloque-text">
              <p>
                Nos obsesiona el detalle, y por eso invertimos en la mejor maquinaria posible.
                Grabamos con una <strong>xTool</strong>, una de las máquinas de grabado láser de
                referencia del mercado, que nos permite una precisión imposible de lograr a mano sobre
                madera, metacrilato, cuero o metal. Mejor herramienta, mejor acabado, mejor regalo.
              </p>
              <ul className="ventajas-list">
                {LASER_VENTAJAS.map((v) => (
                  <li key={v}>
                    <span className="ventaja-icon"><Check size={15} strokeWidth={2.5} /></span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 3 — Personalización 1 a 1 */}
        <section className="nosotros-bloque nosotros-bloque--white">
          <div className="bloque-inner">
            <div className="bloque-head">
              <span className="page-eyebrow">A tu medida</span>
              <h2 className="section-title">Personalización 1 a 1</h2>
            </div>
            <VideoFrame src={PersonalizacionVideo} />
            <div className="bloque-text">
              <p>
                Hablamos contigo de tú a tú y adaptamos cada regalo a lo que quieres transmitir: un
                nombre, una fecha, una foto o una frase que solo vosotros entendéis. Tú lo imaginas y
                nosotros lo hacemos realidad, sin moldes ni catálogos cerrados.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* CTA final */}
      <section className="page-cta">
        <h2 className="section-title centered">Cuéntanos qué quieres regalar</h2>
        <p>Respondemos en menos de 24 horas y lo diseñamos juntos, sin compromiso.</p>
        <a
          className="btn-whatsapp"
          href={whatsappLink('Hola Cristina, me gustaría información sobre un regalo personalizado.')}
          target="_blank"
          rel="noopener noreferrer"
        >
          Escribir por WhatsApp →
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
    </div>
  );
};

export default Nosotros;
