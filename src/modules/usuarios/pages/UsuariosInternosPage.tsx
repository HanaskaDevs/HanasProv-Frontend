import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import EstadoBadge from '../components/EstadoBadge';
import ModalCrearUsuarioInterno from '../components/ModalCrearUsuarioInterno';
import ModalAgregarEmpresa from '../components/ModalAgregarEmpresa';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { listarInternos, inactivarUsuario, reactivarUsuario, reenviarActivacion, type UsuarioInterno } from '../api/usuariosApi';

function UsuariosInternosContent() {
  const [usuarios, setUsuarios] = useState<UsuarioInterno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [usuarioParaEmpresa, setUsuarioParaEmpresa] = useState<number | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  const [mensajeReenvio, setMensajeReenvio] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const cargar = useCallback(async (silenciosa = false) => {
    if (!silenciosa) setIsLoading(true);
    try {
      const data = await listarInternos();
      setUsuarios(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const rolesDisponibles = useMemo(() => {
    const nombres = new Set(usuarios.map((u) => u.rol?.nombre_rol).filter((n): n is string => !!n));
    return Array.from(nombres).map((n) => ({ valor: n, etiqueta: n }));
  }, [usuarios]);

  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto || u.nombre_completo.toLowerCase().includes(texto) || u.email.toLowerCase().includes(texto);

      const coincideRol = !filtroRol || u.rol?.nombre_rol === filtroRol;

      const coincideEstado = !filtroEstado || (filtroEstado === 'activo' ? u.activo : !u.activo);

      return coincideBusqueda && coincideRol && coincideEstado;
    });
  }, [usuarios, busqueda, filtroRol, filtroEstado]);

  async function alternarEstado(u: UsuarioInterno) {
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

  async function reenviar(u: UsuarioInterno) {
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
          <h1 className="font-display text-2xl font-semibold text-brand-900">Usuarios internos</h1>
          <p className="text-sm text-brand-900/60 mt-1">Staff con acceso al sistema (Sistemas, Admin, Calidad, Compras).</p>
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
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre o correo..." />
        <SelectFiltro
          valor={filtroRol}
          onCambiar={setFiltroRol}
          opciones={rolesDisponibles}
          etiquetaTodos="Todos los roles"
        />
        <SelectFiltro
          valor={filtroEstado}
          onCambiar={setFiltroEstado}
          opciones={[
            { valor: 'activo', etiqueta: 'Activos' },
            { valor: 'inactivo', etiqueta: 'Inactivos' },
          ]}
          etiquetaTodos="Todos los estados"
        />
      </div>

      <Card className="p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : usuariosFiltrados.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay usuarios internos que coincidan con la búsqueda.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-brand-200/30 text-left text-brand-900/70">
              <tr>
                <th className="px-4 py-3 font-medium">Nombre</th>
                <th className="px-4 py-3 font-medium">Correo</th>
                <th className="px-4 py-3 font-medium">Rol</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-900/8">
              {usuariosFiltrados.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-brand-900">
                    {u.requiere_activacion ? (
                      <span className="text-brand-900/40 italic">Pendiente de activar</span>
                    ) : (
                      u.nombre_completo
                    )}
                  </td>
                  <td className="px-4 py-3 text-brand-900/70">{u.email}</td>
                  <td className="px-4 py-3 text-brand-900/70">{u.rol?.nombre_rol ?? '—'}</td>
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
        <ModalCrearUsuarioInterno onClose={() => setModalAbierto(false)} onCreado={cargar} />
      )}

      {usuarioParaEmpresa !== null && (
        <ModalAgregarEmpresa
          idUsuario={usuarioParaEmpresa}
          esInterno
          onClose={() => setUsuarioParaEmpresa(null)}
          onAgregado={cargar}
        />
      )}

      {usuarioEditando !== null && (
        <ModalEditarUsuario
          idUsuario={usuarioEditando}
          esInterno
          onClose={() => setUsuarioEditando(null)}
          onActualizado={() => cargar(true)}
        />
      )}
    </div>
  );
}

export default function UsuariosInternosPage() {
  const { esSistemas } = useAuth();

  return (
    <RoleRoute allow={esSistemas}>
      <UsuariosInternosContent />
    </RoleRoute>
  );
}