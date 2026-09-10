import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as productosApi from '../../fichaProductos/api/productosApi';
import type { ProveedorConProductos } from '../../fichaProductos/types';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import Paginador from '../../../shared/components/Paginador';

export function nombreDe(proveedor: ProveedorConProductos): string {
  return proveedor.nombre_comercial?.trim() || proveedor.razon_social?.trim() || 'Proveedor sin razón social';
}

const POR_PAGINA = 15;

/**
 * Mismo molde de columnas para el encabezado y para cada fila. Como cada
 * fila es su propio contenedor grid (y no comparten una sola <table>), la
 * única forma de que se alineen entre sí es que TODAS las columnas midan
 * un valor fijo salvo la del proveedor, que absorbe el sobrante. Mismo
 * criterio que ya usa la lista de productos.
 */
const PLANTILLA_COLUMNAS = 'minmax(0,1fr) 104px 92px minmax(0,210px) 16px';

function IconoFlecha() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function BadgeEstado({ estado }: { estado: string | null }) {
  if (!estado) return <span className="text-[11.5px] text-brand-900/30">—</span>;

  const tono =
    estado === 'Aprobado'
      ? 'bg-emerald-100 text-emerald-800'
      : estado === 'Suspendido' || estado === 'Rechazado'
        ? 'bg-red-100 text-red-800'
        : 'bg-brand-900/8 text-brand-900/70';

  return <span className={`text-[10.5px] font-medium px-1.5 py-0.5 rounded ${tono}`}>{estado}</span>;
}

/**
 * Elegir a qué proveedor entrar.
 *
 * ES UNA LISTA Y NO TARJETAS (pedido del usuario, 10-sep-2026: "van a ser
 * muchos proveedores en el futuro"). Con una tarjeta por proveedor, 200
 * proveedores son 200 bloques de 120px: hay que hacer scroll durante
 * páginas enteras para encontrar uno, y ni el nombre ni el conteo quedan
 * alineados entre sí, así que no se pueden comparar de un vistazo. En
 * filas, cada proveedor ocupa una línea, los números caen todos en la
 * misma columna y la vista entra completa en una pantalla.
 *
 * Se pagina de a POR_PAGINA en el navegador: el endpoint devuelve todos
 * los proveedores de la empresa de una sola vez (son datos livianos, una
 * fila por proveedor) y así buscar y filtrar responde al instante, sin
 * ida y vuelta al servidor en cada tecla.
 *
 * Los CONTEOS son lo que decide a dónde entrar: un proveedor con 1320
 * productos y 400 sin registrar es un día de trabajo, y uno en cero es por
 * dónde empezar. Sin ese dato la lista sería una guía de nombres que
 * obliga a entrar uno por uno a ver si hay algo que hacer.
 */
export default function SelectorProveedorProductos({
  onElegir,
}: {
  onElegir: (proveedor: ProveedorConProductos) => void;
}) {
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);

  const { data: proveedores = [], isLoading } = useQuery({
    queryKey: ['proveedores-con-productos'],
    queryFn: productosApi.listarProveedoresConProductos,
  });

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return proveedores.filter((p) => {
      const coincide =
        !texto ||
        nombreDe(p).toLowerCase().includes(texto) ||
        (p.razon_social ?? '').toLowerCase().includes(texto) ||
        (p.ruc ?? '').toLowerCase().includes(texto);

      if (!coincide) return false;
      if (filtro === 'con') return p.total_productos > 0;
      if (filtro === 'sin') return p.total_productos === 0;
      if (filtro === 'pendientes') return p.productos_pendientes > 0;
      if (filtro === 'rechazados') return p.productos_rechazados > 0;

      return true;
    });
  }, [proveedores, busqueda, filtro]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaSegura = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaSegura - 1) * POR_PAGINA, paginaSegura * POR_PAGINA);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        {/* La página vuelve a 1 acá, en el propio manejador, y no en un
            useEffect que observe la búsqueda: buscar es un EVENTO, y
            reaccionar a él con un efecto obliga a React a renderizar dos
            veces (una con la búsqueda nueva y la página vieja, otra ya
            corregida). Además el clamp de paginaSegura evita de todas
            formas que quede mirando una página que ya no existe. */}
        <BarraBusqueda
          valor={busqueda}
          onCambiar={(valor) => {
            setBusqueda(valor);
            setPagina(1);
          }}
          placeholder="Buscar proveedor por nombre o RUC..."
          className="!py-1.5 !text-xs"
        />
        <SelectFiltro
          valor={filtro}
          onCambiar={(valor) => {
            setFiltro(valor);
            setPagina(1);
          }}
          etiquetaTodos="Todos los proveedores"
          opciones={[
            { valor: 'con', etiqueta: 'Con productos' },
            { valor: 'sin', etiqueta: 'Sin productos' },
            { valor: 'pendientes', etiqueta: 'Con pendientes de registrar' },
            { valor: 'rechazados', etiqueta: 'Con productos rechazados' },
          ]}
          className="w-56"
        />
        <p className="text-[11.5px] text-brand-900/45 ml-auto">
          {filtrados.length} de {proveedores.length} proveedor{proveedores.length === 1 ? '' : 'es'}
        </p>
      </div>

      {filtrados.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/55 text-center py-10">
            {proveedores.length === 0
              ? 'Todavía no hay proveedores cargados en esta empresa.'
              : 'Ningún proveedor coincide con la búsqueda.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white">
            <div
              className="grid gap-3 items-center px-3 py-2 border-b border-brand-900/8 bg-brand-900/[0.02]"
              style={{ gridTemplateColumns: PLANTILLA_COLUMNAS }}
            >
              <span className="text-[12px] font-medium text-brand-900/40 uppercase tracking-wide">Proveedor</span>
              <span className="hidden sm:block text-[12px] font-medium text-brand-900/40 uppercase tracking-wide">
                Estado
              </span>
              <span className="text-[12px] font-medium text-brand-900/40 uppercase tracking-wide text-right">
                Productos
              </span>
              <span className="hidden md:block text-[12px] font-medium text-brand-900/40 uppercase tracking-wide">
                Situación
              </span>
              <span />
            </div>

            {visibles.map((proveedor, indice) => (
              <button
                key={proveedor.id_proveedor}
                onClick={() => onElegir(proveedor)}
                style={{ gridTemplateColumns: PLANTILLA_COLUMNAS }}
                className={`w-full text-left grid gap-3 items-center px-3 py-2.5 border-b border-brand-900/8 last:border-b-0
                  hover:bg-brand-900/[0.05] transition-colors duration-150 focus:outline-none focus:bg-brand-200/40 ${
                    indice % 2 === 0 ? 'bg-white' : 'bg-brand-900/[0.015]'
                  }`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-900 truncate">{nombreDe(proveedor)}</p>
                  <p className="text-[12px] text-brand-900/45 truncate">
                    {proveedor.ruc ?? 'Sin RUC'}
                    {/* En pantallas chicas la columna Estado se oculta, así
                        que el dato se repliega acá en vez de perderse. */}
                    <span className="sm:hidden">{proveedor.estado ? ` · ${proveedor.estado}` : ''}</span>
                  </p>
                </div>

                <div className="hidden sm:block min-w-0">
                  <BadgeEstado estado={proveedor.estado} />
                </div>

                <div className="text-right">
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      proveedor.total_productos > 0 ? 'text-brand-900' : 'text-brand-900/25'
                    }`}
                  >
                    {proveedor.total_productos}
                  </span>
                </div>

                {/* Solo se dibuja lo que hay: un proveedor sin rechazados no
                    necesita ver un "0 rechazados" ocupando lugar. */}
                <div className="hidden md:flex flex-wrap gap-1 min-w-0">
                  {proveedor.productos_pendientes > 0 && (
                    <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-brand-900/8 text-brand-900/70 whitespace-nowrap">
                      {proveedor.productos_pendientes} sin registrar
                    </span>
                  )}
                  {proveedor.productos_rechazados > 0 && (
                    <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 whitespace-nowrap">
                      {proveedor.productos_rechazados} rechazado{proveedor.productos_rechazados === 1 ? '' : 's'}
                    </span>
                  )}
                  {proveedor.productos_aprobados > 0 && (
                    <span className="text-[10.5px] font-medium px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 whitespace-nowrap">
                      {proveedor.productos_aprobados} aprobado{proveedor.productos_aprobados === 1 ? '' : 's'}
                    </span>
                  )}
                </div>

                <span className="text-brand-900/25" aria-hidden="true">
                  <IconoFlecha />
                </span>
              </button>
            ))}
          </div>

          {totalPaginas > 1 && (
            <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />
          )}
        </>
      )}
    </div>
  );
}
