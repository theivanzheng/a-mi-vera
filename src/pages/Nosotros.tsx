import { Link } from 'react-router-dom';
import { MessageCircle, PenTool, Hammer, Package, Hand, Sparkles, Heart, Play } from 'lucide-react';
import Navbar from '../components/Navbar';
import LogotipoSvg from '../../IdentidadVisual/AmiVera_LogoEditable.svg';
import { whatsappLink } from '../lib/whatsapp';

// ── Contenido de ejemplo (placeholder) ───────────────────────────────────────
// Editable desde el admin (Páginas → Nosotros) cuando se conecte a Supabase.
// Los vídeos se añadirán sustituyendo el contenido de <VideoFrame> por un
// <video> en bucle silenciado o un embed.

interface Paso {
  icono: typeof MessageCircle;
  titulo: string;
  texto: string;
}

const PROCESO: Paso[] = [
  {
    icono: MessageCircle,
    titulo: 'Conversamos',
    texto: 'Nos cuentas a quién va dirigido y qué quieres transmitir. Cada regalo nace de una conversación.',
  },
  {
    icono: PenTool,
    titulo: 'Diseñamos contigo',
    texto: 'Damos forma a la idea: nombres, fechas, fotos o frases. Te enseñamos cómo quedará antes de empezar.',
  },
  {
    icono: Hammer,
    titulo: 'Lo hacemos a mano',
    texto: 'Grabamos y personalizamos cada pieza una a una en el taller. Nada de producción en serie.',
  },
  {
    icono: Package,
    titulo: 'Enviamos con cariño',
    texto: 'Lo preparamos con un packaging cuidado y lo enviamos listo para emocionar a quien lo reciba.',
  },
];

// Apartados del taller — scroll horizontal. La máquina láser va primero.
interface Apartado {
  eyebrow: string;
  titulo: string;
  texto: string;
  videoLabel: string;
}

const APARTADOS: Apartado[] = [
  {
    eyebrow: 'Tecnología',
    titulo: 'Máquina de grabado láser',
    texto: 'El corazón del taller. Grabamos cada detalle con una precisión imposible de lograr a mano, sobre madera, metacrilato, cuero o metal.',
    videoLabel: 'Vídeo de la láser próximamente',
  },
  {
    eyebrow: 'El taller',
    titulo: 'Donde nace cada pieza',
    texto: 'Te enseñamos el proceso real: el diseño, el grabado y los acabados que hacen único cada regalo. Sin filtros.',
    videoLabel: 'Vídeo del taller próximamente',
  },
  {
    eyebrow: 'A tu medida',
    titulo: 'Personalización 1 a 1',
    texto: 'Hablamos contigo de tú a tú y adaptamos cada regalo a lo que quieres transmitir. Tú lo imaginas, nosotros lo hacemos realidad.',
    videoLabel: 'Vídeo próximamente',
  },
];

interface Valor {
  icono: typeof Hand;
  titulo: string;
  texto: string;
}

const VALORES: Valor[] = [
  {
    icono: Hand,
    titulo: 'Hecho a mano',
    texto: 'Cada detalle pasa por nuestras manos. Piezas únicas, cuidadas y con alma artesanal.',
  },
  {
    icono: Sparkles,
    titulo: '100% personalizado',
    texto: 'No vendemos un regalo más: lo pensamos especialmente para la persona que lo va a recibir.',
  },
  {
    icono: Heart,
    titulo: 'Trato cercano',
    texto: 'Hablamos contigo de tú a tú, sin intermediarios, acompañándote en cada paso del proceso.',
  },
];

// Marco con formato de vídeo. Estado "próximamente" mientras no hay archivo.
const VideoFrame = ({ label = 'Vídeo próximamente', className = '' }: { label?: string; className?: string }) => (
  <div className={`video-frame ${className}`.trim()}>
    {/* Sustituir por <video autoPlay muted loop playsInline> cuando esté el archivo */}
    <span className="video-frame-coming">
      <span className="video-frame-play"><Play size={22} strokeWidth={1.5} /></span>
      {label}
    </span>
  </div>
);

const Nosotros = () => {
  return (
    <div className="store-container">
      <Navbar />

      {/* Hero */}
      <header className="page-hero">
        <div className="page-hero-inner">
          <VideoFrame className="hero-video" label="Vídeo próximamente" />
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

      <main className="page-main">
        {/* Cómo trabajamos */}
        <section className="page-section">
          <h2 className="section-title centered">Cómo trabajamos</h2>
          <p className="placeholder-note centered">Texto de ejemplo — editable desde el admin.</p>
          <ol className="proceso-grid">
            {PROCESO.map((p, i) => {
              const Icono = p.icono;
              return (
                <li key={p.titulo} className="proceso-card">
                  <span className="proceso-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="proceso-icon">
                    <Icono size={26} strokeWidth={1.5} />
                  </span>
                  <h3 className="proceso-title">{p.titulo}</h3>
                  <p className="proceso-text">{p.texto}</p>
                </li>
              );
            })}
          </ol>
        </section>

        {/* Apartados del taller — scroll horizontal (láser primero) */}
        <section className="page-section">
          <h2 className="section-title centered">Conoce el taller</h2>
          <div className="apartados-scroll">
            {APARTADOS.map((a) => (
              <article key={a.titulo} className="apartado-card">
                <VideoFrame className="apartado-video" label={a.videoLabel} />
                <div className="apartado-body">
                  <span className="page-eyebrow apartado-eyebrow">{a.eyebrow}</span>
                  <h3 className="apartado-title">{a.titulo}</h3>
                  <p className="apartado-text">{a.texto}</p>
                </div>
              </article>
            ))}
          </div>
          <p className="placeholder-note centered apartados-hint">Desliza para ver más — los vídeos se añadirán pronto.</p>
        </section>

        {/* Por qué A Mi Vera */}
        <section className="page-section">
          <h2 className="section-title centered">Por qué A Mi Vera</h2>
          <div className="valores-grid">
            {VALORES.map((v) => {
              const Icono = v.icono;
              return (
                <article key={v.titulo} className="valor-card">
                  <span className="valor-icon">
                    <Icono size={24} strokeWidth={1.5} />
                  </span>
                  <h3 className="valor-title">{v.titulo}</h3>
                  <p className="valor-text">{v.texto}</p>
                </article>
              );
            })}
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
