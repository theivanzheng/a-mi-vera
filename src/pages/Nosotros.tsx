import { useEffect } from 'react';
import { useNosotrosContent } from '../hooks/useNosotrosContent';
import { PageContentProvider } from '../context/PageContent';
import NosotrosView from '../components/NosotrosView';

const Nosotros = () => {
  const { content, hasStored } = useNosotrosContent();

  // Al entrar (la home usa scrollRestoration manual), abrir siempre arriba.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="store-container">
      <PageContentProvider value={{ content, editing: false, hasStored, setField: () => {} }}>
        <NosotrosView />
      </PageContentProvider>
    </div>
  );
};

export default Nosotros;
