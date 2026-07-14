import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import * as authApi from '../api/authApi';
import { ROLES, type Usuario, type EmpresaAcceso } from '../types';

interface AuthContextValue {
  usuario: Usuario | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  idEmpresaActiva: number | null;
  empresaActiva: EmpresaAcceso | null;
  rolActivo: string | null;
  esSistemas: boolean;
  esAdmin: boolean;
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

    if (data.id_empresa_activa) {
      setIdEmpresaActiva(data.id_empresa_activa);
    } else if (data.usuario.empresas.length > 0) {
      const primeraEmpresa = data.usuario.empresas[0].id_empresa;
      await authApi.cambiarEmpresa(primeraEmpresa);
      setIdEmpresaActiva(primeraEmpresa);
    }
  } catch {
    localStorage.removeItem('token');
    setUsuario(null);
    setIdEmpresaActiva(null);
  } finally {
    setIsLoading(false);
  }
}

  useEffect(() => {
    cargarUsuarioActual();
  }, []);

 async function login(email: string, password: string) {
  const { usuario: usuarioLogueado, token, id_empresa_activa } = await authApi.login(email, password);
  localStorage.setItem('token', token);
  setUsuario(usuarioLogueado);

  if (id_empresa_activa) {
    setIdEmpresaActiva(id_empresa_activa);
  } else if (usuarioLogueado.empresas.length > 0) {
    const primeraEmpresa = usuarioLogueado.empresas[0].id_empresa;
    await authApi.cambiarEmpresa(primeraEmpresa);
    setIdEmpresaActiva(primeraEmpresa);
  }

  return usuarioLogueado;
}

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem('token');
      setUsuario(null);
      setIdEmpresaActiva(null);
    }
  }

  async function cambiarEmpresa(idEmpresa: number) {
    const { id_empresa_activa } = await authApi.cambiarEmpresa(idEmpresa);
    setIdEmpresaActiva(id_empresa_activa);
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