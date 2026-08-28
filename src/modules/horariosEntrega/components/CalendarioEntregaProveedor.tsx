import { useQuery } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import * as horariosEntregaApi from '../api/horariosEntregaApi';

const ORDEN_DIAS: Record<string, number> = {
  Lunes: 1, Martes: 2, Miercoles: 3, Jueves: 4, Viernes: 5, Sabado: 6, Domingo: 7,
};

const ETIQUETA_DIA: Record<string, string> = {
  Lunes: 'Lunes', Martes: 'Martes', Miercoles: 'Miércoles', Jueves: 'Jueves',
  Viernes: 'Viernes', Sabado: 'Sábado', Domingo: 'Domingo',
};

/**
 * "El calendario debe mostrarle al proveedor el horario y fechas que
 * tiene para entregar en la sección de pedidos del proveedor" (pedido
 * explícito del usuario, 26-ago-2026). Usa GET /horarios-entrega/mios,
 * que solo devuelve el horario del proveedor logueado.
 */
export default function CalendarioEntregaProveedor() {
  const { data: horarios, isLoading } = useQuery({
    queryKey: ['mis-horarios-entrega'],
    queryFn: horariosEntregaApi.misHorarios,
  });

  const ordenados = [...(horarios ?? [])].sort(
    (a, b) => (ORDEN_DIAS[a.dia_entrega] ?? 99) - (ORDEN_DIAS[b.dia_entrega] ?? 99)
  );

  if (isLoading) {
    return (
      <Card className="flex justify-center py-6">
        <Spinner className="h-5 w-5" />
      </Card>
    );
  }

  if (ordenados.length === 0) {
    return null;
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-5 pt-4 pb-2">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
          Mi calendario de entrega
        </h3>
        <p className="text-[11px] text-brand-900/45 mt-0.5">Días, horario y andén asignados para tus entregas.</p>
      </div>
      <div className="divide-y divide-brand-900/6">
        {ordenados.map((h) => (
          <div key={h.id_horario_entrega_proveedor} className="flex items-center justify-between gap-3 px-5 py-2.5 text-sm">
            <div className="min-w-0">
              <p className="font-medium text-brand-900">{ETIQUETA_DIA[h.dia_entrega] ?? h.dia_entrega}</p>
              <p className="text-[11px] text-brand-900/45">
                {h.clasificacion.replace('_', ' ')}
                {h.anden_puerta ? ` · Andén/Puerta ${h.anden_puerta}` : ''}
              </p>
            </div>
            <span className="font-semibold text-brand-900 tabular-nums shrink-0">{h.hora_llegada}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
