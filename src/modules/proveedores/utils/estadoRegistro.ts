import type { ProveedorListado } from '../types';

/**
 * En qué punto del registro está un proveedor, para la ficha y para la
 * documentación por separado (14-oct-2026).
 *
 * Se arma con datos que la lista YA traía; no hizo falta tocar el backend.
 * Vive acá, y no dentro de una pantalla, para que "pendiente de calificar"
 * signifique lo mismo en todos lados: si cada pantalla lo calculara a su
 * manera, el contador de una diría 12 y el de otra 14 sobre los mismos
 * proveedores.
 *
 * Los cuatro estados siguen el recorrido real:
 *
 *   incompleta -> el proveedor todavía no terminó de cargar
 *   pendiente  -> la terminó y está esperando que alguien la califique
 *   rechazada  -> se calificó con observaciones; espera que corrija
 *   aprobada   -> calificada y aprobada
 *
 * 'pendiente' es el que importa: es la cola de trabajo de quien califica.
 */
export type EstadoRegistro = 'incompleta' | 'pendiente' | 'rechazada' | 'aprobada';

export interface DescripcionEstado {
  estado: EstadoRegistro;
  etiqueta: string;
  /** Una línea más de contexto debajo de la insignia. */
  detalle: string | null;
}

export function estadoFicha(p: ProveedorListado): DescripcionEstado {
  const porcentaje = Number(p.porcentaje_completado_ficha) || 0;

  if (porcentaje < 100) {
    return {
      estado: 'incompleta',
      etiqueta: 'Incompleta',
      detalle: `${porcentaje}% cargada`,
    };
  }

  if (p.estado_calificacion_ficha === 'Aprobado') {
    return { estado: 'aprobada', etiqueta: 'Aprobada', detalle: null };
  }

  if (p.estado_calificacion_ficha === 'Rechazado') {
    return {
      estado: 'rechazada',
      etiqueta: 'Rechazada',
      detalle: 'Esperando que corrija',
    };
  }

  return {
    estado: 'pendiente',
    etiqueta: 'Por calificar',
    detalle: 'Registrada, sin revisar',
  };
}

export function estadoDocumentacion(p: ProveedorListado): DescripcionEstado {
  const totales = Number(p.documentos_totales) || 0;
  const pendientes = Number(p.documentos_pendientes_calificar) || 0;

  // Hasta que el proveedor aprieta "Registrar documentación", los
  // documentos que haya subido no están listos para revisar: puede seguir
  // cambiándolos.
  if (!p.documentacion_registrada) {
    return {
      estado: 'incompleta',
      etiqueta: 'Incompleta',
      detalle:
        totales === 0 ? 'Sin documentos' : `${totales} cargado${totales === 1 ? '' : 's'}, sin registrar`,
    };
  }

  if (p.estado_calificacion_documentacion === 'Rechazado') {
    return {
      estado: 'rechazada',
      etiqueta: 'Rechazada',
      detalle: 'Esperando que corrija',
    };
  }

  if (p.estado_calificacion_documentacion === 'Aprobado') {
    return { estado: 'aprobada', etiqueta: 'Aprobada', detalle: null };
  }

  return {
    estado: 'pendiente',
    etiqueta: 'Por calificar',
    detalle:
      pendientes > 0
        ? `${pendientes} documento${pendientes === 1 ? '' : 's'} sin revisar`
        : 'Registrada, sin revisar',
  };
}

/** Tono de la insignia: 'pendiente' resalta porque es trabajo esperando. */
export const TONO_ESTADO: Record<EstadoRegistro, 'neutral' | 'warning' | 'amber' | 'success'> = {
  incompleta: 'neutral',
  pendiente: 'warning',
  rechazada: 'amber',
  aprobada: 'success',
};
