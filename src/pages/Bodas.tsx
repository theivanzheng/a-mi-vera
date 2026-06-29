import { useEffect } from 'react';
import { useBodasContent } from '../hooks/useBodasContent';
import { PageContentProvider } from '../context/PageContent';
import BodasView from '../components/BodasView';

const Bodas = () => {
  const { content, hasStored } = useBodasContent();

  // Al entrar (la home usa scrollRestoration manual), abrir siempre arriba.
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="store-container">
      <PageContentProvider value={{ content, editing: false, hasStored, setField: () => {} }}>
        <BodasView />
      </PageContentProvider>
    </div>
  );
};

export default Bodas;
