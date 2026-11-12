export interface EmpresaAcceso {
  id_empresa: number;
  razon_social: string;
  nombre_comercial: string | null;
  // El driver de SQL Server a veces devuelve numéricos como string.
  id_rol: number | string;
  nombre_rol: string | null;
  activo: boolean;
}

export interface Usuario {
  id: number;
  email: string;
  nombre_completo: string;
  cargo: string | null;
  tipo_usuario: 'Interno' | 'Proveedor';
  requiere_cambio_password: boolean;
  /**
   * true = es la persona que resuelve las solicitudes de arribo tardío
   * (su correo es el de portal.email_aprobacion_arribo en el backend).
   * Solo sirve para mostrarle el ítem "Aprobaciones de arribo" en el
   * menú; el permiso real lo decide el backend por rol.
   */
  resuelve_aprobaciones_arribo?: boolean;
  empresas: EmpresaAcceso[];
}

export interface LoginResponse {
  usuario: Usuario;
  token: string;
  id_empresa_activa: number | null;
}

export interface MeResponse {
  usuario: Usuario;
  id_empresa_activa: number | null;
}

// Nombres de rol tal como existen en la tabla Rol. Se usan para gatear UI,
// la autorización real siempre la vuelve a validar el backend.
export const ROLES = {
  SISTEMAS: 'Sistemas',
  ADMIN: 'Admin',
  CALIDAD: 'Calidad',
  COMPRAS: 'Compras',
  PROVEEDOR: 'Proveedor',
  // Guardia de recepción: solo marca "el proveedor arribó" en el
  // seguimiento en vivo del calendario de horarios de entrega.
  GUARDIA: 'Guardia',
  // Catálogo (29-oct-2026): datos y códigos BC de los productos. Edita datos
  // de productos (estén o no aprobados), no documentos; no aprueba.
  CATALOGO: 'Catálogo',
  // Modo TV (11-nov-2026): la cuenta de las pantallas de TV. Solo ve el
  // calendario en Modo TV y su sesión no vence (lo decide el backend).
  MODO_TV: 'Modo TV',
} as const;
