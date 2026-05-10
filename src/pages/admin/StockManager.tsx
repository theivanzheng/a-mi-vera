import { Archive } from 'lucide-react';

export default function StockManager() {
  return (
    <div>
      <div className="admin-list-header">
        <h1>Stock</h1>
      </div>

      <div className="admin-placeholder">
        <div className="admin-placeholder-icon"><Archive size={40} /></div>
        <h2>Gestión de stock en Fase 5</h2>
        <p>
          El control de unidades disponibles por producto
          se activará al conectar Supabase.
        </p>
        <span className="admin-placeholder-badge">Próximamente — Fase 5</span>
      </div>
    </div>
  );
}
