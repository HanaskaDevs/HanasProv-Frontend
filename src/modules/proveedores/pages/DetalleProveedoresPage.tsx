// src/modules/proveedores/pages/DetalleProveedoresPage.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import Avatar from '../../../shared/components/Avatar';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import Paginador from '../../../shared/components/Paginador';
import * as proveedoresApi from '../api/proveedoresApi';
import { nombreVisibleProveedor } from '../types';
import type { ProveedorListado } from '../types';
import ModalDetalleProveedor from '../components/ModalDetalleProveedor';
import {
  estadoDocumentacion,
  estadoFicha,
  TONO_ESTADO,
  type DescripcionEstado,
  type EstadoRegistro,
} from '../utils/estadoRegistro';

const POR_PAGINA = 10;

function badgeDeEstado(estado: string | null) {
  if (estado?.trim().toLowerCase() === 'aprobado') return { tone: 'success' as const, texto: 'Aprobado' };
  if (estado?.trim().toLowerCase() === 'rechazado') return { tone: 'amber' as const, texto: 'Rechazado' };
  if (estado?.trim().toLowerCase() === 'suspendido') return { tone: 'danger' as const, texto: 'Suspendido' };
  return { tone: 'neutral' as const, texto: estado ?? 'Aspirante' };
}

const ORDEN_ESTADOS: EstadoRegistro[] = ['pendiente', 'incompleta', 'rechazada', 'aprobada'];

const NOMBRE_FILTRO: Record<EstadoRegistro, string> = {
  pendiente: 'Por calificar',
  incompleta: 'Incompletas',
  rechazada: 'Rechazadas',
  aprobada: 'Aprobadas',
};

const COLOR_FILTRO: Record<EstadoRegistro, { activo: string; numero: string }> = {
  pendiente: {
    activo: 'border-brand-yellow bg-brand-yellow/20',
    numero: 'text-brand-900',
  },
  incompleta: {
    activo: 'border-brand-900/30 bg-brand-900/[0.05]',
    numero: 'text-brand-900/70',
  },
  rechazada: {
    activo: 'border-amber-300 bg-amber-50',
    numero: 'text-amber-800',
  },
  aprobada: {
    activo: 'border-emerald-300 bg-emerald-50',
    numero: 'text-emerald-700',
  },
};

function contarPorEstado(lista: ProveedorListado[], calcular: (p: ProveedorListado) => DescripcionEstado) {
  const conteo: Record<EstadoRegistro, number> = {
    pendiente: 0,
    incompleta: 0,
    rechazada: 0,
    aprobada: 0,
  };
  for (const p of lista) conteo[calcular(p).estado]++;
  return conteo;
}

/**
 * Un resumen por etapa (ficha o documentación) que además sirve de filtro:
 * un clic en "Por calificar" deja en la tabla solo esos proveedores, y otro
 * clic en el mismo lo quita. Así se responde "¿cuántos llenaron la ficha y
 * nadie los calificó?" y se ve la lista en el mismo lugar.
 */
function ResumenEtapa({
  titulo,
  conteo,
  activo,
  onElegir,
}: {
  titulo: string;
  conteo: Record<EstadoRegistro, number>;
  activo: EstadoRegistro | null;
  onElegir: (estado: EstadoRegistro | null) => void;
}) {
  return (
    <Card className="!p-3">
      <div className="mb-2 flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-brand-900/60">{titulo}</h2>
        {activo && (
          <button
            onClick={() => onElegir(null)}
            className="text-xs text-brand-900/50 underline hover:text-brand-900"
          >
            Quitar filtro
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ORDEN_ESTADOS.map((estado) => {
          const seleccionado = activo === estado;
          return (
            <button
              key={estado}
              onClick={() => onElegir(seleccionado ? null : estado)}
              aria-pressed={seleccionado}
              className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                seleccionado
                  ? COLOR_FILTRO[estado].activo
                  : 'border-brand-900/8 hover:border-brand-900/20 hover:bg-brand-900/[0.02]'
              }`}
            >
              <span
                className={`block font-display text-xl font-semibold leading-tight ${COLOR_FILTRO[estado].numero}`}
              >
                {conteo[estado]}
              </span>
              <span className="block text-xs text-brand-900/60">{NOMBRE_FILTRO[estado]}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function CeldaEstado({ estado }: { estado: DescripcionEstado }) {
  return (
    <div className="min-w-0">
      <Badge tone={TONO_ESTADO[estado.estado]}>{estado.etiqueta}</Badge>
      {estado.detalle && <p className="mt-1 truncate text-[11px] text-brand-900/50">{estado.detalle}</p>}
    </div>
  );
}

function DetalleProveedoresContent() {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [filtroFicha, setFiltroFicha] = useState<EstadoRegistro | null>(null);
  const [filtroDocumentacion, setFiltroDocumentacion] = useState<EstadoRegistro | null>(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorListado | null>(null);

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores-lista'],
    queryFn: proveedoresApi.listarProveedores,
  });

  // Los contadores miran a TODOS los proveedores, no a los filtrados: son
  // el panorama general y no deben moverse al buscar o al elegir un filtro.
  const conteoFicha = useMemo(() => contarPorEstado(proveedores ?? [], estadoFicha), [proveedores]);
  const conteoDocumentacion = useMemo(
    () => contarPorEstado(proveedores ?? [], estadoDocumentacion),
    [proveedores]
  );

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return (proveedores ?? []).filter((p) => {
      if (filtroFicha && estadoFicha(p).estado !== filtroFicha) return false;
      if (filtroDocumentacion && estadoDocumentacion(p).estado !== filtroDocumentacion) return false;
      if (!texto) return true;
      return (
        p.razon_social?.toLowerCase().includes(texto) ||
        p.nombre_comercial?.toLowerCase().includes(texto) ||
        p.ruc?.toLowerCase().includes(texto)
      );
    });
  }, [proveedores, busqueda, filtroFicha, filtroDocumentacion]);

  const hayFiltros = busqueda.trim() !== '' || filtroFicha !== null || filtroDocumentacion !== null;

  const totalPaginas = Math.max(1, Math.ceil(proveedoresFiltrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const proveedoresPagina = proveedoresFiltrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">Detalle de Proveedores</h1>
        <p className="text-xs text-brand-900/55 mt-0.5">
          Información completa de cada proveedor y en qué punto está su ficha y su documentación.
        </p>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <ResumenEtapa
          titulo="Ficha del proveedor"
          conteo={conteoFicha}
          activo={filtroFicha}
          onElegir={(e) => {
            setFiltroFicha(e);
            setPagina(1);
          }}
        />
        <ResumenEtapa
          titulo="Documentación"
          conteo={conteoDocumentacion}
          activo={filtroDocumentacion}
          onElegir={(e) => {
            setFiltroDocumentacion(e);
            setPagina(1);
          }}
        />
      </div>

      <BarraBusqueda
        valor={busqueda}
        onCambiar={(v) => {
          setBusqueda(v);
          setPagina(1);
        }}
        placeholder="Buscar por razón social, nombre comercial o RUC"
        className="max-w-lg"
      />

      {!isLoading && (
        <p className="text-xs text-brand-900/55">
          {hayFiltros
            ? `${proveedoresFiltrados.length} de ${(proveedores ?? []).length} proveedores`
            : `${(proveedores ?? []).length} proveedores`}
        </p>
      )}

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay proveedores que coincidan con la búsqueda o los filtros elegidos.
          </p>
        ) : (
          <>
            {/* table-fixed + colgroup: un nombre o un correo largo no empuja
                las columnas de estado fuera de lugar; se recortan con "…". */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed text-sm">
                <colgroup>
                  <col className="w-[30%]" />
                  <col className="w-[22%]" />
                  <col className="w-[12%]" />
                  <col className="w-[18%]" />
                  <col className="w-[18%]" />
                </colgroup>
                <thead className="bg-brand-200/30 text-left text-brand-900/70">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-medium">Proveedor</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Correo</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Ficha</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Documentación</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/8">
                  {proveedoresPagina.map((p) => {
                    const estado = badgeDeEstado(p.estado);
                    return (
                      <tr
                        key={p.id}
                        onClick={() => setProveedorSeleccionado(p)}
                        className="hover:bg-brand-900/[0.02] transition-colors cursor-pointer"
                      >
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar nombre={nombreVisibleProveedor(p)} className="h-8 w-8" />
                            <div className="min-w-0">
                              <p
                                className="text-brand-900 font-medium text-sm truncate"
                                title={nombreVisibleProveedor(p)}
                              >
                                {nombreVisibleProveedor(p)}
                              </p>
                              <p className="text-[12px] text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="truncate px-4 py-2.5 text-brand-900/70" title={p.email ?? undefined}>
                          {p.email ?? '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge tone={estado.tone}>{estado.texto}</Badge>
                        </td>
                        <td className="px-4 py-2.5">
                          <CeldaEstado estado={estadoFicha(p)} />
                        </td>
                        <td className="px-4 py-2.5">
                          <CeldaEstado estado={estadoDocumentacion(p)} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
          </>
        )}
      </Card>

      {proveedorSeleccionado && (
        <ModalDetalleProveedor
          idProveedor={proveedorSeleccionado.id}
          razonSocial={nombreVisibleProveedor(proveedorSeleccionado)}
          onClose={() => setProveedorSeleccionado(null)}
        />
      )}
    </div>
  );
}

export default function DetalleProveedoresPage() {
  // Calidad también: el proceso de calificación es suyo, y esta pantalla
  // es la que cuenta cuántas fichas y documentos esperan revisión.
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <DetalleProveedoresContent />
    </RoleRoute>
  );
}
