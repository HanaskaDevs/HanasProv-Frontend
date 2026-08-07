export interface ContactoProveedor {
  rol_contacto: string;
  nombre_contacto: string | null;
  email: string;
}

export interface ProveedorBusqueda {
  id_proveedor: number;
  razon_social: string;
  ruc: string;
  contactos: ContactoProveedor[];
}

export interface ReclamoMensajeImagen {
  id_reclamo_mensaje_imagen: number;
  nombre_original: string;
}

export interface ReclamoMensaje {
  id_reclamo_mensaje: number;
  mensaje: string;
  fecha_creacion: string;
  autor: {
    id_usuario: number;
    nombre_completo: string;
    tipo_usuario: 'Interno' | 'Proveedor';
  };
  imagenes: ReclamoMensajeImagen[];
}

export type TipoReclamo = 'Calidad' | 'Salubridad' | 'Inocuidad';
export type ImpactoProveedor = 'Alto' | 'Medio' | 'Bajo';

export interface Reclamo {
  id_reclamo: number;
  asunto: string;
  tipo_reclamo: TipoReclamo | null;
  impacto_proveedor: ImpactoProveedor | null;
  estado: 'Abierto' | 'Cerrado';
  fecha_creacion: string;
  fecha_cierre: string | null;
  proveedor: {
    id_proveedor: number;
    razon_social: string;
  };
  creado_por: {
    id_usuario: number;
    nombre_completo: string;
  };
  total_mensajes?: number;
  destinatarios?: ContactoProveedor[];
  mensajes?: ReclamoMensaje[];
}

export interface DestinatarioInput {
  rol_contacto: string;
  nombre_contacto?: string;
  email: string;
}