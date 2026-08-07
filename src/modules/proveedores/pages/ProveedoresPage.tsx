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
import type { ProveedorListado } from '../types';
import ModalCalificarProveedor from '../components/ModalCalificarProveedor';

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

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores-lista'],
    queryFn: proveedoresApi.listarProveedores,
  });

  const proveedoresFiltrados = useMemo(() => {
    return (proveedores ?? []).filter((p) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto ||
        p.razon_social.toLowerCase().includes(texto) ||
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
                  <th className="px-4 py-2.5 text-xs font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/8">
                {proveedoresPagina.map((p) => {
                  const atencion = necesitaAtencion(p);
                  const revisado = todoRevisado(p);
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-brand-900/[0.02] transition-colors ${atencion ? 'bg-brand-wine/[0.02]' : ''}`}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Avatar nombre={p.razon_social} className="h-8 w-8" />
                          <div className="min-w-0">
                            <p className="text-brand-900 font-medium text-sm truncate">{p.razon_social}</p>
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
                      <td className="px-4 py-2.5 text-right">
                        <Button
                          variant={revisado ? 'ghost' : atencion ? 'primary' : 'ghost'}
                          className={`text-xs px-3 py-1.5 ${
                            revisado ? '!bg-brand-200/40 hover:!bg-brand-200/60' : ''
                          }`}
                          onClick={() => setProveedorCalificando(p)}
                        >
                          {revisado ? 'Ver calificación' : 'Calificar'}
                        </Button>
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

      {proveedorCalificando && (
        <ModalCalificarProveedor
          idProveedor={proveedorCalificando.id}
          razonSocial={proveedorCalificando.razon_social}
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