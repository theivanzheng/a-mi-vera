import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { whatsappLink } from '../lib/whatsapp';

// ── Contenido de ejemplo (placeholder) ───────────────────────────────────────
// Editable desde el admin (Páginas → Bodas) cuando se conecte a Supabase.

interface Paquete {
  titulo: string;
  incluye: string[];
  precio: string;
}

const PAQUETES: Paquete[] = [
  {
    titulo: 'Detalles para invitados',
    incluye: ['Recuerdo personalizado por invitado', 'Diseño a medida', 'Presentación cuidada'],
    precio: 'desde 3 € / invitado',
  },
  {
    titulo: 'Kit de ceremonia',
    incluye: ['Porta alianzas en madera', 'Ritual de la arena', 'Grabado con vuestros nombres'],
    precio: 'a consultar',
  },
  {
    titulo: 'Brindis de los novios',
    incluye: ['Dos copas de cava grabadas', 'Caja serigrafiada', 'Mensaje personalizado'],
    precio: 'desde 35 €',
  },
  {
    titulo: 'Pack a medida',
    incluye: ['Lo diseñamos con vosotros', 'Sin límites de personalización', 'Asesoramiento cercano'],
    precio: 'a consultar',
  },
];

const Bodas = () => {
  return (
    <div className="store-container">
      <Navbar />

      {/* Hero */}
      <header className="page-hero bodas-hero">
        <div className="page-hero-inner">
          <span className="page-eyebrow">Bodas</span>
          <h1 className="page-hero-title">Vuestro gran día merece cada detalle</h1>
          <p className="page-hero-sub">
            Detalles personalizados y hechos a mano para una celebración tan única como vosotros.
          </p>
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola, nos casamos y nos gustaría información sobre vuestros paquetes de boda.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Pedir presupuesto
          </a>
        </div>
      </header>

      <main className="page-main">
        {/* Intro */}
        <section className="page-section bodas-intro">
          <div className="bodas-intro-text">
            <h2 className="section-title">Acompañamos vuestra historia</h2>
            <p>
              En A Mi Vera cuidamos los pequeños detalles que hacen grande una boda. Trabajamos cada
              pieza a mano, grabada y pensada para vosotros, desde el recuerdo de los invitados hasta
              el momento del brindis.
            </p>
            <p className="placeholder-note">Texto de ejemplo — editable desde el admin.</p>
          </div>
          <div className="bodas-intro-media media-placeholder">
            <Heart size={28} strokeWidth={1.5} />
            <span>Foto próximamente</span>
          </div>
        </section>

        {/* Paquetes */}
        <section className="page-section">
          <h2 className="section-title centered">Nuestros paquetes</h2>
          <div className="paquetes-grid">
            {PAQUETES.map((p) => (
              <article key={p.titulo} className="paquete-card">
                <div className="paquete-media media-placeholder">
                  <Heart size={24} strokeWidth={1.5} />
                  <span>Foto próximamente</span>
                </div>
                <div className="paquete-body">
                  <h3 className="paquete-title">{p.titulo}</h3>
                  <ul className="paquete-incluye">
                    {p.incluye.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                  <div className="paquete-foot">
                    <span className="paquete-precio">{p.precio}</span>
                    <a
                      className="btn-whatsapp small"
                      href={whatsappLink(`Hola, me interesa el paquete de boda "${p.titulo}".`)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Consultar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Galería */}
        <section className="page-section">
          <h2 className="section-title centered">Bodas que hemos vestido</h2>
          <div className="galeria-grid">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="galeria-item media-placeholder">
                <span>Foto próximamente</span>
              </div>
            ))}
          </div>
        </section>

        {/* Teaser wedding planners */}
        <section className="page-section">
          <Link to="/bodas/wedding-planners" className="planners-teaser">
            <div>
              <span className="page-eyebrow">Wedding planners</span>
              <h3>¿Organizas bodas? Colaboremos</h3>
              <p>Condiciones especiales y trato directo con el taller.</p>
            </div>
            <ArrowRight size={22} strokeWidth={1.5} />
          </Link>
        </section>

        {/* CTA final */}
        <section className="page-cta">
          <h2 className="section-title centered">Contadnos vuestra boda</h2>
          <p>Escribidnos y preparamos una propuesta a vuestra medida.</p>
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola, nos casamos y nos gustaría hablar sobre nuestra boda.')}
            target="_blank"
            rel="noopener noreferrer"
          >
            Hablar por WhatsApp
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Bodas;
