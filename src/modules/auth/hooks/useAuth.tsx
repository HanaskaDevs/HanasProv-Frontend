import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import axios from 'axios';
import * as authApi from '../api/authApi';
import { ROLES, type Usuario, type EmpresaAcceso } from '../types';
// En su propio módulo, sin dependencias: si viviera acá, apiClient tendría que
// importar este archivo y se formaría un ciclo que rompe todas las peticiones.
import {
  guardarEmpresaDePestana,
  leerEmpresaDePestana,
  olvidarEmpresaDePestana,
} from '../../../shared/utils/empresaPestana';

interface AuthContextValue {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  idEmpresaActiva: number | null;
  empresaActiva: EmpresaAcceso | null;
  rolActivo: string | null;
  esSistemas: boolean;
  esAdmin: boolean;
  esCompras: boolean;
  esCalidad: boolean;
  esGuardia: boolean;
  esProveedor: boolean;
  puedeGestionarRecepciones: boolean;
  login: (email: string, password: string) => Promise<Usuario>;
  logout: () => Promise<void>;
  cambiarEmpresa: (idEmpresa: number) => Promise<void>;
  refetchUsuario: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [idEmpresaActiva, setIdEmpresaActiva] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function cargarUsuarioActual() {
  const token = localStorage.getItem('token');
  if (!token) {
    setIsLoading(false);
    return;
  }
  try {
    const data = await authApi.me();
    setUsuario(data.usuario);

    // Number() en todo: el driver de SQL Server devuelve estos ids como string
    // ("2" en vez de 2), y una comparación entre tipos distintos nunca casa.
    const disponibles = data.usuario.empresas.map((e) => Number(e.id_empresa));
    const dePestana = leerEmpresaDePestana();
    const delServidor = Number(data.id_empresa_activa) || 0;

    let idElegido = 0;

    if (dePestana && disponibles.includes(dePestana)) {
      // Esta pestaña ya eligió su empresa -> MANDA ella. Esta rama es la que
      // hace que volver a la pestaña (visibilitychange, más abajo) no la
      // arrastre a la empresa que eligió otra pestaña.
      idElegido = dePestana;
    } else if (delServidor && disponibles.includes(delServidor)) {
      // Pestaña nueva: arranca en la última empresa usada.
      idElegido = delServidor;
    } else if (disponibles.length > 0) {
      idElegido = disponibles[0];
      await authApi.cambiarEmpresa(idElegido);
    }

    if (idElegido) {
      guardarEmpresaDePestana(idElegido);
      setIdEmpresaActiva(idElegido);
    }
  } catch (error) {
    // Solo se cierra la sesión de verdad si el backend contestó 401 (el
    // token ya no es válido, p.ej. porque se cerró sesión desde otro
    // lado). Antes esto se hacía para CUALQUIER error, incluido un
    // simple corte de red -> eso es justo lo que pasaba en el celular
    // (reportado como "se me cierra sesión sola al dejarlo un rato"):
    // al volver de background, el `visibilitychange` de abajo dispara
    // este mismo cargarUsuarioActual(), y si en ese instante el celular
    // todavía no había reconectado el wifi/datos, la petición fallaba
    // SIN respuesta del servidor (no es un 401, es que ni llegó) y este
    // catch borraba el token de todas formas, como si la sesión hubiera
    // expirado -> obligaba a loguearse de nuevo con clave y todo. Con
    // el token intacto, el próximo intento (otro visibilitychange, o
    // recargar) entra solo apenas vuelva la conexión.
    const tokenInvalido = axios.isAxiosError(error) && error.response?.status === 401;
    if (tokenInvalido) {
      localStorage.removeItem('token');
      olvidarEmpresaDePestana();
      setUsuario(null);
      setIdEmpresaActiva(null);
    }
  } finally {
    setIsLoading(false);
  }
}

  useEffect(() => {
    cargarUsuarioActual();
  }, []);

  // Si a este usuario le cambian el acceso a una empresa (o el rol) mientras
  // tiene la sesión abierta en otra pestaña/dispositivo, esto refresca sus
  // datos (incluida la lista de empresas) apenas vuelve a esta pestaña, sin
  // que tenga que cerrar sesión y volver a entrar para verlo reflejado.
  useEffect(() => {
    function alVolverALaPestaña() {
      if (document.visibilityState === 'visible' && localStorage.getItem('token')) {
        cargarUsuarioActual();
      }
    }
    document.addEventListener('visibilitychange', alVolverALaPestaña);
    return () => document.removeEventListener('visibilitychange', alVolverALaPestaña);
  }, []);

 async function login(email: string, password: string) {
  const { usuario: usuarioLogueado, token, id_empresa_activa } = await authApi.login(email, password);
  localStorage.setItem('token', token);
  setUsuario(usuarioLogueado);

  // El backend sólo devuelve id_empresa_activa cuando el usuario tiene UNA
  // sola empresa; con varias llega null y hay que elegir la primera.
  let idEmpresa = Number(id_empresa_activa) || 0;

  if (!idEmpresa && usuarioLogueado.empresas.length > 0) {
    idEmpresa = Number(usuarioLogueado.empresas[0].id_empresa);
    await authApi.cambiarEmpresa(idEmpresa);
  }

  if (idEmpresa) {
    guardarEmpresaDePestana(idEmpresa);
  }
  setIdEmpresaActiva(idEmpresa || null);

  return usuarioLogueado;
}

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      olvidarEmpresaDePestana();
      setUsuario(null);
      setIdEmpresaActiva(null);
    }
  }

  /**
   * Cambia la empresa de ESTA pestaña y recarga en la raíz.
   *
   * Va al INICIO DEL DASHBOARD ('/panel') y no a la ruta actual: si estás en
   * /pedidos (visible sólo para proveedores aprobados) y saltas a una empresa
   * donde eres Aspirante, te quedarías dentro de una pantalla que no te
   * corresponde aunque el menú ya no la muestre.
   *
   * OJO: tiene que ser '/panel', NO '/'. La raíz es la LandingPage pública, así
   * que mandar ahí parece que te hubiera cerrado la sesión.
   *
   * Es recarga completa (href) y no navigate() para que TODA la app vuelva a
   * pedir sus datos con la nueva empresa, sin auditar página por página.
   * sessionStorage sobrevive la recarga, así que la pestaña conserva su empresa.
   */
  async function cambiarEmpresa(idEmpresa: number) {
    await authApi.cambiarEmpresa(idEmpresa);
    guardarEmpresaDePestana(idEmpresa);
    window.location.href = '/panel';
  }

  // Comparación con Number() en ambos lados: el driver de SQL Server a
  // veces devuelve columnas numéricas como string ("2" en vez de 2), y una
  // comparación estricta (===) entre tipos distintos nunca coincide -> la
  // empresa activa quedaba sin resolverse aunque el dato fuera correcto.
  const empresaActiva = useMemo(
    () => usuario?.empresas.find((e) => Number(e.id_empresa) === Number(idEmpresaActiva)) ?? null,
    [usuario, idEmpresaActiva]
  );

  const rolActivo = empresaActiva?.nombre_rol ?? null;

  return (
    <AuthContext.Provider
      value={{
        usuario,
        isLoading,
        isAuthenticated: !!usuario,
        idEmpresaActiva,
        empresaActiva,
        rolActivo,
        esSistemas: rolActivo === ROLES.SISTEMAS,
        esAdmin: rolActivo === ROLES.ADMIN,
        esCompras: rolActivo === ROLES.COMPRAS,
        esCalidad: rolActivo === ROLES.CALIDAD,
        esGuardia: rolActivo === ROLES.GUARDIA,
        esProveedor: usuario?.tipo_usuario === 'Proveedor',
        puedeGestionarRecepciones:
          rolActivo === ROLES.SISTEMAS || rolActivo === ROLES.ADMIN || rolActivo === ROLES.COMPRAS,
        login,
        logout,
        cambiarEmpresa,
        refetchUsuario: cargarUsuarioActual,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return context;
}