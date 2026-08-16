import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import type { DocumentoProducto, Producto, TipoDocumentoProducto } from '../types';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import ModalVisorPdf from '../../../shared/components/ModalVisorPdf';

const TAMANO_MAXIMO_MB = 4;

// Catálogo de tipos de documento de producto: ya NO está hardcodeado
// acá -> viene del backend (GET /mis-productos/tipos-documento), así
// un cambio de negocio (agregar/quitar un tipo, hacerlo opcional,
// pedirle fecha de caducidad) no requiere tocar el frontend. Este hook
// lo comparte cualquier componente que necesite el catálogo (acá y en
// ListaProductos.tsx) sin repetir el fetch -> react-query dedupe por
// query key.
export function useTiposDocumentoProducto() {
  return useQuery({
    queryKey: ['tipos-documento-producto'],
    queryFn: productosApi.listarTiposDocumentoProducto,
    staleTime: 5 * 60 * 1000,
  });
}

export function tieneDocumentosObligatoriosCompletos(producto: Producto, tipos: TipoDocumentoProducto[]): boolean {
  const obligatorios = tipos.filter((t) => t.obligatorio);
  return obligatorios.every((tipo) => producto.documentos.some((d) => d.tipo === tipo.carpeta_slug));
}

export function contarDocumentosPorObligatoriedad(
  producto: Producto,
  tipos: TipoDocumentoProducto[]
): {
  obligatoriosSubidos: number;
  obligatoriosTotal: number;
  opcionalesSubidos: number;
  opcionalesTotal: number;
} {
  const obligatorios = tipos.filter((t) => t.obligatorio);
  const opcionales = tipos.filter((t) => !t.obligatorio);
  return {
    obligatoriosSubidos: obligatorios.filter((tipo) => producto.documentos.some((d) => d.tipo === tipo.carpeta_slug))
      .length,
    obligatoriosTotal: obligatorios.length,
    opcionalesSubidos: opcionales.filter((tipo) => producto.documentos.some((d) => d.tipo === tipo.carpeta_slug))
      .length,
    opcionalesTotal: opcionales.length,
  };
}

/**
 * Único lugar que traduce Estado_Calificacion + Bloqueado a lo que ve el
 * proveedor. Los 4 estados posibles para el proveedor son exactamente
 * "Pendiente" | "En revisión" | "Aprobado" | "Rechazado" -> "Pendiente"
 * y "En revisión" comparten el mismo Estado_Calificacion en la base
 * ("Pendiente"), la diferencia real está en Bloqueado (recién enviado y
 * en revisión = bloqueado; producto nuevo que todavía no se envió = no
 * bloqueado).
 */
export function BadgeCalificacion({ producto }: { producto: Producto }) {
  if (producto.estado_calificacion === 'Aprobado') {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 whitespace-nowrap">
        Aprobado
      </span>
    );
  }
  if (producto.estado_calificacion === 'Rechazado') {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 whitespace-nowrap">
        Por corregir
      </span>
    );
  }
  if (producto.bloqueado) {
    return (
      <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-brand-200 text-brand-700 whitespace-nowrap">
        En revisión
      </span>
    );
  }
  return (
    <span className="text-[10.5px] font-medium px-2 py-0.5 rounded-full bg-brand-900/8 text-brand-900/60 whitespace-nowrap">
      Pendiente
    </span>
  );
}

function UnDocumentoSubido({
  doc,
  tipo,
  puedeEditar,
  onReemplazar,
  reemplazando,
}: {
  doc: DocumentoProducto;
  tipo: TipoDocumentoProducto;
  puedeEditar: boolean;
  onReemplazar: () => void;
  reemplazando: boolean;
}) {
  const queryClient = useQueryClient();
  const [mostrarVisor, setMostrarVisor] = useState(false);

  const eliminarDoc = useMutation({
    mutationFn: (idDocumentoProducto: number) => productosApi.eliminarDocumentoProducto(idDocumentoProducto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
    },
  });

  const vencido = doc.fecha_caducidad != null && new Date(doc.fecha_caducidad) < new Date();

  return (
    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5">
      <p className="text-[12px] font-medium text-emerald-800">{tipo.nombre_documento}</p>
      <p className="text-[10.5px] truncate text-emerald-700/70" title={doc.nombre_original}>
        {doc.nombre_original}
      </p>
      {doc.fecha_caducidad && (
        <p className={`text-[10.5px] ${vencido ? 'text-brand-wine font-medium' : 'text-emerald-700/60'}`}>
          Vence: {doc.fecha_caducidad}
          {vencido && ' (vencido)'}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 mt-1.5">
        <Button onClick={() => setMostrarVisor(true)} className="!text-[10.5px] !px-2.5 !py-1">
          Ver
        </Button>
        {puedeEditar && (
          <>
            <button
              onClick={onReemplazar}
              disabled={reemplazando}
              className="text-[10.5px] font-medium text-brand-900/50 hover:underline"
            >
              Reemplazar
            </button>
            {(!tipo.obligatorio || tipo.permite_multiples) && (
              <button
                onClick={() => eliminarDoc.mutate(doc.id_documento_producto)}
                disabled={eliminarDoc.isPending}
                className="text-[10.5px] font-medium text-brand-wine hover:underline"
              >
                Eliminar
              </button>
            )}
          </>
        )}
      </div>

      {mostrarVisor && (
        <ModalVisorPdf
          idDocumento={doc.id_documento_producto}
          nombre={doc.nombre_original}
          obtenerUrl={productosApi.obtenerUrlVisorDocumentoProducto}
          onClose={() => setMostrarVisor(false)}
        />
      )}
    </div>
  );
}

function CasillaDocumento({
  producto,
  tipo,
  correccionesPendientes,
}: {
  producto: Producto;
  tipo: TipoDocumentoProducto;
  correccionesPendientes: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mostrarPublicidad, setMostrarPublicidad] = useState(false);
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('');

  const documentosDeEsteTipo = producto.documentos.filter((d) => d.tipo === tipo.carpeta_slug);
  const yaSubido = documentosDeEsteTipo[0];
  const esAnalisisProducto = tipo.carpeta_slug === 'analisis-producto';

  const subir = useMutation({
    mutationFn: (archivo: File) =>
      productosApi.subirDocumentoProducto(
        producto.id_producto,
        tipo.id_tipo_documento_producto,
        archivo,
        tipo.requiere_fecha_caducidad ? fechaCaducidad : undefined,
        tipo.permite_multiples ? nombreDocumento : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      window.dispatchEvent(new Event('hana:celebrar'));
      setError(null);
      setNombreDocumento('');
      setFechaCaducidad('');
    },
    onError: () => setError('No se pudo subir. Verifica que sea PDF y pese menos de 4MB.'),
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
    if (tipo.requiere_fecha_caducidad && !fechaCaducidad) {
      setError('Indica la fecha de caducidad antes de cargar el archivo.');
      return;
    }
    if (tipo.permite_multiples && !nombreDocumento.trim()) {
      setError('Indica el nombre de este documento antes de cargarlo.');
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
  // específicamente "Rechazado".
  const puedeEditar = !bloqueado || (correccionesPendientes && producto.estado_calificacion === 'Rechazado');
  const mostrarTooltipAnalisis = esAnalisisProducto && !yaSubido && mostrarPublicidad;

  const camposAntesDeSubir = (puedeEditar || !bloqueado) && (tipo.requiere_fecha_caducidad || tipo.permite_multiples) && (tipo.permite_multiples || !yaSubido);
  // El botón de "Cargue aquí..." se deshabilita hasta que estos campos
  // previos estén completos -> evita que el proveedor abra el selector
  // de PDF, elija un archivo, y recién ahí se entere de que le faltaba
  // poner el nombre o la fecha.
  const camposListos =
    !camposAntesDeSubir ||
    ((!tipo.permite_multiples || nombreDocumento.trim() !== '') &&
      (!tipo.requiere_fecha_caducidad || fechaCaducidad !== ''));

  return (
    <div className="min-w-0 flex-1 relative">
      <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

      {mostrarTooltipAnalisis && (
        <div className="absolute bottom-full left-0 mb-2 z-20 w-64 rounded-lg bg-brand-900 text-white text-xs px-3 py-2.5 shadow-lg">
          <p className="font-medium mb-1">¿Aún no tienes el análisis de Laboratorio?</p>
          <p className="text-white/80 leading-relaxed">
            Puedes realizarlo con nosotros. Para más información contáctanos a{' '}
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
        {/* Tipos "Permite_Multiples" (ej. Hojas de seguridad): se listan
            TODOS los archivos ya cargados, uno por uno. */}
        {tipo.permite_multiples &&
          documentosDeEsteTipo.map((doc) => (
            <div key={doc.id_documento_producto} className="mb-1.5">
              <UnDocumentoSubido
                doc={doc}
                tipo={tipo}
                puedeEditar={puedeEditar}
                reemplazando={subir.isPending}
                onReemplazar={() => inputRef.current?.click()}
              />
            </div>
          ))}

        {!tipo.permite_multiples && yaSubido ? (
          <UnDocumentoSubido
            doc={yaSubido}
            tipo={tipo}
            puedeEditar={puedeEditar}
            reemplazando={subir.isPending}
            onReemplazar={() => inputRef.current?.click()}
          />
        ) : bloqueado && !puedeEditar ? (
          <div className="w-full rounded-md border-2 border-dashed border-brand-900/10 px-2.5 py-1.5 bg-brand-900/[0.02]">
            <p className="text-[12px] font-medium text-brand-900/40">
              {tipo.nombre_documento}
              {tipo.obligatorio && <span> *</span>}
            </p>
            <p className="text-[10.5px] text-brand-900/30">
              {producto.estado_calificacion === 'Aprobado' ? 'No se subió (no aplica)' : 'Bloqueado durante revisión'}
            </p>
          </div>
        ) : (
          // Todo (nombre / fecha / botón de subir) va DENTRO de un único
          // rectángulo por documento -> antes eran dos cajas separadas
          // (una con los campos, otra con el botón) y no quedaba claro
          // que fueran del mismo documento. Ahora es una sola casilla:
          // título arriba, campos si aplica, y el "clic para elegir
          // archivo" como último renglón de la misma caja.
          <div
            className={`w-full rounded-md border-2 border-dashed px-2.5 py-2 transition-colors
              ${
                !camposListos
                  ? 'border-brand-900/10 bg-brand-900/[0.02]'
                  : tipo.obligatorio
                    ? 'border-brand-wine/30 hover:border-brand-wine/60'
                    : 'border-brand-900/15 hover:border-brand-900/30'
              }`}
          >
            <p className={`text-[12px] font-medium ${!camposListos ? 'text-brand-900/40' : 'text-brand-900'}`}>
              {tipo.permite_multiples && documentosDeEsteTipo.length > 0
                ? `Otro ${tipo.nombre_documento.toLowerCase()}`
                : tipo.nombre_documento}
              {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
            </p>

            {camposAntesDeSubir && (
              <div className="flex flex-col gap-1.5 my-1.5">
                {tipo.permite_multiples && (
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-medium text-brand-900/60">
                      Nombre de este documento <span className="text-brand-wine">*</span>
                    </span>
                    <input
                      type="text"
                      value={nombreDocumento}
                      onChange={(e) => setNombreDocumento(e.target.value)}
                      placeholder="Ej. HACCP 2026"
                      className="text-[11px] rounded-md border border-brand-900/15 px-2 py-1.5 bg-white"
                    />
                  </label>
                )}
                {tipo.requiere_fecha_caducidad && (
                  <label className="flex flex-col gap-0.5">
                    <span className="text-[10.5px] font-medium text-brand-900/60">
                      Fecha de caducidad <span className="text-brand-wine">*</span>
                    </span>
                    <input
                      type="date"
                      value={fechaCaducidad}
                      onChange={(e) => setFechaCaducidad(e.target.value)}
                      className="text-[11px] rounded-md border border-brand-900/15 px-2 py-1.5 bg-white"
                    />
                  </label>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={subir.isPending || !camposListos}
              title={!camposListos ? 'Completa el nombre/fecha de arriba antes de cargar el archivo.' : undefined}
              className={`text-left w-full ${!camposListos ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <p className={`text-[11px] font-medium underline ${!camposListos ? 'text-brand-900/30' : 'text-brand-900/70'}`}>
                {subir.isPending ? <Spinner className="h-3 w-3 inline mr-1" /> : null}
                {!camposListos ? 'Completa lo de arriba para poder cargar el PDF' : 'Clic para elegir el PDF (máx. 4MB)'}
              </p>
            </button>
          </div>
        )}
      </div>

      {error && <span className="text-[11px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

/**
 * Modal donde el proveedor gestiona los documentos de un producto
 * puntual (subir/ver/reemplazar/eliminar) y, si ya quedó todo completo,
 * lo registra o confirma su corrección sin salir del modal. El catálogo
 * de tipos ya no está fijo en 3 -> viene del backend, así que puede
 * crecer (ej. "Notificación sanitaria", "Hojas de seguridad") sin tocar
 * este componente.
 */
export default function ModalDocumentosProducto({
  producto,
  correccionesPendientes,
  onClose,
  onRegistrarUno,
  onConfirmarCorreccion,
  confirmandoCorreccion,
}: {
  producto: Producto;
  correccionesPendientes: boolean;
  onClose: () => void;
  onRegistrarUno: () => void;
  onConfirmarCorreccion: () => void;
  confirmandoCorreccion: boolean;
}) {
  const { data: tipos = [], isLoading } = useTiposDocumentoProducto();
  const tiposObligatorios = tipos.filter((t) => t.obligatorio);
  const tiposOpcionales = tipos.filter((t) => !t.obligatorio);

  const listoParaRegistrar = !producto.bloqueado && tieneDocumentosObligatoriosCompletos(producto, tipos);
  const listoParaReenviarCorreccion =
    correccionesPendientes &&
    producto.estado_calificacion === 'Rechazado' &&
    tieneDocumentosObligatoriosCompletos(producto, tipos);

  return (
    <Modal
      title={producto.nombre_producto}
      tituloExtra={<BadgeCalificacion producto={producto} />}
      onClose={onClose}
      maxWidth="max-w-lg"
    >
      <p className="text-xs text-brand-900/50 -mt-2 mb-3">
        {producto.codigo_barras ?? 'Sin código de barras'} · {producto.unidad_presentacion}
        {producto.precio != null && ` · $${producto.precio}`}
        {producto.precio_en_revision && ' · 🔒 Precio en revisión'}
        {producto.peso != null && ` · ${producto.peso} kg`}
        {producto.volumen != null && ` · ${producto.volumen} m³`}
        {producto.unidad_por_caja != null && ` · ${producto.unidad_por_caja} u/caja`}
      </p>

      {producto.estado_calificacion === 'Rechazado' && producto.comentario_calificacion && (
        <div className="mb-3 rounded-md bg-amber-50 border border-amber-200 px-2.5 py-1.5">
          <p className="text-[12px] font-medium text-amber-800">Motivo</p>
          <p className="text-[12px] text-brand-900/70 mt-0.5">{producto.comentario_calificacion}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner className="h-5 w-5" />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {tiposObligatorios.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-wine/80">Obligatorios</p>
              {tiposObligatorios.map((tipo) => (
                <CasillaDocumento
                  key={tipo.id_tipo_documento_producto}
                  producto={producto}
                  tipo={tipo}
                  correccionesPendientes={correccionesPendientes}
                />
              ))}
            </div>
          )}

          {tiposOpcionales.length > 0 && (
            <div className="flex flex-col gap-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-900/40">Opcionales</p>
              {tiposOpcionales.map((tipo) => (
                <CasillaDocumento
                  key={tipo.id_tipo_documento_producto}
                  producto={producto}
                  tipo={tipo}
                  correccionesPendientes={correccionesPendientes}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" className="!bg-brand-200/40" onClick={onClose}>
          Cerrar
        </Button>
        {listoParaRegistrar && <Button onClick={onRegistrarUno}>Registrar este producto</Button>}
        {listoParaReenviarCorreccion && (
          <Button isLoading={confirmandoCorreccion} onClick={onConfirmarCorreccion}>
            Registrar corrección
          </Button>
        )}
      </div>
    </Modal>
  );
}