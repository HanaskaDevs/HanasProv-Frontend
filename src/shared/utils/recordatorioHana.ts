/**
 * Recordatorios de Hana disparados desde una pantalla.
 *
 * La pantalla que sabe que falta algo (ej. Documentación sabe que el
 * proveedor no cargó su Plan de contingencia) no conoce a Hana: le avisa
 * con un evento de ventana, igual que 'hana:celebrar'. HanaBot abre el
 * chat, escribe el mensaje y muestra un botón que lleva a donde hay que ir.
 */
export const EVENTO_RECORDATORIO_HANA = 'hana:recordatorio';

export interface AccionHana {
  etiqueta: string;
  ruta: string;
  /**
   * Va en location.state, no en la URL: cada navigate() crea una entrada
   * nueva aunque la ruta sea la misma, así el botón vuelve a llevar al
   * documento aunque el proveedor ya esté en esa pantalla.
   */
  estado?: Record<string, unknown>;
}

export interface RecordatorioHana {
  mensaje: string;
  accion?: AccionHana;
}

export function pedirRecordatorioHana(recordatorio: RecordatorioHana): void {
  window.dispatchEvent(new CustomEvent<RecordatorioHana>(EVENTO_RECORDATORIO_HANA, { detail: recordatorio }));
}
