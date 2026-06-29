import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Home, Users, Heart, Lock } from 'lucide-react';

interface PaginaItem {
  slug: string;
  nombre: string;
  desc: string;
  editable: boolean;
  Icon: ComponentType<{ size?: number; className?: string }>;
}

const PAGINAS: PaginaItem[] = [
  { slug: 'inicio', nombre: 'Inicio', desc: 'Portada de la tienda', editable: true, Icon: Home },
  { slug: 'nosotros', nombre: 'Nosotros', desc: 'Página "Detrás de cada regalo"', editable: true, Icon: Users },
  { slug: 'bodas', nombre: 'Bodas', desc: 'Packs para wedding planners', editable: true, Icon: Heart },
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
        {PAGINAS.map(p => {
          const Icon = p.editable ? p.Icon : Lock;
          return p.editable ? (
            <Link key={p.slug} to={`/admin/paginas/${p.slug}/editar`} className="admin-pagina-card">
              <Icon size={18} className="admin-pagina-icon" />
              <div className="admin-pagina-info">
                <span className="admin-pagina-nombre">{p.nombre}</span>
                <span className="admin-pagina-desc">{p.desc}</span>
              </div>
              <Pencil size={16} className="admin-pagina-edit" />
            </Link>
          ) : (
            <div key={p.slug} className="admin-pagina-card admin-pagina-card--soon">
              <Icon size={18} className="admin-pagina-icon" />
              <div className="admin-pagina-info">
                <span className="admin-pagina-nombre">{p.nombre}</span>
                <span className="admin-pagina-desc">{p.desc}</span>
              </div>
              <span className="admin-pagina-soon">Próximamente</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
