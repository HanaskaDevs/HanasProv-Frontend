import apiClient from '../../../shared/api/apiClient';

export interface UsuarioInterno {
  id: number;
  email: string;
  nombre_completo: string;
  cargo: string | null;
  telefono: string | null;
  activo: boolean;
  /**
   * Distinto de `activo`: el usuario se bloqueó SOLO, tras 3 intentos de
   * login fallidos seguidos. `activo` sigue en true -> sin este campo, la
   * pantalla mostraría "Inactivar" y no habría forma de destrabarlo.
   */
  bloqueado_por_intentos: boolean;
  fecha_bloqueo: string | null;
  requiere_activacion: boolean;
  ultimo_acceso: string | null;
  rol: { id_rol: number | string; nombre_rol: string } | null;
  fecha_creacion: string;
}

export interface UsuarioExterno {
  id: number;
  email: string;
  nombre_completo: string;
  activo: boolean;
  /**
   * Distinto de `activo`: el usuario se bloqueó SOLO, tras 3 intentos de
   * login fallidos seguidos. `activo` sigue en true -> sin este campo, la
   * pantalla mostraría "Inactivar" y no habría forma de destrabarlo.
   */
  bloqueado_por_intentos: boolean;
  fecha_bloqueo: string | null;
  requiere_activacion: boolean;
  ultimo_acceso: string | null;
  ficha_completada: boolean;
  proveedor: { id_proveedor: number; razon_social: string; porcentaje_completado_ficha: number } | null;
  rol: { id_rol: number | string; nombre_rol: string } | null;
  fecha_creacion: string;
}

/**
 * El resultado de mandar el código de activación, ya en castellano: lo
 * arma el backend (ver ResultadoEnvioCodigo) porque es el único que sabe
 * qué contestó el servidor de correo.
 */
export interface ResultadoEnvio {
  enviado: boolean;
  correo: string;
  titulo: string;
  mensaje: string;
  sugerencia: string | null;
  /** Respuesta cruda del servidor. Solo para Sistemas, nunca de entrada. */
  detalle_tecnico: string | null;
}

export async function listarInternos(): Promise<UsuarioInterno[]> {
  const { data } = await apiClient.get<UsuarioInterno[]>('/usuarios/internos');
  return data;
}

/**
 * Crear el usuario y enviarle el código son DOS cosas: el usuario puede
 * quedar creado y el correo no salir. Por eso vienen separados.
 */
export async function crearInterno(
  email: string,
  idRol: number,
  idEmpresas: number[]
): Promise<{ usuario: UsuarioInterno; envio: ResultadoEnvio }> {
  const { data } = await apiClient.post<{ usuario: UsuarioInterno; envio: ResultadoEnvio }>(
    '/usuarios/internos',
    { email, id_rol: idRol, id_empresas: idEmpresas }
  );
  return data;
}

export async function listarExternos(): Promise<UsuarioExterno[]> {
  const { data } = await apiClient.get<UsuarioExterno[]>('/usuarios/externos');
  return data;
}

export async function crearExterno(
  email: string,
  idEmpresas: number[]
): Promise<{ usuario: UsuarioExterno; envio: ResultadoEnvio }> {
  const { data } = await apiClient.post<{ usuario: UsuarioExterno; envio: ResultadoEnvio }>(
    '/usuarios/externos',
    { email, id_empresas: idEmpresas }
  );
  return data;
}

/** Tope de filas por carga: tiene que coincidir con CrearUsuariosProveedorLoteRequest::MAX_FILAS. */
export const MAX_FILAS_CARGA_MASIVA = 500;

/**
 * Una fila del Excel de carga masiva, tal como viaja al backend.
 *
 * `empresas` va como texto (lo que la persona escribió en la celda), no
 * como Id_Empresa: el backend es el que resuelve los nombres contra la
 * tabla Empresa. Así el archivo no puede pedir acceso a una empresa donde
 * quien carga no es Sistemas, ni siquiera llamando la API a mano.
 */
export interface FilaCargaMasiva {
  /** Fila real de la hoja de cálculo, para que el reporte diga cuál corregir. */
  numero_fila: number;
  codigo_proveedor: string | null;
  email: string;
  empresas: string[];
}

export type EstadoFilaCarga = 'creado' | 'acceso_agregado' | 'omitido' | 'error';

export interface ResultadoFilaCarga {
  numero_fila: number;
  codigo_proveedor: string | null;
  email: string;
  /** Nombres de las empresas que el backend logró resolver. */
  empresas: string[];
  estado: EstadoFilaCarga;
  mensaje: string;
}

export interface ReporteCargaMasiva {
  resumen: {
    total: number;
    creados: number;
    acceso_agregado: number;
    omitidos: number;
    con_error: number;
  };
  filas: ResultadoFilaCarga[];
}

/**
 * Sube las filas del Excel. Responde 200 con el reporte incluso cuando hay
 * filas con error: el éxito parcial es lo normal en una carga masiva, así
 * que el resultado SIEMPRE se lee del cuerpo y no del código HTTP.
 */
export async function crearExternosLote(filas: FilaCargaMasiva[]): Promise<ReporteCargaMasiva> {
  const { data } = await apiClient.post<ReporteCargaMasiva>('/usuarios/externos/lote', { filas });
  return data;
}

export interface EstadoColaCorreo {
  fallidos_recientes: number;
  dias: number;
  ultimo_fallo: string | null;
}

/**
 * Cuántos correos falló el servidor de correo últimamente.
 *
 * El modal lo consulta al abrirse: si el servidor viene rechazando envíos
 * ("450 too much mail"), una carga de 80 filas va a crear los 80 usuarios
 * pero varios proveedores no van a recibir su código. Vale más avisarlo
 * antes que descubrirlo cuando alguien llame preguntando.
 */
export async function obtenerEstadoColaCorreo(): Promise<EstadoColaCorreo> {
  const { data } = await apiClient.get<EstadoColaCorreo>('/usuarios/externos/estado-cola-correo');
  return data;
}

export async function inactivarUsuario(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/usuarios/${id}/inactivar`);
  return data;
}
/**
 * Reactiva (o desbloquea) y le manda un código para que fije una
 * contraseña nueva. Devuelve el resultado de ESE envío: desbloquear sin
 * que le llegue el código deja a la persona igual de afuera que antes.
 */
export async function reactivarUsuario(id: number): Promise<ResultadoEnvio> {
  const { data } = await apiClient.patch<ResultadoEnvio>(`/usuarios/${id}/reactivar`);
  return data;
}

/**
 * BORRA DEFINITIVAMENTE la cuenta. No es una baja lógica: la fila deja de
 * existir y el correo queda libre. El backend solo lo permite sobre
 * cuentas que nunca se activaron, y solo a Sistemas.
 */
export async function eliminarCuentaDefinitivamente(id: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/usuarios/${id}`);
  return data;
}

export async function reenviarActivacion(id: number): Promise<ResultadoEnvio> {
  const { data } = await apiClient.post<ResultadoEnvio>(`/usuarios/${id}/reenviar-activacion`);
  return data;
}

export async function agregarEmpresaUsuario(id: number, idEmpresa: number, idRol?: number): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/usuarios/${id}/empresas`, {
    id_empresa: idEmpresa,
    id_rol: idRol,
  });
  return data;
}
export interface UsuarioDetalle {
  id: number;
  email: string;
  nombre_completo: string;
  tipo_usuario: 'Interno' | 'Proveedor';
  activo: boolean;
  empresas: { id_empresa: number; razon_social: string; nombre_comercial: string | null; id_rol: number; nombre_rol: string; bodegas_asignadas: string[] }[];
}

export async function obtenerDetalleInterno(id: number): Promise<UsuarioDetalle> {
  const { data } = await apiClient.get<UsuarioDetalle>(`/usuarios/internos/${id}`);
  return data;
}

export async function obtenerDetalleExterno(id: number): Promise<UsuarioDetalle> {
  const { data } = await apiClient.get<UsuarioDetalle>(`/usuarios/externos/${id}`);
  return data;
}

export async function actualizarEmailUsuario(id: number, email: string): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/email`, { email });
  return data;
}

export async function actualizarRolUsuarioEmpresa(id: number, idEmpresa: number, idRol: number): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/empresas/${idEmpresa}`, { id_rol: idRol });
  return data;
}

export async function actualizarBodegasUsuarioEmpresa(id: number, idEmpresa: number, codigosBodega: string[]): Promise<{ message: string }> {
  const { data } = await apiClient.put(`/usuarios/${id}/empresas/${idEmpresa}/bodegas`, { codigos_bodega: codigosBodega });
  return data;
}

export async function quitarAccesoUsuarioEmpresa(id: number, idEmpresa: number): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/usuarios/${id}/empresas/${idEmpresa}`);
  return data;
}