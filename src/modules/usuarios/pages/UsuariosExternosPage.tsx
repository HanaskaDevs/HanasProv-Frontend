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
import MenuAcciones, { type AccionFila } from '../components/MenuAcciones';
import ModalEnlaceActivacion from '../components/ModalEnlaceActivacion';
import ModalResultadoEnvio from '../components/ModalResultadoEnvio';
import ModalEliminarCuenta from '../components/ModalEliminarCuenta';
import ModalReenvioMasivo from '../components/ModalReenvioMasivo';
import ModalCrearUsuarioExterno from '../components/ModalCrearUsuarioExterno';
import ModalCargaMasivaExternos from '../components/ModalCargaMasivaExternos';
import ModalAgregarEmpresa from '../components/ModalAgregarEmpresa';
import ModalEditarUsuario from '../components/ModalEditarUsuario';
import { isAxiosError } from 'axios';
import {
  listarExternos,
  inactivarUsuario,
  reactivarUsuario,
  reenviarActivacion,
  eliminarCuentaDefinitivamente,
  type ResultadoEnvio,
  type UsuarioExterno,
} from '../api/usuariosApi';

/**
 * ¿A este proveedor se le puede reenviar el código de forma masiva?
 *
 * ES LA MISMA REGLA QUE EL BACKEND (UsuarioService::motivoParaNoReenviar):
 * activo, sin bloqueo, sin activar y sin haber entrado nunca. Acá solo
 * sirve para habilitar la casilla; quien decide de verdad es el servidor,
 * que vuelve a revisar cada uno y reporta los que no califican.
 *
 * Ultimo_Acceso importa además de requiere_activacion: este último vuelve
 * a true cuando a alguien se le reinicia la contraseña, aunque lleve meses
 * usando el portal.
 */
function esPendienteDeActivacion(u: UsuarioExterno): boolean {
  return u.requiere_activacion && !u.ultimo_acceso && u.activo && !u.bloqueado_por_intentos;
}

function UsuariosExternosContent() {
  // La pantalla la ven Sistemas y Admin, pero la carga masiva es solo de
  // Sistemas -> se necesita el rol acá dentro, no solo en el RoleRoute de
  // abajo. Ocultar el botón es comodidad: el backend igual rechaza a quien
  // no sea Sistemas (ver UsuarioService::crearUsuariosProveedorEnLote).
  const { esSistemas, esAdmin } = useAuth();

  const [usuarios, setUsuarios] = useState<UsuarioExterno[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalCargaAbierto, setModalCargaAbierto] = useState(false);
  const [usuarioParaEmpresa, setUsuarioParaEmpresa] = useState<number | null>(null);
  const [usuarioEditando, setUsuarioEditando] = useState<number | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  /*
   * El resultado del último envío de código, para el modal. Guarda además
   * a quién se le mandó: si falló, el modal ofrece reintentar y hay que
   * saber sobre quién.
   */
  const [resultadoEnvio, setResultadoEnvio] = useState<{ resultado: ResultadoEnvio; idUsuario: number } | null>(null);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioExterno | null>(null);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [reenvioMasivoAbierto, setReenvioMasivoAbierto] = useState(false);
  const [usuarioParaEnlace, setUsuarioParaEnlace] = useState<UsuarioExterno | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
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

      const coincideEstado =
        !filtroEstado ||
        (filtroEstado === 'pendiente'
          ? esPendienteDeActivacion(u)
          : filtroEstado === 'activo'
            ? u.activo
            : !u.activo);

      const coincideFicha =
        !filtroFicha || (filtroFicha === 'con_ficha' ? u.ficha_completada : !u.ficha_completada);

      return coincideBusqueda && coincideEstado && coincideFicha;
    });
  }, [usuarios, busqueda, filtroEstado, filtroFicha]);

  /*
   * La selección se calcula SIEMPRE contra los que siguen siendo
   * elegibles en la lista cargada. Si después de reenviar o recargar uno
   * dejó de calificar, no queda seleccionado "fantasma" y el contador no
   * miente.
   */
  const pendientesVisibles = usuariosFiltrados.filter(esPendienteDeActivacion);
  const usuariosSeleccionados = usuarios.filter((u) => seleccionados.has(u.id) && esPendienteDeActivacion(u));
  const todosLosVisiblesSeleccionados =
    pendientesVisibles.length > 0 && pendientesVisibles.every((u) => seleccionados.has(u.id));

  function alternarSeleccion(id: number) {
    setSeleccionados((previos) => {
      const nuevos = new Set(previos);
      if (nuevos.has(id)) nuevos.delete(id);
      else nuevos.add(id);
      return nuevos;
    });
  }

  /** Selecciona o suelta SOLO los pendientes que están a la vista con el filtro actual. */
  function alternarTodosLosVisibles() {
    setSeleccionados((previos) => {
      const nuevos = new Set(previos);
      pendientesVisibles.forEach((u) => (todosLosVisiblesSeleccionados ? nuevos.delete(u.id) : nuevos.add(u.id)));
      return nuevos;
    });
  }

  /**
   * Desbloquea una cuenta que se trabó sola por 3 intentos de login
   * fallidos. Usa el mismo endpoint que "Reactivar": el backend limpia el
   * bloqueo y le manda un código para que defina una contraseña nueva
   * (ver UsuarioService::reactivar).
   */
  async function desbloquear(u: UsuarioExterno) {
    setProcesandoId(u.id);
    try {
      // La cuenta queda desbloqueada pase lo que pase con el correo; lo
      // que el modal informa es si el código llegó a salir.
      const resultado = await reactivarUsuario(u.id);
      setResultadoEnvio({ resultado, idUsuario: u.id });
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
        // Reactivar manda un código nuevo: el resultado se muestra igual
        // que en los demás envíos.
        setResultadoEnvio({ resultado: await reactivarUsuario(u.id), idUsuario: u.id });
      }
      await cargar();
    } finally {
      setProcesandoId(null);
    }
  }

  /**
   * Manda el código y muestra el resultado REAL en un modal.
   *
   * Antes esto ponía siempre "Correo de activación reenviado a X" en una
   * franja verde, sin esperar al servidor: si el envío fallaba después
   * -una dirección mal escrita, el servidor pidiéndonos esperar- nadie se
   * enteraba y el proveedor seguía sin su código. Ahora el backend espera
   * la respuesta y devuelve el texto ya redactado (ver
   * ResultadoEnvioCodigo), así que acá solo se muestra.
   */
  async function reenviar(idUsuario: number) {
    setReenviandoId(idUsuario);
    try {
      const resultado = await reenviarActivacion(idUsuario);
      setResultadoEnvio({ resultado, idUsuario });
    } finally {
      setReenviandoId(null);
    }
  }

  /**
   * Las acciones del menú de cada fila, en el orden en que se usan. Las
   * de tono 'peligro' (inactivar, eliminar) las manda MenuAcciones al
   * final, separadas.
   */
  function accionesDe(u: UsuarioExterno): AccionFila[] {
    const pendiente = esPendienteDeActivacion(u);
    const acciones: AccionFila[] = [
      { etiqueta: 'Editar', icono: 'editar', onClick: () => setUsuarioEditando(u.id) },
      { etiqueta: 'Agregar empresa', icono: 'empresa', onClick: () => setUsuarioParaEmpresa(u.id) },
    ];

    if (u.requiere_activacion) {
      acciones.push({
        etiqueta: 'Reenviar activación',
        icono: 'correo',
        ayuda: 'Por correo, como la primera vez',
        onClick: () => reenviar(u.id),
        cargando: reenviandoId === u.id,
      });
    }

    // Para cuando el correo no le llega: un enlace para mandarle por
    // WhatsApp o desde el Outlook propio. Sistemas y Admin, solo sobre
    // cuentas que nunca se activaron (lo vuelve a validar el backend).
    if ((esSistemas || esAdmin) && pendiente) {
      acciones.push({
        etiqueta: 'Copiar enlace de activación',
        icono: 'enlace',
        ayuda: 'Para mandarlo por WhatsApp o tu correo',
        onClick: () => setUsuarioParaEnlace(u),
      });
    }

    /* Bloqueado por intentos fallidos: `activo` sigue en true, así que sin
       este caso aparte la opción diría "Inactivar" y no habría forma de
       destrabar la cuenta. Desbloquear además le manda un código para que
       ponga una contraseña nueva. */
    if (u.bloqueado_por_intentos) {
      acciones.push({
        etiqueta: 'Desbloquear',
        icono: 'desbloquear',
        tono: 'bien',
        onClick: () => desbloquear(u),
        cargando: procesandoId === u.id,
      });
    } else {
      acciones.push({
        etiqueta: u.activo ? 'Inactivar' : 'Reactivar',
        icono: u.activo ? 'inactivar' : 'activar',
        tono: u.activo ? 'peligro' : 'bien',
        onClick: () => alternarEstado(u),
        cargando: procesandoId === u.id,
      });
    }

    /* Eliminar definitivamente: solo Sistemas y solo cuentas que nunca se
       activaron. Es el caso del correo mal escrito, donde inactivar no
       alcanza porque la dirección queda ocupada igual. */
    if (esSistemas && u.requiere_activacion && !u.ultimo_acceso) {
      acciones.push({
        etiqueta: 'Eliminar definitivamente',
        icono: 'eliminar',
        tono: 'peligro',
        onClick: () => {
          setErrorEliminar(null);
          setUsuarioAEliminar(u);
        },
      });
    }

    return acciones;
  }

  /**
   * Borrado DEFINITIVO. Las reglas de cuándo se puede las decide el
   * backend (solo Sistemas, solo cuentas sin activar, sin información
   * asociada); acá solo se muestra el resultado. Esconder la opción es
   * comodidad, no seguridad.
   */
  async function eliminarCuenta() {
    if (!usuarioAEliminar) return;

    setEliminando(true);
    setErrorEliminar(null);
    try {
      await eliminarCuentaDefinitivamente(usuarioAEliminar.id);
      setUsuarioAEliminar(null);
      await cargar();
    } catch (error) {
      const datos = isAxiosError(error)
        ? (error.response?.data as { message?: string } | undefined)
        : undefined;
      setErrorEliminar(datos?.message ?? 'No se pudo eliminar la cuenta.');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-brand-900">Usuarios externos</h1>
          <p className="text-sm text-brand-900/60 mt-1">Proveedores con acceso al portal.</p>
        </div>
        <div className="flex items-center gap-2">
          {esSistemas && (
            <Button variant="secondary" onClick={() => setModalCargaAbierto(true)}>
              Carga masiva (Excel)
            </Button>
          )}
          <Button onClick={() => setModalAbierto(true)}>Nuevo usuario</Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por nombre, proveedor o correo..." />
        <SelectFiltro
          valor={filtroEstado}
          onCambiar={setFiltroEstado}
          opciones={[
            { valor: 'activo', etiqueta: 'Activos' },
            { valor: 'inactivo', etiqueta: 'Inactivos' },
            // Pensado para el reenvío masivo: filtrar y "seleccionar
            // todos" deja listos de un clic a los que nunca entraron.
            { valor: 'pendiente', etiqueta: 'Pendientes de activar' },
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

      {/* Barra de acción masiva. Aparece solo con algo seleccionado, así
          no ocupa lugar el resto del tiempo. */}
      {esSistemas && usuariosSeleccionados.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-700/20 bg-brand-200/40 px-4 py-2.5">
          <p className="text-sm text-brand-900">
            <strong>{usuariosSeleccionados.length}</strong> proveedor
            {usuariosSeleccionados.length === 1 ? '' : 'es'} pendiente
            {usuariosSeleccionados.length === 1 ? '' : 's'} de activar seleccionado
            {usuariosSeleccionados.length === 1 ? '' : 's'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" className="text-xs" onClick={() => setSeleccionados(new Set())}>
              Limpiar selección
            </Button>
            <Button onClick={() => setReenvioMasivoAbierto(true)}>Reenviar código de activación</Button>
          </div>
        </div>
      )}

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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* El encabezado queda fijo al hacer scroll: con cientos de
                  proveedores, a media lista ya no se sabía qué columna era
                  cuál. */}
              <thead className="sticky top-0 z-10 bg-brand-200/40 text-left text-xs uppercase tracking-wide text-brand-900/60 backdrop-blur">
                <tr>
                  {/* La columna de casillas solo existe para Sistemas: el
                      reenvío masivo es suyo, igual que la carga por Excel. */}
                  {esSistemas && (
                    <th className="w-10 py-2.5 pl-4">
                      <input
                        type="checkbox"
                        checked={todosLosVisiblesSeleccionados}
                        disabled={pendientesVisibles.length === 0}
                        onChange={alternarTodosLosVisibles}
                        aria-label="Seleccionar todos los pendientes de activar"
                        title={
                          pendientesVisibles.length === 0
                            ? 'No hay proveedores pendientes de activar en esta lista'
                            : 'Seleccionar todos los pendientes de activar de esta lista'
                        }
                        className="h-4 w-4 cursor-pointer accent-brand-700 disabled:cursor-not-allowed"
                      />
                    </th>
                  )}
                  <th className="px-4 py-2.5 font-medium">Proveedor</th>
                  <th className="px-4 py-2.5 font-medium w-44">Ficha</th>
                  <th className="px-4 py-2.5 font-medium w-40">Estado</th>
                  <th className="px-4 py-2.5 font-medium w-40">Último acceso</th>
                  <th className="px-4 py-2.5 font-medium w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-900/[0.07]">
                {usuariosFiltrados.map((u) => {
                  const porcentaje = u.proveedor?.porcentaje_completado_ficha ?? 0;

                  return (
                    <tr
                      key={u.id}
                      className={`transition-colors ${
                        seleccionados.has(u.id) && esPendienteDeActivacion(u)
                          ? 'bg-brand-200/30'
                          : 'hover:bg-brand-200/20'
                      }`}
                    >
                      {esSistemas && (
                        <td className="w-10 py-2.5 pl-4">
                          {/* Deshabilitada (no escondida) para quien no
                              califica: así se entiende por qué no se puede
                              elegir, en vez de preguntarse dónde está. */}
                          <input
                            type="checkbox"
                            checked={seleccionados.has(u.id) && esPendienteDeActivacion(u)}
                            disabled={!esPendienteDeActivacion(u)}
                            onChange={() => alternarSeleccion(u.id)}
                            aria-label={`Seleccionar ${u.email}`}
                            title={
                              esPendienteDeActivacion(u)
                                ? 'Seleccionar para reenviar el código'
                                : 'Solo se puede reenviar a quien nunca activó su cuenta'
                            }
                            className="h-4 w-4 cursor-pointer accent-brand-700 disabled:cursor-not-allowed disabled:opacity-30"
                          />
                        </td>
                      )}
                      {/* Razón social y correo en una sola celda: antes eran
                          dos columnas y la primera repetía el mismo
                          "Pendiente de activar" que ya decía la insignia de
                          Estado, gastando el ancho en decir dos veces lo
                          mismo. */}
                      <td className="px-4 py-2.5">
                        <p className="font-medium text-brand-900 truncate max-w-xs">
                          {u.proveedor?.razon_social ?? (
                            <span className="font-normal text-brand-900/35">Todavía sin ficha</span>
                          )}
                        </p>
                        <a
                          href={`mailto:${u.email}`}
                          className="text-xs text-brand-900/55 hover:text-brand-700 hover:underline"
                        >
                          {u.email}
                        </a>
                      </td>

                      {/* Una barra en vez de una insignia: el avance de la
                          ficha es un número de 0 a 100 y así se compara de
                          un vistazo entre filas. */}
                      <td className="px-4 py-2.5">
                        {u.ficha_completada || porcentaje > 0 ? (
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-20 rounded-full bg-brand-900/10 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  porcentaje >= 100 ? 'bg-emerald-500' : 'bg-brand-700'
                                }`}
                                style={{ width: `${Math.min(100, porcentaje)}%` }}
                              />
                            </div>
                            <span className="text-xs tabular-nums text-brand-900/60">{porcentaje}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-brand-900/35">Sin ficha</span>
                        )}
                      </td>

                      <td className="px-4 py-2.5">
                        {u.bloqueado_por_intentos ? (
                          <Badge tone="danger">Bloqueado</Badge>
                        ) : (
                          <EstadoBadge activo={u.activo} requiereActivacion={u.requiere_activacion} />
                        )}
                      </td>

                      {/* Dato que ya venía del backend y no se mostraba. Es
                          lo que distingue a un proveedor que nunca entró de
                          uno que dejó de entrar. */}
                      <td className="px-4 py-2.5 text-xs text-brand-900/55">
                        {u.ultimo_acceso ? (
                          new Date(u.ultimo_acceso).toLocaleDateString('es-EC', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        ) : (
                          <span className="text-brand-900/35">Nunca ingresó</span>
                        )}
                      </td>

                      <td className="px-4 py-2.5 text-right">
                        <MenuAcciones acciones={accionesDe(u)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {!isLoading && usuariosFiltrados.length > 0 && (
        <p className="text-xs text-brand-900/45">
          {usuariosFiltrados.length === usuarios.length
            ? `${usuarios.length} usuario(s)`
            : `${usuariosFiltrados.length} de ${usuarios.length} usuario(s)`}
        </p>
      )}

      {modalAbierto && (
        <ModalCrearUsuarioExterno
          onClose={() => setModalAbierto(false)}
          onCreado={(envio) => {
            cargar();
            // El usuario ya quedó creado; lo que el modal informa es si el
            // código de activación salió o no.
            setResultadoEnvio({ resultado: envio, idUsuario: 0 });
          }}
        />
      )}

      {modalCargaAbierto && (
        <ModalCargaMasivaExternos onClose={() => setModalCargaAbierto(false)} onCargado={cargar} />
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

      {usuarioParaEnlace && (
        <ModalEnlaceActivacion
          correo={usuarioParaEnlace.email}
          idUsuario={usuarioParaEnlace.id}
          onCerrar={() => setUsuarioParaEnlace(null)}
        />
      )}

      {reenvioMasivoAbierto && (
        <ModalReenvioMasivo
          usuarios={usuariosSeleccionados}
          onCerrar={() => setReenvioMasivoAbierto(false)}
          onTerminado={() => {
            // Ya se mandaron: la selección no tiene más sentido, y si se
            // dejara, un segundo clic les volvería a mandar el código.
            setSeleccionados(new Set());
            cargar();
          }}
        />
      )}

      {usuarioAEliminar && (
        <ModalEliminarCuenta
          correo={usuarioAEliminar.email}
          eliminando={eliminando}
          error={errorEliminar}
          onConfirmar={eliminarCuenta}
          onCerrar={() => {
            setUsuarioAEliminar(null);
            setErrorEliminar(null);
          }}
        />
      )}

      {resultadoEnvio && (
        <ModalResultadoEnvio
          resultado={resultadoEnvio.resultado}
          onCerrar={() => setResultadoEnvio(null)}
          // Reintentar solo tiene sentido sobre un usuario concreto: en el
          // alta no se guarda el id, así que ahí el modal solo informa.
          onReintentar={
            resultadoEnvio.idUsuario > 0 ? () => reenviar(resultadoEnvio.idUsuario) : undefined
          }
          reintentando={reenviandoId === resultadoEnvio.idUsuario}
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