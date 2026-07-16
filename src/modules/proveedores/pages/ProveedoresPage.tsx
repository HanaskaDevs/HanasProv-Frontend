import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import * as proveedoresApi from '../api/proveedoresApi';
import type { ProveedorListado } from '../types';
import ModalCalificarProveedor from '../components/ModalCalificarProveedor';

function BadgeCalificacionFicha({ estado }: { estado: ProveedorListado['estado_calificacion_ficha'] }) {
  if (estado === 'Aprobado') return <Badge tone="success">Aprobada (100)</Badge>;
  if (estado === 'Rechazado') return <Badge tone="danger">Rechazada (0)</Badge>;
  return <Badge tone="neutral">Sin calificar</Badge>;
}

function ProveedoresContent() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroCalificacion, setFiltroCalificacion] = useState('');
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
        (filtroCalificacion === 'sin_calificar' ? !p.estado_calificacion_ficha : p.estado_calificacion_ficha === (filtroCalificacion === 'aprobada' ? 'Aprobado' : 'Rechazado'));

      return coincideBusqueda && coincideCalificacion;
    });
  }, [proveedores, busqueda, filtroCalificacion]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Calificación de Proveedores</h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Proveedores activos. Revisá y calificá su Ficha y su Documentación desde acá.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por razón social, nombre comercial o RUC..." />
        <SelectFiltro
          valor={filtroCalificacion}
          onCambiar={setFiltroCalificacion}
          opciones={[
            { valor: 'sin_calificar', etiqueta: 'Ficha sin calificar' },
            { valor: 'aprobada', etiqueta: 'Ficha aprobada' },
            { valor: 'rechazada', etiqueta: 'Ficha rechazada' },
          ]}
          etiquetaTodos="Todas las calificaciones"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : proveedoresFiltrados.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay proveedores que coincidan con la búsqueda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-200/30 text-left text-brand-900/70">
              <tr>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Ficha</th>
                <th className="px-4 py-3 font-medium">Calificación Ficha</th>
                <th className="px-4 py-3 font-medium">Documentación</th>
                <th className="px-4 py-3 font-medium">Documentos</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {proveedoresFiltrados.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="text-brand-900 font-medium">{p.razon_social}</p>
                    <p className="text-xs text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.porcentaje_completado_ficha === 100 ? 'info' : 'neutral'}>
                      {p.porcentaje_completado_ficha}%
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <BadgeCalificacionFicha estado={p.estado_calificacion_ficha} />
                  </td>
                  <td className="px-4 py-3">
                    {p.documentacion_registrada ? (
                      <Badge tone="success">Registrada</Badge>
                    ) : (
                      <Badge tone="neutral">Pendiente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.documentos_totales === 0 ? (
                      <span className="text-xs text-brand-900/40">Sin cargar</span>
                    ) : p.documentos_pendientes_calificar > 0 ? (
                      <Badge tone="warning">{p.documentos_pendientes_calificar} por calificar</Badge>
                    ) : (
                      <Badge tone="success">Todos calificados</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setProveedorCalificando(p)}>
                      Calificar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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