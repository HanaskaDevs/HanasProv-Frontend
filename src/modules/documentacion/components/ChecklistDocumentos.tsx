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
    <div className="pl-[22px] py-1">
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
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => ver.mutate()}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:text-brand-900"
          >
            <IconoOjo /> Ver
          </button>
          {!soloLectura && (
            <button
              onClick={() => setReemplazando((v) => !v)}
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
      </div>

      {!soloLectura && reemplazando && (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

          {tipo.permite_multiples && (
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Nombre del documento"
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
    </div>
  );
}

function FilaDocumento({ tipo, soloLectura }: { tipo: TipoDocumentoChecklist; soloLectura: boolean }) {
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
  const mostrarCuadroCarga = !soloLectura && (tipo.permite_multiples || !yaSubido);

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        faltaObligatorio
          ? 'border-brand-wine/25 bg-brand-wine/[0.03]'
          : yaSubido
            ? 'border-emerald-600/15 bg-emerald-50/40'
            : 'border-brand-900/10 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <IconoDocumento className={yaSubido ? 'text-emerald-600 shrink-0' : 'text-brand-900/35 shrink-0'} />
          <span className="text-sm font-medium text-brand-900 truncate">
            {tipo.nombre_documento}
            {tipo.obligatorio && <span className="text-brand-wine"> *</span>}
          </span>
          {tipo.permite_multiples && (
            <span className="text-[10.5px] text-brand-700/60 shrink-0 hidden sm:inline">(varios archivos)</span>
          )}
        </div>
        {yaSubido ? (
          <Badge tone="success">Cargado</Badge>
        ) : faltaObligatorio ? (
          <Badge tone="danger">Falta</Badge>
        ) : (
          <Badge tone="neutral">Opcional</Badge>
        )}
      </div>

      {tipo.documentos.map((doc) => (
        <ArchivoSubido key={doc.id_documento_proveedor} doc={doc} tipo={tipo} soloLectura={soloLectura} />
      ))}

      {soloLectura && !yaSubido && (
        <p className="pl-[22px] text-[11px] text-brand-900/35 italic">No se cargó ningún archivo.</p>
      )}

      {mostrarCuadroCarga && (
        <div className="pl-[22px] mt-1 flex flex-wrap items-center gap-2">
          <input ref={inputRef} type="file" accept="application/pdf" className="hidden" onChange={handleSeleccionar} />

          {tipo.permite_multiples && (
            <input
              type="text"
              value={nombreDocumento}
              onChange={(e) => setNombreDocumento(e.target.value)}
              placeholder="Nombre del documento"
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
            className={`inline-flex items-center gap-1 text-[11px] font-medium ${
              faltaObligatorio ? 'text-brand-wine hover:text-brand-wine/80' : 'text-brand-700 hover:text-brand-900'
            }`}
          >
            {subir.isPending ? <Spinner className="h-3 w-3" /> : <IconoSubir />}
            {yaSubido ? 'Cargar otro archivo' : 'Subir archivo'}
          </button>
          <span className="text-[10px] text-brand-900/35">PDF, máx. 4MB</span>
        </div>
      )}

      {error && <span className="pl-[22px] text-[10px] text-brand-wine block mt-1">{error}</span>}
    </div>
  );
}

function formateaFecha(iso: string): string {
  return new Date(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'long', year: 'numeric' });
}

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
    </>
  );
}

function AroProgreso({ porcentaje }: { porcentaje: number }) {
  const radio = 26;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - porcentaje / 100);
  const color = porcentaje >= 100 ? 'stroke-emerald-500' : porcentaje >= 50 ? 'stroke-brand-700' : 'stroke-brand-wine';

  return (
    <svg width="64" height="64" viewBox="0 0 64 64" className="shrink-0 -rotate-90">
      <circle cx="32" cy="32" r={radio} fill="none" strokeWidth="6" className="stroke-brand-900/8" />
      <circle
        cx="32"
        cy="32"
        r={radio}
        fill="none"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        className={`transition-all duration-500 ${color}`}
      />
      <text
        x="32"
        y="32"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 fill-brand-900 text-[13px] font-bold"
        style={{ transformOrigin: '32px 32px' }}
      >
        {porcentaje}%
      </text>
    </svg>
  );
}

function ResumenProgreso({
  totalObligatorios,
  cargadosObligatorios,
  totalDocumentos,
  cargadosDocumentos,
}: {
  totalObligatorios: number;
  cargadosObligatorios: number;
  totalDocumentos: number;
  cargadosDocumentos: number;
}) {
  const porcentaje =
    totalObligatorios > 0 ? Math.round((cargadosObligatorios / totalObligatorios) * 100) : 100;
  const faltanObligatorios = totalObligatorios - cargadosObligatorios;

  return (
    <Card className="!p-4 sm:!p-5">
      <div className="flex items-center gap-4 sm:gap-5">
        <AroProgreso porcentaje={porcentaje} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-brand-900">
            {faltanObligatorios > 0
              ? `Te ${faltanObligatorios === 1 ? 'falta' : 'faltan'} ${faltanObligatorios} documento${faltanObligatorios === 1 ? '' : 's'} obligatorio${faltanObligatorios === 1 ? '' : 's'}`
              : '¡Todos los documentos obligatorios están cargados!'}
          </p>
          <p className="text-xs text-brand-900/50 mt-0.5">
            {cargadosObligatorios}/{totalObligatorios} obligatorios · {cargadosDocumentos}/{totalDocumentos} en total
          </p>
        </div>
      </div>
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
      className={`flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
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

export default function ChecklistDocumentos() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['mi-documentos'],
    queryFn: documentacionApi.obtenerChecklist,
  });
  const [categoriaActiva, setCategoriaActiva] = useState<string | null>(null);

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

  const totalObligatorios = tipos.filter((t) => t.obligatorio).length;
  const cargadosObligatorios = totalObligatorios - faltantes.length;
  const cargadosDocumentos = tipos.filter((t) => t.documentos.length > 0).length;

  return (
    <div className="space-y-4">
      <ResumenProgreso
        totalObligatorios={totalObligatorios}
        cargadosObligatorios={cargadosObligatorios}
        totalDocumentos={tipos.length}
        cargadosDocumentos={cargadosDocumentos}
      />

      {/* Se movió la barra de registro aquí arriba y dejó de ser sticky */}
      <BarraRegistro
        registrado={data?.registrado ?? false}
        fechaRegistro={data?.fecha_registro ?? null}
        faltantes={faltantes}
      />

      <Card className="!p-0 overflow-hidden">
        <div className="flex gap-0.5 overflow-x-auto border-b border-brand-900/8 bg-brand-900/[0.02] px-2 pt-1">
          {statsPorCategoria.map(({ categoria, tiposCategoria, cargados, faltanObligatorios }) => (
            <TabCategoria
              key={categoria}
              nombre={categoria}
              activa={categoria === categoriaSeleccionada}
              cargados={cargados}
              total={tiposCategoria.length}
              faltanObligatorios={faltanObligatorios}
              onClick={() => setCategoriaActiva(categoria)}
            />
          ))}
        </div>

        <div className="p-5">
          <div className="columns-1 lg:columns-2 gap-4 [&>*]:mb-3">
            {statsActivos.tiposCategoria.map((tipo) => (
              <div key={tipo.id_tipo_documento} className="break-inside-avoid">
                <FilaDocumento tipo={tipo} soloLectura={data?.registrado ?? false} />
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}