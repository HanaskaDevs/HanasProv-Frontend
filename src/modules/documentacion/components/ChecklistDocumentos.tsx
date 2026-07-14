import { useRef, useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import * as documentacionApi from '../api/documentacionApi';
import type { TipoDocumentoChecklist } from '../types';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Modal from '../../../shared/components/Modal';

const TAMANO_MAXIMO_MB = 4;

function IconoDocumento({ className = '' }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconoSubir({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 14.9A5 5 0 0 1 6 5.3 6 6 0 0 1 17.9 8.7a4.5 4.5 0 0 1 1.1 8.9" />
      <polyline points="12 12 12 21" />
      <polyline points="9 15 12 12 15 15" />
    </svg>
  );
}

function IconoOjo({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconoRepetir({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
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

function IconoBasura({ className = '' }: { className?: string }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

/**
 * Fila de UN archivo ya cargado. Cada uno maneja su propio input de
 * archivo y su propio reemplazo -> así, en los tipos con
 * permite_multiples, "Reemplazar" afecta solo a ESE archivo puntual y no
 * toca los demás que el proveedor ya subió para el mismo tipo.
 */
function ArchivoSubido({
  doc,
  tipo,
  soloLectura,
}: {
  doc: TipoDocumentoChecklist['documentos'][number];
  tipo: TipoDocumentoChecklist;
  soloLectura: boolean;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [reemplazando, setReemplazando] = useState(false);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [confirmandoBorrar, setConfirmandoBorrar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ver = useMutation({
    mutationFn: () => documentacionApi.descargarDocumento(doc.id_documento_proveedor),
  });

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
      setReemplazando(false);
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

  return (
    <div className="rounded-md border border-emerald-200/70 bg-white px-2.5 py-2">
      <p className="text-[11px] font-medium text-brand-900 truncate" title={doc.nombre_original}>
        {doc.nombre_original}
      </p>
      {doc.fecha_caducidad && (
        <p className="text-[10.5px] font-bold text-brand-900/70">Fecha_Exp_{doc.fecha_caducidad}</p>
      )}

      <div className="flex items-center gap-3 mt-1.5">
        <button
          onClick={() => ver.mutate()}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
        >
          <IconoOjo /> Ver
        </button>

        {!soloLectura && !reemplazando && (
          <button
            onClick={() => setReemplazando(true)}
            disabled={reemplazar.isPending}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-900/50 hover:text-brand-900"
          >
            <IconoRepetir /> Reemplazar
          </button>
        )}

        {!soloLectura && (
          <button
            onClick={() => setConfirmandoBorrar(true)}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-wine/70 hover:text-brand-wine"
          >
            <IconoBasura /> Borrar
          </button>
        )}
      </div>

      {!soloLectura && reemplazando && (
        <div className="mt-2 pt-2 border-t border-brand-900/8 flex flex-col gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleSeleccionar}
          />

          {tipo.permite_multiples && (
            <div className="flex items-center gap-1.5">
              <label className="shrink-0 text-[11px] text-brand-900/50">Nombre</label>
              <input
                type="text"
                value={nuevoNombre}
                onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Ej: HACCP 2026"
                className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                  text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
              />
            </div>
          )}

          {tipo.requiere_fecha_caducidad && (
            <div className="flex items-center gap-1.5">
              <label className="shrink-0 text-[11px] text-brand-900/50">Nueva vence</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={(e) => setNuevaFecha(e.target.value)}
                className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
                  text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
              />
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={reemplazar.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
            >
              {reemplazar.isPending ? <Spinner className="h-3 w-3" /> : <IconoSubir className="h-3.5 w-3.5" />}
              Elegir nuevo PDF
            </button>
            <button
              type="button"
              onClick={() => {
                setReemplazando(false);
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

          {borrar.isError && (
            <p className="text-xs text-brand-wine mt-3">No se pudo borrar. Intenta de nuevo.</p>
          )}

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
    </div>
  );
}

function CasillaDocumento({ tipo, soloLectura }: { tipo: TipoDocumentoChecklist; soloLectura: boolean }) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fechaCaducidad, setFechaCaducidad] = useState('');
  const [nombreDocumento, setNombreDocumento] = useState('');
  const [error, setError] = useState<string | null>(null);

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
  // Sin "permite_multiples": solo mostramos el cuadro de carga si todavía
  // no hay nada (después se reemplaza con el botón "Reemplazar").
  // Con "permite_multiples": el cuadro se queda siempre visible para
  // seguir agregando, además de la lista de lo ya subido.
  // En modo solo lectura (documentación ya registrada) nunca se muestra.
  const mostrarCuadroCarga = !soloLectura && (tipo.permite_multiples || !yaSubido);

  return (
    <div
      className={`min-w-0 rounded-lg border p-3 flex flex-col gap-2 transition-colors ${
        yaSubido
          ? 'border-emerald-200 bg-emerald-50/40'
          : faltaObligatorio
            ? 'border-brand-wine/25 bg-brand-wine/[0.03]'
            : 'border-brand-900/10 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-1.5 min-w-0">
          <IconoDocumento className={`mt-0.5 shrink-0 ${yaSubido ? 'text-emerald-600' : 'text-brand-900/35'}`} />
          <p className="text-xs font-medium text-brand-900 leading-snug line-clamp-2">
            {tipo.nombre_documento}
            {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
          </p>
        </div>
        {yaSubido ? (
          <Badge tone="success">Cargado</Badge>
        ) : faltaObligatorio ? (
          <Badge tone="danger">Falta</Badge>
        ) : (
          <Badge tone="neutral">Opcional</Badge>
        )}
      </div>

      {tipo.permite_multiples && (
        <p className="text-[10.5px] text-brand-700/70 -mt-1">Puedes subir más de un archivo.</p>
      )}

      {!soloLectura && (
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleSeleccionar}
        />
      )}

      {!soloLectura && tipo.permite_multiples && (
        <div className="flex items-center gap-1.5">
          <label className="shrink-0 text-[11px] text-brand-900/50">Nombre</label>
          <input
            type="text"
            value={nombreDocumento}
            onChange={(e) => setNombreDocumento(e.target.value)}
            placeholder="Ej: HACCP 2026"
            className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
              text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
          />
        </div>
      )}

      {!soloLectura && tipo.requiere_fecha_caducidad && (
        <div className="flex items-center gap-1.5">
          <label className="shrink-0 text-[11px] text-brand-900/50">Vence</label>
          <input
            type="date"
            value={fechaCaducidad}
            onChange={(e) => setFechaCaducidad(e.target.value)}
            className="min-w-0 flex-1 rounded-sm border border-brand-900/20 bg-white px-1.5 py-1 text-[11px]
              text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
          />
        </div>
      )}

      {tipo.documentos.map((doc) => (
        <ArchivoSubido key={doc.id_documento_proveedor} doc={doc} tipo={tipo} soloLectura={soloLectura} />
      ))}

      {soloLectura && !yaSubido && (
        <p className="text-[11px] text-brand-900/35 italic">No se cargó ningún archivo.</p>
      )}

      {mostrarCuadroCarga && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={subir.isPending}
          className={`w-full rounded-md border-2 border-dashed px-3 py-3 flex flex-col items-center justify-center gap-1 text-center transition-colors
            ${
              faltaObligatorio
                ? 'border-brand-wine/30 hover:border-brand-wine/60 hover:bg-brand-wine/5'
                : 'border-brand-900/15 hover:border-brand-700/50 hover:bg-brand-700/5'
            }`}
        >
          {subir.isPending ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <IconoSubir className={faltaObligatorio ? 'text-brand-wine/60' : 'text-brand-900/35'} />
          )}
          <p className="text-[11px] font-medium text-brand-900">
            {yaSubido ? 'Cargar otro archivo' : 'Clic para cargar'}
          </p>
          <p className="text-[10.5px] text-brand-900/40">PDF, máx. 4MB</p>
        </button>
      )}

      {error && <span className="text-[10px] text-brand-wine">{error}</span>}
    </div>
  );
}

function formateaFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

/**
 * Franja inferior con el botón "Registrar documentación": mientras no se
 * haya registrado, deja seguir subiendo/reemplazando y muestra cuántos
 * documentos obligatorios faltan. Al confirmar en el modal, todo el
 * checklist de arriba pasa a modo solo lectura (soloLectura=true).
 */
function BarraRegistro({
  registrado,
  fechaRegistro,
  faltantes,
}: {
  registrado: boolean;
  fechaRegistro: string | null;
  faltantes: string[];
}) {
  const queryClient = useQueryClient();
  const [modalAbierto, setModalAbierto] = useState(false);

  const registrar = useMutation({
    mutationFn: documentacionApi.registrarDocumentacion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-documentos'] });
      setModalAbierto(false);
    },
  });

  if (registrado) {
    return (
      <Card className="bg-emerald-50 border-emerald-200">
        <p className="text-sm text-emerald-800">
          <span className="font-semibold">Documentación registrada</span>
          {fechaRegistro && ` el ${formateaFecha(fechaRegistro)}`}. Ya no se puede editar ni cargar más archivos,
          solo puedes verlos.
        </p>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-900">
              Cuando termines de cargar todo, registra tu documentación.
            </p>
            <p className="text-xs text-brand-900/50 mt-0.5">
              {faltantes.length > 0
                ? `Todavía falta: ${faltantes.join(', ')}.`
                : 'Ya tienes todos los documentos obligatorios cargados.'}{' '}
              Después de registrar no podrás editar ni subir más archivos.
            </p>
          </div>
          <Button
            variant="primary"
            disabled={faltantes.length > 0}
            onClick={() => setModalAbierto(true)}
            className="shrink-0"
          >
            Registrar documentación
          </Button>
        </div>
      </Card>

      {modalAbierto && (
        <Modal onClose={() => !registrar.isPending && setModalAbierto(false)} title="Registrar documentación">
          <div className="flex gap-3">
            <div className="shrink-0 h-10 w-10 rounded-full bg-brand-wine/10 flex items-center justify-center text-brand-wine">
              <IconoAlerta />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-brand-900">
                ¿Estás seguro de registrar la documentación ingresada?
              </p>
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
    </>
  );
}

export default function ChecklistDocumentos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mi-documentos'],
    queryFn: documentacionApi.obtenerChecklist,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
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
      <Card>
        <p className="text-sm text-brand-900/60 text-center py-6">
          No hay documentos configurados todavía.
        </p>
      </Card>
    );
  }

  // 'General' antes que 'Certificaciones' (el backend ordena alfabético,
  // donde C < G, así que reordenamos acá para que salga en el orden
  // esperado por el equipo).
  const categorias = Array.from(new Set(tipos.map((t) => t.categoria))).sort((a, b) =>
    a === 'General' ? -1 : b === 'General' ? 1 : a.localeCompare(b)
  );

  const faltantes = tipos.filter((t) => t.obligatorio && t.documentos.length === 0).map((t) => t.nombre_documento);

  return (
    <div className="space-y-4">
      {categorias.map((categoria) => {
        const tiposCategoria = tipos
          .filter((t) => t.categoria === categoria)
          // Obligatorios primero, opcionales al final. Array.sort es
          // estable en JS moderno -> dentro de cada grupo se respeta el
          // orden que ya venía del backend.
          .sort((a, b) => Number(b.obligatorio) - Number(a.obligatorio));
        const cargados = tiposCategoria.filter((t) => t.documentos.length > 0).length;

        return (
          <Card key={categoria}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
                {categoria}
              </h3>
              <span className="text-[11px] text-brand-900/40">
                {cargados}/{tiposCategoria.length} cargados
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {tiposCategoria.map((tipo) => (
                <CasillaDocumento key={tipo.id_tipo_documento} tipo={tipo} soloLectura={data?.registrado ?? false} />
              ))}
            </div>
          </Card>
        );
      })}

      <BarraRegistro
        registrado={data?.registrado ?? false}
        fechaRegistro={data?.fecha_registro ?? null}
        faltantes={faltantes}
      />
    </div>
  );
}