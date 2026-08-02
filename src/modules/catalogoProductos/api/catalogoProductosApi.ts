// src/modules/catalogoProductos/api/catalogoProductosApi.ts
import apiClient from '../../../shared/api/apiClient';
import type {
  FilaImportacion,
  FiltrosCatalogo,
  ProductoCatalogo,
  ReporteImportacion,
  RespuestaPaginada,
  ResumenCatalogo,
} from '../types';

/** Quita las claves vacías para no mandar `?estado=&busqueda=` al backend. */
function limpiarFiltros(filtros: FiltrosCatalogo): Record<string, string | number> {
  const params: Record<string, string | number> = {};

  Object.entries(filtros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') {
      params[clave] = valor as string | number;
    }
  });

  return params;
}

export async function listarCatalogo(
  filtros: FiltrosCatalogo
): Promise<RespuestaPaginada<ProductoCatalogo>> {
  const { data } = await apiClient.get<RespuestaPaginada<ProductoCatalogo>>('/catalogo-productos', {
    params: limpiarFiltros(filtros),
  });
  return data;
}

export async function obtenerResumen(): Promise<ResumenCatalogo> {
  const { data } = await apiClient.get<ResumenCatalogo>('/catalogo-productos/resumen');
  return data;
}

/**
 * Trae TODAS las filas que coinciden con los filtros actuales (sin
 * paginar) para armar el .xlsx en el navegador.
 */
export async function obtenerFilasParaExportar(filtros: FiltrosCatalogo): Promise<ProductoCatalogo[]> {
  const { pagina: _pagina, por_pagina: _porPagina, ...soloFiltros } = filtros;

  const { data } = await apiClient.get<{ filas: ProductoCatalogo[] }>('/catalogo-productos/exportar', {
    params: limpiarFiltros(soloFiltros),
  });
  return data.filas;
}

/** Paso 1: reporte de qué pasaría, sin guardar nada. */
export async function validarImportacion(filas: FilaImportacion[]): Promise<ReporteImportacion> {
  const { data } = await apiClient.post<ReporteImportacion>('/catalogo-productos/importar/validar', { filas });
  return data;
}

/** Paso 2: guarda las filas válidas y descarta las que tienen error. */
export async function importarCodigosBc(filas: FilaImportacion[]): Promise<ReporteImportacion> {
  const { data } = await apiClient.post<ReporteImportacion>('/catalogo-productos/importar', { filas });
  return data;
}