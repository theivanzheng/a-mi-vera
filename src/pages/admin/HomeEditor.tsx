import { Home } from 'lucide-react';

export default function HomeEditor() {
  return (
    <div>
      <div className="admin-list-header">
        <h1>Portada</h1>
      </div>

      <div className="admin-placeholder">
        <div className="admin-placeholder-icon"><Home size={40} /></div>
        <h2>Editor de portada en Fase 5</h2>
        <p>
          Personaliza el héroe, banners y secciones destacadas
          de la tienda. Disponible al conectar Supabase.
        </p>
        <span className="admin-placeholder-badge">Próximamente — Fase 5</span>
      </div>
    </div>
  );
}
