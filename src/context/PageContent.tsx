import { createContext, useContext, ReactNode } from 'react';

// Valor que comparten la página pública y el editor.
// - En público: editing=false, setField no hace nada.
// - En el editor: editing=true, setField actualiza el borrador.
//
// Es genérico en el tipo de contenido (HomeContent, NosotrosContent…). Los
// componentes editables (EditableText/EditableMedia) navegan el contenido por
// "path" y no dependen de la forma concreta, así que usan el default `unknown`.
export interface PageContextValue<T = unknown> {
  content: T;
  editing: boolean;
  hasStored: boolean; // ¿hay contenido guardado en Supabase? (para avisar en el editor)
  setField: (path: string, value: unknown) => void;
}

const PageContext = createContext<PageContextValue | null>(null);

export function PageContentProvider<T>({
  value,
  children,
}: {
  value: PageContextValue<T>;
  children: ReactNode;
}) {
  return <PageContext.Provider value={value as PageContextValue}>{children}</PageContext.Provider>;
}

export function usePageContext<T = unknown>(): PageContextValue<T> {
  const ctx = useContext(PageContext);
  if (!ctx) throw new Error('usePageContext debe usarse dentro de <PageContentProvider>');
  return ctx as PageContextValue<T>;
}
