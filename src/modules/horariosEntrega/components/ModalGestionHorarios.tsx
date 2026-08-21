import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import type { ClasificacionHorario, DatosHorarioForm, DiaSemana, HorarioEntrega } from '../types';
import { CLASIFICACIONES, DIAS_SEMANA } from '../types';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Input from '../../../shared/components/Input';
import Spinner from '../../../shared/components/Spinner';

const FORM_VACIO: DatosHorarioForm = {
  id_proveedor: '',
  clasificacion: 'Perecibles',
  dia_entrega: '',
  anden_puerta: '',
  hora_llegada: '',
  tiempo_preparacion_min: '',
  tiempo_permanencia_min: '',
  hora_salida: '',
};

const inputSelectClass =
  'rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900 w-full focus:outline-none focus:ring-2 focus:ring-brand-700';

/**
 * CRUD del calendario, solo para Sistemas/Admin (verificado también en el
 * backend). 3 pestañas, una por clasificación -> la clasificación de cada
 * horario queda implícita en la pestaña usada para crearlo, sin que el
 * usuario tenga que elegirla en un campo aparte (pedido explícito).
 */
export default function ModalGestionHorarios({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ClasificacionHorario>('Perecibles');
  const [editando, setEditando] = useState<HorarioEntrega | null>(null);
  const [form, setForm] = useState<DatosHorarioForm>(FORM_VACIO);
  const [error, setError] = useState<string | null>(null);

  const { data: horarios, isLoading } = useQuery({
    queryKey: ['horarios-entrega', tab],
    queryFn: () => horariosEntregaApi.listar(tab),
  });

  const { data: proveedores } = useQuery({
    queryKey: ['horarios-entrega-proveedores'],
    queryFn: horariosEntregaApi.listarProveedores,
  });

  const horariosOrdenados = useMemo(() => {
    const orden: Record<string, number> = Object.fromEntries(DIAS_SEMANA.map((d, i) => [d, i]));
    return [...(horarios ?? [])].sort(
      (a, b) => (orden[a.dia_entrega] ?? 99) - (orden[b.dia_entrega] ?? 99) || a.hora_llegada.localeCompare(b.hora_llegada)
    );
  }, [horarios]);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ['horarios-entrega'] });

  const guardar = useMutation({
    mutationFn: (payload: horariosEntregaApi.PayloadHorario) =>
      editando
        ? horariosEntregaApi.actualizar(editando.id_horario_entrega_proveedor, payload)
        : horariosEntregaApi.crear(payload),
    onSuccess: () => {
      invalidar();
      cancelarEdicion();
    },
    onError: (e: unknown) => {
      const mensaje = (e as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(mensaje ?? 'No se pudo guardar el horario.');
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => horariosEntregaApi.eliminar(id),
    onSuccess: invalidar,
  });

  function cambiarTab(t: ClasificacionHorario) {
    setTab(t);
    cancelarEdicion();
  }

  function cancelarEdicion() {
    setEditando(null);
    setForm({ ...FORM_VACIO, clasificacion: tab });
    setError(null);
  }

  function editar(h: HorarioEntrega) {
    setEditando(h);
    setForm({
      id_proveedor: h.id_proveedor,
      clasificacion: h.clasificacion,
      dia_entrega: h.dia_entrega,
      anden_puerta: h.anden_puerta ?? '',
      hora_llegada: h.hora_llegada,
      tiempo_preparacion_min: h.tiempo_preparacion_min?.toString() ?? '',
      tiempo_permanencia_min: h.tiempo_permanencia_min?.toString() ?? '',
      hora_salida: h.hora_salida ?? '',
    });
    setError(null);
  }

  function enviar() {
    setError(null);

    if (!form.id_proveedor || !form.dia_entrega || !form.hora_llegada) {
      setError('Proveedor, día de entrega y hora de llegada son obligatorios.');
      return;
    }

    guardar.mutate({
      id_proveedor: Number(form.id_proveedor),
      clasificacion: tab,
      dia_entrega: form.dia_entrega as DiaSemana,
      anden_puerta: form.anden_puerta.trim() || null,
      hora_llegada: form.hora_llegada,
      tiempo_preparacion_min: form.tiempo_preparacion_min ? Number(form.tiempo_preparacion_min) : null,
      tiempo_permanencia_min: form.tiempo_permanencia_min ? Number(form.tiempo_permanencia_min) : null,
      hora_salida: form.hora_salida || null,
    });
  }

  return (
    <Modal onClose={onClose} title="Calendario de horarios de entrega" maxWidth="max-w-4xl" expandible>
      <div className="flex flex-col gap-4">
        {/* Pestañas de clasificación */}
        <div className="flex items-center gap-1 border-b border-brand-900/10">
          {CLASIFICACIONES.map((c) => (
            <button
              key={c.valor}
              onClick={() => cambiarTab(c.valor)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === c.valor ? 'border-brand-700 text-brand-900' : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
              }`}
            >
              {c.etiqueta}
            </button>
          ))}
        </div>

        {/* Formulario de alta/edición */}
        <div className="rounded-md border border-brand-900/10 p-3 space-y-3">
          <p className="text-xs font-medium text-brand-900/60">
            {editando ? `Editando horario de ${editando.nombre_proveedor}` : `Nuevo horario — ${CLASIFICACIONES.find((c) => c.valor === tab)?.etiqueta}`}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-sm font-medium text-brand-900">Proveedor</label>
              <select
                className={inputSelectClass}
                value={form.id_proveedor}
                onChange={(e) => setForm((f) => ({ ...f, id_proveedor: e.target.value ? Number(e.target.value) : '' }))}
              >
                <option value="">Selecciona un proveedor...</option>
                {(proveedores ?? []).map((p) => (
                  <option key={p.id_proveedor} value={p.id_proveedor}>
                    {p.codigo_bc ? `${p.codigo_bc} — ${p.nombre}` : p.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Día de entrega</label>
              <select
                className={inputSelectClass}
                value={form.dia_entrega}
                onChange={(e) => setForm((f) => ({ ...f, dia_entrega: e.target.value as DiaSemana }))}
              >
                <option value="">Selecciona...</option>
                {DIAS_SEMANA.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label={tab === 'Fruver' ? 'Puerta' : 'Andén'}
              placeholder="A, B, C..."
              value={form.anden_puerta}
              onChange={(e) => setForm((f) => ({ ...f, anden_puerta: e.target.value }))}
            />

            <Input
              label="Hora de llegada"
              type="time"
              value={form.hora_llegada}
              onChange={(e) => setForm((f) => ({ ...f, hora_llegada: e.target.value }))}
            />

            {tab === 'Fruver' && (
              <Input
                label="Tiempo de preparación (min)"
                type="number"
                min={0}
                value={form.tiempo_preparacion_min}
                onChange={(e) => setForm((f) => ({ ...f, tiempo_preparacion_min: e.target.value }))}
              />
            )}

            <Input
              label={tab === 'Fruver' ? 'Tiempo en recepción (min)' : 'Tiempo de permanencia (min)'}
              type="number"
              min={0}
              value={form.tiempo_permanencia_min}
              onChange={(e) => setForm((f) => ({ ...f, tiempo_permanencia_min: e.target.value }))}
            />

            <Input
              label="Hora de salida"
              type="time"
              value={form.hora_salida}
              onChange={(e) => setForm((f) => ({ ...f, hora_salida: e.target.value }))}
            />
          </div>

          {error && <p className="text-xs text-brand-wine">{error}</p>}

          <div className="flex gap-2">
            <Button className="text-xs px-3 py-1.5" onClick={enviar} isLoading={guardar.isPending}>
              {editando ? 'Guardar cambios' : 'Agregar horario'}
            </Button>
            {editando && (
              <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={cancelarEdicion}>
                Cancelar
              </Button>
            )}
          </div>
        </div>

        {/* Listado de la clasificación activa */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="h-6 w-6" />
          </div>
        ) : horariosOrdenados.length === 0 ? (
          <p className="text-sm text-brand-900/50 text-center py-6">Todavía no hay horarios cargados en esta clasificación.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-900/50 border-b border-brand-900/10">
                  <th className="py-1.5 pr-2">Día</th>
                  <th className="py-1.5 pr-2">{tab === 'Fruver' ? 'Puerta' : 'Andén'}</th>
                  <th className="py-1.5 pr-2">Código</th>
                  <th className="py-1.5 pr-2">Proveedor</th>
                  <th className="py-1.5 pr-2">Llegada</th>
                  <th className="py-1.5 pr-2">Salida</th>
                  <th className="py-1.5 pr-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/6">
                {horariosOrdenados.map((h) => (
                  <tr key={h.id_horario_entrega_proveedor}>
                    <td className="py-1.5 pr-2">{h.dia_entrega}</td>
                    <td className="py-1.5 pr-2">{h.anden_puerta ?? '—'}</td>
                    <td className="py-1.5 pr-2 text-brand-900/60">{h.codigo_proveedor ?? '—'}</td>
                    <td className="py-1.5 pr-2">{h.nombre_proveedor}</td>
                    <td className="py-1.5 pr-2">{h.hora_llegada}</td>
                    <td className="py-1.5 pr-2">{h.hora_salida ?? '—'}</td>
                    <td className="py-1.5 pr-2 text-right whitespace-nowrap">
                      <button className="text-xs text-brand-700 hover:underline mr-3" onClick={() => editar(h)}>
                        Editar
                      </button>
                      <button
                        className="text-xs text-brand-wine hover:underline"
                        onClick={() => eliminar.mutate(h.id_horario_entrega_proveedor)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
}
