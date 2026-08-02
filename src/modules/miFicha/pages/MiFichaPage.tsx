// src/modules/miFicha/pages/MiFichaPage.tsx
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import AroProgreso from '../../../shared/components/AroProgreso';
import ModalFichaProveedor from '../components/ModalFichaProveedor';
import ModalFichaRegistrada from '../components/ModalFichaRegistrada';
import ModalEditarContactos from '../components/ModalEditarContactos';
import { obtenerMiFicha } from '../api/fichaApi';
import * as documentacionApi from '../../documentacion/api/documentacionApi';
import type { FichaProveedor } from '../types';
import {
  CAMPO_CLASE,
  CAMPO_CATEGORIA,
  ETIQUETAS_CAMPOS_FICHA,
  seccionDelCampo,
} from '../../../shared/constants/camposFichaProveedor';

function IconoCheck({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoFlecha({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return !!ficha.seccion_1.ruc && !!ficha.seccion_1.razon_social;
}

function calcularPorcentaje(ficha: FichaProveedor): number {
  const pasos = [
    esDatosGeneralesCompleta(ficha),
    esDatosGeneralesCompleta(ficha), // Contactos se guarda junto con Datos Generales
    ficha.seccion_2.clases.length > 0,
    ficha.seccion_3.categorias.length > 0,
  ];
  return Math.round((pasos.filter(Boolean).length / 4) * 100);
}

function badgeDeEstado(porcentaje: number, estadoCalificacion: FichaProveedor['estado_calificacion_general']) {
  if (porcentaje === 0) return { tone: 'neutral' as const, texto: 'Sin iniciar' };
  if (porcentaje === 100) {
    if (estadoCalificacion === 'Aprobado') return { tone: 'success' as const, texto: 'Aprobada' };
    if (estadoCalificacion === 'Rechazado') return { tone: 'amber' as const, texto: 'Por corregir' };
    return { tone: 'info' as const, texto: 'Ficha en revisión' };
  }
  return { tone: 'warning' as const, texto: 'En progreso' };
}

interface SeccionInfo {
  numero: number;
  titulo: string;
  descripcion: string;
  completa: boolean;
  camposRechazados: { etiqueta: string; observacion: string | null }[];
}

/**
 * Arma el desglose por sección (Datos Generales / Clase / Categoría)
 * en vez de un único bloque genérico -> así el proveedor ve de un
 * vistazo cuál de las 3 partes tiene el problema y por qué, sin
 * necesitar abrir el modal solo para enterarse.
 */
function armarSecciones(ficha: FichaProveedor): SeccionInfo[] {
  const camposRechazadosPorSeccion = (numeroSeccion: 1 | 2 | 3) =>
    Object.entries(ficha.calificaciones_campos)
      .filter(([campo, c]) => c.estado === 'Rechazado' && seccionDelCampo(campo) === numeroSeccion)
      .map(([campo, c]) => ({
        etiqueta: ETIQUETAS_CAMPOS_FICHA[campo as keyof typeof ETIQUETAS_CAMPOS_FICHA] ?? campo,
        observacion: c.observacion,
      }));

  return [
    {
      numero: 1,
      titulo: 'Datos Generales',
      descripcion: 'Información general de su empresa.',
      completa: esDatosGeneralesCompleta(ficha),
      camposRechazados: camposRechazadosPorSeccion(1),
    },
    {
      numero: 2,
      titulo: 'Clase de Proveedor',
      descripcion: 'La(s) clase(s) que describen a su empresa.',
      completa: ficha.seccion_2.clases.length > 0,
      camposRechazados: Object.entries(ficha.calificaciones_campos)
        .filter(([campo, c]) => campo === CAMPO_CLASE && c.estado === 'Rechazado')
        .map(([, c]) => ({ etiqueta: ETIQUETAS_CAMPOS_FICHA[CAMPO_CLASE], observacion: c.observacion })),
    },
    {
      numero: 3,
      titulo: 'Categoría de Productos',
      descripcion: 'Las categorías de producto que ofrece.',
      completa: ficha.seccion_3.categorias.length > 0,
      camposRechazados: Object.entries(ficha.calificaciones_campos)
        .filter(([campo, c]) => campo === CAMPO_CATEGORIA && c.estado === 'Rechazado')
        .map(([, c]) => ({ etiqueta: ETIQUETAS_CAMPOS_FICHA[CAMPO_CATEGORIA], observacion: c.observacion })),
    },
  ];
}

function TarjetaSeccionFicha({ seccion }: { seccion: SeccionInfo }) {
  const rechazada = seccion.camposRechazados.length > 0;
  const estado = rechazada
    ? { tone: 'amber' as const, texto: 'Por corregir' }
    : seccion.completa
    ? { tone: 'success' as const, texto: 'Completo' }
    : { tone: 'neutral' as const, texto: 'Incompleto' };

  return (
    <div className="rounded-lg border border-brand-900/8 bg-white px-4 py-3 flex items-start gap-3">
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-medium text-xs ${
          rechazada
            ? 'bg-amber-100 text-amber-700'
            : seccion.completa
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-brand-900/8 text-brand-900/40'
        }`}
      >
        {seccion.completa && !rechazada ? <IconoCheck /> : seccion.numero}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-brand-900">{seccion.titulo}</p>
          <Badge tone={estado.tone}>{estado.texto}</Badge>
        </div>
        <p className="text-xs text-brand-900/55 mt-0.5">{seccion.descripcion}</p>
      </div>
    </div>
  );
}

export default function MiFichaPage() {
  const [ficha, setFicha] = useState<FichaProveedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalRegistradaAbierto, setModalRegistradaAbierto] = useState(false);
  const [modalContactosAbierto, setModalContactosAbierto] = useState(false);

  // Mismo queryKey que usan Documentación/Inicio -> React Query lo sirve
  // de caché en vez de duplicar la llamada. Se usa acá solo para saber
  // si ya se registró la documentación (ver "documentacionYaAvanzada"
  // más abajo), no para mostrar el checklist en sí.
  const { data: documentos } = useQuery({
    queryKey: ['mi-documentos'],
    queryFn: documentacionApi.obtenerChecklist,
    retry: false,
  });

  useEffect(() => {
    let cancelado = false;

    obtenerMiFicha()
      .then((data) => {
        if (!cancelado) setFicha(data);
      })
      .catch((error) => {
        if (cancelado) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setErrorCarga(
            'Su cuenta todavía no tiene una Ficha de Proveedor asociada. Contacta al administrador del sistema.'
          );
        } else if (axios.isAxiosError(error) && error.response?.status === 403) {
          setErrorCarga('No tienes acceso a esta sección.');
        } else {
          setErrorCarga('No se pudo cargar su Ficha. Intente de nuevo más tarde.');
        }
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });

    return () => {
      cancelado = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (errorCarga || !ficha) {
    return (
      <Card className="max-w-md mx-auto">
        <p className="text-sm text-brand-wine">{errorCarga ?? 'No se pudo cargar la Ficha.'}</p>
      </Card>
    );
  }

  const porcentaje = calcularPorcentaje(ficha);
  const estadoCalificacion = ficha.estado_calificacion_general;
  const estado = badgeDeEstado(porcentaje, estadoCalificacion);
  const rechazada = estadoCalificacion === 'Rechazado';
  const esAprobado = ficha.estado?.trim().toLowerCase() === 'aprobado';
  const secciones = armarSecciones(ficha);
  const seccionesCompletas = secciones.filter((s) => s.completa).length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-3">
      <div>
        <h1 className="font-display text-lg font-semibold text-brand-900">Mi Ficha de Proveedor</h1>
        <p className="text-brand-900/55 text-xs mt-0.5">Información, clase y categoría de su empresa como proveedor.</p>
      </div>

      <Card className="!p-2.5 sm:!p-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setModalAbierto(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setModalAbierto(true);
            }
          }}
          className="flex items-center justify-between gap-3 flex-wrap cursor-pointer -m-2.5 sm:-m-3 p-2.5 sm:p-3 rounded-lg transition-colors hover:bg-brand-900/[0.02]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <AroProgreso porcentaje={porcentaje} rechazado={rechazada} />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-900 truncate flex items-center gap-2 flex-wrap">
                <Badge tone={estado.tone}>{estado.texto}</Badge>
                {rechazada && (
                  <span className="text-brand-900/60 font-normal">Revise el detalle de cada sección abajo</span>
                )}
              </p>
              <p className="text-[10.5px] text-brand-900/50 mt-0.5">{seccionesCompletas}/3 secciones completas</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {esAprobado && (
              <Button
                variant="ghost"
                className="!text-xs !px-3 !py-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  setModalContactosAbierto(true);
                }}
              >
                Editar contactos
              </Button>
            )}
            <Button className="!text-xs !px-3 !py-1.5" onClick={() => setModalAbierto(true)}>
              Ver
            </Button>
          </div>
        </div>
      </Card>

      <div className="space-y-2">
        {secciones.map((seccion) => (
          <TarjetaSeccionFicha key={seccion.numero} seccion={seccion} />
        ))}
      </div>

      {porcentaje === 100 && !rechazada && !documentos?.registrado && (
        <Card className="!p-2.5 sm:!p-3 bg-brand-700/5 border-brand-700/20">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-brand-900">Siguiente paso: su documentación</p>
              <p className="text-[10.5px] text-brand-900/55 mt-0.5">
                Completar la ficha es el primer paso. Para terminar su proceso como proveedor todavía falta
                cargar la documentación requerida.
              </p>
            </div>
            <Link
              to="/documentos"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-brand-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700 cursor-pointer"
            >
              Ir a Documentación
              <IconoFlecha />
            </Link>
          </div>
        </Card>
      )}

      {modalAbierto && (
        <ModalFichaProveedor
          fichaInicial={ficha}
          onClose={() => setModalAbierto(false)}
          onFichaActualizada={setFicha}
          documentacionRegistrada={documentos?.registrado ?? false}
          onCompletado={() => {
            setModalAbierto(false);
            setModalRegistradaAbierto(true);
          }}
        />
      )}

      {modalRegistradaAbierto && <ModalFichaRegistrada onClose={() => setModalRegistradaAbierto(false)} />}

      {modalContactosAbierto && (
        <ModalEditarContactos
          ficha={ficha}
          onClose={() => setModalContactosAbierto(false)}
          onGuardado={setFicha}
        />
      )}
    </div>
  );
}