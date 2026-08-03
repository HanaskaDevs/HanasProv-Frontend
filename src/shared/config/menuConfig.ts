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
      // Renombrado de "Proveedores" a "Cuentas de Proveedores" -> ahora
      // que "Proveedores" es un desplegable de nivel superior (ver
      // abajo), dejarlo igual acá generaba dos ítems con el mismo
      // nombre en el mismo menú, apuntando a cosas distintas.
      { to: '/usuarios/proveedores', label: 'Cuentas de Proveedores' },
    ],
  },
  {
    label: 'Proveedores',
    children: [
      { to: '/proveedores/detalle', label: 'Detalle de Proveedores' },
      { to: '/proveedores', label: 'Calificación de Proveedores' },
    ],
  },
  { label: 'Catálogo de Productos', to: '/catalogo-productos' },
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
    children: [{ to: '/usuarios/proveedores', label: 'Cuentas de Proveedores' }],
  },
  {
    label: 'Proveedores',
    children: [
      { to: '/proveedores/detalle', label: 'Detalle de Proveedores' },
      { to: '/proveedores', label: 'Calificación de Proveedores' },
    ],
  },
  { label: 'Catálogo de Productos', to: '/catalogo-productos' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Auditorías', to: '/auditorias' },
  { label: 'Políticas', to: '/politicas' },
  { label: 'Calendario', to: '/calendario' },
  { label: 'Reportes', to: '/reportes' },
];

const MENU_CALIDAD_COMPRAS: MenuItem[] = [PEDIDOS, { label: 'Auditorías', to: '/auditorias' }, RECLAMOS];

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
    case ROLES.COMPRAS:
      return MENU_CALIDAD_COMPRAS;
    default:
      return [];
  }
}