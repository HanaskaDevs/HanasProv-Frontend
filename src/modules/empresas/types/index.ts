export interface Empresa {
  id_empresa: number;
  razon_social: string;
  ruc: string;
  nombre_comercial: string | null;
  logo_url: string | null;
  activo: boolean;
}

export interface EmpresaPayload {
  razon_social: string;
  ruc: string;
  nombre_comercial?: string;
  logo_url?: string;
}