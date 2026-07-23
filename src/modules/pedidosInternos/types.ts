export interface LineaPedidoInterno {
  nro_linea: number;
  nro_producto: string;
  descripcion: string | null;
  cantidad: number;
  cantidad_recibida: number;
  porcentaje_entrega: number;
}

export interface PedidoInterno {
  nro_pedido: string;
  proveedor: string | null;
  ruc_proveedor: string | null;
  fecha_registro_bc: string | null;
  fecha_recepcion_esperada: string | null;
  estado_pedido_bc: string | null;
  cod_almacen: string;
  porcentaje_entrega: number;
  lineas: LineaPedidoInterno[];
}

export interface BodegaPedidos {
  porcentaje_entrega: number;
  pedidos: PedidoInterno[];
}

/** Llave = código de bodega (CD-0001/CD-0002/CD-0003). */
export type PedidosPorBodega = Record<string, BodegaPedidos>;

export const BODEGAS_PEDIDOS_INTERNOS = ['CD-0001', 'CD-0002', 'CD-0003'] as const;

export interface FiltrosPedidosInternos {
  fecha_desde?: string;
  fecha_hasta?: string;
  proveedor?: string;
  producto?: string;
}