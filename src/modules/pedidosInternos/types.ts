export interface RecepcionImagen {
  id_recepcion_imagen: number;
  nombre_original: string;
}

export interface RecepcionPedidoDetalle {
  id_recepcion_pedido_detalle: number;
  fecha_recepcion: string;
  registrado_por: string | null;
  cantidad_recibida: string;
  recepcion_completa: boolean;
  observacion: string | null;
  imagenes: RecepcionImagen[];
}

export interface LineaPedidoInterno {
  id_detalle_pedido_compra: number;
  nro_linea: number;
  codigo_producto: string;
  descripcion: string | null;
  cantidad_pedida: string;
  cantidad_recibida: string;
  recepciones: RecepcionPedidoDetalle[];
}

export interface PedidoInterno {
  id_pedido_compra: number;
  nro_pedido: string;
  fecha_registro_bc: string;
  fecha_recepcion_esperada: string | null;
  estado: 'Abierto' | 'Cerrado';
  proveedor: {
    id_proveedor: number;
    razon_social: string;
  };
  lineas: LineaPedidoInterno[];
}

export interface LineaRecepcionInput {
  id_detalle_pedido_compra: number;
  cantidad_recibida: number;
  recepcion_completa: boolean;
  observacion?: string;
  imagenes: File[];
}