import { useMemo, useState } from 'react';
import RoleRoute from '../../../routes/RoleRoute';
import { useAuth } from '../../auth/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as empresasApi from '../api/empresasApi';
import type { Empresa } from '../types';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import ModalEmpresa from '../components/ModalEmpresa';

function EmpresasPageContenido() {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.listarEmpresas,
  });

  const inactivar = useMutation({
    mutationFn: empresasApi.inactivarEmpresa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
  });

  const activar = useMutation({
    mutationFn: empresasApi.activarEmpresa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
  });

  const empresasFiltradas = useMemo(() => {
    return (data ?? []).filter((e) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto ||
        e.razon_social.toLowerCase().includes(texto) ||
        e.ruc.includes(texto) ||
        (e.nombre_comercial?.toLowerCase().includes(texto) ?? false);

      const coincideEstado = !filtroEstado || (filtroEstado === 'activa' ? e.activo : !e.activo);

      return coincideBusqueda && coincideEstado;
    });
  }, [data, busqueda, filtroEstado]);

  function abrirNueva() {
    setEmpresaEditando(null);
    setModalAbierto(true);
  }

  function abrirEditar(empresa: Empresa) {
    setEmpresaEditando(empresa);
    setModalAbierto(true);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Empresas</h1>
          <p className="text-brand-900/60 text-sm mt-1">Empresas del grupo Hanaska registradas en el portal.</p>
        </div>
        <Button onClick={abrirNueva}>+ Nueva empresa</Button>
      </div>

      <div className="flex items-center gap-3">
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por razón social o RUC..." />
        <SelectFiltro
          valor={filtroEstado}
          onCambiar={setFiltroEstado}
          opciones={[
            { valor: 'activa', etiqueta: 'Activas' },
            { valor: 'inactiva', etiqueta: 'Inactivas' },
          ]}
          etiquetaTodos="Todos los estados"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-brand-200/20 text-brand-900/70 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Razón social</th>
              <th className="px-4 py-3 font-medium">RUC</th>
              <th className="px-4 py-3 font-medium">Nombre comercial</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {empresasFiltradas.map((empresa) => (
              <tr key={empresa.id_empresa} className="border-t border-brand-900/8">
                <td className="px-4 py-3 text-brand-900">{empresa.razon_social}</td>
                <td className="px-4 py-3 text-brand-900/70">{empresa.ruc}</td>
                <td className="px-4 py-3 text-brand-900/70">{empresa.nombre_comercial ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={empresa.activo ? 'success' : 'neutral'}>
                    {empresa.activo ? 'Activa' : 'Inactiva'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => abrirEditar(empresa)}>
                    Editar
                  </Button>
                  {empresa.activo ? (
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1 text-brand-wine"
                      isLoading={inactivar.isPending}
                      onClick={() => inactivar.mutate(empresa.id_empresa)}
                    >
                      Inactivar
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1 text-emerald-700"
                      isLoading={activar.isPending}
                      onClick={() => activar.mutate(empresa.id_empresa)}
                    >
                      Activar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {empresasFiltradas.length === 0 && (
          <p className="text-sm text-brand-900/60 text-center py-10">No hay empresas que coincidan con la búsqueda.</p>
        )}
      </Card>

      {modalAbierto && <ModalEmpresa empresa={empresaEditando} onClose={() => setModalAbierto(false)} />}
    </div>
  );
}

/**
 * Solo Sistemas. El backend ya lo exige (esSistemasGlobal en cada endpoint),
 * pero sin esta guarda el resto de los roles llegaba a la pantalla por URL
 * directa y la veía dibujada, chocando después contra 403 en cada acción. El
 * caso concreto que lo destapó: la tarjeta "Empresas activas" del panel de
 * Inicio enlazaba a /empresas y también se le mostraba al Admin.
 */
export default function EmpresasPage() {
  const { esSistemas } = useAuth();

  return (
    <RoleRoute allow={esSistemas}>
      <EmpresasPageContenido />
    </RoleRoute>
  );
}
