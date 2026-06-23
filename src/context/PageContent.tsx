import { createContext, useContext, ReactNode } from 'react';
import type { HomeContent } from '../content/home';

// Valor que comparten la página pública y el editor.
// - En público: editing=false, setField no hace nada.
// - En el editor (Paso 3): editing=true, setField actualiza el borrador.
export interface PageContextValue {
  content: HomeContent;
  editing: boolean;
  hasStored: boolean; // ¿hay contenido guardado en Supabase? (para avisar en el editor)
  setField: (path: string, value: unknown) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageContentProvider({
  value,
  children,
}: {
  value: PageContextValue;
  children: ReactNode;
}) {
  return <PageContext.Provider value={value}>{children}</PageContext.Provider>;
}

export function usePageContext(): PageContextValue {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('usePageContext debe usarse dentro de <PageContentProvider>');
  return ctx;
}
