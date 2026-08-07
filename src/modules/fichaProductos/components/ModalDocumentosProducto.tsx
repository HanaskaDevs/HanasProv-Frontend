import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import type { Producto } from '../types';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import ModalVisorPdf from '../../../shared/components/ModalVisorPdf';

const TAMANO_MAXIMO_MB = 4;

export const TIPOS_DOCUMENTO = [
  { id: 1, slug: 'ficha-tecnica', etiqueta: 'Ficha técnica', obligatorio: true },
  { id: 2, slug: 'analisis-producto', etiqueta: 'Análisis de Laboratorio', obligatorio: true },
  { id: 3, slug: 'carta-alergenos', etiqueta: 'Carta de alérgenos', obligatorio: false },
] as const;

export function tieneDocumentosObligatoriosCompletos(producto: Producto): boolean {
  const obligatorios = TIPOS_DOCUMENTO.filter((t) => t.obligatorio);
  return obligatorios.every((tipo) => producto.documentos.some((d) => d.tipo === tipo.slug));
}

export function contarDocumentosCompletos(producto: Producto): number {
  return TIPOS_DOCUMENTO.filter((tipo) => producto.documentos.some((d) => d.tipo === tipo.slug)).length;
}

export function contarDocumentosPorObligatoriedad(producto: Producto): {
  obligatoriosSubidos: number;
  obligatoriosTotal: number;
  opcionalesSubidos: number;
  opcionalesTotal: number;
} {
  const obligatorios = TIPOS_DOCUMENTO.filter((t) => t.obligatorio);
  const opcionales = TIPOS_DOCUMENTO.filter((t) => !t.obligatorio);
  return {
    obligatoriosSubidos: obligatorios.filter((tipo) => producto.documentos.some((d) => d.tipo === tipo.slug)).length,
    obligatoriosTotal: obligatorios.length,
    opcionalesSubidos: opcionales.filter((tipo) => producto.documentos.some((d) => d.tipo === tipo.slug)).length,
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

  const [mostrarVisor, setMostrarVisor] = useState(false);

  // Solo el documento OPCIONAL (Carta de alérgenos) se puede borrar del
  // todo -> Ficha técnica y Análisis de Laboratorio son obligatorios,
  // ahí solo se puede Ver/Reemplazar.
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
  // "En revisión" = bloqueado y todavía sin calificar (Pendiente) -> es
  // el mismo criterio que usa BadgeCalificacion para pintar ese badge,
  // así la tarjeta del documento usa la misma paleta que el badge de
  // arriba en vez de un verde apagado que se confunde con "Aprobado".
  const enRevision = bloqueado && producto.estado_calificacion === 'Pendiente';
  const mostrarTooltipAnalisis = esAnalisisProducto && !yaSubido && mostrarPublicidad;

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
        {yaSubido ? (
          <div
            className={`rounded-md border px-2.5 py-1.5 ${
              !puedeEditar
                ? enRevision
                  ? 'border-brand-200 bg-brand-200/25'
                  : 'border-emerald-100 bg-emerald-50/60'
                : 'border-emerald-200 bg-emerald-50'
            }`}
          >
            <p
              className={`text-[12px] font-medium ${
                !puedeEditar ? (enRevision ? 'text-brand-700' : 'text-emerald-700/70') : 'text-emerald-800'
              }`}
            >
              {tipo.etiqueta}
            </p>
            <p
              className={`text-[10.5px] truncate ${
                !puedeEditar ? (enRevision ? 'text-brand-700/80' : 'text-emerald-700/50') : 'text-emerald-700/70'
              }`}
              title={yaSubido.nombre_original}
            >
              {yaSubido.nombre_original}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              <Button onClick={() => setMostrarVisor(true)} className="!text-[10.5px] !px-2.5 !py-1">
                Ver
              </Button>
              {puedeEditar && (
                <>
                  <button
                    onClick={() => inputRef.current?.click()}
                    disabled={subir.isPending}
                    className="text-[10.5px] font-medium text-brand-900/50 hover:underline"
                  >
                    Reemplazar
                  </button>
                  {!tipo.obligatorio && (
                    <button
                      onClick={() => eliminarDoc.mutate(yaSubido.id_documento_producto)}
                      disabled={eliminarDoc.isPending}
                      className="text-[10.5px] font-medium text-brand-wine hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ) : bloqueado && !puedeEditar ? (
          <div className="w-full rounded-md border-2 border-dashed border-brand-900/10 px-2.5 py-1.5 bg-brand-900/[0.02]">
            <p className="text-[12px] font-medium text-brand-900/40">
              {tipo.etiqueta}
              {tipo.obligatorio && <span> *</span>}
            </p>
            <p className="text-[10.5px] text-brand-900/30">
              {/* "Bloqueado durante revisión" solo tiene sentido mientras
                  el producto sigue en revisión -> si ya quedó Aprobado, no
                  está "bloqueado esperando revisión", está definitivo. */}
              {producto.estado_calificacion === 'Aprobado' ? 'No se subió (no aplica)' : 'Bloqueado durante revisión'}
            </p>
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
            <p className="text-[12px] font-medium text-brand-900">
              {subir.isPending ? <Spinner className="h-3 w-3 inline mr-1" /> : null}
              Cargue aquí {tipo.etiqueta.toLowerCase()}
              {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
            </p>
            <p className="text-[10.5px] text-brand-900/40">PDF, máx. 4MB</p>
          </button>
        )}
      </div>

      {error && <span className="text-[11px] text-brand-wine block mt-1">{error}</span>}

      {mostrarVisor && yaSubido && (
        <ModalVisorPdf
          idDocumento={yaSubido.id_documento_producto}
          nombre={yaSubido.nombre_original}
          obtenerUrl={productosApi.obtenerUrlVisorDocumentoProducto}
          onClose={() => setMostrarVisor(false)}
        />
      )}
    </div>
  );
}

/**
 * Modal donde el proveedor gestiona los 3 documentos de un producto
 * puntual (subir/ver/reemplazar/eliminar) y, si ya quedó todo completo,
 * lo registra o confirma su corrección sin salir del modal. Antes esto
 * vivía embebido en cada tarjeta de la grilla; ahora la lista principal
 * es más compacta (una fila por producto) y este modal concentra el
 * detalle solo cuando el proveedor lo necesita.
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
  const listoParaRegistrar = !producto.bloqueado && tieneDocumentosObligatoriosCompletos(producto);
  const listoParaReenviarCorreccion =
    correccionesPendientes &&
    producto.estado_calificacion === 'Rechazado' &&
    tieneDocumentosObligatoriosCompletos(producto);

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

      <div className="flex flex-col gap-2.5">
        {TIPOS_DOCUMENTO.map((tipo) => (
          <CasillaDocumento
            key={tipo.id}
            producto={producto}
            tipo={tipo}
            correccionesPendientes={correccionesPendientes}
          />
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="ghost" className="!bg-brand-200/40" onClick={onClose}>
          Cerrar
        </Button>
        {listoParaRegistrar && (
          <Button onClick={onRegistrarUno}>
            Registrar este producto
          </Button>
        )}
        {listoParaReenviarCorreccion && (
          <Button isLoading={confirmandoCorreccion} onClick={onConfirmarCorreccion}>
            Registrar corrección
          </Button>
        )}
      </div>
    </Modal>
  );
}