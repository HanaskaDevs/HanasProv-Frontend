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

/** "2026-10-27" -> "27/10" (se parte el texto: new Date() lo leería en UTC y retrocede un día). */
function fechaCorta(fecha: string): string {
  const [, mes, dia] = fecha.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

/**
 * Cada día muestra además la próxima fecha y los números de pedido
 * abiertos para esa fecha (27-oct-2026, pedido del usuario).
 *
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
    // Compacto (27-oct-2026, pedido del usuario: "está muy grandote"): título en
    // una línea y cada entrega como una ficha chica, varias por fila.
    <Card className="px-3.5 py-2.5">
      <p className="text-[11px] text-brand-900/45 mb-1.5">
        <span className="font-display font-bold text-brand-900 uppercase tracking-wide">Mi calendario de entrega</span>
        {' · '}días, hora, andén y pedidos
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5">
        {ordenados.map((h, i) => {
          // Los pedidos son del día, no de cada entrega: con varias entregas el
          // mismo día se muestran solo en la primera, para no repetirlos.
          const primeraDelDia = i === 0 || ordenados[i - 1].dia_entrega !== h.dia_entrega;

          return (
            <div key={h.id_horario_entrega_proveedor} className="rounded-md bg-brand-900/[0.03] px-2 py-1.5 text-[11px] leading-snug min-w-0">
              <p className="flex justify-between gap-1">
                <span className="font-semibold text-brand-900 truncate">
                  {ETIQUETA_DIA[h.dia_entrega] ?? h.dia_entrega}
                  {h.proxima_fecha && <span className="font-normal text-brand-900/45"> {fechaCorta(h.proxima_fecha)}</span>}
                </span>
                <span className="font-semibold text-brand-900 tabular-nums shrink-0">{h.hora_llegada}</span>
              </p>
              <p className="text-brand-900/45 truncate">
                {h.clasificacion.replace('_', ' ')}
                {h.anden_puerta ? ` · Andén ${h.anden_puerta}` : ''}
              </p>
              {primeraDelDia && (
                <p
                  className={`line-clamp-2 break-words ${h.pedidos.length > 0 ? 'text-brand-900/75' : 'text-brand-900/35'}`}
                  title={h.pedidos.join(', ')}
                >
                  {h.pedidos.length > 0 ? `Pedidos: ${h.pedidos.join(', ')}` : 'Sin pedidos'}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
