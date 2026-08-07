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
import type { ProveedorListado } from '../types';
import ModalDetalleProveedor from '../components/ModalDetalleProveedor';

const POR_PAGINA = 10;

function badgeDeEstado(estado: string | null) {
  if (estado?.trim().toLowerCase() === 'aprobado') return { tone: 'success' as const, texto: 'Aprobado' };
  if (estado?.trim().toLowerCase() === 'rechazado') return { tone: 'amber' as const, texto: 'Rechazado' };
  if (estado?.trim().toLowerCase() === 'suspendido') return { tone: 'danger' as const, texto: 'Suspendido' };
  return { tone: 'neutral' as const, texto: estado ?? 'Aspirante' };
}

function DetalleProveedoresContent() {
  const [busqueda, setBusqueda] = useState('');
  const [pagina, setPagina] = useState(1);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorListado | null>(null);

  const { data: proveedores, isLoading } = useQuery({
    queryKey: ['proveedores-lista'],
    queryFn: proveedoresApi.listarProveedores,
  });

  const proveedoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return proveedores ?? [];
    return (proveedores ?? []).filter(
      (p) =>
        p.razon_social.toLowerCase().includes(texto) ||
        p.nombre_comercial?.toLowerCase().includes(texto) ||
        p.ruc?.toLowerCase().includes(texto)
    );
  }, [proveedores, busqueda]);

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
          Información completa de cada proveedor: datos generales, contactos, clases, categorías y ubicación.
        </p>
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
                  <th className="px-4 py-2.5 text-xs font-medium">Correo</th>
                  <th className="px-4 py-2.5 text-xs font-medium">Estado</th>
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
                          <Avatar nombre={p.razon_social} className="h-8 w-8" />
                          <div className="min-w-0">
                            <p className="text-brand-900 font-medium text-sm truncate">
                              {p.nombre_comercial ?? p.razon_social}
                            </p>
                            <p className="text-[12px] text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-brand-900/70">{p.email ?? '—'}</td>
                      <td className="px-4 py-2.5">
                        <Badge tone={estado.tone}>{estado.texto}</Badge>
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

      {proveedorSeleccionado && (
        <ModalDetalleProveedor
          idProveedor={proveedorSeleccionado.id}
          razonSocial={proveedorSeleccionado.razon_social}
          onClose={() => setProveedorSeleccionado(null)}
        />
      )}
    </div>
  );
}

export default function DetalleProveedoresPage() {
  const { esSistemas, esAdmin } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin}>
      <DetalleProveedoresContent />
    </RoleRoute>
  );
}