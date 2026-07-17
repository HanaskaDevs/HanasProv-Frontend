// src/modules/proveedores/components/FilaCampoCalificable.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as proveedoresApi from '../api/proveedoresApi';
import ControlesCalificacion from './ControlesCalificacion';
import type { FichaProveedor } from '../../miFicha/types';

export default function FilaCampoCalificable({
  idProveedor,
  campo,
  label,
  valor,
  calificacion,
}: {
  idProveedor: number;
  campo: string;
  label: string;
  valor: string | number | null | undefined;
  calificacion: { estado: 'Aprobado' | 'Rechazado' | null; observacion: string | null; fecha: string | null };
}) {
  const queryClient = useQueryClient();

  const calificar = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarCampoFicha(idProveedor, campo, payload),
    onSuccess: (fichaActualizada: FichaProveedor) => {
      // El POST ya devuelve la ficha completa actualizada -> directo al
      // caché, sin depender de un segundo viaje al servidor.
      queryClient.setQueryData(['calificacion-ficha', idProveedor], fichaActualizada);
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
  });

  const vacio = valor === null || valor === undefined || valor === '';
  const estado = calificacion.estado;

  return (
    <div
      className={`rounded-lg border p-2.5 transition-colors ${
        estado === 'Rechazado'
          ? 'border-brand-wine/25 bg-brand-wine/[0.03]'
          : estado === 'Aprobado'
            ? 'border-emerald-600/15 bg-emerald-50/30'
            : 'border-brand-900/10 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10.5px] text-brand-900/50 truncate">{label}</p>
          <p className="text-sm font-medium text-brand-900 truncate">
            {vacio ? <span className="italic text-brand-900/30 font-normal">Vacío</span> : valor}
          </p>
        </div>
        <div className="shrink-0">
          <ControlesCalificacion
            estado={calificacion.estado}
            observacion={calificacion.observacion}
            fecha={calificacion.fecha}
            calificando={calificar.isPending}
            onCalificar={(aprobado, observacion) => calificar.mutate({ aprobado, observacion })}
          />
        </div>
      </div>
      {calificar.isError && <p className="text-[10px] text-brand-wine mt-1">No se pudo guardar.</p>}
    </div>
  );
}