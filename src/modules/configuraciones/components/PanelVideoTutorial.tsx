import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import * as configuracionesApi from '../api/configuracionesApi';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

/**
 * URL del video tutorial que el proveedor ve desde su panel (01-oct-2026).
 *
 * Vive dentro de la pestaña "Guía de inicio" y no en una propia porque es
 * lo mismo que los pasos del tour: material de onboarding del proveedor.
 * Son las dos formas de explicarle lo mismo y conviene verlas juntas.
 *
 * Dejar el campo VACÍO borra el video y le esconde el botón al proveedor
 * -> es el interruptor para apagarlo sin tener que desplegar nada.
 */
export default function PanelVideoTutorial() {
  const queryClient = useQueryClient();

  /*
   * null = el administrador no tocó nada, así que el input muestra lo
   * guardado. Apenas escribe algo, manda su edición. Se modela así -y no
   * copiando el valor del servidor al estado con un efecto- para que un
   * refetch en segundo plano no le pise lo que está tipeando.
   */
  const [edicion, setEdicion] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['config-video-tutorial'],
    queryFn: configuracionesApi.obtenerVideoTutorial,
  });

  const url = edicion ?? data?.url ?? '';

  const guardar = useMutation({
    mutationFn: () => configuracionesApi.guardarVideoTutorial(url.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-video-tutorial'] });
      // Vuelve a mandar lo que diga el servidor.
      setEdicion(null);
    },
  });

  const errorGuardar = guardar.isError
    ? (isAxiosError(guardar.error) &&
        (guardar.error.response?.data as { errors?: { url?: string[] } } | undefined)?.errors?.url?.[0]) ||
      'No se pudo guardar el enlace.'
    : null;

  if (isLoading) {
    return (
      <Card>
        <div className="flex justify-center py-8">
          <Spinner className="h-6 w-6" />
        </div>
      </Card>
    );
  }

  const sinCambios = url.trim() === (data?.url ?? '');

  return (
    <Card>
      <h3 className="font-medium text-brand-900 mb-1">URL del video tutorial</h3>
      <p className="text-sm text-brand-900/60 mb-4">
        Enlace de YouTube con el tutorial de cómo cargar datos y documentos. El proveedor lo ve
        desde el botón <strong>Ver video tutorial</strong> de su panel, sin salir del portal.
        Dejá el campo vacío para quitarlo.
      </p>

      <div className="flex flex-col gap-1 mb-3">
        <label htmlFor="url-video-tutorial" className="text-sm font-medium text-brand-900">
          Enlace
        </label>
        <input
          id="url-video-tutorial"
          value={url}
          onChange={(e) => setEdicion(e.target.value)}
          className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
          placeholder="https://www.youtube.com/watch?v=..."
        />
        <p className="text-xs text-brand-900/45">
          Sirve cualquiera de las formas de YouTube: el enlace normal, el corto (youtu.be), el de
          insertar o el de Shorts.
        </p>
      </div>

      {errorGuardar && <p className="text-sm text-brand-wine mb-3">{errorGuardar}</p>}

      {/* Vista previa de lo YA GUARDADO, no de lo que está escrito: así el
          administrador comprueba de verdad que el video se ve dentro del
          portal antes de que lo abra un proveedor. */}
      {data?.url_embed && (
        <div className="mb-4">
          <p className="text-xs text-brand-900/45 mb-1.5">Así lo ve el proveedor:</p>
          <div className="aspect-video max-w-md rounded-lg overflow-hidden bg-brand-900">
            <iframe
              src={data.url_embed}
              title="Vista previa del video tutorial"
              className="w-full h-full"
              allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => guardar.mutate()} disabled={sinCambios || guardar.isPending}>
          {guardar.isPending ? 'Guardando...' : 'Guardar'}
        </Button>
        {guardar.isSuccess && sinCambios && (
          <span className="text-sm text-brand-900/50">Guardado.</span>
        )}
      </div>
    </Card>
  );
}
