import { type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import { obtenerMenu, type MenuItem } from '../config/menuConfig';
import IconoModulo from '../components/IconoModulo';
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

function IconoHamburguesa({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function IconoX({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
  const { usuario, empresaActiva, idEmpresaActiva, rolActivo, esProveedor, esGuardia, cambiarEmpresa, logout } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuAbierto, setMenuAbierto] = useState<string | null>(null);
  const [menuUsuarioAbierto, setMenuUsuarioAbierto] = useState(false);
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);
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

  /**
   * ¿La ruta actual está dentro de esta área? Con el menú agrupado hace
   * falta: la ruta activa vive DENTRO del panel, así que si el ítem de la
   * barra no se marcara, el usuario pierde la referencia de en qué área está
   * parado. Se compara la ruta exacta o su prefijo (ej. estando en
   * /proveedores/detalle, el área "Proveedores" queda marcada).
   */
  function areaContieneRutaActual(item: MenuItem): boolean {
    return (item.children ?? []).some(
      (sub) => location.pathname === sub.to || location.pathname.startsWith(`${sub.to}/`)
    );
  }
  const [conScroll, setConScroll] = useState(false);

  // Por si la ruta cambia sin pasar por el onClick de un link de acá
  // adentro (botón "atrás" del navegador, por ejemplo) -> el panel no se
  // queda abierto tapando la pantalla en la página nueva.
  useEffect(() => {
    setMenuMovilAbierto(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-brand-200/10">
      <header className="bg-brand-900 text-white shrink-0 transition-all duration-300">
        {/* Header pensado para escritorio (pl-10, logo h-20 = 80px) se veía
         *  aplastado en celular: el logo gigante empujaba la píldora de
         *  empresa a partirse en 2 líneas contra el avatar, todo apretado
         *  arriba de la pantalla -> pedido explícito del usuario al
         *  probarlo en su celular. Abajo de `sm` todo se achica: menos
         *  padding lateral, logo más chico, píldora de empresa sin ícono
         *  y con el texto truncado en 1 línea en vez de partirse. */}
        <div className={`flex items-center justify-between gap-2 pl-4 sm:pl-10 pr-3 sm:pr-6 transition-all duration-300 ${conScroll ? 'py-1' : 'py-1.5 sm:py-2'}`}>
          <LogoLink className={`shrink-0 transition-all duration-300 ${conScroll ? 'h-8 sm:h-12' : 'h-10 sm:h-20'}`} variant="light" />

          {/* Pedido explícito del usuario: en celular que SOLO se vea el
           *  logo, y que la empresa/el perfil/el resto vivan en un menú
           *  hamburguesa aparte -> este bloque (empresa + avatar) se
           *  esconde abajo de `sm` y reaparece completo en escritorio,
           *  sin tocar nada de esa lógica. */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-4 min-w-0">
            {usuario && usuario.empresas.length > 1 ? (
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-md px-2 sm:px-3 py-1.5 border border-white/20 min-w-0">
                <IconoEmpresa className="text-white/60 shrink-0 hidden sm:block" />
                <select
                  value={empresaActiva ? String(empresaActiva.id_empresa) : ''}
                  onChange={(e) => handleCambiarEmpresa(Number(e.target.value))}
                  disabled={cambiandoEmpresa}
                  className="bg-transparent text-white text-xs sm:text-sm focus:outline-none min-w-0 max-w-[110px] sm:max-w-none truncate"
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
                <div className="flex items-center gap-1.5 sm:gap-2 bg-white/10 rounded-md px-2 sm:px-3 py-1.5 border border-white/20 min-w-0">
                  <IconoEmpresa className="text-white/60 shrink-0 hidden sm:block" />
                  <span className="text-white text-xs sm:text-sm whitespace-nowrap truncate max-w-[110px] sm:max-w-none">
                    {empresaActiva.nombre_comercial ?? empresaActiva.razon_social}
                  </span>
                </div>
              )
            )}

            <div
              className="relative shrink-0"
              onMouseEnter={() => setMenuUsuarioAbierto(true)}
              onMouseLeave={() => setMenuUsuarioAbierto(false)}
            >
              <button className="flex items-center gap-2 px-1.5 sm:px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors">
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

          {/* Hamburguesa: solo en celular/tablet angosta. Abre el panel de
           *  abajo con empresa + perfil + navegación, todo lo que en
           *  escritorio vive repartido en la barra de arriba. */}
          <button
            onClick={() => setMenuMovilAbierto((v) => !v)}
            className="sm:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-white/10 transition-colors shrink-0"
            aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuMovilAbierto}
          >
            {menuMovilAbierto ? <IconoX /> : <IconoHamburguesa />}
          </button>
        </div>

        {/* Barra de navegación de escritorio: en celular queda escondida
         *  -> sus mismos ítems (`menu`) se repiten dentro del panel
         *  hamburguesa de más abajo, no hay 2 navegaciones a la vez.
         *  IMPORTANTE: sin overflow-x-auto acá -> ese overflow (aunque
         *  sea solo en X) fuerza a los navegadores a recortar también en
         *  Y, y eso tapaba los paneles desplegables de "Proveedores",
         *  "Operación", etc. que aparecen al pasar el mouse (se salen
         *  hacia abajo del <nav> con position absolute). Como esta barra
         *  ya solo se ve en escritorio (sm+, ver arriba), no hace falta
         *  que se deslice -> se sacó del todo, no hay bug de recorte. */}
        <nav className="hidden sm:flex items-center justify-center gap-0.5 px-6 border-t border-white/10">
          {menu.map((item) =>
            item.children ? (
              <div
                key={item.label}
                className="relative shrink-0"
                onMouseEnter={() => setMenuAbierto(item.label)}
                onMouseLeave={() => setMenuAbierto(null)}
              >
                <button
                  id={item.label === 'Reclamos' ? 'tour-reclamos' : undefined}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                    areaContieneRutaActual(item) || menuAbierto === item.label
                      ? 'bg-white/10 text-white'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.label}
                  <span
                    className={`text-[10px] leading-none transition-transform duration-200 ${
                      menuAbierto === item.label ? 'rotate-180' : ''
                    }`}
                  >
                    ▾
                  </span>
                </button>

                {menuAbierto === item.label && (
                  /* El pt-1 va en este contenedor y no como margen del panel:
                     deja un puente invisible entre el botón y el panel para
                     que al bajar el mouse no se cierre en el hueco. */
                  <div className="absolute left-0 top-full pt-1 z-20">
                    <div className="animar-entrada-pagina min-w-[300px] rounded-lg border border-brand-900/10 bg-white p-1.5 shadow-xl">
                      {item.children.map((sub) => (
                        <NavLink
                          key={sub.to}
                          to={sub.to}
                          className={({ isActive }) =>
                            `flex items-start gap-2.5 rounded-md px-2.5 py-2 transition-colors ${
                              isActive ? 'bg-brand-200/35' : 'hover:bg-brand-900/[0.04]'
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              {sub.icono && (
                                <span
                                  className={`mt-0.5 shrink-0 ${isActive ? 'text-brand-700' : 'text-brand-900/35'}`}
                                >
                                  <IconoModulo nombre={sub.icono} />
                                </span>
                              )}
                              <span className="min-w-0">
                                <span
                                  className={`block text-sm leading-snug ${
                                    isActive ? 'font-medium text-brand-700' : 'text-brand-900'
                                  }`}
                                >
                                  {sub.label}
                                </span>
                                {sub.descripcion && (
                                  <span className="mt-0.5 block text-[11.5px] leading-snug text-brand-900/45">
                                    {sub.descripcion}
                                  </span>
                                )}
                              </span>
                            </>
                          )}
                        </NavLink>
                      ))}
                    </div>
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
                  `shrink-0 whitespace-nowrap px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
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

      {/* Panel hamburguesa (solo celular/tablet angosta): junta lo que en
       *  escritorio está repartido entre la píldora de empresa, el
       *  dropdown de usuario y la barra de navegación -> pedido explícito
       *  del usuario. El fondo oscuro cierra al tocar afuera, igual que
       *  el Modal genérico. */}
      {menuMovilAbierto && (
        <div
          className="sm:hidden fixed inset-0 bg-brand-900/60 z-30"
          onClick={() => setMenuMovilAbierto(false)}
        >
          <div
            className="absolute inset-x-0 top-0 bg-brand-900 text-white shadow-xl max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
              <LogoLink className="h-8" variant="light" />
              <button
                onClick={() => setMenuMovilAbierto(false)}
                className="h-9 w-9 flex items-center justify-center rounded-md hover:bg-white/10"
                aria-label="Cerrar menú"
              >
                <IconoX />
              </button>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Avatar nombre={usuario?.nombre_completo ?? '?'} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{usuario?.nombre_completo}</p>
                {rolActivo && <p className="text-xs text-white/50 truncate">{rolActivo}</p>}
              </div>
            </div>

            <div className="px-4 py-3 border-b border-white/10">
              <p className="text-[11px] uppercase tracking-wide text-white/40 mb-1.5">Empresa</p>
              {usuario && usuario.empresas.length > 1 ? (
                <select
                  value={empresaActiva ? String(empresaActiva.id_empresa) : ''}
                  onChange={(e) => handleCambiarEmpresa(Number(e.target.value))}
                  disabled={cambiandoEmpresa}
                  className="w-full bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white"
                >
                  {usuario.empresas.map((e) => (
                    <option key={e.id_empresa} value={String(e.id_empresa)} className="text-brand-900">
                      {e.nombre_comercial ?? e.razon_social}
                    </option>
                  ))}
                </select>
              ) : (
                empresaActiva && (
                  <p className="text-sm">{empresaActiva.nombre_comercial ?? empresaActiva.razon_social}</p>
                )
              )}
            </div>

            {/* Mismos ítems que la barra de escritorio (`menu`), listados
             *  en vez de en pestañas -> los que tienen sub-ítems (áreas)
             *  se muestran como un pequeño título de sección seguido de
             *  sus enlaces. */}
            <div className="py-2 border-b border-white/10">
              {menu.map((item) =>
                item.children ? (
                  <div key={item.label}>
                    <p className="px-4 pt-2.5 pb-1 text-[11px] uppercase tracking-wide text-white/40">
                      {item.label}
                    </p>
                    {item.children.map((sub) => (
                      <NavLink
                        key={sub.to}
                        to={sub.to}
                        onClick={() => setMenuMovilAbierto(false)}
                        className={({ isActive }) =>
                          `block px-4 py-2.5 text-sm ${
                            isActive ? 'bg-white/10 text-white font-medium' : 'text-white/80'
                          }`
                        }
                      >
                        {sub.label}
                      </NavLink>
                    ))}
                  </div>
                ) : (
                  <NavLink
                    key={item.label}
                    to={item.to!}
                    onClick={() => setMenuMovilAbierto(false)}
                    className={({ isActive }) =>
                      `block px-4 py-2.5 text-sm ${
                        isActive ? 'bg-white/10 text-white font-medium' : 'text-white/80'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </div>

            <div className="py-2">
              {esProveedor && !esAspirante && (
                <>
                  <Link
                    to="/mi-ficha"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80"
                  >
                    <IconoFicha className="text-white/40 shrink-0" />
                    Mi Ficha
                  </Link>
                  <Link
                    to="/documentos"
                    onClick={() => setMenuMovilAbierto(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-white/80"
                  >
                    <IconoCarpeta className="text-white/40 shrink-0" />
                    Mi Documentación
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setMenuMovilAbierto(false);
                  setModalPasswordAbierto(true);
                }}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-white/80"
              >
                <IconoCandado className="text-white/40 shrink-0" />
                Cambiar contraseña
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full text-left px-4 py-2.5 text-sm text-brand-wine"
              >
                <IconoSalir className="text-brand-wine/70 shrink-0" />
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Pedido explícito del usuario: el Guardia no debe ver a HanaBot ->
       *  su pantalla es solo marcar arribos, no tiene sentido el
       *  asistente ahí y además reduce distracciones en un celular en
       *  el andén. */}
      {!esGuardia && <HanaBot />}
    </div>
  );
}