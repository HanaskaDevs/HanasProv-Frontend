import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import EstadoBadge from '../components/EstadoBadge';
import ModalCrearUsuarioExterno from '../components/ModalCrearUsuarioExterno';
import ModalAgregarEmpresa from '../components/ModalAgregarEmpresa';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { listarExternos, inactivarUsuario, reactivarUsuario, type UsuarioExterno } from '../api/usuariosApi';

function UsuariosExternosContent() {
  const [usuarios, setUsuarios] = useState<UsuarioExterno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaEmpresa, setUsuarioParaEmpresa] = useState<number | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await listarExternos();
      setUsuarios(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function alternarEstado(u: UsuarioExterno) {
    setProcesandoId(u.id);
    try {
      if (u.activo) {
        await inactivarUsuario(u.id);
      } else {
        await reactivarUsuario(u.id);
      }
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Usuarios externos</h1>
          <p className="text-sm text-brand-900/60 mt-1">Proveedores con acceso al portal.</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>Nuevo usuario</Button>
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : usuarios.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">Todavía no hay usuarios externos creados.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-200/30 text-left text-brand-900/70">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre / Proveedor</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Ficha</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {usuarios.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-brand-900">
                    {u.proveedor?.razon_social ?? u.nombre_completo}
                  </td>
                  <td className="px-4 py-3 text-brand-900/70">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.ficha_completada ? (
                      <Badge tone="info">{u.proveedor?.porcentaje_completado_ficha ?? 0}% completo</Badge>
                    ) : (
                      <Badge tone="neutral">Sin ficha</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <EstadoBadge activo={u.activo} requiereActivacion={u.requiere_activacion} />
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setUsuarioEditando(u.id)}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-xs px-2 py-1"
                      onClick={() => setUsuarioParaEmpresa(u.id)}
                    >
                      + Empresa
                    </Button>
                    <Button
                      variant="ghost"
                      className={`text-xs px-2 py-1 ${u.activo ? 'text-brand-wine' : 'text-emerald-700'}`}
                      isLoading={procesandoId === u.id}
                      onClick={() => alternarEstado(u)}
                    >
                      {u.activo ? 'Inactivar' : 'Reactivar'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {modalAbierto && (
        <ModalCrearUsuarioExterno onClose={() => setModalAbierto(false)} onCreado={cargar} />
      )}

      {usuarioParaEmpresa !== null && (
        <ModalAgregarEmpresa
          idUsuario={usuarioParaEmpresa}
          esInterno={false}
          onClose={() => setUsuarioParaEmpresa(null)}
          onAgregado={cargar}
        />
      )}

      {usuarioEditando !== null && (
        <ModalEditarUsuario
          idUsuario={usuarioEditando}
          esInterno={false}
          onClose={() => setUsuarioEditando(null)}
          onActualizado={cargar}
        />
      )}
    </div>
  );
}

export default function UsuariosExternosPage() {
  const { esSistemas, esAdmin } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin}>
      <UsuariosExternosContent />
    </RoleRoute>
  );
}