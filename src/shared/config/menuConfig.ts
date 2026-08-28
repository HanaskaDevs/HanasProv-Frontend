import { Capacitor } from '@capacitor/core';
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
 * Ahora esos roles agrupan sus módulos en ÁREAS (Proveedores, Operación,
 * Calidad, Administración y Reportes), cada una con un panel que lista sus
 * módulos con ícono y una línea de descripción, en vez de una barra
 * horizontal saturada de ítems sueltos.
 *
 * Compras y Calidad (27-ago-2026, pedido explícito del usuario: "organicemos
 * similar como tiene organizado el de Sistemas") también quedaron
 * agrupados, aunque con menos áreas -> el criterio es el mismo, solo cambia
 * cuántas áreas les tocan según lo que pueden hacer. Guardia y Proveedor SÍ
 * siguen PLANOS a propósito: Guardia tiene un solo ítem (agruparlo no
 * ganaría nada) y Proveedor ve su propio flujo, no módulos administrativos.
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

const CALENDARIO_HORARIOS: SubMenuItem = {
  to: '/calendario',
  label: 'Calendario de horarios',
  icono: 'calendario',
  descripcion: 'Día, andén y hora de entrega por proveedor',
};

// ---------------------------------------------------------------------------
// Menús planos (roles con pocos módulos)
// ---------------------------------------------------------------------------

const PEDIDOS: MenuItem = { label: 'Pedidos', to: '/pedidos' };

const RECLAMOS: MenuItem = {
  label: 'Reclamos',
  children: [RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS],
};

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

// Seguimiento de hoy: solo Sistemas y Guardia (pedido explícito del
// usuario, 27-ago-2026: "para lo del seguimiento de hoy solo Sistemas y
// el guardia") -> Admin, Compras y Calidad ya NO lo ven, mismo criterio
// que Auditorías/Aprobaciones con Admin (no tiene sentido un ítem que el
// backend le va a rechazar con acceso denegado). Por eso NO va en
// AREA_OPERACION (compartida con Admin), solo en la de Sistemas.
const SEGUIMIENTO_HOY_ITEM: SubMenuItem = {
  to: '/calendario/seguimiento',
  label: 'Seguimiento de hoy',
  icono: 'recepcion',
  descripcion: 'Arribo, recepción y entrega en vivo de hoy',
};

// Aprobaciones de arribo: solo Calidad/Sistemas resuelven (ver
// HorarioEntregaService::verificarAccesoResolverAprobacion) -> NO va en
// AREA_OPERACION (compartida con Admin), para no llevar a Admin a una
// pantalla que el backend le va a rechazar con 403 (mismo criterio que ya
// usaba este archivo con Auditorías/Compras, ver comentario más abajo).
const APROBACIONES_ARRIBO_ITEM: SubMenuItem = {
  to: '/calendario/aprobaciones',
  label: 'Aprobaciones de arribo',
  icono: 'recepcion',
  descripcion: 'Solicitudes de arribo tardío pendientes',
};

const AREA_OPERACION: MenuItem = {
  label: 'Operación',
  children: [PEDIDOS_ITEM, RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS, CAMBIOS_PRECIO_ITEM],
};

// Sistemas SÍ ve Seguimiento de hoy y resuelve aprobaciones de arribo (ver
// verificarAccesoOperativo/verificarAccesoResolverAprobacion) -> su
// Operación lleva 2 ítems más que la de Admin.
const AREA_OPERACION_SISTEMAS: MenuItem = {
  label: 'Operación',
  children: [PEDIDOS_ITEM, SEGUIMIENTO_HOY_ITEM, APROBACIONES_ARRIBO_ITEM, RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS, CAMBIOS_PRECIO_ITEM],
};

// Auditorías (26-ago-2026): el backend ahora solo deja entrar a Sistemas y
// Calidad (AuditoriaService::verificarAcceso, "Auditorías solo para los
// roles CALIDAD y SISTEMAS") -> Admin YA NO va acá, mismo criterio que ya
// se usaba con Compras (ver comentario en MENU_COMPRAS de abajo: no tiene
// sentido enseñar un ítem que el backend va a rechazar con 403).
// Calificación de Recepciones sigue igual (Sistemas/Admin/Calidad, ver
// CalificacionRecepcionService::verificarAcceso), así que Admin conserva
// esa sola.
const AREA_CALIDAD_SISTEMAS: MenuItem = {
  label: 'Calidad',
  children: [AUDITORIAS_CALIFICACION, AUDITORIAS_RECEPCIONES, POLITICAS_ITEM],
};

const AREA_CALIDAD_ADMIN: MenuItem = {
  label: 'Calidad',
  children: [AUDITORIAS_RECEPCIONES, POLITICAS_ITEM],
};

// Compras: Pedidos + Calendario de horarios (lo ve pero no lo gestiona,
// eso es Sistemas/Admin/Compras vía CRUD -> el ítem de menú es el mismo,
// el backend decide qué botones mostrar) + Reclamos.
const AREA_OPERACION_COMPRAS: MenuItem = {
  label: 'Operación',
  children: [PEDIDOS_ITEM, CALENDARIO_HORARIOS, RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS],
};

// Calidad (27-ago-2026, pedido explícito del usuario): SIN Pedidos, SIN
// Aprobaciones de arribo (esa la resuelve Valeria desde el link del correo
// de notificación, no navegando el menú -> no hace falta que sea un ítem
// visible para todo el rol Calidad) y SIN Cambios de Precio.
const AREA_OPERACION_CALIDAD: MenuItem = {
  label: 'Operación',
  children: [CALENDARIO_HORARIOS, RECLAMOS_ABIERTOS, RECLAMOS_CERRADOS],
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
  AREA_OPERACION_SISTEMAS,
  AREA_CALIDAD_SISTEMAS,
  AREA_ADMINISTRACION,
  AREA_REPORTES,
];

const MENU_ADMIN: MenuItem[] = [
  { label: 'Inicio', to: '/panel' },
  AREA_PROVEEDORES,
  AREA_OPERACION,
  AREA_CALIDAD_ADMIN,
  AREA_REPORTES,
];

// Compras NO lleva Auditorías: el backend solo deja auditar a Sistemas,
// Admin y Calidad (ver AuditoriaService::verificarAcceso y
// CalificacionRecepcionService::verificarAcceso), así que tenerlo en el menú
// solo lo llevaba a una pantalla que responde 403. Si algún día se decide
// que Compras también audite, hay que habilitarlo en esos dos services
// además de agregar AUDITORIAS a su área de Operación.
//
// Seguimiento de hoy: SOLO Sistemas y Guardia (pedido explícito del
// usuario, 27-ago-2026) -> coincide con
// HorarioEntregaService::verificarAccesoOperativo del lado del backend
// para estas 2 pantallas puntuales (el endpoint técnicamente deja pasar a
// más roles porque también lo usa Modo TV, pero la pantalla de
// Seguimiento en sí ya no admite otros roles, ver SeguimientoHoyPage).
const SEGUIMIENTO_HOY_PLANO: MenuItem = { label: 'Seguimiento de hoy', to: '/calendario/seguimiento' };

/**
 * Compras y Calidad (27-ago-2026, pedido explícito del usuario): mismo
 * estilo agrupado que Sistemas/Admin, con "Inicio" + sus áreas -> antes
 * eran menús planos, con pocos ítems sueltos.
 *
 * Calidad se queda SIN Pedidos, SIN Aprobaciones de arribo (esa la
 * resuelve Valeria desde el link del correo, no navegando el menú) y SIN
 * Cambios de Precio -> pedido explícito, esos 3 ítems salen del rol.
 */
const MENU_COMPRAS: MenuItem[] = [{ label: 'Inicio', to: '/panel' }, AREA_OPERACION_COMPRAS];

const MENU_CALIDAD: MenuItem[] = [{ label: 'Inicio', to: '/panel' }, AREA_OPERACION_CALIDAD, AUDITORIAS];

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
      // En la app nativa (celular), Calidad solo necesita Calificación de
      // auditorías y Calificación de Recepciones -> pedido explícito del
      // usuario probando la app instalada: Calendario y Reclamos (que sí
      // se quedan en el menú web, ver MENU_CALIDAD) se ocultan en la app.
      // Pedidos, Aprobaciones de arribo y Cambios de Precio ya ni siquiera
      // están en MENU_CALIDAD (pedido explícito, 27-ago-2026), así que no
      // hace falta filtrarlos acá aparte.
      return Capacitor.isNativePlatform() ? [AUDITORIAS] : MENU_CALIDAD;
    case ROLES.COMPRAS:
      return MENU_COMPRAS;
    case ROLES.GUARDIA:
      return MENU_GUARDIA;
    default:
      return [];
  }
}
