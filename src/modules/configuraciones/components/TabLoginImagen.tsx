import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configuracionesApi from '../api/configuracionesApi';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

export default function TabLoginImagen() {
  const queryClient = useQueryClient();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['config-login-imagen'],
    queryFn: configuracionesApi.obtenerImagenLogin,
  });

  const actualizar = useMutation({
    mutationFn: () => configuracionesApi.actualizarImagenLogin(archivo!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-login-imagen'] });
      setArchivo(null);
      setPreviewUrl(null);
    },
  });

  function manejarArchivo(file: File | null) {
    setArchivo(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <Card>
      <h3 className="font-medium text-brand-900 mb-1">Imagen de fondo del login</h3>
      <p className="text-sm text-brand-900/60 mb-4">
        Esta imagen aparece de fondo en la pantalla de inicio de sesión, antes de entrar al sistema.
      </p>

      <div className="rounded-lg overflow-hidden bg-brand-900 mb-4 aspect-video max-w-md">
        <img
          src={previewUrl ?? data?.url ?? undefined}
          alt="Imagen actual del login"
          className="w-full h-full object-cover"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="file"
          accept="image/*"
          onChange={(e) => manejarArchivo(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button onClick={() => actualizar.mutate()} isLoading={actualizar.isPending} disabled={!archivo}>
          Guardar imagen
        </Button>
      </div>
    </Card>
  );
}