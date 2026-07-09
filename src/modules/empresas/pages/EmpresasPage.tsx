import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as empresasApi from '../api/empresasApi';
import type { Empresa } from '../types';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import ModalEmpresa from '../components/ModalEmpresa';

export default function EmpresasPage() {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [empresaEditando, setEmpresaEditando] = useState<Empresa | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['empresas'],
    queryFn: empresasApi.listarEmpresas,
  });

  const inactivar = useMutation({
    mutationFn: empresasApi.inactivarEmpresa,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
  });

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Empresas</h1>
          <p className="text-brand-900/60 text-sm mt-1">Empresas del grupo Hanaska registradas en el portal.</p>
        </div>
        <Button onClick={abrirNueva}>+ Nueva empresa</Button>
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
            {data?.map((empresa) => (
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
                  {empresa.activo && (
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1 text-brand-wine"
                      isLoading={inactivar.isPending}
                      onClick={() => inactivar.mutate(empresa.id_empresa)}
                    >
                      Inactivar
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {data?.length === 0 && (
          <p className="text-sm text-brand-900/60 text-center py-10">Todavía no hay empresas registradas.</p>
        )}
      </Card>

      {modalAbierto && <ModalEmpresa empresa={empresaEditando} onClose={() => setModalAbierto(false)} />}
    </div>
  );
}