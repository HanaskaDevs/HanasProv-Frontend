import { useEffect, useState } from 'react';
import apiClient from '../../../shared/api/apiClient';
import { MAX_IMAGENES_OBSERVACION, type ImagenObservacion } from '../types';

/**
 * Fotos de la observación de UNA pregunta (12-nov-2026).
 *
 * Lo usan los dos formularios de Calidad -auditorías y calificación de
 * recepciones-, porque en los dos es lo mismo: hasta
 * MAX_IMAGENES_OBSERVACION fotos junto al texto de la observación.
 *
 * LAS FOTOS NO SE PUEDEN PONER EN UN <img src> DIRECTO: el endpoint que
 * las devuelve pide el token (el repositorio de archivos no es público),
 * así que cada miniatura se baja con apiClient y se muestra desde un
 * objectURL, igual que ya hacía la pantalla de reclamos para abrirlas.
 */
export default function ImagenesObservacion({
  imagenes,
  soloLectura,
  deshabilitadoMotivo,
  onSubir,
  onEliminar,
}: {
  imagenes: ImagenObservacion[];
  soloLectura: boolean;
  /** Si viene, el botón de subir queda deshabilitado y se explica por qué. */
  deshabilitadoMotivo?: string;
  onSubir: (archivo: File) => Promise<void>;
  onEliminar: (idImagen: number) => Promise<void>;
}) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completo = imagenes.length >= MAX_IMAGENES_OBSERVACION;

  async function alElegirArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    // Se limpia el input SIEMPRE: si no, elegir dos veces el mismo
    // archivo (por ejemplo tras un error) no dispara el onChange.
    e.target.value = '';

    if (!archivo) return;

    setError(null);
    setSubiendo(true);
    try {
      await onSubir(archivo);
    } catch (err) {
      setError(mensajeDeError(err));
    } finally {
      setSubiendo(false);
    }
  }

  async function alEliminar(idImagen: number) {
    setError(null);
    try {
      await onEliminar(idImagen);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  }

  if (soloLectura && imagenes.length === 0) return null;

  return (
    <div className="mt-2 sm:ml-9">
      <div className="flex items-center gap-2 flex-wrap">
        {imagenes.map((imagen) => (
          <Miniatura
            key={imagen.id}
            imagen={imagen}
            soloLectura={soloLectura}
            onEliminar={() => alEliminar(imagen.id)}
          />
        ))}

        {!soloLectura && !completo && (
          <label
            className={`h-16 w-16 shrink-0 rounded-lg border-2 border-dashed border-brand-900/15 flex flex-col items-center justify-center text-[11px] text-brand-900/50 ${
              deshabilitadoMotivo || subiendo ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-brand-700 hover:text-brand-700'
            }`}
            title={deshabilitadoMotivo ?? 'Adjuntar una foto'}
          >
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={!!deshabilitadoMotivo || subiendo}
              onChange={alElegirArchivo}
            />
            {subiendo ? '...' : '+ Foto'}
          </label>
        )}
      </div>

      {!soloLectura && (
        <p className="mt-1 text-[11px] text-brand-900/40">
          {completo
            ? `Máximo ${MAX_IMAGENES_OBSERVACION} fotos. Elimina una para subir otra.`
            : deshabilitadoMotivo ?? `Hasta ${MAX_IMAGENES_OBSERVACION} fotos (JPG, PNG o WEBP, máx. 4 MB).`}
        </p>
      )}

      {error && <p className="mt-1 text-[11px] text-brand-wine">{error}</p>}
    </div>
  );
}

/** Una miniatura. Al hacer clic se abre en una pestaña nueva, tamaño real. */
function Miniatura({
  imagen,
  soloLectura,
  onEliminar,
}: {
  imagen: ImagenObservacion;
  soloLectura: boolean;
  onEliminar: () => void;
}) {
  const [src, setSrc] = useState<string | null>(null);
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelado = false;

    apiClient
      .get(imagen.url.replace(/^\/api/, ''), { responseType: 'blob' })
      .then(({ data }) => {
        if (cancelado) return;
        objectUrl = window.URL.createObjectURL(data);
        setSrc(objectUrl);
      })
      .catch(() => {
        if (!cancelado) setFallo(true);
      });

    return () => {
      cancelado = true;
      // Sin esto, cada vez que se redibuja el formulario queda un blob
      // retenido en memoria del navegador.
      if (objectUrl) window.URL.revokeObjectURL(objectUrl);
    };
  }, [imagen.url]);

  return (
    <div className="relative h-16 w-16 shrink-0">
      {src ? (
        <button
          type="button"
          onClick={() => window.open(src, '_blank')}
          className="h-16 w-16 rounded-lg overflow-hidden border border-brand-900/12 block"
          title={imagen.nombre ?? 'Ver la foto'}
        >
          <img src={src} alt={imagen.nombre ?? 'Foto de la observación'} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="h-16 w-16 rounded-lg border border-brand-900/12 bg-brand-900/5 flex items-center justify-center text-[10px] text-brand-900/40">
          {fallo ? 'no disponible' : '...'}
        </div>
      )}

      {!soloLectura && (
        <button
          type="button"
          onClick={onEliminar}
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-brand-wine text-white text-[11px] leading-none flex items-center justify-center shadow"
          title="Eliminar esta foto"
          aria-label="Eliminar esta foto"
        >
          ×
        </button>
      )}
    </div>
  );
}

/** El mensaje que mandó el backend; si no hay, uno genérico. */
function mensajeDeError(err: unknown): string {
  const respuesta = (err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response;
  const primerError = respuesta?.data?.errors ? Object.values(respuesta.data.errors)[0]?.[0] : undefined;

  return primerError ?? respuesta?.data?.message ?? 'No se pudo completar la operación con la foto.';
}
