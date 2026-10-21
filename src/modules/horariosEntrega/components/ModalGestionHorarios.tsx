import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as horariosEntregaApi from '../api/horariosEntregaApi';
import type { ClasificacionHorario, DatosHorarioForm, DiaSemana, HorarioEntrega } from '../types';
import { CLASIFICACIONES, DIAS_SEMANA } from '../types';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import SelectorBuscable from '../../../shared/components/SelectorBuscable';
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

// Misma altura (h-10) para inputs, selects y el selector de proveedor: antes
// cada control tenía la suya y los campos quedaban a distinta altura.
const claseControl =
  'h-10 w-full rounded-md border border-brand-900/15 bg-white px-3 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-700';

/**
 * Rótulo de UN renglón y alto fijo sobre cada control. Antes, en pantallas
 * medianas "Tiempo de permanencia (min)" ocupaba dos renglones y empujaba
 * su campo más abajo que los de al lado: eso era lo "disparejo". El texto
 * largo se corta con … y queda completo en el title.
 */
function Campo({ etiqueta, htmlFor, children, className = '' }: { etiqueta: string; htmlFor: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <label htmlFor={htmlFor} title={etiqueta} className="h-5 truncate text-[13px] font-medium text-brand-900">
        {etiqueta}
      </label>
      {children}
    </div>
  );
}

/**
 * CRUD del calendario: Sistemas, Admin, Compras y Calidad (verificado también
 * en el backend). 3 pestañas, una por clasificación -> la clasificación de cada
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

  // Fila de tiempos: llegada, permanencia y salida, a todo el ancho. La
  // preparación ya no se pide (el usuario no la usa, 21-oct-2026).
  const anchoTiempo = 'md:col-span-4';

  // Código BC adelante y búsqueda por código, nombre o RUC: con ~150
  // proveedores, el <select> nativo obligaba a recorrer toda la lista.
  const opcionesProveedor = useMemo(
    () =>
      (proveedores ?? []).map((p) => ({
        valor: p.id_proveedor,
        etiqueta: p.nombre,
        codigo: p.codigo_bc,
        buscarTambien: [p.ruc],
      })),
    [proveedores]
  );

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
      // Ya no se edita en pantalla: se manda el que tenía el horario (si lo
      // tenía), para no borrarlo sin que nadie lo vea.
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

          {/* 12 columnas: arriba proveedor (ancho) + día + andén; abajo los
              tiempos, todos del mismo ancho. En celular, de a uno o de a dos. */}
          <div className="grid grid-cols-2 gap-x-3 gap-y-3 md:grid-cols-12">
            <Campo etiqueta="Proveedor" htmlFor="horario-proveedor" className="col-span-2 md:col-span-6">
              <SelectorBuscable
                id="horario-proveedor"
                opciones={opcionesProveedor}
                valor={form.id_proveedor}
                onChange={(v) => setForm((f) => ({ ...f, id_proveedor: Number(v) }))}
                placeholder="Selecciona un proveedor..."
                placeholderBusqueda="Buscar por código BC, nombre o RUC..."
              />
            </Campo>

            <Campo etiqueta="Día de entrega" htmlFor="horario-dia" className="col-span-1 md:col-span-3">
              <select
                id="horario-dia"
                className={claseControl}
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
            </Campo>

            <Campo etiqueta={tab === 'Fruver' ? 'Puerta' : 'Andén'} htmlFor="horario-anden" className="col-span-1 md:col-span-3">
              <input
                id="horario-anden"
                className={claseControl}
                placeholder="A, B, C..."
                value={form.anden_puerta}
                onChange={(e) => setForm((f) => ({ ...f, anden_puerta: e.target.value }))}
              />
            </Campo>

            <Campo etiqueta="Hora de llegada" htmlFor="horario-llegada" className={`col-span-1 ${anchoTiempo}`}>
              <input
                id="horario-llegada"
                type="time"
                className={claseControl}
                value={form.hora_llegada}
                onChange={(e) => setForm((f) => ({ ...f, hora_llegada: e.target.value }))}
              />
            </Campo>


            <Campo
              etiqueta={tab === 'Fruver' ? 'En recepción (min)' : 'Permanencia (min)'}
              htmlFor="horario-permanencia"
              className={`col-span-1 ${anchoTiempo}`}
            >
              <input
                id="horario-permanencia"
                type="number"
                min={0}
                className={claseControl}
                value={form.tiempo_permanencia_min}
                onChange={(e) => setForm((f) => ({ ...f, tiempo_permanencia_min: e.target.value }))}
              />
            </Campo>

            <Campo etiqueta="Hora de salida" htmlFor="horario-salida" className={`col-span-1 ${anchoTiempo}`}>
              <input
                id="horario-salida"
                type="time"
                className={claseControl}
                value={form.hora_salida}
                onChange={(e) => setForm((f) => ({ ...f, hora_salida: e.target.value }))}
              />
            </Campo>
          </div>

          {error && <p className="text-xs text-brand-wine">{error}</p>}

          <div className="flex justify-end gap-2">
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
