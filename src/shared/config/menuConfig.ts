import { ROLES } from '../../modules/auth/types';
import type { NombreIconoModulo } from '../components/IconoModulo';

export interface SubMenuItem {
  to: string;
  label: string;
  /** Ícono del panel agrupado. Sin ícono, la fila se dibuja sin él. */
  icono?: NombreIconoModulo;
  /** Una línea de contexto, para no tener que adivinar qué hay detrás. */
  descripcion?: string;
}

export interface MenuItem {
  label: string;
  to?: string;
  children?: SubMenuItem[];
}

/**
 * ORGANIZACIÓN DEL MENÚ PRINCIPAL
 *
 * Los roles internos llegaron a tener demasiados módulos para una barra
 * horizontal: Sistemas mostraba 14 ítems de primer nivel y Admin 11, así que
 * la barra se saturaba y se partía en dos líneas.
 *
 * Ahora esos dos roles agrupan sus módulos en 5 ÁREAS (Proveedores,
 * Operación, Calidad, Administración y Reportes), cada una con un panel que
 * lista sus módulos con ícono y una línea de descripción. Sistemas pasa de
 * 14 a 6 ítems y Admin de 11 a 5, sin que se pierda ni se mueva ninguna
 * ruta: es puro reagrupamiento visual.
 *
 * Los roles con pocos módulos (Proveedor, Calidad, Compras) siguen PLANOS a
 * propósito: agruparlos escondería 3 o 4 ítems detrás de un clic sin ganar
 * nada. Un usuario de Calidad no necesita un menú llamado "Calidad".
 */

// ---------------------------------------------------------------------------
// Módulos individuales, definidos una sola vez y reusados en cada menú
// ---------------------------------------------------------------------------

const PEDIDOS_ITEM: SubMenuItem = {
  to: '/pedidos',
  label: 'Pedidos',
  icono: 'camion',
  descripcion: 'Pedidos de compra y % de entrega',
};

const RECLAMOS_ABIERTOS: SubMenuItem = {
  to: '/reclamos/abiertos',
  label: 'Reclamos abiertos',
  icono: 'reclamo',
  descripcion: 'En curso, esperando respuesta',
};

const RECLAMOS_CERRADOS: SubMenuItem = {
  to: '/reclamos/cerrados',
  label: 'Reclamos cerrados',
  icono: 'reclamo',
  descripcion: 'Historial de reclamos resueltos',
};

const CAMBIOS_PRECIO_ITEM: SubMenuItem = {
  to: '/cambios-precio',
  label: 'Cambios de precio',
  icono: 'etiqueta',
  descripcion: 'Solicitudes pendientes de aprobar',
};

// Nombre en paralelo con AUDITORIAS_RECEPCIONES: los dos son
// "Calificación de X", así que en el menú se leen como dos variantes de lo
// mismo (que es lo que son) y no como dos módulos distintos.
const AUDITORIAS_CALIFICACION: SubMenuItem = {
  to: '/auditorias',
  label: 'Calificación de auditorías',
  icono: 'portapapeles',
  descripcion: 'Formulario completo por clase de proveedor',
};

const AUDITORIAS_RECEPCIONES: SubMenuItem = {
  to: '/auditorias/recepciones',
  label: 'Calificación de recepciones',
  icono: 'recepcion',
  descripcion: 'Evaluación de calidad en la recepción',
};

const POLITICAS_ITEM: SubMenuItem = {
  to: '/politicas',
  label: 'Políticas',
  icono: 'documento',
  descripcion: 'Políticas vigentes del portal',
};

// ---------------------------------------------------------------------------
// Menús planos (roles con pocos módulos)
// ---------------------------------------------------------------------------

const PEDIDOS: MenuItem = { label: 'Pedidos', to: '/pedidos' };

const RECLAMOS: MenuItem = {
  label: 'Reclamos',
  children: [RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS],
};

// Solo lo ven Admin/Calidad/Sistemas (mismos roles que puede
// aprobar/rechazar en el backend, ver SolicitudCambioPrecioService::
// verificarEsAdminOCalidad) -> Compras nunca aprueba precios.
const CAMBIOS_PRECIO: MenuItem = { label: 'Cambios de Precio', to: '/cambios-precio' };

const AUDITORIAS: MenuItem = {
  label: 'Auditorías',
  children: [AUDITORIAS_CALIFICACION, AUDITORIAS_RECEPCIONES],
};

// ---------------------------------------------------------------------------
// Áreas agrupadas (Sistemas y Admin)
// ---------------------------------------------------------------------------

const AREA_PROVEEDORES: MenuItem = {
  label: 'Proveedores',
  children: [
    {
      to: '/proveedores/detalle',
      label: 'Detalle de proveedores',
      icono: 'usuarios',
      descripcion: 'Ficha completa de cada proveedor',
    },
    {
      to: '/proveedores',
      label: 'Calificación de proveedores',
      icono: 'checklist',
      descripcion: 'Revisar ficha, documentos y productos',
    },
    {
      to: '/usuarios/proveedores',
      label: 'Cuentas de proveedores',
      icono: 'llave',
      descripcion: 'Accesos al portal y activaciones',
    },
    {
      to: '/catalogo-productos',
      label: 'Catálogo de productos',
      icono: 'caja',
      descripcion: 'Todos los productos con su código BC',
    },
  ],
};

const SEGUIMIENTO_HOY_ITEM: SubMenuItem = {
  to: '/calendario/seguimiento',
  label: 'Seguimiento de hoy',
  icono: 'recepcion',
  descripcion: 'Arribo, recepción y entrega en vivo de hoy',
};

const AREA_OPERACION: MenuItem = {
  label: 'Operación',
  children: [PEDIDOS_ITEM, SEGUIMIENTO_HOY_ITEM, RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS, CAMBIOS_PRECIO_ITEM],
};

const AREA_CALIDAD: MenuItem = {
  label: 'Calidad',
  children: [AUDITORIAS_CALIFICACION, AUDITORIAS_RECEPCIONES, POLITICAS_ITEM],
};

const AREA_ADMINISTRACION: MenuItem = {
  label: 'Administración',
  children: [
    {
      to: '/empresas',
      label: 'Empresas',
      icono: 'empresa',
      descripcion: 'Empresas del grupo y su código BC',
    },
    {
      to: '/usuarios/internos',
      label: 'Usuarios internos',
      icono: 'usuarioInterno',
      descripcion: 'Staff, roles y bodegas asignadas',
    },
    {
      to: '/catalogos',
      label: 'Catálogos',
      icono: 'catalogos',
      descripcion: 'Clases, categorías y tipos de documento',
    },
    {
      to: '/configuraciones',
      label: 'Configuraciones',
      icono: 'configuracion',
      descripcion: 'Contenido del sitio y reglas de documentos',
    },
  ],
};

const CALENDARIO_HORARIOS: SubMenuItem = {
  to: '/calendario',
  label: 'Calendario de horarios',
  icono: 'calendario',
  descripcion: 'Día, andén y hora de entrega por proveedor',
};

const AREA_REPORTES: MenuItem = {
  label: 'Reportes',
  children: [
    {
      to: '/reportes/calificacion-proveedores',
      label: 'Calificación de proveedores',
      icono: 'reporte',
      descripcion: 'Comparativa por componente de la nota',
    },
    {
      to: '/reportes/cumplimiento-entregas',
      label: 'Cumplimiento de entregas',
      icono: 'reporte',
      descripcion: 'Fill rate por proveedor',
    },
    CALENDARIO_HORARIOS,
  ],
};

// ---------------------------------------------------------------------------
// Menús por rol
// ---------------------------------------------------------------------------

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
  AREA_PROVEEDORES,
  AREA_OPERACION,
  AREA_CALIDAD,
  AREA_ADMINISTRACION,
  AREA_REPORTES,
];

const MENU_ADMIN: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  AREA_PROVEEDORES,
  AREA_OPERACION,
  AREA_CALIDAD,
  AREA_REPORTES,
];

// Compras NO lleva Auditorías: el backend solo deja auditar a Sistemas,
// Admin y Calidad (ver AuditoriaService::verificarAcceso y
// CalificacionRecepcionService::verificarAcceso), así que tenerlo en el menú
// solo lo llevaba a una pantalla que responde 403. Si algún día se decide
// que Compras también audite, hay que habilitarlo en esos dos services
// además de volver a poner AUDITORIAS acá.
// Calendario de horarios: Compras y Calidad también lo VEN (pedido
// explícito del usuario), aunque no puedan gestionarlo (eso queda solo
// para Sistemas/Admin, ver ModalGestionHorarios). Como son menús planos,
// se agrega directo como ítem de primer nivel.
const CALENDARIO_HORARIOS_PLANO: MenuItem = { label: 'Calendario de horarios', to: '/calendario' };

// Seguimiento de hoy (Arribo/Atrasado/En recepción/Entregado): Compras
// marca "entregado" ahí -> lo necesita en su menú. Calidad solo ve el
// calendario semanal, no participa del seguimiento en vivo.
const SEGUIMIENTO_HOY_PLANO: MenuItem = { label: 'Seguimiento de hoy', to: '/calendario/seguimiento' };

const MENU_COMPRAS: MenuItem[] = [PEDIDOS, CALENDARIO_HORARIOS_PLANO, SEGUIMIENTO_HOY_PLANO, RECLAMOS];

const MENU_CALIDAD: MenuItem[] = [PEDIDOS, AUDITORIAS, CALENDARIO_HORARIOS_PLANO, RECLAMOS, CAMBIOS_PRECIO];

// El Guardia es un rol de un solo propósito: marcar que un proveedor
// arribó en el seguimiento de hoy -> no necesita nada más del portal.
const MENU_GUARDIA: MenuItem[] = [SEGUIMIENTO_HOY_PLANO];

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
    case ROLES.GUARDIA:
      return MENU_GUARDIA;
    default:
      return [];
  }
}
