import { Home } from 'lucide-react';

export default function HomeEditor() {
  return (
    <div>
      <div className="admin-list-header">
        <h1>Portada</h1>
      </div>

      <div className="admin-placeholder">
        <div className="admin-placeholder-icon"><Home size={40} /></div>
        <h2>Gestión de portada pendiente</h2>
        <p>
          El editor de portada (héroe, banners, secciones destacadas) se implementará
          en una fase futura. Por ahora, el contenido de la portada se gestiona
          directamente en el código.
        </p>
        <span className="admin-placeholder-badge">Próximamente</span>
      </div>
    </div>
  );
}
