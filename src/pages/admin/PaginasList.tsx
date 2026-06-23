import { Link } from 'react-router-dom';
import { Pencil, Home, Lock } from 'lucide-react';

interface PaginaItem {
  slug: string;
  nombre: string;
  desc: string;
  editable: boolean;
}

const PAGINAS: PaginaItem[] = [
  { slug: 'inicio', nombre: 'Inicio', desc: 'Portada de la tienda', editable: true },
  { slug: 'nosotros', nombre: 'Nosotros', desc: 'Página "Detrás de cada regalo"', editable: false },
];

export default function PaginasList() {
  return (
    <div>
      <div className="admin-list-header">
        <h1>Páginas</h1>
      </div>
      <p className="admin-home-section-desc" style={{ marginBottom: '1.25rem' }}>
        Edita los textos de cada página directamente sobre la propia web.
      </p>

      <div className="admin-paginas-list">
        {PAGINAS.map(p =>
          p.editable ? (
            <Link key={p.slug} to={`/admin/paginas/${p.slug}/editar`} className="admin-pagina-card">
              <Home size={18} className="admin-pagina-icon" />
              <div className="admin-pagina-info">
                <span className="admin-pagina-nombre">{p.nombre}</span>
                <span className="admin-pagina-desc">{p.desc}</span>
              </div>
              <Pencil size={16} className="admin-pagina-edit" />
            </Link>
          ) : (
            <div key={p.slug} className="admin-pagina-card admin-pagina-card--soon">
              <Lock size={18} className="admin-pagina-icon" />
              <div className="admin-pagina-info">
                <span className="admin-pagina-nombre">{p.nombre}</span>
                <span className="admin-pagina-desc">{p.desc}</span>
              </div>
              <span className="admin-pagina-soon">Próximamente</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
