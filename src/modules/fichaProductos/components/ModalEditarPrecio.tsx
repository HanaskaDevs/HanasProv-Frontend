import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as productosApi from '../api/productosApi';
import type { Producto } from '../types';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

/**
 * Pide un cambio de precio para un producto ya creado. Solo tiene
 * efecto si el proveedor ya está Aprobado (lo valida el backend) -> si
 * no, el mensaje de error del servidor se muestra tal cual. Al
 * enviarse, el precio queda bloqueado (Precio_En_Revision) hasta que
 * Admin/Calidad de la empresa lo apruebe o lo rechace.
 */
export default function ModalEditarPrecio({ producto, onClose }: { producto: Producto; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [precioNuevo, setPrecioNuevo] = useState(producto.precio ?? '');
  const [error, setError] = useState<string | null>(null);

  const solicitar = useMutation({
    mutationFn: () => productosApi.solicitarCambioPrecio(producto.id_producto, Number(precioNuevo)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      onClose();
    },
    onError: (err) => {
      const mensaje =
        axios.isAxiosError(err) && (err.response?.data?.errors || err.response?.data?.message)
          ? (err.response.data.errors
              ? (Object.values(err.response.data.errors).flat() as string[]).join(' ')
              : err.response.data.message)
          : 'No se pudo solicitar el cambio de precio. Intenta de nuevo.';
      setError(mensaje);
    },
  });

  return (
    <Modal onClose={onClose} title="Solicitar cambio de precio" maxWidth="max-w-sm">
      <div className="space-y-4">
        <p className="text-sm text-brand-900/70">
          Este cambio queda pendiente hasta que sea aprobado. Mientras tanto, el precio de{' '}
          <strong>{producto.nombre_producto}</strong> queda bloqueado.
        </p>

        <Input
          label="Precio actual"
          value={producto.precio != null ? `$${producto.precio}` : 'Sin precio'}
          disabled
          readOnly
        />

        <Input
          label="Nuevo precio"
          type="number"
          step="0.01"
          min="0.01"
          value={precioNuevo}
          onChange={(e) => setPrecioNuevo(e.target.value)}
          autoFocus
        />

        {error && <p className="text-xs text-brand-wine">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            isLoading={solicitar.isPending}
            disabled={!precioNuevo || Number(precioNuevo) <= 0}
            onClick={() => {
              setError(null);
              solicitar.mutate();
            }}
          >
            Solicitar cambio
          </Button>
        </div>
      </div>
    </Modal>
  );
}
