// src/modules/catalogoProductos/pages/CatalogoProductosPage.tsx
import { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import Paginacion from '../../../shared/components/Paginacion';
import useDebounce from '../../../shared/hooks/useDebounce';
import * as catalogoApi from '../api/catalogoProductosApi';
import { descargarExcelCatalogo } from '../utils/excelCodigosBc';
import ModalImportarCodigosBc from '../components/ModalImportarCodigosBc';
import type { EstadoCalificacionProducto, FiltrosCatalogo } from '../types';

const POR_PAGINA = 15;

function BadgeEstado({ estado }: { estado: EstadoCalificacionProducto }) {
  if (estado === 'Aprobado') return <Badge tone="success">Aprobado</Badge>;
  if (estado === 'Rechazado') return <Badge tone="amber">Rechazado</Badge>;
  return <Badge tone="neutral">Pendiente</Badge>;
}

function TarjetaResumen({ valor, etiqueta, tono }: { valor: number; etiqueta: string; tono: 'neutral' | 'wine' }) {
  return (
    <div
      className={`rounded-lg border px-3 py-2 ${
        tono === 'wine' ? 'border-brand-wine/20 bg-brand-wine/5' : 'border-brand-900/10 bg-white'
      }`}
    >
      <p className={`text-lg font-display font-bold leading-none ${tono === 'wine' ? 'text-brand-wine' : 'text-brand-900'}`}>
        {valor}
      </p>
      <p className="text-[12px] text-brand-900/50 mt-1">{etiqueta}</p>
    </div>
  );
}

function formatearPrecio(precio: number | string | null): string {
  if (precio === null || precio === undefined || precio === '') return '—';
  const numero = Number(precio);
  return Number.isNaN(numero) ? '—' : numero.toFixed(2);
}

function CatalogoProductosContent() {
  const queryClient = useQueryClient();

  const [busqueda, setBusqueda] = useState('');
  const [estado, setEstado] = useState<'' | EstadoCalificacionProducto>('');
  const [codigoBc, setCodigoBc] = useState<'' | 'con_codigo' | 'sin_codigo'>('');
  const [pagina, setPagina] = useState(1);
  const [descargando, setDescargando] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  // La búsqueda es server-side (el catálogo puede tener miles de filas),
  // así que se espera a que el usuario deje de escribir antes de pedirla.
  const busquedaConDemora = useDebounce(busqueda);

  const filtros: FiltrosCatalogo = {
    busqueda: busquedaConDemora,
    estado,
    codigo_bc: codigoBc,
    pagina,
    por_pagina: POR_PAGINA,
  };

  const { data: resumen } = useQuery({
    queryKey: ['catalogo-productos-resumen'],
    queryFn: catalogoApi.obtenerResumen,
  });

  const { data: paginado, isLoading, isFetching } = useQuery({
    queryKey: ['catalogo-productos', filtros],
    queryFn: () => catalogoApi.listarCatalogo(filtros),
    // Mantiene la tabla anterior visible mientras llega la nueva página,
    // en vez de parpadear a un spinner en cada tecla o cambio de página.
    placeholderData: keepPreviousData,
  });

  /** Cualquier cambio de filtro devuelve a la página 1. */
  function cambiarFiltro<T>(setter: (valor: T) => void) {
    return (valor: T) => {
      setter(valor);
      setPagina(1);
    };
  }

  async function descargarExcel() {
    setDescargando(true);
    setErrorDescarga(null);

    try {
      // Se descarga lo que está filtrado en pantalla, no todo el catálogo
      // -> permite trabajar por tandas (ej. solo los "Sin código BC").
      const filas = await catalogoApi.obtenerFilasParaExportar(filtros);

      if (filas.length === 0) {
        setErrorDescarga('No hay productos que coincidan con los filtros actuales.');
        return;
      }

      descargarExcelCatalogo(filas);
    } catch {
      setErrorDescarga('No se pudo generar el archivo. Intenta de nuevo.');
    } finally {
      setDescargando(false);
    }
  }

  function alImportar() {
    queryClient.invalidateQueries({ queryKey: ['catalogo-productos'] });
    queryClient.invalidateQueries({ queryKey: ['catalogo-productos-resumen'] });
  }

  const productos = paginado?.data ?? [];
  const totalPaginas = paginado?.last_page ?? 1;

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900">Catálogo de Productos</h1>
          <p className="text-xs text-brand-900/55 mt-0.5">
            Todos los productos registrados por los proveedores de esta empresa, con su código de Business Central.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={descargarExcel} isLoading={descargando}>
            Descargar Excel
          </Button>
          <Button onClick={() => setMostrarImportar(true)}>Cargar códigos BC</Button>
        </div>
      </div>

      {resumen && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <TarjetaResumen valor={resumen.total} etiqueta="Productos activos" tono="neutral" />
          <TarjetaResumen valor={resumen.con_codigo_bc} etiqueta="Con código BC" tono="neutral" />
          <TarjetaResumen valor={resumen.sin_codigo_bc} etiqueta="Sin código BC" tono="wine" />
          <TarjetaResumen valor={resumen.pendientes_calificacion} etiqueta="Pendientes de calificar" tono="neutral" />
        </div>
      )}

      {errorDescarga && (
        <div className="rounded-lg border border-brand-wine/25 bg-brand-wine/5 px-4 py-2.5 text-xs text-brand-wine">
          {errorDescarga}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <BarraBusqueda
          valor={busqueda}
          onCambiar={cambiarFiltro(setBusqueda)}
          placeholder="Buscar por producto, código, código BC, proveedor o RUC"
          className="!py-1.5 !text-xs !max-w-md"
        />
        <SelectFiltro
          valor={estado}
          onCambiar={cambiarFiltro(setEstado) as (valor: string) => void}
          opciones={[
            { valor: 'Aprobado', etiqueta: 'Aprobados' },
            { valor: 'Rechazado', etiqueta: 'Rechazados' },
            { valor: 'Pendiente', etiqueta: 'Pendientes de aprobación' },
          ]}
          etiquetaTodos="Todos los estados"
          className="!py-1.5 !text-xs"
        />
        <SelectFiltro
          valor={codigoBc}
          onCambiar={cambiarFiltro(setCodigoBc) as (valor: string) => void}
          opciones={[
            { valor: 'sin_codigo', etiqueta: 'Sin código BC' },
            { valor: 'con_codigo', etiqueta: 'Con código BC' },
          ]}
          etiquetaTodos="Código BC: todos"
          className="!py-1.5 !text-xs"
        />
        {isFetching && !isLoading && <Spinner className="h-4 w-4" />}
      </div>

      <Card className="!p-0 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : productos.length === 0 ? (
          <p className="text-center text-sm text-brand-900/50 py-12">
            No hay productos que coincidan con la búsqueda.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-brand-200/30 text-left text-brand-900/70">
                  <tr>
                    <th className="px-4 py-2.5 text-xs font-medium">Producto</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Código BC</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Cód. barras</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Unidad</th>
                    <th className="px-4 py-2.5 text-xs font-medium text-right">Precio</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Estado</th>
                    <th className="px-4 py-2.5 text-xs font-medium">Proveedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-900/8">
                  {productos.map((p, indice) => (
                    <tr
                      key={p.id_producto}
                      className="hover:bg-brand-900/[0.02] transition-colors animar-fila"
                      style={{ animationDelay: `${indice * 18}ms` }}
                    >
                      <td className="px-4 py-2.5">
                        <p className="text-brand-900 font-medium text-sm">{p.nombre_producto}</p>
                        {p.bloqueado && (
                          <span className="text-[12px] text-brand-wine">En revisión / bloqueado</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {p.bc_nro_producto ? (
                          <span className="font-mono text-xs text-brand-900">{p.bc_nro_producto}</span>
                        ) : (
                          <Badge tone="warning">Sin código</Badge>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="font-mono text-xs text-brand-900/60">{p.codigo_barras || '—'}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-brand-900/60">{p.unidad_presentacion || '—'}</td>
                      <td className="px-4 py-2.5 text-xs text-brand-900/70 text-right tabular-nums">
                        {formatearPrecio(p.precio)}
                      </td>
                      <td className="px-4 py-2.5">
                        <BadgeEstado estado={p.estado_calificacion} />
                      </td>
                      <td className="px-4 py-2.5">
                        <p className="text-brand-900 text-sm truncate max-w-[16rem]">{p.razon_social ?? '—'}</p>
                        <p className="text-[12px] text-brand-900/50">{p.ruc ?? 'Sin RUC'}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-brand-900/8">
              <p className="text-[12px] text-brand-900/50">
                {paginado?.total ?? 0} producto{(paginado?.total ?? 0) === 1 ? '' : 's'} encontrado
                {(paginado?.total ?? 0) === 1 ? '' : 's'}
              </p>
              <Paginacion paginaActual={pagina} totalPaginas={totalPaginas} onCambiar={setPagina} />
            </div>
          </>
        )}
      </Card>

      {mostrarImportar && (
        <ModalImportarCodigosBc onClose={() => setMostrarImportar(false)} onImportado={alImportar} />
      )}
    </div>
  );
}

export default function CatalogoProductosPage() {
  const { esSistemas, esAdmin, esCompras } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCompras}>
      <CatalogoProductosContent />
    </RoleRoute>
  );
}