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
  /**
   * Fecha de ENTREGA esperada. La pantalla la fija siempre en hoy y no se
   * puede cambiar (decisión del negocio, 1-sep-2026): esta vista es para
   * saber qué se recibe HOY, no para revisar el histórico. Por eso se
   * quitaron los filtros «Desde» y «Hasta», que filtraban además por la
   * fecha de REGISTRO del pedido en BC, no por la de entrega.
   */
  fecha_recepcion_esperada?: string;
  proveedor?: string;
  producto?: string;
}