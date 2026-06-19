import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { whatsappLink } from '../lib/whatsapp';

// ── Contenido de ejemplo (placeholder) ───────────────────────────────────────
// Editable desde el admin (Páginas → Wedding Planners) al conectar Supabase.

const VENTAJAS: string[] = [
  'Condiciones especiales por volumen de pedido',
  'Plazos coordinados con tu calendario de eventos',
  'Personalización a medida para cada pareja',
  'Trato directo con el taller, sin intermediarios',
];

const WeddingPlanners = () => {
  return (
    <div className="store-container">
      <Navbar />

      <main className="page-main planners-page">
        <Link to="/bodas" className="page-back-link">
          <ArrowLeft size={18} strokeWidth={1.5} /> Volver a Bodas
        </Link>

        {/* Hero B2B */}
        <header className="page-hero planners-hero">
          <div className="page-hero-inner">
            <span className="page-eyebrow">Wedding planners</span>
            <h1 className="page-hero-title">Colaboremos en cada celebración</h1>
            <p className="page-hero-sub">
              Sumamos detalles personalizados y hechos a mano a las bodas que organizas, con la
              flexibilidad que tu trabajo necesita.
            </p>
            <a
              className="btn-whatsapp"
              href={whatsappLink('Hola, soy wedding planner y me gustaría hablar sobre una colaboración.')}
              target="_blank"
              rel="noopener noreferrer"
            >
              Hablar de colaboración
            </a>
          </div>
        </header>

        {/* Ventajas */}
        <section className="page-section">
          <h2 className="section-title centered">Por qué trabajar con nosotros</h2>
          <ul className="ventajas-list">
            {VENTAJAS.map((v) => (
              <li key={v}>
                <span className="ventaja-icon"><Check size={16} strokeWidth={2} /></span>
                {v}
              </li>
            ))}
          </ul>
          <p className="placeholder-note centered">Texto de ejemplo — editable desde el admin.</p>
        </section>

        {/* CTA */}
        <section className="page-cta">
          <h2 className="section-title centered">Trabajemos juntos</h2>
          <p>Cuéntanos cómo trabajas y preparamos condiciones a tu medida.</p>
          <a
            className="btn-whatsapp"
            href={whatsappLink('Hola, soy wedding planner y quiero información para colaborar con A Mi Vera.')}
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

export default WeddingPlanners;
