import { useRef, useState } from 'react';
import { Video } from 'lucide-react';
import { usePageContext } from '../../context/PageContent';
import { uploadPageMedia, validateVideoFile } from '../../lib/storageApi';

function getPath(obj: unknown, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

interface Props {
  /** Ruta en el contenido donde se guarda la URL del vídeo, ej. "cristina.video". */
  path: string;
  /** Vídeo por defecto (asset del proyecto) si aún no se ha subido ninguno. */
  fallbackSrc: string;
  /** Slug de la página (para la ruta en Storage). */
  slug?: string;
  className?: string;
}

/**
 * Vídeo editable. En la web reproduce el vídeo (el guardado en Supabase o, si no
 * hay, el del proyecto). En el editor añade un botón "Cambiar vídeo" que sube el
 * archivo a Storage y guarda su URL en el contenido (se publica al Guardar).
 */
export default function EditableMedia({ path, fallbackSrc, slug = 'inicio', className }: Props) {
  const { content, editing, setField } = usePageContext();
  const stored = getPath(content, path);
  const src = typeof stored === 'string' && stored ? stored : fallbackSrc;

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar el mismo archivo
    if (!file) return;

    const verr = validateVideoFile(file);
    if (verr) { setError(verr); return; }

    setError(null);
    setUploading(true);
    const { url, error: upErr } = await uploadPageMedia(slug, file);
    setUploading(false);

    if (upErr) { setError(upErr); return; }
    if (url) setField(path, url);
  }

  return (
    <div className={`av-media ${className ?? ''}`.trim()}>
      <video key={src} src={src} autoPlay muted loop playsInline preload="metadata" />

      {editing && (
        <div className="av-media-overlay">
          <button
            type="button"
            className="av-media-btn"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            <Video size={16} /> {uploading ? 'Subiendo…' : 'Cambiar vídeo'}
          </button>
          {error && <span className="av-media-error">{error}</span>}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            hidden
            onChange={handleFile}
          />
        </div>
      )}
    </div>
  );
}
