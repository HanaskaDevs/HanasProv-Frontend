import apiClient from '../../../shared/api/apiClient';
import type { DestinatarioInput, ImpactoProveedor, ProveedorBusqueda, Reclamo, ReclamoMensaje, TipoReclamo } from '../types';

function construirFormData(mensaje: string, imagenes: File[]): FormData {
    const formData = new FormData();
    formData.append('mensaje', mensaje);
    imagenes.forEach((img) => formData.append('imagenes[]', img));
    return formData;
}

// ---- Usuarios internos ----

export async function listarReclamosAbiertos(): Promise<Reclamo[]> {
    const { data } = await apiClient.get<Reclamo[]>('/reclamos/abiertos');
    return data;
}

export async function listarReclamosCerrados(): Promise<Reclamo[]> {
    const { data } = await apiClient.get<Reclamo[]>('/reclamos/cerrados');
    return data;
}

export async function obtenerReclamo(idReclamo: number): Promise<Reclamo> {
    const { data } = await apiClient.get<Reclamo>(`/reclamos/${idReclamo}`);
    return data;
}

export async function buscarProveedores(termino: string): Promise<ProveedorBusqueda[]> {
    const { data } = await apiClient.get<ProveedorBusqueda[]>('/reclamos/buscar-proveedores', {
        params: { q: termino },
    });
    return data;
}

export async function crearReclamo(payload: {
    id_proveedor: number;
    asunto: string;
    tipo_reclamo: TipoReclamo;
    impacto_proveedor: ImpactoProveedor;
    mensaje: string;
    destinatarios: DestinatarioInput[];
    imagenes: File[];
}): Promise<Reclamo> {
    const formData = new FormData();
    formData.append('id_proveedor', String(payload.id_proveedor));
    formData.append('asunto', payload.asunto);
    formData.append('tipo_reclamo', payload.tipo_reclamo);
    formData.append('impacto_proveedor', payload.impacto_proveedor);
    formData.append('mensaje', payload.mensaje);

    payload.destinatarios.forEach((d, i) => {
        formData.append(`destinatarios[${i}][rol_contacto]`, d.rol_contacto);
        if (d.nombre_contacto) formData.append(`destinatarios[${i}][nombre_contacto]`, d.nombre_contacto);
        formData.append(`destinatarios[${i}][email]`, d.email);
    });

    payload.imagenes.forEach((img) => formData.append('imagenes[]', img));

    const { data } = await apiClient.post<Reclamo>('/reclamos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

export async function responderReclamo(idReclamo: number, mensaje: string, imagenes: File[]): Promise<ReclamoMensaje> {
    const { data } = await apiClient.post<ReclamoMensaje>(
        `/reclamos/${idReclamo}/responder`,
        construirFormData(mensaje, imagenes),
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
}

export async function cerrarReclamo(idReclamo: number): Promise<{ message: string }> {
    const { data } = await apiClient.patch(`/reclamos/${idReclamo}/cerrar`);
    return data;
}

// ---- Proveedor ----

export async function listarMisReclamosAbiertos(): Promise<Reclamo[]> {
    const { data } = await apiClient.get<Reclamo[]>('/mis-reclamos/abiertos');
    return data;
}

export async function listarMisReclamosCerrados(): Promise<Reclamo[]> {
    const { data } = await apiClient.get<Reclamo[]>('/mis-reclamos/cerrados');
    return data;
}

export async function obtenerMiReclamo(idReclamo: number): Promise<Reclamo> {
    const { data } = await apiClient.get<Reclamo>(`/mis-reclamos/${idReclamo}`);
    return data;
}

export async function responderMiReclamo(idReclamo: number, mensaje: string, imagenes: File[]): Promise<ReclamoMensaje> {
    const { data } = await apiClient.post<ReclamoMensaje>(
        `/mis-reclamos/${idReclamo}/responder`,
        construirFormData(mensaje, imagenes),
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
}
export async function verImagenReclamo(idImagen: number): Promise<void> {
  const { data } = await apiClient.get(`/reclamos/imagenes/${idImagen}/ver`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank');
}

export async function verImagenMiReclamo(idImagen: number): Promise<void> {
  const { data } = await apiClient.get(`/mis-reclamos/imagenes/${idImagen}/ver`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank');
}