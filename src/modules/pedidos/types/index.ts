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
  /** Fecha con la que se clasifica en Vigentes/Históricos (esperada, o registro si no vino de BC). */
  fecha_recepcion_efectiva: string;
  usa_fecha_registro_como_recepcion: boolean;
  estado: 'Abierto' | 'Cerrado';
  /** Entregado sobre pedido, por cantidad y con tope por línea. Es el mismo número que alimenta el fill rate de la calificación. */
  porcentaje_entrega: number;
  /** true = este pedido entra al promedio del fill rate de la calificación global (solo los cerrados). */
  cuenta_para_calificacion: boolean;
  lineas: LineaPedido[];
}