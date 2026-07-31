// src/modules/catalogos/components/CrudCatalogoGenerico.tsx
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';

export interface CampoFormularioCatalogo {
  clave: string;
  etiqueta: string;
  tipo: 'texto' | 'textarea' | 'checkbox' | 'select';
  opciones?: string[];
  placeholder?: string;
  requerido?: boolean;
}

export interface ColumnaExtraCatalogo<T> {
  etiqueta: string;
  obtenerValor: (item: T) => string;
  esBadge?: boolean;
}

interface ApiCatalogo<T> {
  listar: () => Promise<T[]>;
  crear: (payload: Record<string, unknown>) => Promise<T>;
  actualizar: (id: number, payload: Record<string, unknown>) => Promise<T>;
  desactivar: (id: number) => Promise<{ message: string }>;
  activar: (id: number) => Promise<T>;
}

/**
 * CRUD genérico para catálogos simples (una tabla, un nombre principal,
 * algunos campos más, activo/inactivo) -> se parametriza con la config
 * de cada catálogo puntual en vez de escribir 5 pantallas casi
 * idénticas. Pensado para Clase de Proveedor, Categoría de Producto,
 * Tipo de Documento, Tipo de Documento de Producto y Unidad de
 * Presentación, todos con el mismo patrón de soft-delete (Activo).
 */
export default function CrudCatalogoGenerico<T extends { Activo: boolean }>({
  queryKey,
  api,
  obtenerId,
  obtenerNombre,
  columnasExtra = [],
  campos,
  nombreSingular,
}: {
  queryKey: string;
  api: ApiCatalogo<T>;
  obtenerId: (item: T) => number;
  obtenerNombre: (item: T) => string;
  columnasExtra?: ColumnaExtraCatalogo<T>[];
  campos: CampoFormularioCatalogo[];
  nombreSingular: string;
}) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState<'crear' | 'editar' | null>(null);
  const [itemEditando, setItemEditando] = useState<T | null>(null);
  const [valores, setValores] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: [queryKey], queryFn: api.listar });

  const invalidar = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const crear = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.crear(payload),
    onSuccess: () => {
      invalidar();
      cerrarModal();
    },
    onError: () => setError('No se pudo guardar. Revisa que el nombre no esté repetido.'),
  });

  const actualizar = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Record<string, unknown> }) => api.actualizar(id, payload),
    onSuccess: () => {
      invalidar();
      cerrarModal();
    },
    onError: () => setError('No se pudo guardar. Revisa que el nombre no esté repetido.'),
  });

  const cambiarActivo = useMutation({
    mutationFn: async ({ id, activo }: { id: number; activo: boolean }): Promise<unknown> =>
      activo ? api.activar(id) : api.desactivar(id),
    onSuccess: invalidar,
  });

  function valoresIniciales(): Record<string, unknown> {
    const base: Record<string, unknown> = {};
    for (const campo of campos) {
      base[campo.clave] = campo.tipo === 'checkbox' ? false : '';
    }
    return base;
  }

  function abrirCrear() {
    setError(null);
    setItemEditando(null);
    setValores(valoresIniciales());
    setModalAbierto('crear');
  }

  function abrirEditar(item: T) {
    setError(null);
    setItemEditando(item);
    const base: Record<string, unknown> = {};
    for (const campo of campos) {
      // Los campos vienen en PascalCase desde el modelo (ej.
      // Nombre_Clase); acá se buscan "adivinando" esa clave a partir de
      // la clave del form (nombre_clase -> Nombre_Clase), ya que cada
      // config define sus propias claves en minúsculas para el payload
      // que espera el backend.
      const clavePascal = campo.clave
        .split('_')
        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
        .join('_');
      base[campo.clave] = (item as Record<string, unknown>)[clavePascal] ?? (campo.tipo === 'checkbox' ? false : '');
    }
    setValores(base);
    setModalAbierto('editar');
  }

  function cerrarModal() {
    setModalAbierto(null);
    setItemEditando(null);
    setError(null);
  }

  function guardar() {
    setError(null);
    if (modalAbierto === 'crear') {
      crear.mutate(valores);
    } else if (itemEditando) {
      actualizar.mutate({ id: obtenerId(itemEditando), payload: valores });
    }
  }

  const guardando = crear.isPending || actualizar.isPending;
  const plantillaColumnas = `1fr ${columnasExtra.map(() => '140px').join(' ')} 90px 140px`;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-brand-900/50">
          {data ? `${data.length} registrado${data.length === 1 ? '' : 's'}` : ''}
        </p>
        <Button className="!text-xs !px-3 !py-1.5" onClick={abrirCrear}>
          + Nuevo {nombreSingular}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-6 w-6" />
        </div>
      ) : !data || data.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/50 text-center py-8">
            Todavía no hay {nombreSingular.toLowerCase()}s cargados.
          </p>
        </Card>
      ) : (
        <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white">
          <div
            className="grid gap-3 items-center px-3 py-2 border-b border-brand-900/8 bg-brand-900/[0.02] text-[10.5px] font-medium text-brand-900/40 uppercase tracking-wide"
            style={{ gridTemplateColumns: plantillaColumnas }}
          >
            <span>Nombre</span>
            {columnasExtra.map((c) => (
              <span key={c.etiqueta}>{c.etiqueta}</span>
            ))}
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          {data.map((item) => {
            const id = obtenerId(item);
            const activo = item.Activo;
            return (
              <div
                key={id}
                className="grid gap-3 items-center px-3 py-2.5 border-b border-brand-900/8 last:border-b-0"
                style={{ gridTemplateColumns: plantillaColumnas }}
              >
                <span className={`text-sm ${activo ? 'text-brand-900' : 'text-brand-900/40'}`}>
                  {obtenerNombre(item)}
                </span>
                {columnasExtra.map((c) =>
                  c.esBadge ? (
                    <span key={c.etiqueta}>
                      <Badge tone={c.obtenerValor(item) === 'Sí' ? 'info' : 'neutral'}>{c.obtenerValor(item)}</Badge>
                    </span>
                  ) : (
                    <span key={c.etiqueta} className="text-xs text-brand-900/60">
                      {c.obtenerValor(item)}
                    </span>
                  )
                )}
                <span>
                  <Badge tone={activo ? 'success' : 'neutral'}>{activo ? 'Activo' : 'Inactivo'}</Badge>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => abrirEditar(item)}
                    className="text-xs font-medium text-brand-700 hover:underline"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => cambiarActivo.mutate({ id, activo: !activo })}
                    disabled={cambiarActivo.isPending}
                    className={`text-xs font-medium hover:underline ${activo ? 'text-brand-wine' : 'text-emerald-700'}`}
                  >
                    {activo ? 'Desactivar' : 'Activar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAbierto && (
        <Modal
          title={modalAbierto === 'crear' ? `Nuevo ${nombreSingular}` : `Editar ${nombreSingular}`}
          onClose={cerrarModal}
        >
          <div className="space-y-3">
            {campos.map((campo) => (
              <div key={campo.clave}>
                <label className="block text-xs font-medium text-brand-900/60 mb-1">{campo.etiqueta}</label>
                {campo.tipo === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-sm text-brand-900">
                    <input
                      type="checkbox"
                      checked={Boolean(valores[campo.clave])}
                      onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.checked })}
                      className="h-4 w-4 accent-brand-700"
                    />
                    {campo.placeholder ?? 'Sí'}
                  </label>
                ) : campo.tipo === 'textarea' ? (
                  <textarea
                    value={String(valores[campo.clave] ?? '')}
                    onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.value })}
                    placeholder={campo.placeholder}
                    rows={3}
                    className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                ) : campo.tipo === 'select' ? (
                  <select
                    value={String(valores[campo.clave] ?? '')}
                    onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.value })}
                    className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                  >
                    <option value="">Selecciona...</option>
                    {campo.opciones?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={String(valores[campo.clave] ?? '')}
                    onChange={(e) => setValores({ ...valores, [campo.clave]: e.target.value })}
                    placeholder={campo.placeholder}
                    className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700"
                  />
                )}
              </div>
            ))}

            {error && <p className="text-xs text-brand-wine">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={cerrarModal}>
                Cancelar
              </Button>
              <Button isLoading={guardando} onClick={guardar}>
                Guardar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}