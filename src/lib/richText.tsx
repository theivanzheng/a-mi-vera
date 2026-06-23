import { Fragment, ReactNode } from 'react';

/**
 * Renderiza texto plano con dos convenciones de formato:
 *   "\n"        → salto de línea (<br>)
 *   *cursiva*   → énfasis en Playfair Display itálica (<em class="av-em">)
 *
 * Lo usan tanto las páginas públicas como el editor (vista previa).
 */
export function renderText(text: string): ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => (
    <Fragment key={li}>
      {parseEmphasis(line)}
      {li < lines.length - 1 && <br />}
    </Fragment>
  ));
}

function parseEmphasis(line: string): ReactNode {
  // Divide conservando los tramos *...* como separadores
  return line.split(/(\*[^*]+\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) {
      return <em key={i} className="av-em">{part.slice(1, -1)}</em>;
    }
    return <Fragment key={i}>{part}</Fragment>;
  });
}
