import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';

/**
 * Layout de la tienda pública.
 *
 * El Navbar se renderiza UNA sola vez aquí y queda fijo: no se remonta ni se
 * anima al cambiar de ruta. Solo el contenido de debajo (`.page-fade`) hace la
 * transición fade-up en cada navegación.
 *
 * Gracias a esto la animación puede usar `transform: translateY` con seguridad:
 * el navbar `position: fixed` ya no es descendiente del elemento que se
 * transforma, así que no se desplaza con él.
 *
 * El wrapper se keyea por `pathname` (no por `search`) para que el contenido se
 * remonte en cada cambio de ruta y la animación se reproduzca desde el inicio,
 * sin remontar la portada cuando cambian los query params (?categoria=, ?q=).
 */
const PublicLayout = () => {
  const { pathname } = useLocation();
  const isProductDetail = pathname.startsWith('/producto/');

  return (
    <>
      <Navbar isProductDetail={isProductDetail} />
      <div key={pathname} className="page-fade">
        <Outlet />
      </div>
    </>
  );
};

export default PublicLayout;
