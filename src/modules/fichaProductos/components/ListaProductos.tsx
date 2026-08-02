// src/modules/fichaProductos/components/ListaProductos.tsx
import { useEffect, useState, type KeyboardEvent } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import axios from 'axios';
import * as productosApi from '../api/productosApi';
import type { EstadoFiltroProducto } from '../api/productosApi';
import type { Producto } from '../types';
import useDebounce from '../../../shared/hooks/useDebounce';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import FiltroMultiple from '../../../shared/components/FiltroMultiple';
import Paginador from '../../../shared/components/Paginador';
import ModalCrearProducto from './ModalCrearProducto';
import ModalConfirmarRegistro from './ModalConfirmarRegistro';
import ModalDocumentosProducto, {
  contarDocumentosPorObligatoriedad,
  BadgeCalificacion,
} from './ModalDocumentosProducto';
import Modal from '../../../shared/components/Modal';

// Mismo molde de columnas para el encabezado y cada fila -> como cada
// fila es su propio contenedor grid (no comparten una sola tabla), la
// única forma de que se alineen perfecto entre sí es que TODAS las
// columnas midan un valor fijo, excepto la de "Producto" (1fr) que
// absorbe el espacio sobrante -> así ese sobrante queda siempre del
// lado del nombre (que es donde se ve natural, como cualquier lista),
// en vez de generar un hueco raro entre columnas.
const PLANTILLA_COLUMNAS_LISTA = '24px 1fr 150px 130px 110px 28px';

function EncabezadoListaProductos() {
  return (
    <div
      className="grid gap-3 items-center px-3 py-2 border-b border-brand-900/8 bg-brand-900/[0.02]"
      style={{ gridTemplateColumns: PLANTILLA_COLUMNAS_LISTA }}
    >
      <span />
      <span className="text-[11px] font-medium text-brand-900/40 uppercase tracking-wide">Producto</span>
      <span className="text-[11px] font-medium text-brand-900/40 uppercase tracking-wide text-center">
        Documentos registrados
      </span>
      <span className="text-[11px] font-medium text-brand-900/40 uppercase tracking-wide">Estado</span>
      <span className="text-[11px] font-medium text-brand-900/40 uppercase tracking-wide">Acciones</span>
      <span />
    </div>
  );
}

function FilaProducto({
  producto,
  seleccionado,
  onSeleccionar,
  onEliminar,
  eliminando,
  onAbrirDocumentos,
  indice,
}: {
  producto: Producto;
  seleccionado: boolean;
  onSeleccionar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
  onAbrirDocumentos: () => void;
  indice: number;
}) {
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);
  const { obligatoriosSubidos, obligatoriosTotal, opcionalesSubidos, opcionalesTotal } =
    contarDocumentosPorObligatoriedad(producto);

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onAbrirDocumentos();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrirDocumentos}
      onKeyDown={handleKeyDown}
      // El delay escalonado (tope de 150ms para que listas largas no
      // tarden en "terminar de aparecer") se define inline porque
      // depende de la posición de cada fila -> no se puede meter en la
      // clase CSS fija de index.css.
      style={{ gridTemplateColumns: PLANTILLA_COLUMNAS_LISTA, animationDelay: `${Math.min(indice * 25, 150)}ms` }}
      className={`animar-fila group grid gap-3 items-center px-3 py-2.5 border-b border-brand-900/8 last:border-b-0 hover:bg-brand-900/[0.05] transition-colors duration-150 cursor-pointer ${
        indice % 2 === 0 ? 'bg-white' : 'bg-brand-900/[0.015]'
      }`}
    >
      {!producto.bloqueado ? (
        <input
          type="checkbox"
          checked={seleccionado}
          onChange={onSeleccionar}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 accent-brand-700 cursor-pointer shrink-0 transition-transform active:scale-90"
        />
      ) : (
        <span className="w-4 shrink-0" />
      )}

      <div className="min-w-0">
        <p className="text-sm font-medium text-brand-900 truncate">{producto.nombre_producto}</p>
        <p className="text-[11px] text-brand-900/50 truncate">
          {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion}
          {producto.precio != null && ` · $${producto.precio}`}
        </p>
      </div>

      <div className="text-[11px] leading-tight text-center">
        <p className={obligatoriosSubidos === obligatoriosTotal ? 'text-emerald-700 font-medium' : 'text-amber-700 font-medium'}>
          {obligatoriosSubidos}/{obligatoriosTotal} Obligatorios
        </p>
        <p className="text-brand-900/40">
          {opcionalesSubidos}/{opcionalesTotal} Opcionales
        </p>
      </div>

      <div className="min-w-0">
        <BadgeCalificacion producto={producto} />
      </div>

      <div className="flex items-center gap-1.5 min-w-0" onClick={(e) => e.stopPropagation()}>
        {!producto.bloqueado && confirmandoEliminar ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                onEliminar();
                setConfirmandoEliminar(false);
              }}
              disabled={eliminando}
              className="text-[11px] font-medium px-2 py-1 rounded-md bg-brand-wine text-white transition-transform active:scale-95"
            >
              Confirmar
            </button>
            <button
              onClick={() => setConfirmandoEliminar(false)}
              className="text-[11px] font-medium px-1.5 py-1 text-brand-900/40"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <Button className="!text-[11px] !px-2.5 !py-1" onClick={onAbrirDocumentos}>
            Ver registro
          </Button>
        )}
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        {!producto.bloqueado && !confirmandoEliminar && (
          <button
            onClick={() => setConfirmandoEliminar(true)}
            className="h-7 w-7 rounded-full flex items-center justify-center text-brand-900/0 group-hover:text-brand-900/30 hover:!bg-brand-wine/10 hover:!text-brand-wine transition-colors shrink-0"
            title="Eliminar producto"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default function ListaProductos() {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  // null = modal cerrado. Cuando tiene contenido, son los ids que se van
  // a registrar -> así el mismo modal de confirmación sirve tanto para
  // el registro masivo (selección) como para el botón individual de
  // cada tarjeta, sin duplicar el flujo de validación.
  const [idsParaRegistrar, setIdsParaRegistrar] = useState<number[] | null>(null);
  const [idProductoAbierto, setIdProductoAbierto] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltroProducto[]>([]);
  const [pagina, setPagina] = useState(1);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [errorCorreccion, setErrorCorreccion] = useState<string | null>(null);

  // La búsqueda pega directo al servidor (ver productosApi.listarProductos)
  // -> con debounce para no mandar una consulta en cada tecla, solo
  // cuando el usuario hace una pausa al escribir.
  const busquedaConDemora = useDebounce(busqueda, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['mis-productos', pagina, busquedaConDemora, filtroEstado],
    queryFn: () => productosApi.listarProductos(pagina, busquedaConDemora, filtroEstado),
    // Sin esto, cada tecla (con su debounce) arma una queryKey nueva sin
    // caché -> React Query vuelve a poner isLoading=true por un
    // instante, y como el return de abajo reemplaza TODA la pantalla
    // (incluida la barra de búsqueda) mientras isLoading es true, el
    // input se desmontaba y perdía el foco en cada búsqueda -> se
    // sentía como si la página se recargara. Con keepPreviousData se
    // sigue mostrando la página anterior mientras llega la nueva.
    placeholderData: keepPreviousData,
  });

  const { data: resumen, isLoading: cargandoResumen } = useQuery({
    queryKey: ['resumen-registro'],
    queryFn: () => productosApi.obtenerResumenRegistro(),
  });

  const eliminarUno = useMutation({
    mutationFn: (idProducto: number) => productosApi.eliminarProducto(idProducto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
    },
  });

  const eliminarSeleccionados = useMutation({
    mutationFn: () => productosApi.eliminarProductosMasivo(Array.from(seleccionados)),
    onSuccess: () => {
      setSeleccionados(new Set());
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
    },
  });

  // Confirma la corrección de UN producto puntual (ver
  // ProductoService::confirmarCorreccionProducto en el backend) -> ya
  // no es una acción global para todo el catálogo rechazado, así que
  // no hace falta lidiar con una lista de "otros productos pendientes"
  // cruzada; el único posible error es sobre ESTE mismo producto, que
  // ya se está viendo en el modal abierto.
  const confirmarCorreccion = useMutation({
    mutationFn: (idProducto: number) => productosApi.confirmarCorreccionProducto(idProducto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
    },
    onError: (error) => {
      const mensaje =
        axios.isAxiosError(error) && error.response?.data?.errors
          ? (Object.values(error.response.data.errors).flat() as string[]).join(' ')
          : 'No se pudo confirmar. Intenta de nuevo.';
      setErrorCorreccion(mensaje);
    },
  });

  useEffect(() => {
    setPagina(1);
  }, [busquedaConDemora, filtroEstado]);

  function alternarSeleccionado(id: number) {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  const productos = data?.data ?? [];
  // Se busca por id en cada render (en vez de guardar el objeto completo
  // en el estado) para que, si el proveedor sube/reemplaza/elimina un
  // documento mientras el modal está abierto, se refleje al toque -> la
  // invalidación de 'mis-productos' ya refresca este arreglo solo.
  const productoAbierto = productos.find((p) => p.id_producto === idProductoAbierto) ?? null;
  // Solo los que se pueden seleccionar (los bloqueados ni siquiera
  // muestran el checkbox) -> "seleccionar todo" tiene que ignorarlos,
  // si no quedaría marcando productos que no se pueden tocar.
  const idsSeleccionables = productos.filter((p) => !p.bloqueado).map((p) => p.id_producto);
  const todosSeleccionados =
    idsSeleccionables.length > 0 && idsSeleccionables.every((id) => seleccionados.has(id));
  const algunoSeleccionado = idsSeleccionables.some((id) => seleccionados.has(id));

  // "Seleccionar todo" es sobre la PÁGINA actual -> con paginado del
  // servidor no tiene sentido pretender marcar productos que ni
  // siquiera se cargaron todavía en el navegador.
  function alternarSeleccionarTodo() {
    setSeleccionados((prev) => {
      const nuevo = new Set(prev);
      if (todosSeleccionados) {
        idsSeleccionables.forEach((id) => nuevo.delete(id));
      } else {
        idsSeleccionables.forEach((id) => nuevo.add(id));
      }
      return nuevo;
    });
  }

  const totalPaginas = data?.meta.last_page ?? 1;
  const paginaSegura = Math.min(pagina, totalPaginas);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-3 max-w-6xl mx-auto">
      <div className="sticky top-0 z-10 bg-brand-200/20 backdrop-blur-sm py-2 -mx-1 px-1 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <BarraBusqueda
            valor={busqueda}
            onCambiar={setBusqueda}
            placeholder="Buscar producto o código de barras..."
            className="!py-1.5 !text-xs"
          />
          <FiltroMultiple
            seleccionados={filtroEstado}
            onCambiar={(v) => setFiltroEstado(v as EstadoFiltroProducto[])}
            opciones={[
              { valor: 'aprobado', etiqueta: 'Aprobados' },
              { valor: 'rechazado', etiqueta: 'Por corregir' },
              { valor: 'en_revision', etiqueta: 'En revisión' },
              { valor: 'pendiente', etiqueta: 'Pendientes' },
            ]}
            etiqueta="Todos los estados"
            className="w-44"
          />
          {isFetching && !isLoading && <Spinner className="h-3.5 w-3.5" />}

          {idsSeleccionables.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-brand-900/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={todosSeleccionados}
                ref={(el) => {
                  if (el) el.indeterminate = algunoSeleccionado && !todosSeleccionados;
                }}
                onChange={alternarSeleccionarTodo}
                className="h-4 w-4 accent-brand-700 cursor-pointer"
              />
              Seleccionar todo
            </label>
          )}
        </div>
        <div className="flex gap-2 items-start">
          {seleccionados.size > 0 && (
            <Button
              variant="secondary"
              className="text-brand-wine !text-xs !px-3 !py-1.5"
              isLoading={eliminarSeleccionados.isPending}
              onClick={() => eliminarSeleccionados.mutate()}
            >
              Eliminar {seleccionados.size} seleccionado{seleccionados.size > 1 ? 's' : ''}
            </Button>
          )}
          <Button className="!text-xs !px-3 !py-1.5" onClick={() => setModalAbierto(true)}>
            + Agregar producto
          </Button>
          {seleccionados.size > 0 && (
            <Button
              variant="secondary"
              className="!text-xs !px-3 !py-1.5"
              onClick={() => setIdsParaRegistrar(Array.from(seleccionados))}
              disabled={cargandoResumen}
            >
              Registrar {seleccionados.size} producto{seleccionados.size === 1 ? '' : 's'}
            </Button>
          )}
        </div>
      </div>

      {productos.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            {!busquedaConDemora && filtroEstado.length === 0
              ? 'Todavía no has agregado ningún producto.'
              : 'Sin resultados para tu búsqueda/filtro.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="rounded-lg border border-brand-900/8 overflow-hidden bg-white">
            <EncabezadoListaProductos />
            {productos.map((producto, indice) => (
              <FilaProducto
                key={producto.id_producto}
                producto={producto}
                indice={indice}
                seleccionado={seleccionados.has(producto.id_producto)}
                onSeleccionar={() => alternarSeleccionado(producto.id_producto)}
                onEliminar={() => eliminarUno.mutate(producto.id_producto)}
                eliminando={eliminarUno.isPending}
                onAbrirDocumentos={() => setIdProductoAbierto(producto.id_producto)}
              />
            ))}
          </div>

          <Paginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />

          {data && (
            <p className="text-center text-[11px] text-brand-900/40">
              {data.meta.total} producto{data.meta.total === 1 ? '' : 's'} en total
            </p>
          )}
        </>
      )}

      {modalAbierto && <ModalCrearProducto onClose={() => setModalAbierto(false)} />}

      {productoAbierto && (
        <ModalDocumentosProducto
          producto={productoAbierto}
          correccionesPendientes={resumen?.correcciones_pendientes ?? false}
          onClose={() => setIdProductoAbierto(null)}
          onRegistrarUno={() => {
            setIdsParaRegistrar([productoAbierto.id_producto]);
            setIdProductoAbierto(null);
          }}
          onConfirmarCorreccion={() => {
            // Antes esto cerraba el modal de una, sin importar si la
            // mutación terminaba bien o mal -> con un error, el modal ya
            // se había cerrado antes de que el mensaje pudiera avisarle
            // nada al proveedor sobre ESTE producto. Ahora solo se
            // cierra cuando de verdad se confirmó.
            confirmarCorreccion.mutate(productoAbierto.id_producto, {
              onSuccess: () => setIdProductoAbierto(null),
            });
          }}
          confirmandoCorreccion={confirmarCorreccion.isPending}
        />
      )}

      {idsParaRegistrar && (
        <ModalConfirmarRegistro
          idsSeleccionados={idsParaRegistrar}
          onClose={() => setIdsParaRegistrar(null)}
          onRegistrado={() => setSeleccionados(new Set())}
        />
      )}

      {errorCorreccion && (
        <Modal title="No se pudo confirmar" onClose={() => setErrorCorreccion(null)}>
          <p className="text-sm text-brand-900/80">{errorCorreccion}</p>
          <div className="flex justify-end mt-4">
            <Button variant="ghost" onClick={() => setErrorCorreccion(null)}>
              Entendido
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}