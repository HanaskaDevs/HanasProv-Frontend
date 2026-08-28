import { useQuery } from '@tanstack/react-query';
import Modal from '../../../shared/components/Modal';
import Spinner from '../../../shared/components/Spinner';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import type { HorarioHoy } from '../types';

/**
 * Al hacer clic en un registro del seguimiento de hoy (Admin/Compras/
 * Calidad), este modal muestra los pedidos que ese proveedor debe entregar
 * HOY -> pedido explícito del usuario, en vez de mostrar más columnas en
 * la tabla.
 */
export default function ModalPedidosDelDia({ horario, onClose }: { horario: HorarioHoy; onClose: () => void }) {
  const { data: pedidos, isLoading } = useQuery({
    queryKey: ['pedidos-del-dia', horario.id_horario_entrega_proveedor],
    queryFn: () => horariosEntregaApi.pedidosDelDia(horario.id_horario_entrega_proveedor),
  });

  return (
    <Modal onClose={onClose} title={`Pedidos de hoy — ${horario.nombre_proveedor}`}>
      <div className="space-y-3">
        <p className="text-xs text-brand-900/50">
          Hora programada {horario.hora_llegada}
          {horario.anden_puerta ? ` · Andén/Puerta ${horario.anden_puerta}` : ''}
        </p>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-5 w-5" />
          </div>
        ) : (pedidos ?? []).length === 0 ? (
          <p className="text-sm text-brand-900/50 py-6 text-center">
            Este proveedor no tiene pedidos con recepción esperada para hoy.
          </p>
        ) : (
          <div className="divide-y divide-brand-900/8 rounded-lg border border-brand-900/10 overflow-hidden">
            {(pedidos ?? []).map((p) => (
              <div key={p.id_pedido_compra} className="flex items-center justify-between px-3 py-2.5 text-sm">
                <div>
                  <p className="font-medium text-brand-900">{p.nro_pedido}</p>
                  <p className="text-[11px] text-brand-900/45">{p.estado_pedido_bc ?? p.estado}</p>
                </div>
                <span className="text-[11px] text-brand-900/50">
                  {p.fecha_recepcion_esperada ?? '—'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
