import { ElementType, useRef, useLayoutEffect } from 'react';
import { usePageContext } from '../../context/PageContent';
import { renderText } from '../../lib/richText';

// Lee un valor anidado por ruta de puntos ('hero.titulo', 'escaparates.0.titulo').
function getPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

interface Props {
  /** Ruta dentro del contenido, ej. "hero.titulo". */
  path: string;
  /** Etiqueta a renderizar en modo vista (h1, h2, p, span…). */
  as?: ElementType;
  className?: string;
  /** Permite varias líneas (textarea que crece + saltos de línea). */
  multiline?: boolean;
  /** Interpreta *cursiva* en la vista. */
  rich?: boolean;
  placeholder?: string;
}

/**
 * Texto editable. En modo vista renderiza el valor (con saltos de línea y
 * *cursiva* si procede). En modo edición se convierte en un campo editable
 * legible (fondo claro + texto oscuro), que muestra todo el contenido: el
 * input se ajusta al texto y el textarea crece en altura.
 */
export default function EditableText({
  path,
  as: Tag = 'span',
  className,
  multiline,
  rich,
  placeholder,
}: Props) {
  const { content, editing, setField } = usePageContext();
  const value = String(getPath(content, path) ?? '');
  const taRef = useRef<HTMLTextAreaElement>(null);

  // En edición todos los campos son textarea que crece para mostrar TODO el
  // contenido (envuelve el texto largo en varias líneas, nunca lo recorta).
  useLayoutEffect(() => {
    if (editing && taRef.current) {
      taRef.current.style.height = 'auto';
      taRef.current.style.height = `${taRef.current.scrollHeight}px`;
    }
  }, [editing, value]);

  if (!editing) {
    return <Tag className={className}>{rich || multiline ? renderText(value) : value}</Tag>;
  }

  return (
    <textarea
      ref={taRef}
      rows={1}
      className={`${className ?? ''} av-editable`.trim()}
      value={value}
      placeholder={placeholder}
      data-editable={path}
      onChange={(e) => setField(path, e.target.value)}
    />
  );
}
