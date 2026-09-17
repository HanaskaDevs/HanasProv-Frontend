import apiClient from '../../../shared/api/apiClient';
import type { CuentaBancaria, FichaProveedor, GuardarCuentaBancariaPayload, Seccion1Data } from '../types';

export async function obtenerMiFicha(): Promise<FichaProveedor> {
  const { data } = await apiClient.get<FichaProveedor>('/mi-ficha');
  return data;
}

/**
 * `acepta_politicas` solo viaja cuando el formulario lo pidió (es el
 * guardado que completa la ficha y la manda a revisión). El backend lo
 * exige en ese caso y lo ignora en los demás; el campo ausente no rompe
 * nada.
 */
function conAceptacion(cuerpo: Record<string, unknown>, aceptaPoliticas?: boolean) {
  return aceptaPoliticas === undefined ? cuerpo : { ...cuerpo, acepta_politicas: aceptaPoliticas };
}

export async function guardarSeccion1(
  payload: Partial<Seccion1Data>,
  aceptaPoliticas?: boolean
): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/seccion-1', conAceptacion(payload, aceptaPoliticas));
  return data;
}

export async function guardarSeccion2(idClases: number[], aceptaPoliticas?: boolean): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>(
    '/mi-ficha/seccion-2',
    conAceptacion({ id_clases: idClases }, aceptaPoliticas)
  );
  return data;
}

export async function guardarSeccion3(idCategorias: number[], aceptaPoliticas?: boolean): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>(
    '/mi-ficha/seccion-3',
    conAceptacion({ id_categorias: idCategorias }, aceptaPoliticas)
  );
  return data;
}

export interface ContactosData {
  representante_legal: string;
  correo_representante: string;
  telefono_representante: string;
  contacto_venta: string;
  correo_venta: string;
  telefono_contacto_venta: string;
  contacto_calidad: string;
  correo_calidad: string;
  telefono_contacto_calidad: string;
  contacto_contabilidad: string;
  correo_contabilidad: string;
  telefono_contabilidad: string;
}

/** Solo para un proveedor YA APROBADO -> el resto de la Ficha
 *  (Datos Generales, Clase, Categoría) no se puede editar desde acá. */
export async function guardarContactos(payload: ContactosData): Promise<FichaProveedor> {
  const { data } = await apiClient.put<FichaProveedor>('/mi-ficha/contactos', payload);
  return data;
}
/** null si el proveedor todavía no registró su cuenta bancaria. */
/**
 * El backend responde {"cuenta": ...} en vez de la cuenta pelada.
 *
 * NO ES CAPRICHO: `response()->json(null)` de Laravel manda `{}`, no
 * `null` (Symfony convierte el null en un objeto vacío). Como `{}` es
 * truthy, la pantalla daba por registrada una cuenta que no existía y
 * mostraba los campos en blanco. Con el envoltorio, "no tiene" llega como
 * null de verdad y se desenvuelve acá, así los componentes siguen
 * recibiendo `CuentaBancaria | null` sin enterarse.
 */
export async function obtenerMiCuentaBancaria(): Promise<CuentaBancaria | null> {
  const { data } = await apiClient.get<{ cuenta: CuentaBancaria | null }>('/mi-ficha/cuenta-bancaria');
  return data?.cuenta ?? null;
}

/** Misma envoltura que el GET, ver el comentario de arriba. */
export async function guardarMiCuentaBancaria(
  payload: GuardarCuentaBancariaPayload
): Promise<CuentaBancaria> {
  const { data } = await apiClient.put<{ cuenta: CuentaBancaria }>('/mi-ficha/cuenta-bancaria', payload);
  return data.cuenta;
}
