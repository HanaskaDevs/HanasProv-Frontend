import { useRef, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as documentacionApi from '../api/documentacionApi';
import type { DocumentoSubido, TipoDocumentoChecklist } from '../types';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Modal from '../../../shared/components/Modal';
import ModalVisorPdf from './ModalVisorPdf';

const TAMANO_MAXIMO_MB = 4;

/**
 * Para los tipos "permite_multiples" pedimos un nombre para cada archivo
 * (ya que puede haber varios), pero "Nombre del documento" es genérico.
 * Esto lo hace más natural según de qué tipo se trate -> se matchea por
 * el nombre del catálogo, no por un id fijo, para no romper si cambia el
 * orden de las filas en Tipo_Documento.
 */
function etiquetaNombreArchivo(nombreDocumento: string): string {
  const texto = nombreDocumento.toLowerCase();
  if (texto.includes('certificaci')) return 'Nombre del certificado';
  if (texto.includes('hojas de seguridad') || texto.includes('hoja de seguridad')) return 'Nombre de la hoja';
  return 'Nombre del documento';
}

function IconoDocumento({ className = '' }: { className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconoSubir({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14.9A5 5 0 0 1 6 5.3 6 6 0 0 1 17.9 8.7a4.5 4.5 0 0 1 1.1 8.9" />
      <polyline points="12 12 12 21" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  );
}

function IconoOjo({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoRepetir({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  );
}

function IconoBasura({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function IconoAlerta({ className = '' }: { className?: string }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function ArchivoSubido({
  doc,
  tipo,
  soloLectura,
  correccionesPendientes,
  reemplazando,
  onCambiarReemplazando,
}: {
  doc: TipoDocumentoChecklist['documentos'][number];
  tipo: TipoDocumentoChecklist;
  soloLectura: boolean;
  correccionesPendientes: boolean;
  // Antes esto era un useState local acá adentro -> el problema es que
  // el bloque de "cargar otro" vive en el padre (FilaDocumento), y no
  // tenía forma de saber si ALGUNA fila estaba reemplazando para
  // ocultarse mientras tanto. Ahora el padre es dueño de "cuál
  // documento se está reemplazando" (a lo sumo uno a la vez) y esta
  // fila solo refleja/pide cambiarlo.
  reemplazando: boolean;
  onCambiarReemplazando: (valor: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [visorAbierto, setVisorAbierto] = useState(false);

  const reemplazar = useMutation({
    mutationFn: (archivo: File) =>
      documentacionApi.reemplazarDocumento(
        doc.id_documento_proveedor,
        archivo,
        nuevaFecha || undefined,
        nuevoNombre || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      onCambiarReemplazando(false);
      setNuevaFecha('');
      setNuevoNombre('');
      setError(null);
    },
    onError: () => setError('No se pudo reemplazar. Verifica que sea PDF y pese menos de 4MB.'),
  });

  const borrar = useMutation({
    mutationFn: () => documentacionApi.borrarDocumento(doc.id_documento_proveedor),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setConfirmandoBorrar(false);
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
    if (tipo.requiere_fecha_caducidad && !nuevaFecha) {
      setError('Indica la nueva fecha de caducidad antes de elegir el archivo.');
      return;
    }
    if (tipo.permite_multiples && !nuevoNombre.trim()) {
      setError('Indica el nombre de este documento antes de elegir el archivo.');
      return;
    }

    setError(null);
    reemplazar.mutate(archivo);
  }

  // Aunque la documentación ya esté "registrada" (solo lectura), un
  // documento puntual se puede seguir corrigiendo (reemplazar o borrar)
  // MIENTRAS HAYA CORRECCIONES PENDIENTES DE CONFIRMAR (el admin rechazó
  // algo y todavía no dijiste "ya terminé de corregir" con el botón de
  // abajo) Y ese documento en particular no esté ya Aprobado. Una vez que
  // confirmás, todo vuelve a quedar bloqueado hasta que el admin revise
  // de nuevo. El backend aplica exactamente esta misma regla.
  const rechazado = doc.estado_calificacion === 'Rechazado';
  const puedeEditar = !soloLectura || (correccionesPendientes && doc.estado_calificacion !== 'Aprobado');

  return (
    <div className="py-1">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="text-xs font-medium text-brand-900 truncate" title={doc.nombre_original}>
            {doc.nombre_original}
          </span>
          {doc.fecha_caducidad && (
            <span className="text-[10.5px] font-bold text-brand-900/60 shrink-0">
              Fecha_Exp_{doc.fecha_caducidad}
            </span>
          )}
          {doc.estado_calificacion === 'Aprobado' && <Badge tone="success">Aprobado</Badge>}
          {rechazado && (
            <Badge tone="danger" className="!bg-amber-100 !text-amber-800">
              Rechazado
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setVisorAbierto(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
          >
            <IconoOjo /> Ver
          </button>
          {puedeEditar && (
            <button
              onClick={() => onCambiarReemplazando(!reemplazando)}
              disabled={reemplazar.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-900/50 hover:text-brand-900"
            >
              <IconoRepetir /> Reemplazar
            </button>
          )}
          {puedeEditar && (
            <button
              onClick={() => setConfirmandoBorrar(true)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-wine/70 hover:text-brand-wine"
            >
              <IconoBasura /> Borrar
            </button>
          )}
        </div>
      </div>

      {rechazado && doc.comentario_calificacion && (
        <p className="mt-1 text-[11px] text-brand-wine bg-brand-wine/5 border border-brand-wine/15 rounded px-2 py-1">
          <span className="font-semibold">Motivo:</span> {doc.comentario_calificacion}
        </p>
      )}

      {puedeEditar && reemplazando && (
        <div className="mt-1.5 rounded-md border border-brand-700/20 bg-brand-700/[0.04] p-2">
          <p className="text-[10px] font-medium text-brand-700 mb-1">
            Sube el archivo que reemplaza a "{doc.nombre_original}"
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

            {tipo.permite_multiples && (
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder={etiquetaNombreArchivo(tipo.nombre_documento)}
                className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                  text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
              />
            )}
            {tipo.requiere_fecha_caducidad && (
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                  text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
              />
            )}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={reemplazar.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
            >
              {reemplazar.isPending ? <Spinner className="h-3 w-3" /> : <IconoSubir />}
              Elegir PDF
            </button>
            <button
              type="button"
              onClick={() => {
                onCambiarReemplazando(false);
                setNuevaFecha('');
                setNuevoNombre('');
                setError(null);
              }}
              disabled={reemplazar.isPending}
              className="text-[11px] text-brand-900/40 hover:text-brand-900"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <span className="text-[10px] text-brand-wine block mt-1">{error}</span>}

      {confirmandoBorrar && (
        <Modal onClose={() => !borrar.isPending && setConfirmandoBorrar(false)} title="Borrar documento">
          <div className="flex gap-3">
            <div className="shrink-0 h-10 w-10 rounded-full bg-brand-wine/10 flex items-center justify-center text-brand-wine">
              <IconoAlerta />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-brand-900">
                ¿Borrar <span className="font-medium">{doc.nombre_original}</span>?
              </p>
              <p className="text-xs text-brand-900/50">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          {borrar.isError && <p className="text-xs text-brand-wine mt-3">No se pudo borrar. Intenta de nuevo.</p>}

          <div className="flex justify-end gap-2 mt-5">
            <Button variant="ghost" onClick={() => setConfirmandoBorrar(false)} disabled={borrar.isPending}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={() => borrar.mutate()} isLoading={borrar.isPending}>
              Sí, borrar
            </Button>
          </div>
        </Modal>
      )}

      {visorAbierto && (
        <ModalVisorPdf
          idDocumentoProveedor={doc.id_documento_proveedor}
          nombre={doc.nombre_original}
          onClose={() => setVisorAbierto(false)}
        />
      )}
    </div>
  );
}

function FilaDocumento({
  tipo,
  soloLectura,
  correccionesPendientes,
}: {
  tipo: TipoDocumentoChecklist;
  soloLectura: boolean;
  correccionesPendientes: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [error, setError] = useState<string | null>(null);
  // A lo sumo un documento de este tipo se puede estar reemplazando a
  // la vez -> mientras eso pasa, se oculta el bloque de "cargar otro"
  // de más abajo, para que no aparezcan dos formularios de carga casi
  // idénticos en pantalla al mismo tiempo (uno para reemplazar el
  // archivo rechazado, otro para agregar uno adicional).
  const [reemplazandoId, setReemplazandoId] = useState<number | null>(null);

  const subir = useMutation({
    mutationFn: (archivo: File) =>
      documentacionApi.subirDocumento(
        tipo.id_tipo_documento,
        archivo,
        fechaCaducidad || undefined,
        nombreDocumento || undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setFechaCaducidad('');
      setNombreDocumento('');
      setError(null);
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
      setError('Indica la fecha de caducidad antes de subir el archivo.');
      return;
    }
    if (tipo.permite_multiples && !nombreDocumento.trim()) {
      setError('Indica el nombre de este documento antes de subir el archivo.');
      return;
    }

    setError(null);
    subir.mutate(archivo);
  }

  const yaSubido = tipo.documentos.length > 0;
  const faltaObligatorio = tipo.obligatorio && !yaSubido;
  // Igual que en ArchivoSubido: aunque la documentación ya esté
  // registrada (soloLectura), mientras haya correcciones pendientes de
  // confirmar se puede seguir subiendo -> esto es lo que faltaba acá:
  // si un tipo "Permite_Multiples" se queda en 0 documentos (ej. se
  // borró el único que había, el que estaba rechazado), sigue sin
  // ningún "ArchivoSubido" que muestre el botón de editar, así que hace
  // falta este mismo permiso acá para poder volver a subir uno.
  const puedeSubirNuevo = !soloLectura || correccionesPendientes;
  const mostrarCuadroCarga = puedeSubirNuevo && (tipo.permite_multiples || !yaSubido) && reemplazandoId === null;

  return (
    <div className="rounded-2xl border border-brand-900/20 bg-white p-2.5 transition-all duration-150 hover:border-brand-900/35 hover:shadow-sm">
      <div className="flex items-center gap-1.5 min-w-0">
        <IconoDocumento className={yaSubido ? 'text-emerald-600 shrink-0' : 'text-brand-900/35 shrink-0'} />
        <span className="text-xs font-medium text-brand-900 truncate">
          {tipo.nombre_documento}
          {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
        </span>
        {tipo.permite_multiples && (
          <span className="text-[10px] text-brand-700/60 shrink-0 hidden lg:inline">(varios)</span>
        )}
      </div>

      <div className="mt-1">
        {yaSubido ? (
          <Badge tone="success">Cargado</Badge>
        ) : faltaObligatorio ? (
          <Badge tone="danger">Pendiente (Obligatorio)</Badge>
        ) : (
          <Badge tone="neutral">Pendiente (Opcional)</Badge>
        )}
      </div>

      {tipo.documentos.map((doc) => (
        <ArchivoSubido
          key={doc.id_documento_proveedor}
          doc={doc}
          tipo={tipo}
          soloLectura={soloLectura}
          correccionesPendientes={correccionesPendientes}
          reemplazando={reemplazandoId === doc.id_documento_proveedor}
          onCambiarReemplazando={(valor) => setReemplazandoId(valor ? doc.id_documento_proveedor : null)}
        />
      ))}

      {soloLectura && !yaSubido && !mostrarCuadroCarga && (
        <p className="text-[11px] text-brand-900/35 italic mt-1">No se cargó ningún archivo.</p>
      )}

      {mostrarCuadroCarga && (
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

          {tipo.permite_multiples && (
            <input
              type="text"
              value={nombreDocumento}
              onChange={(e) => setNombreDocumento(e.target.value)}
              placeholder={etiquetaNombreArchivo(tipo.nombre_documento)}
              className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
            />
          )}
          {tipo.requiere_fecha_caducidad && (
            <input
              type="date"
              value={fechaCaducidad}
              onChange={(e) => setFechaCaducidad(e.target.value)}
              className="rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
            />
          )}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subir.isPending}
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
              faltaObligatorio
                ? 'bg-brand-wine/10 text-brand-wine hover:bg-brand-wine/15'
                : 'bg-brand-700/10 text-brand-700 hover:bg-brand-700/15'
            }`}
          >
            {subir.isPending ? <Spinner className="h-3 w-3" /> : <IconoSubir />}
            {yaSubido ? 'Clic para cargar otro' : 'Clic para subir tu archivo'}
          </button>
          <span className="text-[10px] text-brand-900/35">PDF, máx. 4MB</span>
        </div>
      )}

      {error && <span className="text-[10px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

function formateaFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

function AroProgreso({ porcentaje }: { porcentaje: number }) {
  const radio = 18;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - porcentaje / 100);
  const color = porcentaje >= 100 ? 'stroke-emerald-500' : porcentaje >= 50 ? 'stroke-brand-700' : 'stroke-brand-wine';

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={radio} fill="none" strokeWidth="4.5" className="stroke-brand-900/8" />
      <circle
        cx="22"
        cy="22"
        r={radio}
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        className={`transition-all duration-500 ${color}`}
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 fill-brand-900 text-[10px] font-bold"
        style={{ transformOrigin: '22px 22px' }}
      >
        {porcentaje}%
      </text>
    </svg>
  );
}

/**
 * Antes eran 2 Cards apiladas (resumen de progreso + barra de registro).
 * Se fusionaron en una sola franja compacta -> ahorra el padding/margen
 * de una tarjeta entera, clave para que la vista completa quepa sin
 * scroll.
 */
/** Detalle organizado de los documentos rechazados -> lo que ve el proveedor al pulsar "Más información". */
function ModalDetalleRechazoDocumentos({
  documentos,
  onClose,
}: {
  documentos: { tipo: TipoDocumentoChecklist; doc: DocumentoSubido }[];
  onClose: () => void;
}) {
  return (
    <Modal onClose={onClose} title={`Documentos por corregir (${documentos.length})`} maxWidth="max-w-lg">
      <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
        {documentos.map(({ tipo, doc }) => (
          <div key={doc.id_documento_proveedor} className="rounded-lg border border-brand-wine/15 bg-brand-wine/[0.03] p-3">
            <p className="text-[10.5px] text-brand-900/50">{tipo.nombre_documento}</p>
            <p className="text-xs font-semibold text-brand-900">{doc.nombre_original}</p>
            <p className="text-sm text-brand-900/75 mt-1">{doc.comentario_calificacion}</p>
          </div>
        ))}
      </div>
    </Modal>
  );
}

function FranjaSuperior({
  totalObligatorios,
  cargadosObligatorios,
  totalDocumentos,
  cargadosDocumentos,
  registrado,
  fechaRegistro,
  faltantes,
  documentosRechazados,
  correccionesPendientes,
  todosAprobados,
}: {
  totalObligatorios: number;
  cargadosObligatorios: number;
  totalDocumentos: number;
  cargadosDocumentos: number;
  registrado: boolean;
  fechaRegistro: string | null;
  faltantes: string[];
  documentosRechazados: { tipo: TipoDocumentoChecklist; doc: DocumentoSubido }[];
  correccionesPendientes: boolean;
  todosAprobados: boolean;
}) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const porcentaje =
    totalObligatorios > 0 ? Math.round((cargadosObligatorios / totalObligatorios) * 100) : 100;
  const faltanObligatorios = totalObligatorios - cargadosObligatorios;
  const hayRechazados = documentosRechazados.length > 0;

  const registrar = useMutation({
    mutationFn: documentacionApi.registrarDocumentacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setModalAbierto(false);
    },
  });

  const confirmarCorrecciones = useMutation({
    mutationFn: documentacionApi.confirmarCorrecciones,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
    },
  });

  return (
    <Card className="!p-2.5 sm:!p-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <AroProgreso porcentaje={porcentaje} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-brand-900 truncate flex items-center gap-2 flex-wrap">
              {registrado ? (
                correccionesPendientes ? (
                  <>
                    <Badge tone="danger">Documentación en revisión</Badge>
                    <span className="text-brand-900/60 font-normal">
                      {hayRechazados
                        ? documentosRechazados.length === 1
                          ? '1 documento por corregir'
                          : `${documentosRechazados.length} documentos por corregir`
                        : 'Corregido, clic en "Registrar documentación actualizada" para enviar a calificar'}
                    </span>
                  </>
                ) : todosAprobados ? (
                  <Badge tone="success">Documentación Aprobada</Badge>
                ) : (
                  <Badge tone="info">Documentación en revisión</Badge>
                )
              ) : porcentaje === 0 ? (
                'Vamos a cargar tu documentación'
              ) : faltanObligatorios > 0 ? (
                `¡Vas bien! Te ${faltanObligatorios === 1 ? 'falta' : 'faltan'} ${faltanObligatorios} obligatorio${faltanObligatorios === 1 ? '' : 's'}`
              ) : (
                '¡Todos los obligatorios están cargados!'
              )}
              {registrado && fechaRegistro && (
                <span className="text-brand-900/40 font-normal text-[10.5px]">
                  {formateaFecha(fechaRegistro)}
                </span>
              )}
            </p>
            <p className="text-[10.5px] text-brand-900/50 mt-0.5">
              {cargadosObligatorios}/{totalObligatorios} obligatorios · {cargadosDocumentos}/{totalDocumentos} en total
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {registrado && hayRechazados && (
            <Button
              variant="ghost"
              className="!bg-brand-200/40 hover:!bg-brand-200/60 !text-xs !px-3 !py-1.5"
              onClick={() => setModalDetalleAbierto(true)}
            >
              Más información
            </Button>
          )}

          {registrado && correccionesPendientes ? (
            <div className="text-right">
              <span className="relative inline-block group">
                <Button
                  variant="primary"
                  className="!text-xs !px-3 !py-1.5"
                  disabled={hayRechazados}
                  isLoading={confirmarCorrecciones.isPending}
                  onClick={() => confirmarCorrecciones.mutate()}
                >
                  Registrar documentación actualizada
                </Button>

                {hayRechazados && (
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute z-20 right-0 top-full mt-1.5 w-56 rounded-md bg-brand-900
                      px-2.5 py-1.5 text-[11px] leading-snug text-white shadow-lg opacity-0 invisible
                      group-hover:opacity-100 group-hover:visible transition-opacity"
                  >
                    Se habilita al corregir {documentosRechazados.length === 1 ? 'el documento rechazado' : 'los documentos rechazados'}
                  </span>
                )}
              </span>

              {confirmarCorrecciones.isError && (
                <p className="text-[10px] text-brand-wine mt-1">
                  {axios.isAxiosError(confirmarCorrecciones.error) && confirmarCorrecciones.error.response?.data?.errors
                    ? Object.values(confirmarCorrecciones.error.response.data.errors).flat().join(' ')
                    : 'No se pudo confirmar. Intenta de nuevo.'}
                </p>
              )}
            </div>
          ) : registrado ? (
            <Link
              to="/productos"
              className="inline-flex items-center gap-1.5 rounded-md bg-brand-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 cursor-pointer"
            >
              Ir a Ficha Productos
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </Link>
          ) : (
            <div className="text-right">
              <Button
                variant="primary"
                className="!text-xs !px-3 !py-1.5"
                disabled={faltantes.length > 0}
                onClick={() => setModalAbierto(true)}
              >
                Registrar documentación
              </Button>
              {faltantes.length > 0 && (
                <p className="text-[10px] text-brand-900/40 mt-1">
                  Se habilita al cargar los {faltantes.length === 1 ? 'obligatorio' : 'obligatorios'} que faltan
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {modalDetalleAbierto && (
        <ModalDetalleRechazoDocumentos
          documentos={documentosRechazados}
          onClose={() => setModalDetalleAbierto(false)}
        />
      )}

      {modalAbierto && (
        <Modal onClose={() => !registrar.isPending && setModalAbierto(false)} title="Registrar documentación">
          <div className="flex gap-3">
            <div className="shrink-0 h-10 w-10 rounded-full bg-brand-wine/10 flex items-center justify-center text-brand-wine">
              <IconoAlerta />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-brand-900">¿Estás seguro de registrar la documentación ingresada?</p>
              <p className="text-xs text-brand-900/50">
                Una vez registrada, no podrás editar ni cargar más archivos. Solo podrás verlos.
              </p>
            </div>
          </div>

          {registrar.isError && (
            <p className="text-xs text-brand-wine mt-3">
              {axios.isAxiosError(registrar.error) && registrar.error.response?.data?.errors
                ? Object.values(registrar.error.response.data.errors).flat().join(' ')
                : 'No se pudo registrar. Intenta de nuevo.'}
            </p>
          )}

          <div className="flex justify-end gap-2 mt-5">
            <Button variant="ghost" onClick={() => setModalAbierto(false)} disabled={registrar.isPending}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => registrar.mutate()} isLoading={registrar.isPending}>
              Sí, registrar
            </Button>
          </div>
        </Modal>
      )}
    </Card>
  );
}

function TabCategoria({
  nombre,
  activa,
  cargados,
  total,
  faltanObligatorios,
  onClick,
}: {
  nombre: string;
  activa: boolean;
  cargados: number;
  total: number;
  faltanObligatorios: number;
  onClick: () => void;
}) {
  const puntoColor = faltanObligatorios > 0 ? 'bg-brand-wine' : cargados === total ? 'bg-emerald-500' : 'bg-brand-900/25';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-3 py-1.5 text-xs font-medium transition-colors ${
        activa
          ? 'border-brand-700 text-brand-900 bg-white'
          : 'border-transparent text-brand-900/50 hover:text-brand-900 hover:bg-brand-900/[0.03]'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${puntoColor}`} />
      {nombre}
      <span
        className={`text-[10.5px] rounded-full px-1.5 py-0.5 ${
          activa ? 'bg-brand-200/60 text-brand-700' : 'bg-brand-900/8 text-brand-900/40'
        }`}
      >
        {cargados}/{total}
      </span>
    </button>
  );
}

const DOCUMENTOS_POR_PAGINA = 4;

function IconoFlechaChica({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

/**
 * Minimalista a propósito: flechas + puntos, nada de números de página
 * ni "Anterior/Siguiente" en texto. El punto activo se agranda un poco
 * (no solo cambia de color) para que se note incluso sin mirar con
 * atención.
 */
function FlechaPaginador({
  direccion,
  onClick,
  deshabilitada,
}: {
  direccion: 'izquierda' | 'derecha';
  onClick: () => void;
  deshabilitada: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={deshabilitada}
      aria-label={direccion === 'izquierda' ? 'Página anterior' : 'Página siguiente'}
      className="h-11 w-11 rounded-full flex items-center justify-center bg-brand-700 text-white shadow-lg
        hover:bg-brand-900 disabled:opacity-0 disabled:pointer-events-none transition-all"
    >
      <IconoFlechaChica className={direccion === 'izquierda' ? 'rotate-180 h-4 w-4' : 'h-4 w-4'} />
    </button>
  );
}

function PuntosPaginador({
  pagina,
  totalPaginas,
  onCambiar,
}: {
  pagina: number;
  totalPaginas: number;
  onCambiar: (pagina: number) => void;
}) {
  if (totalPaginas <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      {Array.from({ length: totalPaginas }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onCambiar(n)}
          aria-label={`Ir a la página ${n}`}
          className={`rounded-full transition-all duration-200 ${
            n === pagina ? 'h-2 w-5 bg-brand-700' : 'h-2 w-2 bg-brand-900/15 hover:bg-brand-900/30'
          }`}
        />
      ))}
    </div>
  );
}

export default function ChecklistDocumentos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mi-documentos'],
    queryFn: documentacionApi.obtenerChecklist,
  });
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card className="max-w-6xl mx-auto w-full">
        <p className="text-sm text-brand-wine">
          No se pudo cargar la documentación.{' '}
          {axios.isAxiosError(error) && error.response?.data?.message
            ? error.response.data.message
            : 'Intenta de nuevo más tarde.'}
        </p>
      </Card>
    );
  }

  const tipos = data?.documentos ?? [];

  if (tipos.length === 0) {
    return (
      <Card className="max-w-6xl mx-auto w-full">
        <p className="text-sm text-brand-900/60 text-center py-6">No hay documentos configurados todavía.</p>
      </Card>
    );
  }

  const categorias = Array.from(new Set(tipos.map((t) => t.categoria))).sort((a, b) =>
    a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)
  );

  const faltantes = tipos.filter((t) => t.obligatorio && t.documentos.length === 0).map((t) => t.nombre_documento);

  const statsPorCategoria = categorias.map((categoria) => {
    const tiposCategoria = tipos
      .filter((t) => t.categoria === categoria)
      .sort((a, b) => Number(b.obligatorio) - Number(a.obligatorio));
    const cargados = tiposCategoria.filter((t) => t.documentos.length > 0).length;
    const faltanObligatorios = tiposCategoria.filter((t) => t.obligatorio && t.documentos.length === 0).length;
    return { categoria, tiposCategoria, cargados, faltanObligatorios };
  });

  const categoriaSeleccionada =
    categoriaActiva && categorias.includes(categoriaActiva) ? categoriaActiva : categorias[0];
  const statsActivos = statsPorCategoria.find((s) => s.categoria === categoriaSeleccionada)!;

  const totalPaginas = Math.max(1, Math.ceil(statsActivos.tiposCategoria.length / DOCUMENTOS_POR_PAGINA));
  // Si la categoría tiene menos páginas que la actual (ej. venías en la
  // página 3 de "General" y cambiaste a "Certificaciones", que solo
  // tiene 1) o si la propia categoría cambió, ajustamos sin que se note
  // como un salto raro -> Math.min la deja quieta cuando sí es válida.
  const paginaSegura = Math.min(pagina, totalPaginas);
  const inicio = (paginaSegura - 1) * DOCUMENTOS_POR_PAGINA;
  const tiposPagina = statsActivos.tiposCategoria.slice(inicio, inicio + DOCUMENTOS_POR_PAGINA);

  function cambiarCategoria(categoria: string) {
    setCategoriaActiva(categoria);
    setPagina(1);
  }

  const totalObligatorios = tipos.filter((t) => t.obligatorio).length;
  const cargadosObligatorios = totalObligatorios - faltantes.length;
  const cargadosDocumentos = tipos.filter((t) => t.documentos.length > 0).length;
  const documentosRechazados = tipos.flatMap((tipo) =>
    tipo.documentos
      .filter((doc) => doc.estado_calificacion === 'Rechazado')
      .map((doc) => ({ tipo, doc }))
  );
  // "En revisión" (celeste) implica que todavía falta que el admin la
  // mire -> pero antes ese era el ÚNICO texto posible una vez
  // registrada (aparte del caso con rechazos), aunque el admin ya
  // hubiera aprobado TODO. Acá se calcula aparte para poder decir
  // "Aprobada" cuando de verdad ya no queda nada pendiente de revisar.
  const todosLosDocumentos = tipos.flatMap((tipo) => tipo.documentos);
  const todosAprobados =
    todosLosDocumentos.length > 0 && todosLosDocumentos.every((doc) => doc.estado_calificacion === 'Aprobado');

  return (
    <div className="flex-1 min-h-0 flex flex-col space-y-2.5 max-w-6xl mx-auto w-full">
      <div className="shrink-0">
        <FranjaSuperior
          totalObligatorios={totalObligatorios}
          cargadosObligatorios={cargadosObligatorios}
          totalDocumentos={tipos.length}
          cargadosDocumentos={cargadosDocumentos}
          registrado={data?.registrado ?? false}
          fechaRegistro={data?.fecha_registro ?? null}
          faltantes={faltantes}
          documentosRechazados={documentosRechazados}
          correccionesPendientes={data?.correcciones_pendientes ?? false}
          todosAprobados={todosAprobados}
        />
      </div>

      <div className="relative flex-1 min-h-0 flex flex-col">
        {totalPaginas > 1 && (
          <div className="hidden sm:block absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10">
            <FlechaPaginador
              direccion="izquierda"
              deshabilitada={paginaSegura === 1}
              onClick={() => setPagina(paginaSegura - 1)}
            />
          </div>
        )}

        <Card className="!p-0 overflow-hidden flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 flex gap-0.5 overflow-x-auto border-b border-brand-900/8 bg-brand-900/[0.02] px-2 pt-1">
            {statsPorCategoria.map(({ categoria, tiposCategoria, cargados, faltanObligatorios }) => (
              <TabCategoria
                key={categoria}
                nombre={categoria}
                activa={categoria === categoriaSeleccionada}
                cargados={cargados}
                total={tiposCategoria.length}
                faltanObligatorios={faltanObligatorios}
                onClick={() => cambiarCategoria(categoria)}
              />
            ))}
          </div>

          {/* Antes esto tenía altura fija (flex-1) + contenido centrado
              verticalmente, para que el paginado no "saltara" entre
              páginas con distinta cantidad de documentos. Pero con
              tarjetas que ahora pueden crecer mucho (rechazo + observación
              + formulario de reemplazo abierto), una altura fija hacía que
              el contenido se desbordara y tapara lo de al lado. Ahora
              crece de forma natural; overflow-y-auto es solo un respaldo
              por si en una pantalla muy baja igual no entra todo. */}
          <div className="p-3 overflow-y-auto">
            <div key={`${categoriaSeleccionada}-${paginaSegura}`} className="animar-entrada-pagina sm:px-11">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tiposPagina.map((tipo) => (
                  <FilaDocumento
                    key={tipo.id_tipo_documento}
                    tipo={tipo}
                    soloLectura={data?.registrado ?? false}
                    correccionesPendientes={data?.correcciones_pendientes ?? false}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="shrink-0 pb-2.5">
            <PuntosPaginador pagina={paginaSegura} totalPaginas={totalPaginas} onCambiar={setPagina} />

            {/* En mobile no hay espacio a los costados -> ahí sí mostramos flechas normales, junto a los puntitos */}
            {totalPaginas > 1 && (
              <div className="flex sm:hidden items-center justify-center gap-3 mt-1.5">
                <FlechaPaginador
                  direccion="izquierda"
                  deshabilitada={paginaSegura === 1}
                  onClick={() => setPagina(paginaSegura - 1)}
                />
                <FlechaPaginador
                  direccion="derecha"
                  deshabilitada={paginaSegura === totalPaginas}
                  onClick={() => setPagina(paginaSegura + 1)}
                />
              </div>
            )}
          </div>
        </Card>

        {totalPaginas > 1 && (
          <div className="hidden sm:block absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
            <FlechaPaginador
              direccion="derecha"
              deshabilitada={paginaSegura === totalPaginas}
              onClick={() => setPagina(paginaSegura + 1)}
            />
          </div>
        )}
      </div>
    </div>
  );
}