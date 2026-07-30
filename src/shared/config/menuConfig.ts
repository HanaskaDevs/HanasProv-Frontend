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
  { label: 'Mi Ficha', to: '/mi-ficha' },
  { label: 'Documentación', to: '/documentos' },
  { label: 'Ficha Productos', to: '/productos' },
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
  { label: 'Configuraciones', to: '/configuraciones' },
];

const MENU_ADMIN: MenuItem[] = [
  {
    label: 'Usuarios',
    children: [{ to: '/usuarios/proveedores', label: 'Cuentas de Proveedores' }],
  },
  { label: 'Calificación Proveedores', to: '/proveedores' },
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
      // (ver comentario arriba) -> pero sí necesita un acceso directo
      // al panel/inicio en el menú (el resto de proveedores llega ahí
      // por el logo, pero para el aspirante conviene dejarlo explícito
      // ya que su panel es su única referencia de estado por ahora).
      return [
        { label: 'Inicio', to: '/panel' },
        ...MENU_PROVEEDOR.filter((item) => !ETIQUETAS_OCULTAS_PARA_ASPIRANTE.includes(item.label)),
      ];
    }
    return MENU_PROVEEDOR;
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