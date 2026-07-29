// src/modules/fichaProductos/components/ListaProductos.tsx
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as productosApi from '../api/productosApi';
import type { EstadoFiltroProducto } from '../api/productosApi';
import type { Producto } from '../types';
import useDebounce from '../../../shared/hooks/useDebounce';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import Paginador from '../../../shared/components/Paginador';
import ModalCrearProducto from './ModalCrearProducto';
import ModalConfirmarRegistro from './ModalConfirmarRegistro';

const TAMANO_MAXIMO_MB = 4;

const TIPOS_DOCUMENTO = [
  { id: 1, slug: 'ficha-tecnica', etiqueta: 'Ficha técnica', obligatorio: true },
  { id: 2, slug: 'analisis-producto', etiqueta: 'Análisis de Laboratorio', obligatorio: true },
  { id: 3, slug: 'carta-alergenos', etiqueta: 'Carta de alérgenos', obligatorio: false },
] as const;

function BadgeCalificacion({ producto }: { producto: Producto }) {
  if (producto.bloqueado && producto.estado_calificacion === 'Pendiente') {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-brand-200 text-brand-700">
        En revisión
      </span>
    );
  }
  if (producto.estado_calificacion === 'Aprobado') {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
        Aprobado
      </span>
    );
  }
  if (producto.estado_calificacion === 'Rechazado') {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
        Rechazado
      </span>
    );
  }
  return null;
}

function CasillaDocumento({
  producto,
  tipo,
  correccionesPendientes,
}: {
  producto: Producto;
  tipo: (typeof TIPOS_DOCUMENTO)[number];
  correccionesPendientes: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarPublicidad, setMostrarPublicidad] = useState(false);

  const yaSubido = producto.documentos.find((d) => d.tipo === tipo.slug);
  const esAnalisisProducto = tipo.slug === 'analisis-producto';

  const subir = useMutation({
    mutationFn: (archivo: File) => productosApi.subirDocumentoProducto(producto.id_producto, tipo.id, archivo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      window.dispatchEvent(new Event('hana:celebrar'));
      setError(null);
    },
    onError: () => setError('No se pudo subir. Verifica que sea PDF y pese menos de 4MB.'),
  });

  const ver = useMutation({
    mutationFn: (idDocumentoProducto: number) => productosApi.verDocumentoProducto(idDocumentoProducto),
  });

  const eliminarDoc = useMutation({
    mutationFn: (idDocumentoProducto: number) => productosApi.eliminarDocumentoProducto(idDocumentoProducto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
    },
  });

  function handleSeleccionar(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = '';
    if (!archivo) return;

    if (archivo.type !== 'application/pdf') {
      setError('Solo se aceptan archivos PDF.');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      setError(`El archivo supera los ${TAMANO_MAXIMO_MB}MB.`);
      return;
    }

    setError(null);
    subir.mutate(archivo);
  }

  const bloqueado = producto.bloqueado;
  // A diferencia de Documentos, acá NO alcanza con "no está Aprobado":
  // un producto recién enviado y nunca revisado también queda en
  // "Pendiente" (mismo valor que un producto que ya se corrigió una vez
  // pero el proveedor todavía no confirmó) -> por eso se exige
  // específicamente "Rechazado". Mientras se está corrigiendo, el
  // backend deja el producto marcado como Rechazado a propósito (no lo
  // resetea a Pendiente hasta que el proveedor confirme con "Registrar
  // productos actualizados"), así este chequeo queda simple y correcto.
  const puedeEditar =
    !bloqueado || (correccionesPendientes && producto.estado_calificacion === 'Rechazado');
  const mostrarTooltipAnalisis = esAnalisisProducto && !yaSubido && mostrarPublicidad;

  return (
    <div className="min-w-0 flex-1 relative">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

      {mostrarTooltipAnalisis && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-64 rounded-lg bg-brand-900 text-white text-xs px-3 py-2.5 shadow-lg">
          <p className="font-medium mb-1">¿Aún no tienes el análisis de Laboratorio?</p>
          <p className="text-white/80 leading-relaxed">
            Puedes realizarlo con Hanaska. Para más información contáctanos a{' '}
            <a href="mailto:analisis@hanska.com" className="underline font-medium">
              analisis@hanska.com
            </a>
          </p>
          <div className="absolute top-full left-4 h-2 w-2 -mt-1 rotate-45 bg-brand-900" />
        </div>
      )}

      <div
        onMouseEnter={() => esAnalisisProducto && !yaSubido && setMostrarPublicidad(true)}
        onMouseLeave={() => setMostrarPublicidad(false)}
      >
        {yaSubido ? (
          <div className={`rounded-md border px-2.5 py-1.5 ${!puedeEditar ? 'border-brand-900/10 bg-brand-900/[0.03]' : 'border-emerald-200 bg-emerald-50'}`}>
            <p className={`text-[11px] font-medium flex items-center gap-1 ${!puedeEditar ? 'text-brand-900/50' : 'text-emerald-800'}`}>
              ✓ {tipo.etiqueta}
            </p>
            <p className={`text-[10.5px] truncate ${!puedeEditar ? 'text-brand-900/40' : 'text-emerald-700/70'}`} title={yaSubido.nombre_original}>
              {yaSubido.nombre_original}
            </p>
            <div className="flex flex-wrap gap-x-2.5 gap-y-1 mt-1">
              <button
                onClick={() => ver.mutate(yaSubido.id_documento_producto)}
                className="text-[10.5px] font-medium text-brand-700 hover:underline"
              >
                Ver
              </button>
              {puedeEditar && (
                <>
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={subir.isPending}
                    className="text-[10.5px] font-medium text-brand-900/50 hover:underline"
                  >
                    Reemplazar
                  </button>
                  <button
                    onClick={() => eliminarDoc.mutate(yaSubido.id_documento_producto)}
                    disabled={eliminarDoc.isPending}
                    className="text-[10.5px] font-medium text-brand-wine hover:underline"
                  >
                    Eliminar
                  </button>
                </>
              )}
            </div>
          </div>
        ) : bloqueado && !puedeEditar ? (
          <div className="w-full rounded-md border-2 border-dashed border-brand-900/10 px-2.5 py-1.5 bg-brand-900/[0.02]">
            <p className="text-[11px] font-medium text-brand-900/40">
              {tipo.etiqueta}
              {tipo.obligatorio && <span> *</span>}
            </p>
            <p className="text-[10.5px] text-brand-900/30">Bloqueado durante revisión</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subir.isPending}
            className={`w-full rounded-md border-2 border-dashed px-2.5 py-1.5 text-left transition-colors
              ${tipo.obligatorio
                ? 'border-brand-wine/30 hover:border-brand-wine/60 hover:bg-brand-wine/5'
                : 'border-brand-900/15 hover:border-brand-900/30 hover:bg-brand-900/5'
              }`}
          >
            <p className="text-[11px] font-medium text-brand-900">
              {subir.isPending ? <Spinner className="h-3 w-3 inline mr-1" /> : null}
              Cargue aquí {tipo.etiqueta.toLowerCase()}
              {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
            </p>
            <p className="text-[10.5px] text-brand-900/40">PDF, máx. 4MB</p>
          </button>
        )}
      </div>

      {error && <span className="text-[10px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

function TarjetaProducto({
  producto,
  seleccionado,
  correccionesPendientes,
  onSeleccionar,
  onEliminar,
  eliminando,
}: {
  producto: Producto;
  seleccionado: boolean;
  correccionesPendientes: boolean;
  onSeleccionar: () => void;
  onEliminar: () => void;
  eliminando: boolean;
}) {
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false);

  return (
    <Card className="!p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {!producto.bloqueado && (
            <input
              type="checkbox"
              checked={seleccionado}
              onChange={onSeleccionar}
              className="mt-1 h-4 w-4 accent-brand-700 cursor-pointer shrink-0"
            />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-brand-900 truncate">{producto.nombre_producto}</p>
            <p className="text-[11px] text-brand-900/50 mt-0.5">
              {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion}
              {producto.precio != null && ` · $${producto.precio}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <BadgeCalificacion producto={producto} />
          {!producto.bloqueado && (
            confirmandoEliminar ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { onEliminar(); setConfirmandoEliminar(false); }}
                  disabled={eliminando}
                  className="text-[11px] font-medium px-2 py-1 rounded-md bg-brand-wine text-white"
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
              <button
                onClick={() => setConfirmandoEliminar(true)}
                className="h-7 w-7 rounded-full flex items-center justify-center text-brand-900/30 hover:bg-brand-wine/10 hover:text-brand-wine transition-colors"
                title="Eliminar producto"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {producto.estado_calificacion === 'Rechazado' && producto.comentario_calificacion && (
        <div className="mt-2 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5">
          <p className="text-[11px] font-medium text-amber-800">Motivo del rechazo</p>
          <p className="text-[11px] text-brand-900/70 mt-0.5">{producto.comentario_calificacion}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mt-3 pt-3 border-t border-brand-900/8">
        {TIPOS_DOCUMENTO.map((tipo) => (
          <CasillaDocumento
            key={tipo.id}
            producto={producto}
            tipo={tipo}
            correccionesPendientes={correccionesPendientes}
          />
        ))}
      </div>
    </Card>
  );
}

export default function ListaProductos() {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalRegistroAbierto, setModalRegistroAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<EstadoFiltroProducto>('');
  const [pagina, setPagina] = useState(1);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());

  // La búsqueda pega directo al servidor (ver productosApi.listarProductos)
  // -> con debounce para no mandar una consulta en cada tecla, solo
  // cuando el usuario hace una pausa al escribir.
  const busquedaConDemora = useDebounce(busqueda, 400);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['mis-productos', pagina, busquedaConDemora, filtroEstado],
    queryFn: () => productosApi.listarProductos(pagina, busquedaConDemora, filtroEstado),
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

  const confirmarCorrecciones = useMutation({
    mutationFn: productosApi.confirmarCorrecciones,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
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

  const productosEnRevision = resumen?.productos_en_revision ?? 0;
  const productos = data?.data ?? [];
  const correccionesPendientes = resumen?.correcciones_pendientes ?? false;
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
      {!correccionesPendientes && productosEnRevision > 0 && (
        <Card className="!p-2.5 bg-brand-yellow/15 border-brand-yellow/30">
          <p className="text-xs text-brand-900/80">
            Tienes {productosEnRevision} producto{productosEnRevision === 1 ? '' : 's'} en revisión (no se{' '}
            {productosEnRevision === 1 ? 'puede' : 'pueden'} editar hasta que un administrador lo
            {productosEnRevision === 1 ? '' : 's'} califique). El resto de tu catálogo sigue disponible como
            siempre.
          </p>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <BarraBusqueda
            valor={busqueda}
            onCambiar={setBusqueda}
            placeholder="Buscar producto o código de barras..."
            className="!py-1.5 !text-xs"
          />
          <SelectFiltro
            valor={filtroEstado}
            onCambiar={(v) => setFiltroEstado(v as EstadoFiltroProducto)}
            opciones={[
              { valor: 'aprobado', etiqueta: 'Aprobados' },
              { valor: 'rechazado', etiqueta: 'Rechazados' },
              { valor: 'en_revision', etiqueta: 'En revisión' },
            ]}
            etiquetaTodos="Todos los estados"
            className="!py-1.5 !text-xs"
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
          <Button
            variant="secondary"
            className="!text-xs !px-3 !py-1.5"
            onClick={() => setModalRegistroAbierto(true)}
            disabled={cargandoResumen || seleccionados.size === 0}
          >
            Registrar {seleccionados.size > 0 ? `${seleccionados.size} ` : ''}producto{seleccionados.size === 1 ? '' : 's'}
          </Button>
          {correccionesPendientes && (
            <div>
              <Button
                variant="primary"
                className="!text-xs !px-3 !py-1.5"
                isLoading={confirmarCorrecciones.isPending}
                onClick={() => confirmarCorrecciones.mutate()}
              >
                Registrar productos actualizados
              </Button>
              {confirmarCorrecciones.isError && (
                <p className="text-[10px] text-brand-wine mt-1 max-w-[220px] text-right">
                  {axios.isAxiosError(confirmarCorrecciones.error) && confirmarCorrecciones.error.response?.data?.errors
                    ? Object.values(confirmarCorrecciones.error.response.data.errors).flat().join(' ')
                    : 'No se pudo confirmar. Intenta de nuevo.'}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {productos.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            {!busquedaConDemora && !filtroEstado
              ? 'Todavía no has agregado ningún producto.'
              : 'Sin resultados para tu búsqueda/filtro.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {productos.map((producto) => (
              <TarjetaProducto
                key={producto.id_producto}
                producto={producto}
                seleccionado={seleccionados.has(producto.id_producto)}
                correccionesPendientes={resumen?.correcciones_pendientes ?? false}
                onSeleccionar={() => alternarSeleccionado(producto.id_producto)}
                onEliminar={() => eliminarUno.mutate(producto.id_producto)}
                eliminando={eliminarUno.isPending}
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

      {modalRegistroAbierto && (
        <ModalConfirmarRegistro
          idsSeleccionados={Array.from(seleccionados)}
          onClose={() => setModalRegistroAbierto(false)}
          onRegistrado={() => setSeleccionados(new Set())}
        />
      )}
    </div>
  );
}