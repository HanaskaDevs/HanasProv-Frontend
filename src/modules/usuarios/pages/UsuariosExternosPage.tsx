import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import EstadoBadge from '../components/EstadoBadge';
import ModalCrearUsuarioExterno from '../components/ModalCrearUsuarioExterno';
import ModalAgregarEmpresa from '../components/ModalAgregarEmpresa';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { listarExternos, inactivarUsuario, reactivarUsuario, reenviarActivacion, type UsuarioExterno } from '../api/usuariosApi';

function UsuariosExternosContent() {
  const [usuarios, setUsuarios] = useState<UsuarioExterno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaEmpresa, setUsuarioParaEmpresa] = useState<number | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroFicha, setFiltroFicha] = useState('');

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

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto ||
        u.nombre_completo.toLowerCase().includes(texto) ||
        u.email.toLowerCase().includes(texto) ||
        (u.proveedor?.razon_social?.toLowerCase().includes(texto) ?? false);

      const coincideEstado = !filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo);

      const coincideFicha =
        !filtroFicha || (filtroFicha === 'con_ficha' ? u.ficha_completada : !u.ficha_completada);

      return coincideBusqueda && coincideEstado && coincideFicha;
    });
  }, [usuarios, busqueda, filtroEstado, filtroFicha]);

  /**
   * Desbloquea una cuenta que se trabó sola por 3 intentos de login
   * fallidos. Usa el mismo endpoint que "Reactivar": el backend limpia el
   * bloqueo y le manda un código para que defina una contraseña nueva
   * (ver UsuarioService::reactivar).
   */
  async function desbloquear(u: UsuarioExterno) {
    setProcesandoId(u.id);
    try {
      await reactivarUsuario(u.id);
      setMensajeReenvio(`Cuenta desbloqueada. Se envió un código a ${u.email} para que defina una contraseña nueva.`);
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

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

  async function reenviar(u: UsuarioExterno) {
    setReenviandoId(u.id);
    setMensajeReenvio(null);
    try {
      await reenviarActivacion(u.id);
      setMensajeReenvio(`Correo de activación reenviado a ${u.email}.`);
    } finally {
      setReenviandoId(null);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Usuarios externos</h1>
          <p className="text-sm text-brand-900/60 mt-1">Proveedores con acceso al portal.</p>
        </div>
        <Button onClick={() => setModalAbierto(true)}>Nuevo usuario</Button>
      </div>

      {mensajeReenvio && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-2.5 text-sm text-emerald-800 flex items-center justify-between">
          {mensajeReenvio}
          <button onClick={() => setMensajeReenvio(null)} className="text-emerald-700/60 hover:text-emerald-900 ml-4">
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre, proveedor o correo..." />
        <SelectFiltro
          valor={filtroEstado}
          onCambiar={setFiltroEstado}
          opciones={[
            { valor: 'activo', etiqueta: 'Activos' },
            { valor: 'inactivo', etiqueta: 'Inactivos' },
          ]}
          etiquetaTodos="Todos los estados"
        />
        <SelectFiltro
          valor={filtroFicha}
          onCambiar={setFiltroFicha}
          opciones={[
            { valor: 'con_ficha', etiqueta: 'Con ficha' },
            { valor: 'sin_ficha', etiqueta: 'Sin ficha' },
          ]}
          etiquetaTodos="Todas las fichas"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay usuarios externos que coincidan con la búsqueda.
          </p>
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
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-brand-900">
                    {u.proveedor?.razon_social ? (
                      u.proveedor.razon_social
                    ) : u.requiere_activacion ? (
                      <span className="text-brand-900/40 italic">Pendiente de activar</span>
                    ) : (
                      <span className="text-brand-900/40 italic">Ficha sin completar</span>
                    )}
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
                    {u.bloqueado_por_intentos ? (
                      <Badge tone="danger">Bloqueado</Badge>
                    ) : (
                      <EstadoBadge activo={u.activo} requiereActivacion={u.requiere_activacion} />
                    )}
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
                    {u.requiere_activacion && (
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1"
                        isLoading={reenviandoId === u.id}
                        onClick={() => reenviar(u)}
                      >
                        Reenviar activación
                      </Button>
                    )}
                    {/* Bloqueado por intentos fallidos: `activo` sigue en true,
                        así que sin este caso aparte el botón diría "Inactivar"
                        y Sistemas no tendría forma de destrabar la cuenta.
                        Reactivar además le manda un código para que ponga una
                        contraseña nueva (ver UsuarioService::reactivar). */}
                    {u.bloqueado_por_intentos ? (
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 text-emerald-700"
                        isLoading={procesandoId === u.id}
                        onClick={() => desbloquear(u)}
                      >
                        Desbloquear
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        className={`text-xs px-2 py-1 ${u.activo ? 'text-brand-wine' : 'text-emerald-700'}`}
                        isLoading={procesandoId === u.id}
                        onClick={() => alternarEstado(u)}
                      >
                        {u.activo ? 'Inactivar' : 'Reactivar'}
                      </Button>
                    )}
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