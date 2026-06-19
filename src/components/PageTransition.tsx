import { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Envuelve el contenido de las rutas y lanza un "reveal" suave cada vez que
 * cambia la ruta (pathname). Al cambiar el `key`, el div se vuelve a montar y
 * la animación CSS `pageReveal` se reproduce desde el inicio.
 *
 * Importante: animamos solo `opacity` + `clip-path`. No usamos `transform` ni
 * `filter` porque crearían un nuevo bloque contenedor y romperían el navbar
 * `position: fixed` durante la animación.
 *
 * Se basa SOLO en pathname (no en search) para no remontar la portada cuando
 * cambian los query params (?categoria=, ?q=), que gestionan su propio scroll.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  return (
    <div key={location.pathname} className="page-reveal">
      {children}
    </div>
  );
};

export default PageTransition;
