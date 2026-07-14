import apiClient from '../../../shared/api/apiClient';
import type { LineaRecepcionInput, PedidoInterno } from '../types';

export async function listarPedidosInternos(
  estado: 'Abierto' | 'Cerrado',
  busqueda?: string
): Promise<PedidoInterno[]> {
  const { data } = await apiClient.get<PedidoInterno[]>('/pedidos-internos', {
    params: { estado, busqueda: busqueda || undefined },
  });
  return data;
}

export async function obtenerPedidoInterno(idPedido: number): Promise<PedidoInterno> {
  const { data } = await apiClient.get<PedidoInterno>(`/pedidos-internos/${idPedido}`);
  return data;
}

export async function registrarRecepcion(
  idPedido: number,
  fechaRecepcion: string,
  lineas: LineaRecepcionInput[]
): Promise<{ message: string }> {
  const formData = new FormData();
  formData.append('fecha_recepcion', fechaRecepcion);

  lineas.forEach((linea, i) => {
    formData.append(`lineas[${i}][id_detalle_pedido_compra]`, String(linea.id_detalle_pedido_compra));
    formData.append(`lineas[${i}][cantidad_recibida]`, String(linea.cantidad_recibida));
    formData.append(`lineas[${i}][recepcion_completa]`, linea.recepcion_completa ? '1' : '0');
    if (linea.observacion) {
      formData.append(`lineas[${i}][observacion]`, linea.observacion);
    }
    linea.imagenes.forEach((imagen) => {
      formData.append(`lineas[${i}][imagenes][]`, imagen);
    });
  });

  const { data } = await apiClient.post(`/pedidos-internos/${idPedido}/recepciones`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function actualizarRecepcionDetalle(
  idDetalle: number,
  payload: {
    cantidad_recibida: number;
    recepcion_completa: boolean;
    observacion?: string;
    imagenes: File[];
  }
): Promise<void> {
  const formData = new FormData();
  formData.append('cantidad_recibida', String(payload.cantidad_recibida));
  formData.append('recepcion_completa', payload.recepcion_completa ? '1' : '0');
  if (payload.observacion) {
    formData.append('observacion', payload.observacion);
  }
  payload.imagenes.forEach((imagen) => formData.append('imagenes[]', imagen));
  formData.append('_method', 'PUT');

  await apiClient.post(`/pedidos-internos/recepciones-detalle/${idDetalle}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

export async function cerrarPedidoInterno(idPedido: number): Promise<{ message: string }> {
  const { data } = await apiClient.patch(`/pedidos-internos/${idPedido}/cerrar`);
  return data;
}

export async function verImagenRecepcion(idImagen: number): Promise<void> {
  const { data } = await apiClient.get(`/pedidos-internos/recepciones-imagen/${idImagen}/ver`, {
    responseType: 'blob',
  });
  const url = window.URL.createObjectURL(data);
  window.open(url, '_blank');
}