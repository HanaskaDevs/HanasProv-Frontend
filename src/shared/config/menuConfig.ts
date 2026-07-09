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

const PEDIDOS: MenuItem = {
  label: 'Pedidos',
  children: [
    { to: '/pedidos/abiertos', label: 'Pedidos Abiertos' },
    { to: '/pedidos/cerrados', label: 'Pedidos Cerrados' },
  ],
};

const RECLAMOS: MenuItem = {
  label: 'Reclamos',
  children: [
    { to: '/reclamos/abiertos', label: 'Reclamos Abiertos' },
    { to: '/reclamos/cerrados', label: 'Reclamos Cerrados' },
  ],
};

const MENU_PROVEEDOR: MenuItem[] = [
  { label: 'Mi Ficha', to: '/mi-ficha' },
  { label: 'Documentación', to: '/documentos' },
  { label: 'Ficha Productos', to: '/productos' },
  { label: 'Calificación', to: '/calificacion' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Políticas', to: '/politicas' },
];

const MENU_SISTEMAS: MenuItem[] = [
  { label: 'Empresas', to: '/empresas' },
  {
    label: 'Usuarios',
    children: [
      { to: '/usuarios/internos', label: 'Usuarios Internos' },
      { to: '/usuarios/proveedores', label: 'Cuentas de Proveedores' },
    ],
  },
  { label: 'Proveedores', to: '/proveedores' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Calificaciones', to: '/calificacion' },
  { label: 'Auditorías', to: '/auditorias' },
  { label: 'Políticas', to: '/politicas' },
  { label: 'Calendario', to: '/calendario' },
  { label: 'Reportes', to: '/reportes' },
];

const MENU_ADMIN: MenuItem[] = [
  {
    label: 'Usuarios',
    children: [{ to: '/usuarios/proveedores', label: 'Cuentas de Proveedores' }],
  },
  { label: 'Proveedores', to: '/proveedores' },
  PEDIDOS,
  RECLAMOS,
  { label: 'Calificaciones', to: '/calificacion' },
  { label: 'Auditorías', to: '/auditorias' },
  { label: 'Políticas', to: '/politicas' },
  { label: 'Calendario', to: '/calendario' },
  { label: 'Reportes', to: '/reportes' },
];

const MENU_CALIDAD_COMPRAS: MenuItem[] = [PEDIDOS, { label: 'Auditorías', to: '/auditorias' }, RECLAMOS];

export function obtenerMenu(rolActivo: string | null, tipoUsuario: 'Interno' | 'Proveedor'): MenuItem[] {
  if (tipoUsuario === 'Proveedor') return MENU_PROVEEDOR;

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