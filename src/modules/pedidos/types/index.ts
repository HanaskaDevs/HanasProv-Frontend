export interface LineaPedido {
  nro_linea: number;
  codigo_producto: string;
  descripcion: string | null;
  cantidad: string;
  cantidad_recibida: number;
  porcentaje_entrega: number;
}

export interface PedidoCompra {
  id_pedido_compra: number;
  nro_pedido: string;
  fecha_registro_bc: string;
  fecha_recepcion_esperada: string | null;
  estado: 'Abierto' | 'Cerrado';
  porcentaje_entrega: number;
  lineas: LineaPedido[];
}