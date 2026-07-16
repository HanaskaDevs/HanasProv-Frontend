import { type ReactNode, useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { obtenerMenu } from '../config/menuConfig';
import LogoLink from '../components/LogoLink';
import Avatar from '../components/Avatar';
import ModalCambiarPassword from '../../modules/auth/components/ModalCambiarPassword';
import * as fichaApi from '../../modules/miFicha/api/fichaApi';
import GuiaInicioTour from '../components/GuiaInicioTour';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { usuario, empresaActiva, rolActivo, esProveedor, cambiarEmpresa, logout } = useAuth();
  const navigate = useNavigate();
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [cambiandoEmpresa, setCambiandoEmpresa] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);

  const claveTour = usuario ? `tour_completado_${usuario.id}` : null;

  useEffect(() => {
    if (usuario?.tipo_usuario === 'Proveedor' && claveTour && localStorage.getItem(claveTour) !== 'true') {
      setTourVisible(true);
    }
  }, [usuario, claveTour]);

  useEffect(() => {
    function abrirTour() {
      setTourVisible(true);
    }
    window.addEventListener('guia-inicio:abrir', abrirTour);
    return () => window.removeEventListener('guia-inicio:abrir', abrirTour);
  }, []);

  function cerrarTour() {
    setTourVisible(false);
    if (claveTour) localStorage.setItem(claveTour, 'true');
  }

  // Solo nos interesa para decidir qué mostrar en el menú -> se pide acá
  // (no en cada página) para que la restricción aplique en TODA la app
  // consistentemente. Comparte queryKey con MiFichaPage/PanelProveedor,
  // así que React Query lo cachea entre ellos y no duplica la llamada.
  const { data: ficha, isLoading: cargandoFicha } = useQuery({
    queryKey: ['mi-ficha'],
    queryFn: fichaApi.obtenerMiFicha,
    enabled: esProveedor,
    retry: false,
  });

  // Mientras no sepamos el estado (recién cargando), asumimos Aspirante
  // -> es más seguro mostrar de menos y luego expandir el menú, que
  // mostrar de más un instante y después ocultarlo (se ve como un bug).
  const esAspirante = !esProveedor ? false : cargandoFicha || ficha?.estado === 'Aspirante';

  async function handleCambiarEmpresa(idEmpresa: number) {
    setCambiandoEmpresa(true);
    try {
      await cambiarEmpresa(idEmpresa);
      // Recarga completa a propósito: garantiza que TODA la app (Mi Ficha,
      // Documentos, Productos, etc.) vuelva a pedir sus datos frescos para
      // la nueva empresa activa, sin tener que auditar cada página.
      window.location.reload();
    } catch {
      setCambiandoEmpresa(false);
      alert('No se pudo cambiar de empresa. Intenta de nuevo.');
    }
  }

  const menu = obtenerMenu(rolActivo, usuario?.tipo_usuario ?? 'Interno', esAspirante);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-200/10">
      <header className="bg-brand-900 text-white shrink-0">
        <div className="flex items-center justify-between px-6 py-3">
          <LogoLink className="h-12" variant="light" />

          <div className="flex items-center gap-4">
            {usuario && usuario.empresas.length > 1 && (
              <select
                value={empresaActiva ? String(empresaActiva.id_empresa) : ''}
                onChange={(e) => handleCambiarEmpresa(Number(e.target.value))}
                disabled={cambiandoEmpresa}
                className="bg-white/10 text-white text-sm rounded-md px-3 py-1.5 border border-white/20"
              >
                {usuario.empresas.map((e) => (
                  <option key={e.id_empresa} value={String(e.id_empresa)} className="text-brand-900">
                    {e.nombre_comercial ?? e.razon_social}
                  </option>
                ))}
              </select>
            )}

            <div
              className="relative"
              onMouseEnter={() => setMenuUsuarioAbierto(true)}
              onMouseLeave={() => setMenuUsuarioAbierto(false)}
            >
              <button className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
                <Avatar nombre={usuario?.nombre_completo ?? '?'} />
                <span className="text-sm text-white/80 hidden md:inline">{usuario?.nombre_completo}</span>
                <span className="text-xs text-white/50">▾</span>
              </button>

              {menuUsuarioAbierto && (
                <div className="absolute right-0 top-full bg-white rounded-md shadow-lg border border-brand-900/10 py-1 min-w-[200px] z-20">
                  <button
                    onClick={() => setModalPasswordAbierto(true)}
                    className="w-full text-left px-4 py-2 text-sm text-brand-900/80 hover:bg-brand-200/30"
                  >
                    Cambiar contraseña
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-brand-wine hover:bg-brand-200/30"
                  >
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <nav className="flex items-center justify-center gap-1 px-6 border-t border-white/10">
          {menu.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setMenuAbierto(item.label)}
                onMouseLeave={() => setMenuAbierto(null)}
              >
                <button className="px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white rounded-md hover:bg-white/5 transition-colors">
                  {item.label} <span className="ml-1 text-xs">▾</span>
                </button>

                {menuAbierto === item.label && (
                  <div className="absolute left-0 top-full bg-white rounded-md shadow-lg border border-brand-900/10 py-1 min-w-[200px] z-20">
                    {item.children.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        className={({ isActive }) =>
                          `block px-4 py-2 text-sm ${
                            isActive ? 'text-brand-700 font-medium bg-brand-200/20' : 'text-brand-900/80'
                          } hover:bg-brand-200/30`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.label}
                to={item.to!}
                id={
                  item.to === '/mi-ficha'
                    ? 'tour-mi-ficha'
                    : item.to === '/documentos'
                      ? 'tour-documentacion'
                      : item.to === '/productos'
                        ? 'tour-productos'
                        : undefined
                }
                className={({ isActive }) =>
                  `px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`
                }
              >
                {item.label}
              </NavLink>
            )
          )}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto p-8">{children}</main>

      {modalPasswordAbierto && <ModalCambiarPassword onClose={() => setModalPasswordAbierto(false)} />}

      <GuiaInicioTour visible={tourVisible} onCerrar={cerrarTour} />
    </div>
  );
}