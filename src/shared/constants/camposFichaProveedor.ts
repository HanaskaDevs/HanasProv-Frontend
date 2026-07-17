// src/shared/constants/camposFichaProveedor.ts
export const CAMPOS_SECCION1 = [
  'ruc',
  'clase_contribuyente',
  'razon_social',
  'nombre_comercial',
  'email',
  'telefono',
  'direccion',
  'ciudad',
  'pagina_web',
  'representante_legal',
  'correo_representante',
  'telefono_representante',
  'contacto_venta',
  'correo_venta',
  'telefono_contacto_venta',
  'contacto_calidad',
  'correo_calidad',
  'telefono_contacto_calidad',
  'contacto_contabilidad',
  'correo_contabilidad',
  'telefono_contabilidad',
] as const;

export const CAMPO_CLASE = 'clase_proveedor';
export const CAMPO_CATEGORIA = 'categoria_productos';

export type CampoFichaCalificable = (typeof CAMPOS_SECCION1)[number] | typeof CAMPO_CLASE | typeof CAMPO_CATEGORIA;

/** Etiqueta legible para cada campo -> la usan tanto la vista de calificación del admin como la de corrección del proveedor. */
export const ETIQUETAS_CAMPOS_FICHA: Record<CampoFichaCalificable, string> = {
  ruc: 'RUC',
  clase_contribuyente: 'Clase de contribuyente',
  razon_social: 'Razón social',
  nombre_comercial: 'Nombre comercial',
  email: 'Correo',
  telefono: 'Teléfono',
  direccion: 'Dirección',
  ciudad: 'Ciudad',
  pagina_web: 'Página web',
  representante_legal: 'Representante legal · Nombre',
  correo_representante: 'Representante legal · Correo',
  telefono_representante: 'Representante legal · Teléfono',
  contacto_venta: 'Contacto de ventas · Nombre',
  correo_venta: 'Contacto de ventas · Correo',
  telefono_contacto_venta: 'Contacto de ventas · Teléfono',
  contacto_calidad: 'Contacto de calidad · Nombre',
  correo_calidad: 'Contacto de calidad · Correo',
  telefono_contacto_calidad: 'Contacto de calidad · Teléfono',
  contacto_contabilidad: 'Contacto de contabilidad · Nombre',
  correo_contabilidad: 'Contacto de contabilidad · Correo',
  telefono_contabilidad: 'Contacto de contabilidad · Teléfono',
  clase_proveedor: 'Clase de Proveedor',
  categoria_productos: 'Categoría de Productos',
};

/** Para el formulario de corrección del proveedor: a qué sección/paso pertenece cada campo. */
export function seccionDelCampo(campo: string): 1 | 2 | 3 {
  if (campo === CAMPO_CLASE) return 2;
  if (campo === CAMPO_CATEGORIA) return 3;
  return 1;
}