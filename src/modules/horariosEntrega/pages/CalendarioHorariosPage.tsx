import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import { CLASIFICACIONES, DIAS_SEMANA, type ClasificacionHorario, type HorarioEntrega } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import RoleRoute from '../../../routes/RoleRoute';
import ModalGestionHorarios from '../components/ModalGestionHorarios';

function TablaDia({ dia, horarios }: { dia: string; horarios: HorarioEntrega[] }) {
  const delDia = horarios.filter((h) => h.dia_entrega === dia);

  if (delDia.length === 0) return null;

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 py-2.5 bg-brand-900/4 border-b border-brand-900/10">
        <h3 className="text-sm font-semibold text-brand-900">{dia}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-brand-900/50 border-b border-brand-900/10">
              <th className="py-1.5 px-4">Andén/Puerta</th>
              <th className="py-1.5 px-2">Código proveedor</th>
              <th className="py-1.5 px-2">Nombre proveedor</th>
              <th className="py-1.5 px-2">Llegada</th>
              <th className="py-1.5 px-2">Preparación (min)</th>
              <th className="py-1.5 px-2">Permanencia (min)</th>
              <th className="py-1.5 px-2">Salida</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/6">
            {delDia.map((h) => (
              <tr key={h.id_horario_entrega_proveedor}>
                <td className="py-1.5 px-4 font-medium">{h.anden_puerta ?? '—'}</td>
                <td className="py-1.5 px-2 text-brand-900/60">{h.codigo_proveedor ?? '—'}</td>
                <td className="py-1.5 px-2">{h.nombre_proveedor}</td>
                <td className="py-1.5 px-2">{h.hora_llegada}</td>
                <td className="py-1.5 px-2">{h.tiempo_preparacion_min ?? '—'}</td>
                <td className="py-1.5 px-2">{h.tiempo_permanencia_min ?? '—'}</td>
                <td className="py-1.5 px-2">{h.hora_salida ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function CalendarioContenido() {
  const { esSistemas, esAdmin } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ClasificacionHorario>('Perecibles');
  const [modalAbierto, setModalAbierto] = useState(false);
  const puedeGestionar = esSistemas || esAdmin;

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios-entrega', tab],
    queryFn: () => horariosEntregaApi.listar(tab),
  });

  const diasConDatos = useMemo(
    () => DIAS_SEMANA.filter((d) => (horarios ?? []).some((h) => h.dia_entrega === d)),
    [horarios]
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            Calendario de horarios de entrega
          </h1>
          <p className="text-brand-900/50 text-xs mt-0.5">Día, andén/puerta y horario de recepción por proveedor.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="text-xs px-3 py-1.5" onClick={() => navigate('/calendario/modo-tv')}>
            Modo TV
          </Button>
          {puedeGestionar && (
            <Button className="text-xs px-3 py-1.5" onClick={() => setModalAbierto(true)}>
              Gestionar calendario
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-brand-900/10">
        {CLASIFICACIONES.map((c) => (
          <button
            key={c.valor}
            onClick={() => setTab(c.valor)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === c.valor ? 'border-brand-700 text-brand-900' : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
            }`}
          >
            {c.etiqueta}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : diasConDatos.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            Todavía no hay horarios cargados para {CLASIFICACIONES.find((c) => c.valor === tab)?.etiqueta}.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {diasConDatos.map((dia) => (
            <TablaDia key={dia} dia={dia} horarios={horarios ?? []} />
          ))}
        </div>
      )}

      {modalAbierto && <ModalGestionHorarios onClose={() => setModalAbierto(false)} />}
    </div>
  );
}

/**
 * Ven el calendario Sistemas, Admin, Compras y Calidad (pedido explícito
 * del usuario); gestionar (crear/editar/borrar) queda solo para
 * Sistemas/Admin dentro del modal, verificado también en el backend.
 */
export default function CalendarioHorariosPage() {
  const { esSistemas, esAdmin, esCompras, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCompras || esCalidad}>
      <CalendarioContenido />
    </RoleRoute>
  );
}
