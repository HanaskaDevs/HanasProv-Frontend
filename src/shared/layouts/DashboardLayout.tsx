import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { obtenerMenu } from '../config/menuConfig';
import LogoLink from '../components/LogoLink';
import Avatar from '../components/Avatar';
import ModalCambiarPassword from '../../modules/auth/components/ModalCambiarPassword';
import * as fichaApi from '../../modules/miFicha/api/fichaApi';
import GuiaInicioTour from '../components/GuiaInicioTour';
import type { GuiaPasoPublico } from '../api/publicConfigApi';
import HanaBot from '../components/HanaBot';
import Footer from '../components/Footer';

function IconoFicha({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function IconoCarpeta({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function IconoCandado({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IconoSalir({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function IconoEmpresa({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="4" y="2" width="16" height="20" rx="1" />
      <path d="M9 22v-4h6v4M9 6h.01M9 10h.01M9 14h.01M15 6h.01M15 10h.01M15 14h.01" />
    </svg>
  );
}

// Tour para el proveedor YA APROBADO -> apunta a lo que se le acaba de
// habilitar (Pedidos, Reclamos), no a Ficha/Documentación (ya las
// completó y aprobó hace rato, y de hecho ya ni están en el menú de
// arriba, se mudaron al dropdown del usuario). A diferencia del tour
// del aspirante, este queda fijo acá en vez de salir de Guia_Paso -> no
// tiene sentido mezclarlo con la pantalla de configuración pensada para
// la guía de onboarding.
const PASOS_PROVEEDOR_APROBADO: GuiaPasoPublico[] = [
  {
    Target_Id: 'tour-productos',
    Titulo: 'Mis Productos',
    Texto: 'Administre su catálogo desde aquí: agregue nuevos productos, revise su estado de calificación y corrija lo que el equipo rechace.',
  },
  {
    Target_Id: 'tour-calificacion',
    Titulo: 'Calificación',
    Texto: 'Consulte el estado de su ficha, documentación y productos frente al equipo de Hanaska.',
  },
  {
    Target_Id: 'tour-pedidos',
    Titulo: 'Pedidos',
    Texto: 'Sus pedidos de compra abiertos y cerrados, con sus fechas de entrega esperadas.',
  },
  {
    Target_Id: 'tour-reclamos',
    Titulo: 'Reclamos',
    Texto: 'Consulte y responda aquí los reclamos que le haga llegar el equipo de Hanaska.',
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { usuario, empresaActiva, idEmpresaActiva, rolActivo, esProveedor, cambiarEmpresa, logout } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [cambiandoEmpresa, setCambiandoEmpresa] = useState(false);
  const [tourVisible, setTourVisible] = useState(false);

  // Clave por usuario Y EMPRESA. El mismo proveedor puede ser Aspirante en una
  // empresa y llevar meses Aprobado en otra; con una sola clave por usuario,
  // cerrar el tour en una lo apagaba en todas, y al revés: aparecía en la
  // empresa donde ya venía trabajando desde antes.
  const claveTour =
    usuario && idEmpresaActiva ? `tour_completado_${usuario.id}_emp${idEmpresaActiva}` : null;

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
  // Comparación normalizada (sin mayúsculas/espacios) a propósito:
  // "estado" viene de Nombre_Estado en la tabla Estado_Proveedor, un
  // campo de texto libre editable desde el backend -> un espacio de más
  // o un casing distinto ahí adentro ("aspirante", "Aspirante ") ya
  // rompía la comparación estricta y dejaba el menú completo visible
  // para un proveedor que en realidad seguía siendo Aspirante.
  const esAspirante = !esProveedor ? false : cargandoFicha || ficha?.estado?.trim().toLowerCase() === 'aspirante';

  useEffect(() => {
    // El tour se abre solo ÚNICAMENTE para el Aspirante, que es quien necesita
    // que le expliquen los pasos. Al proveedor ya Aprobado no se le interrumpe:
    // su tour (PASOS_PROVEEDOR_APROBADO) sigue disponible bajo demanda desde el
    // botón "Guía de inicio" del panel y desde HanaBot, pero no salta solo.
    if (!claveTour) return;
    if (usuario?.tipo_usuario !== 'Proveedor') return;
    // Hay que esperar el dato real de la ficha: mientras carga, esAspirante
    // viene forzado a true, y decidir antes se lo mostraba a todos un instante.
    if (cargandoFicha) return;
    if (!esAspirante) return;
    if (localStorage.getItem(claveTour) === 'true') return;

    setTourVisible(true);
  }, [usuario, claveTour, esAspirante, cargandoFicha]);

  async function handleCambiarEmpresa(idEmpresa: number) {
    setCambiandoEmpresa(true);
    try {
      // cambiarEmpresa() ya guarda la empresa de esta pestaña y recarga en la
      // raíz. Antes acá había un reload() de la MISMA URL: si estabas en
      // /pedidos y saltabas a una empresa donde eres Aspirante, seguías ahí.
      await cambiarEmpresa(idEmpresa);
    } catch {
      setCambiandoEmpresa(false);
      alert('No se pudo cambiar de empresa. Intenta de nuevo.');
    }
  }

  const menu = obtenerMenu(rolActivo, usuario?.tipo_usuario ?? 'Interno', esAspirante);
  const [conScroll, setConScroll] = useState(false);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-200/10">
      <header className="bg-brand-900 text-white shrink-0 transition-all duration-300">
        <div className={`flex items-center justify-between pl-10 pr-6 transition-all duration-300 ${conScroll ? 'py-1' : 'py-2'}`}>
          <LogoLink className={`transition-all duration-300 ${conScroll ? 'h-12' : 'h-20'}`} variant="light" />

          <div className="flex items-center gap-4">
            {usuario && usuario.empresas.length > 1 ? (
              <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 border border-white/20">
                <IconoEmpresa className="text-white/60 shrink-0" />
                <select
                  value={empresaActiva ? String(empresaActiva.id_empresa) : ''}
                  onChange={(e) => handleCambiarEmpresa(Number(e.target.value))}
                  disabled={cambiandoEmpresa}
                  className="bg-transparent text-white text-sm focus:outline-none"
                >
                  {usuario.empresas.map((e) => (
                    <option key={e.id_empresa} value={String(e.id_empresa)} className="text-brand-900">
                      {e.nombre_comercial ?? e.razon_social}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              empresaActiva && (
                <div className="flex items-center gap-2 bg-white/10 rounded-md px-3 py-1.5 border border-white/20">
                  <IconoEmpresa className="text-white/60 shrink-0" />
                  <span className="text-white text-sm">
                    {empresaActiva.nombre_comercial ?? empresaActiva.razon_social}
                  </span>
                </div>
              )
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
                  {esProveedor && !esAspirante && (
                    <>
                      {/* Para el proveedor ya aprobado, Mi Ficha y Mi
                          Documentación dejan de ser el foco principal
                          (ya están completas y aprobadas) -> se sacan
                          del menú de arriba y quedan acá, como algo que
                          se consulta ocasionalmente, no todos los días. */}
                      <Link
                        to="/mi-ficha"
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-brand-900/80 hover:bg-brand-200/30"
                      >
                        <IconoFicha className="text-brand-900/40 shrink-0" />
                        Mi Ficha
                      </Link>
                      <Link
                        to="/documentos"
                        className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-brand-900/80 hover:bg-brand-200/30"
                      >
                        <IconoCarpeta className="text-brand-900/40 shrink-0" />
                        Mi Documentación
                      </Link>
                      <div className="border-t border-brand-900/8 my-1" />
                    </>
                  )}
                  <button
                    onClick={() => setModalPasswordAbierto(true)}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-brand-900/80 hover:bg-brand-200/30"
                  >
                    <IconoCandado className="text-brand-900/40 shrink-0" />
                    Cambiar contraseña
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2.5 w-full text-left px-4 py-2 text-sm text-brand-wine hover:bg-brand-200/30"
                  >
                    <IconoSalir className="text-brand-wine/70 shrink-0" />
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
                <button
                  id={item.label === 'Reclamos' ? 'tour-reclamos' : undefined}
                  className="px-3 py-2.5 text-sm font-medium text-white/80 hover:text-white rounded-md hover:bg-white/5 transition-colors"
                >
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
                        : item.to === '/calificacion'
                          ? 'tour-calificacion'
                          : item.to === '/pedidos'
                            ? 'tour-pedidos'
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

      <main
        className="flex-1 overflow-y-auto flex flex-col"
        onScroll={(e) => {
          // Dos umbrales distintos (no uno solo) a propósito: si achicar
          // el header en sí corre un poquito el scroll (cambia su propia
          // altura), un único umbral hace que el scroll quede justo en el
          // borde y la animación oscile en bucle sin parar. Con un umbral
          // más alto para achicar y uno más bajo para volver a agrandar,
          // queda una "zona muerta" en el medio que no dispara nada.
          const scrollTop = e.currentTarget.scrollTop;
          setConScroll((actual) => (actual ? scrollTop > 8 : scrollTop > 40));
        }}
      >
        <div key={location.pathname} className="flex-1 p-8 animar-entrada-pagina-completa">
          {children}
        </div>
        <Footer />
      </main>

      {modalPasswordAbierto && <ModalCambiarPassword onClose={() => setModalPasswordAbierto(false)} />}

      <GuiaInicioTour
        visible={tourVisible}
        onCerrar={cerrarTour}
        pasos={esProveedor && !esAspirante ? PASOS_PROVEEDOR_APROBADO : undefined}
      />

      <HanaBot />
    </div>
  );
}