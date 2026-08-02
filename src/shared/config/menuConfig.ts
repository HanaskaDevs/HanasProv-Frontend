import { ROLES } from '../../modules/auth/types';

export interface SubMenuItem {
  to: string;
  label: string;
}

export interface MenuItem {
  label: string;
  to?: string;
  children?: SubMenuItem[];
}

const PEDIDOS: MenuItem = { label: 'Pedidos', to: '/pedidos' };

// Catálogo consolidado de productos de todos los proveedores. Solo
// personal interno: Sistemas, Admin y Compras (Calidad NO -> por eso
// dejó de existir un único MENU_CALIDAD_COMPRAS, ver más abajo).
const CATALOGO_PRODUCTOS: MenuItem = { label: 'Catálogo Productos', to: '/catalogo-productos' };

const RECLAMOS: MenuItem = {
  label: 'Reclamos',
  children: [
    { to: '/reclamos/abiertos', label: 'Reclamos Abiertos' },
    { to: '/reclamos/cerrados', label: 'Reclamos Cerrados' },
  ],
};

const MENU_PROVEEDOR: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  { label: 'Mi Ficha', to: '/mi-ficha' },
  { label: 'Documentación', to: '/documentos' },
  { label: 'Ficha Productos', to: '/productos' },
  { label: 'Calificación', to: '/calificacion' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Políticas', to: '/politicas' },
];

// El proveedor Aprobado ya completó y aprobó su Ficha y su
// Documentación -> dejan de ser lo primero que necesita todos los días,
// así que se sacan del menú de arriba (quedan como "Mi Ficha"/"Mi
// Documentación" en el dropdown del usuario, ver DashboardLayout) y
// "Ficha Productos" pasa a llamarse "Mis Productos" -> ya no está
// "llenando una ficha", es su catálogo activo de productos.
const MENU_PROVEEDOR_APROBADO: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  { label: 'Mis Productos', to: '/productos' },
  { label: 'Calificación', to: '/calificacion' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Políticas', to: '/politicas' },
];

// Mientras el proveedor está "Aspirante" (todavía no aprobado), estas
// secciones no le aplican -> ni siquiera puede tener pedidos ni
// reclamos todavía, y las políticas son para proveedores ya activos.
// "Calificación" SÍ la puede ver -> es donde sigue el estado de su
// propia postulación (Ficha/Documentación/Productos).
const ETIQUETAS_OCULTAS_PARA_ASPIRANTE = ['Pedidos', 'Reclamos', 'Políticas'];

const MENU_SISTEMAS: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  { label: 'Empresas', to: '/empresas' },
  {
    label: 'Usuarios',
    children: [
      { to: '/usuarios/internos', label: 'Usuarios Internos' },
      { to: '/usuarios/proveedores', label: 'Proveedores' },
    ],
  },
  // Renombrado a "Calificación Proveedores" (mismo nombre que ya usa
  // MENU_ADMIN para esta misma pantalla) -> si no, quedaban DOS ítems
  // llamados "Proveedores" en este mismo menú (este y el de arriba,
  // que en realidad apuntan a pantallas completamente distintas).
  { label: 'Calificación Proveedores', to: '/proveedores' },
  { label: 'Productos', to: '/productos-proveedores' },
  { label: 'Proveedores', to: '/proveedores' },
  CATALOGO_PRODUCTOS,
  PEDIDOS,
  RECLAMOS,
  { label: 'Auditorías', to: '/auditorias' },
  { label: 'Políticas', to: '/politicas' },
  { label: 'Calendario', to: '/calendario' },
  { label: 'Reportes', to: '/reportes' },
  { label: 'Catálogos', to: '/catalogos' },
  { label: 'Configuraciones', to: '/configuraciones' },
];

const MENU_ADMIN: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  {
    label: 'Usuarios',
    children: [{ to: '/usuarios/proveedores', label: 'Proveedores' }],
  },
  { label: 'Calificación Proveedores', to: '/proveedores' },
  { label: 'Productos', to: '/productos-proveedores' },
  CATALOGO_PRODUCTOS,
  PEDIDOS,
  RECLAMOS,
  { label: 'Auditorías', to: '/auditorias' },
  { label: 'Políticas', to: '/politicas' },
  { label: 'Calendario', to: '/calendario' },
  { label: 'Reportes', to: '/reportes' },
];

const MENU_CALIDAD: MenuItem[] = [PEDIDOS, { label: 'Auditorías', to: '/auditorias' }, RECLAMOS];

// Compras tenía exactamente el mismo menú que Calidad; se separan porque
// Compras SÍ entra al Catálogo de Productos (es quien mapea los códigos
// de Business Central) y Calidad no.
const MENU_COMPRAS: MenuItem[] = [
  CATALOGO_PRODUCTOS,
  PEDIDOS,
  { label: 'Auditorías', to: '/auditorias' },
  RECLAMOS,
];

export function obtenerMenu(
  rolActivo: string | null,
  tipoUsuario: 'Interno' | 'Proveedor',
  esAspirante = false
): MenuItem[] {
  if (tipoUsuario === 'Proveedor') {
    if (esAspirante) {
      // El aspirante todavía no tiene Pedidos, Reclamos ni Políticas
      // (ver comentario arriba). "Inicio" ya viene incluido en
      // MENU_PROVEEDOR (no hace falta agregarlo a mano acá).
      return MENU_PROVEEDOR.filter((item) => !ETIQUETAS_OCULTAS_PARA_ASPIRANTE.includes(item.label));
    }
    return MENU_PROVEEDOR_APROBADO;
  }

  switch (rolActivo) {
    case ROLES.SISTEMAS:
      return MENU_SISTEMAS;
    case ROLES.ADMIN:
      return MENU_ADMIN;
    case ROLES.CALIDAD:
      return MENU_CALIDAD;
    case ROLES.COMPRAS:
      return MENU_COMPRAS;
    default:
      return [];
  }
}