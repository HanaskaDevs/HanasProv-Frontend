// src/modules/proveedores/pages/ProveedoresPage.tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import Avatar from '../../../shared/components/Avatar';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import Paginador from '../../../shared/components/Paginador';
import * as proveedoresApi from '../api/proveedoresApi';
import * as calificacionGlobalApi from '../../../shared/api/calificacionGlobalApi';
import { DesgloseCalificacion } from '../../../shared/components/CalificacionGlobal';
import { colorTexto, formatearNota } from '../../../shared/utils/formatoCalificacion';
import { nombreVisibleProveedor } from '../types';
import type { ProveedorListado } from '../types';
import ModalCalificarProveedor from '../components/ModalCalificarProveedor';
import Modal from '../../../shared/components/Modal';

const POR_PAGINA = 8;

function BadgeCalificacion({ estado }: { estado: 'Aprobado' | 'Rechazado' | null }) {
  if (estado === 'Aprobado') return <Badge tone="success">Aprobada</Badge>;
  if (estado === 'Rechazado')
    return (
      <Badge tone="danger" className="!bg-amber-100 !text-amber-800">
        Rechazada
      </Badge>
    );
  return <Badge tone="neutral">Sin calificar</Badge>;
}

/** true si esta fila tiene algo esperando una primera revisión del admin. */
function necesitaAtencion(p: ProveedorListado): boolean {
  const fichaListaPeroSinCalificar = Number(p.porcentaje_completado_ficha) === 100 && !p.estado_calificacion_ficha;
  return fichaListaPeroSinCalificar || Number(p.documentos_pendientes_calificar) > 0;
}

/**
 * true si ya no queda NADA por decidir por primera vez: la ficha ya
 * tiene una calificación general (Aprobada o Rechazada) y no hay ningún
 * documento todavía sin calificar. En ese caso "Calificar" ya no aplica
 * -> pasa a ser una acción de solo consulta ("Ver calificación").
 * Si algo fue Rechazado, sigue contando como "ya revisado" -> la pelota
 * está del lado del proveedor hasta que corrija y vuelva a quedar
 * pendiente (eso lo resetea el propio flujo de corrección).
 */
function todoRevisado(p: ProveedorListado): boolean {
  const fichaRevisada = Number(p.porcentaje_completado_ficha) === 100 && p.estado_calificacion_ficha !== null;
  const documentosRevisados = Number(p.documentos_pendientes_calificar) === 0;
  return fichaRevisada && documentosRevisados;
}

/**
 * La nota global en una celda de tabla: número grande con su color y, debajo,
 * sobre cuánto se la evaluó. Ese "sobre cuánto" no es decorativo -> una nota
 * de 100 calculada sobre 25 de los 100 puntos del esquema no significa lo
 * mismo que una de 100 evaluada completa, y en una tabla de comparación esa
 * diferencia tiene que verse.
 */
function CeldaNota({ calificacion }: { calificacion?: calificacionGlobalApi.CalificacionGlobalEnLote }) {
  if (!calificacion) {
    return <span className="text-xs text-brand-900/30">—</span>;
  }

  if (calificacion.puntaje_total === null) {
    return <span className="text-xs text-brand-900/40">Sin datos</span>;
  }

  return (
    <div className="leading-tight">
      <span className={`font-display text-base font-semibold tabular-nums ${colorTexto(calificacion.puntaje_total)}`}>
        {formatearNota(calificacion.puntaje_total)}
      </span>
      <span className="text-[11px] text-brand-900/40">/100</span>
      {calificacion.peso_evaluado < 100 && (
        <p className="text-[10.5px] text-brand-900/40">sobre {calificacion.peso_evaluado} pts</p>
      )}
    </div>
  );
}

function TarjetaResumen({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono: 'neutral' | 'wine' }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        tono === 'wine' ? 'border-brand-wine/20 bg-brand-wine/5' : 'border-brand-900/10 bg-white'
      }`}
    >
      <p className={`text-lg font-display font-bold leading-none ${tono === 'wine' ? 'text-brand-wine' : 'text-brand-900'}`}>
        {valor}
      </p>
      <p className="text-[12px] text-brand-900/50 mt-1">{etiqueta}</p>
    </div>
  );
}

function ProveedoresContent() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCalificacion, setFiltroCalificacion] = useState('');
  const [pagina, setPagina] = useState(1);
  const [proveedorCalificando, setProveedorCalificando] = useState<ProveedorListado | null>(null);
  // Proveedor cuyo desglose se está mirando en el modal.
  const [desgloseDe, setDesgloseDe] = useState<calificacionGlobalApi.CalificacionGlobalEnLote | null>(null);

  // Las notas de todos, en una sola petición. Query aparte de la lista: si
  // este endpoint falla o tarda, la tabla se muestra igual y la columna de
  // calificación queda en "—".
  const { data: calificaciones } = useQuery({
    queryKey: ['calificaciones-globales'],
    queryFn: calificacionGlobalApi.obtenerCalificacionesGlobales,
    retry: false,
  });

  const calificacionPorProveedor = useMemo(() => {
    const mapa = new Map<number, calificacionGlobalApi.CalificacionGlobalEnLote>();
    (calificaciones ?? []).forEach((c) => mapa.set(c.id_proveedor, c));
    return mapa;
  }, [calificaciones]);


  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores-lista'],
    queryFn: proveedoresApi.listarProveedores,
  });

  const proveedoresFiltrados = useMemo(() => {
    return (proveedores ?? []).filter((p) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto ||
        p.razon_social?.toLowerCase().includes(texto) ||
        (p.nombre_comercial?.toLowerCase().includes(texto) ?? false) ||
        (p.ruc?.toLowerCase().includes(texto) ?? false);

      const coincideCalificacion =
        !filtroCalificacion ||
        (filtroCalificacion === 'sin_calificar'
          ? !p.estado_calificacion_ficha
          : p.estado_calificacion_ficha === (filtroCalificacion === 'aprobada' ? 'Aprobado' : 'Rechazado'));

      return coincideBusqueda && coincideCalificacion;
    });
  }, [proveedores, busqueda, filtroCalificacion]);

  const totalPaginas = Math.max(1, Math.ceil(proveedoresFiltrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const proveedoresPagina = proveedoresFiltrados.slice(
    (paginaSegura - 1) * POR_PAGINA,
    paginaSegura * POR_PAGINA
  );

  function actualizarBusqueda(valor: string) {
    setBusqueda(valor);
    setPagina(1);
  }

  function actualizarFiltro(valor: string) {
    setFiltroCalificacion(valor);
    setPagina(1);
  }

  const pendientes = useMemo(() => (proveedores ?? []).filter(necesitaAtencion).length, [proveedores]);

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900">Calificación de Proveedores</h1>
        <p className="text-xs text-brand-900/55 mt-0.5">
          Proveedores activos. Revisa y califica su Ficha y su Documentación desde aquí.
        </p>
      </div>

      {!isLoading && proveedores && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TarjetaResumen valor={proveedores.length} etiqueta="Proveedores activos" tono="neutral" />
          <TarjetaResumen
            valor={proveedores.filter((p) => p.estado_calificacion_ficha === 'Aprobado').length}
            etiqueta="Fichas aprobadas"
            tono="neutral"
          />
          <TarjetaResumen
            valor={proveedores.filter((p) => p.documentacion_registrada).length}
            etiqueta="Documentación registrada"
            tono="neutral"
          />
          <TarjetaResumen valor={pendientes} etiqueta="Esperando tu revisión" tono="wine" />
        </div>
      )}

      <div className="flex items-center gap-2 max-w-lg">
        <BarraBusqueda
          valor={busqueda}
          onCambiar={actualizarBusqueda}
          placeholder="Buscar por razón social, nombre comercial o RUC"
          className="!py-1.5 !text-xs"
        />
        <SelectFiltro
          valor={filtroCalificacion}
          onCambiar={actualizarFiltro}
          opciones={[
            { valor: 'sin_calificar', etiqueta: 'Ficha sin calificar' },
            { valor: 'aprobada', etiqueta: 'Ficha aprobada' },
            { valor: 'rechazada', etiqueta: 'Ficha rechazada' },
          ]}
          etiquetaTodos="Todas"
          className="!py-1.5 !text-xs"
        />
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay proveedores que coincidan con la búsqueda.
          </p>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-brand-200/30 text-left text-brand-900/70">
                <tr>
                  <th className="px-4 py-2.5 text-xs font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Ficha</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Calificación Ficha</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Documentación</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Calificación Documentación</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Calificación global</th>
                  <th className="px-4 py-2.5 text-xs font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/8">
                {proveedoresPagina.map((p) => {
                  const atencion = necesitaAtencion(p);
                  const revisado = todoRevisado(p);
                  const calificacion = calificacionPorProveedor.get(p.id);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-brand-900/[0.02] transition-colors ${atencion ? 'bg-brand-wine/[0.02]' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar nombre={nombreVisibleProveedor(p)} className="h-8 w-8" />
                          <div className="min-w-0">
                            <p className="text-brand-900 font-medium text-sm truncate">{nombreVisibleProveedor(p)}</p>
                            <p className="text-[12px] text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {Number(p.porcentaje_completado_ficha) === 100 ? (
                          <Badge tone="success">Registrada</Badge>
                        ) : (
                          <Badge tone="neutral">No registrada</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <BadgeCalificacion estado={p.estado_calificacion_ficha} />
                      </td>
                      <td className="px-4 py-2.5">
                        {p.documentacion_registrada ? (
                          <Badge tone="success">Registrada</Badge>
                        ) : (
                          <Badge tone="neutral">Pendiente</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {Number(p.documentos_totales) === 0 ? (
                          <span className="text-xs text-brand-900/40">Sin documentos</span>
                        ) : (
                          <BadgeCalificacion estado={p.estado_calificacion_documentacion} />
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {/* La nota ES el botón: se hace clic sobre el número
                            y se abre el desglose. Antes había un botón
                            "Desglose" aparte, que era una columna más para
                            algo que el usuario ya intentaba clickear. */}
                        {calificacion ? (
                          <button
                            type="button"
                            onClick={() => setDesgloseDe(calificacion)}
                            title="Ver el desglose de la calificación"
                            className="-mx-2 -my-1 rounded-md px-2 py-1 text-left transition-colors
                              hover:bg-brand-200/30
                              focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-700"
                          >
                            <CeldaNota calificacion={calificacion} />
                          </button>
                        ) : (
                          <CeldaNota calificacion={calificacion} />
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant={revisado ? 'ghost' : atencion ? 'primary' : 'ghost'}
                            className={`text-xs px-3 py-1.5 ${
                              revisado ? '!bg-brand-200/40 hover:!bg-brand-200/60' : ''
                            }`}
                            onClick={() => setProveedorCalificando(p)}
                          >
                            {revisado ? 'Ver calificación' : 'Calificar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
          </>
        )}
      </Card>

      {desgloseDe && (
        <Modal
          onClose={() => setDesgloseDe(null)}
          title="Calificación del proveedor"
          maxWidth="max-w-xl"
        >
          <DesgloseCalificacion
            datos={desgloseDe}
            subtitulo={desgloseDe.razon_social ?? undefined}
          />
        </Modal>
      )}

      {proveedorCalificando && (
        <ModalCalificarProveedor
          idProveedor={proveedorCalificando.id}
          razonSocial={nombreVisibleProveedor(proveedorCalificando)}
          onClose={() => setProveedorCalificando(null)}
        />
      )}
    </div>
  );
}

export default function ProveedoresPage() {
  const { esSistemas, esAdmin } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin}>
      <ProveedoresContent />
    </RoleRoute>
  );
}