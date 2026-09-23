import apiClient from '../../../shared/api/apiClient';
import type {
  GrupoProducto,
  NuevoProducto,
  Producto,
  ProveedorConProductos,
  ResumenRegistro,
  SolicitudCambioPrecio,
  TipoDocumentoProducto,
  UnidadPresentacion,
} from '../types';

export interface RespuestaPaginada<T> {
  data: T[];
  meta: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

/**
 * DE QUIÉN son los productos con los que se está trabajando.
 *
 * - undefined/null -> los del propio usuario proveedor (/mis-productos).
 * - un id          -> los de ESE proveedor, manejados por personal interno
 *                     (Compras, Admin, Sistemas) en /productos-proveedor.
 *
 * Las dos familias de endpoints hacen exactamente lo mismo y con las mismas
 * reglas (el backend resuelve el proveedor en un solo lugar, ver
 * ProductoService::proveedorDeTrabajo). Por eso cada función de este archivo
 * recibe el id como último parámetro opcional en vez de existir dos veces:
 * así ListaProductos sirve tal cual para las dos pantallas y no hay dos
 * copias de la misma pantalla que se separen con el tiempo.
 */
export type IdProveedorObjetivo = number | null | undefined;

function base(idProveedor: IdProveedorObjetivo): string {
  return idProveedor ? `/productos-proveedor/${idProveedor}` : '/mis-productos';
}

/**
 * Paginado y búsqueda del lado del servidor -> con catálogos de 1000+
 * productos, traer todo de una vez y filtrar/paginar en el navegador
 * sería impracticable (payload gigante + el browser renderizando miles
 * de filas). Acá nunca se pide más de una página a la vez.
 */
export type EstadoFiltroProducto = 'aprobado' | 'rechazado' | 'en_revision' | 'pendiente';

export async function listarProductos(
  pagina: number,
  busqueda: string,
  estados: EstadoFiltroProducto[] = [],
  idProveedor?: IdProveedorObjetivo
): Promise<RespuestaPaginada<Producto>> {
  const { data } = await apiClient.get<RespuestaPaginada<Producto>>(base(idProveedor), {
    params: {
      page: pagina,
      per_page: 20,
      search: busqueda || undefined,
      // Varios estados a la vez (filtro tipo BC) -> se mandan
      // coma-separados, el backend hace un whereIn en vez de un where.
      estado: estados.length > 0 ? estados.join(',') : undefined,
    },
  });
  return data;
}

export async function crearProducto(payload: NuevoProducto, idProveedor?: IdProveedorObjetivo): Promise<Producto> {
  const { data } = await apiClient.post<Producto>(base(idProveedor), payload);
  return data;
}

/**
 * Edita un producto que todavía se puede tocar (no está en revisión ni
 * aprobado). El precio de un producto ya aprobado NO pasa por acá: sigue
 * yendo por solicitarCambioPrecio, que lo aprueba Admin/Calidad.
 */
export async function actualizarProducto(
  idProducto: number,
  payload: NuevoProducto,
  idProveedor?: IdProveedorObjetivo
): Promise<Producto> {
  const url = idProveedor ? `/productos-proveedor/${idProveedor}/${idProducto}` : `/mis-productos/${idProducto}`;
  const { data } = await apiClient.put<Producto>(url, payload);
  return data;
}

export async function subirDocumentoProducto(
  idProducto: number,
  idTipoDocumento: number,
  archivo: File,
  fechaCaducidad?: string,
  nombreDocumento?: string,
  idProveedor?: IdProveedorObjetivo
): Promise<void> {
  const formData = new FormData();
  formData.append('archivo', archivo);
  if (fechaCaducidad) formData.append('fecha_caducidad', fechaCaducidad);
  if (nombreDocumento) formData.append('nombre_documento', nombreDocumento);

  const url = idProveedor
    ? `/productos-proveedor/${idProveedor}/${idProducto}/documentos/${idTipoDocumento}`
    : `/mis-productos/${idProducto}/documentos/${idTipoDocumento}`;

  await apiClient.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/**
 * Catálogos que NO dependen de quién esté trabajando: son los mismos para
 * el proveedor y para el comprador, así que viven fuera de base().
 */
export async function listarUnidadesPresentacion(): Promise<UnidadPresentacion[]> {
  const { data } = await apiClient.get<UnidadPresentacion[]>('/mis-productos/unidades-presentacion');
  return data;
}

/** Grupos de producto activos (EK, CD, PH, IM...) para el multi-select. */
export async function listarGruposProducto(): Promise<GrupoProducto[]> {
  const { data } = await apiClient.get<GrupoProducto[]>('/catalogos/grupos-producto');
  return data;
}

/**
 * Catálogo activo de tipos de documento de producto (dinámico, viene
 * del backend) -> reemplaza el TIPOS_DOCUMENTO hardcodeado que antes
 * vivía en ModalDocumentosProducto.tsx.
 */
export async function listarTiposDocumentoProducto(): Promise<TipoDocumentoProducto[]> {
  const { data } = await apiClient.get<TipoDocumentoProducto[]>('/mis-productos/tipos-documento');
  return data;
}

/** Proveedores de la empresa activa, para el selector del comprador. */
export async function listarProveedoresConProductos(): Promise<ProveedorConProductos[]> {
  const { data } = await apiClient.get<ProveedorConProductos[]>('/productos-proveedor/proveedores');
  return data;
}

export async function obtenerUrlVisorDocumentoProducto(
  idDocumentoProducto: number,
  idProveedor?: IdProveedorObjetivo
): Promise<string> {
  const url = idProveedor
    ? `/productos-proveedor/${idProveedor}/documentos/${idDocumentoProducto}/ver`
    : `/mis-productos/documentos/${idDocumentoProducto}/ver`;

  const { data } = await apiClient.get(url, { responseType: 'blob' });
  return window.URL.createObjectURL(data);
}

export async function obtenerResumenRegistro(
  idsProductos?: number[],
  idProveedor?: IdProveedorObjetivo
): Promise<ResumenRegistro> {
  const { data } = await apiClient.get<ResumenRegistro>(`${base(idProveedor)}/resumen-registro`, {
    params: idsProductos && idsProductos.length > 0 ? { ids: idsProductos.join(',') } : undefined,
  });
  return data;
}

export async function registrarProductos(
  idsProductos: number[],
  idProveedor?: IdProveedorObjetivo
): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.post(`${base(idProveedor)}/registrar`, { ids: idsProductos });
  return data;
}

export async function eliminarProducto(idProducto: number, idProveedor?: IdProveedorObjetivo): Promise<{ message: string }> {
  const url = idProveedor ? `/productos-proveedor/${idProveedor}/${idProducto}` : `/mis-productos/${idProducto}`;
  const { data } = await apiClient.delete(url);
  return data;
}

export async function eliminarProductosMasivo(
  ids: number[],
  idProveedor?: IdProveedorObjetivo
): Promise<{ message: string; total: number }> {
  const { data } = await apiClient.delete(`${base(idProveedor)}/masivo`, { data: { ids } });
  return data;
}

export async function eliminarDocumentoProducto(
  idDocumentoProducto: number,
  idProveedor?: IdProveedorObjetivo
): Promise<{ message: string }> {
  const url = idProveedor
    ? `/productos-proveedor/${idProveedor}/documentos/${idDocumentoProducto}`
    : `/mis-productos/documentos/${idDocumentoProducto}`;
  const { data } = await apiClient.delete(url);
  return data;
}

export async function confirmarCorreccionProducto(idProducto: number, idProveedor?: IdProveedorObjetivo): Promise<void> {
  const url = idProveedor
    ? `/productos-proveedor/${idProveedor}/${idProducto}/confirmar-correccion`
    : `/mis-productos/${idProducto}/confirmar-correccion`;
  await apiClient.post(url);
}

/**
 * Pide cambiar el precio de un producto ya creado (solo si el proveedor
 * está Aprobado -> lo valida el backend). Bloquea el precio hasta que
 * Admin/Calidad de la empresa lo apruebe o lo rechace.
 *
 * SIN idProveedor a propósito: la solicitud de cambio de precio la firma
 * el proveedor, es su declaración de precio. El comprador que necesite
 * corregir un precio lo hace mientras el producto todavía es editable
 * (ver actualizarProducto).
 */
export async function solicitarCambioPrecio(idProducto: number, precioNuevo: number): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.patch<SolicitudCambioPrecio>(`/mis-productos/${idProducto}/precio`, {
    precio_nuevo: precioNuevo,
  });
  return data;
}

export async function listarCambiosPrecioPendientes(): Promise<SolicitudCambioPrecio[]> {
  const { data } = await apiClient.get<SolicitudCambioPrecio[]>('/cambios-precio');
  return data;
}

export async function aprobarCambioPrecio(idSolicitud: number): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.post<SolicitudCambioPrecio>(`/cambios-precio/${idSolicitud}/aprobar`);
  return data;
}

export async function rechazarCambioPrecio(idSolicitud: number, motivo?: string): Promise<SolicitudCambioPrecio> {
  const { data } = await apiClient.post<SolicitudCambioPrecio>(`/cambios-precio/${idSolicitud}/rechazar`, { motivo });
  return data;
}

/* -------------------------------------------------------------------------
 * PRIMER PASO del circuito de aprobación: la bandeja de Compras.
 *
 *     proveedor envía  ->  COMPRAS  ->  Calidad  ->  aprobado
 *
 * Compras revisa antes que nadie: aprueba (y ahí pasa a Calidad), rechaza
 * para que el proveedor corrija, o elimina el producto del catálogo. Las
 * dos últimas exigen un motivo que le llega al proveedor por correo.
 * ------------------------------------------------------------------------- */

export async function listarProductosEnRevision(): Promise<Producto[]> {
  const { data } = await apiClient.get<Producto[]>('/productos-revision');
  return data;
}

export async function aprobarEnCompras(idProducto: number): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/productos-revision/${idProducto}/aprobar`);
  return data;
}

export async function rechazarEnCompras(idProducto: number, observacion: string): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/productos-revision/${idProducto}/rechazar`, { observacion });
  return data;
}

export async function eliminarEnCompras(idProducto: number, observacion: string): Promise<{ message: string }> {
  const { data } = await apiClient.post(`/productos-revision/${idProducto}/eliminar`, { observacion });
  return data;
}
