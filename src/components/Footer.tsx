import Logotipo from '../../IdentidadVisual/Logo_AmiVera.png';

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <img src={Logotipo} alt="A Mi Vera Logo" className="footer-logo darker" />
      <p>&copy; {new Date().getFullYear()} A Mi Vera. Todos los derechos reservados.</p>
    </div>
  </footer>
);

export default Footer;
