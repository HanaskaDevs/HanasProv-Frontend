// src/modules/auth/components/PanelAspirante.tsx
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Spinner from '../../../shared/components/Spinner';
import * as fichaApi from '../../miFicha/api/fichaApi';
import * as documentacionApi from '../../documentacion/api/documentacionApi';
import * as productosApi from '../../fichaProductos/api/productosApi';
import type { FichaProveedor } from '../../miFicha/types';

function IconoCheck({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconoAlerta({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function IconoFlecha({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/**
 * Lo decide el BACKEND (FichaProveedorService::seccion1EstaCompleta): son
 * los 22 campos que exige el formulario de Datos Generales, no solo el RUC
 * y la razón social. Esa comprobación corta daba la sección por completa
 * desde que la activación de la cuenta empezó a pedir esos dos datos por
 * adelantado (2-sep-2026), y el panel mostraba avance donde no había.
 */
function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return ficha.seccion_1_completa;
}

function calcularPorcentajeFicha(ficha: FichaProveedor): number {
  const pasos = [
    esDatosGeneralesCompleta(ficha),
    esDatosGeneralesCompleta(ficha),
    ficha.seccion_2.clases.length > 0,
    ficha.seccion_3.categorias.length > 0,
  ];
  return Math.round((pasos.filter(Boolean).length / 4) * 100);
}

type EstadoPaso = 'completado' | 'actual' | 'pendiente' | 'rechazado';

interface Paso {
  numero: number;
  titulo: string;
  descripcion: string;
  estado: EstadoPaso;
  to: string;
  textoBoton: string;
}

const ESTILOS_ESTADO: Record<EstadoPaso, { circulo: string; etiqueta: string; texto: string }> = {
  completado: { circulo: 'bg-emerald-100 text-emerald-700', etiqueta: 'Listo', texto: 'text-emerald-700' },
  actual: { circulo: 'bg-brand-900 text-white', etiqueta: 'Sigue aquí', texto: 'text-brand-900' },
  rechazado: { circulo: 'bg-brand-wine/15 text-brand-wine', etiqueta: 'Por corregir', texto: 'text-brand-wine' },
  pendiente: { circulo: 'bg-brand-900/8 text-brand-900/40', etiqueta: 'Pendiente', texto: 'text-brand-900/40' },
};

function TarjetaPaso({ paso }: { paso: Paso }) {
  const estilo = ESTILOS_ESTADO[paso.estado];
  const activo = paso.estado === 'actual' || paso.estado === 'rechazado';

  return (
    <div
      className={`rounded-lg border px-4 py-3.5 flex items-center gap-3.5 ${
        activo ? 'border-brand-900/15 bg-white' : 'border-brand-900/8 bg-brand-900/[0.015]'
      }`}
    >
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 font-medium text-sm ${estilo.circulo}`}>
        {paso.estado === 'completado' ? <IconoCheck /> : paso.numero}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-brand-900">{paso.titulo}</p>
          <span className={`text-[10.5px] font-medium ${estilo.texto}`}>{estilo.etiqueta}</span>
        </div>
        <p className="text-xs text-brand-900/55 mt-0.5">{paso.descripcion}</p>
      </div>
      {activo && (
        <Link
          to={paso.to}
          className="shrink-0 inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-brand-900 text-white hover:bg-brand-700 transition-colors cursor-pointer"
        >
          {paso.textoBoton} <IconoFlecha />
        </Link>
      )}
    </div>
  );
}

/**
 * Panel de bienvenida para el proveedor Aspirante (todavía no aprobado).
 * A diferencia de PanelProveedor (pensado para un proveedor ya activo,
 * con pedidos/entregas/documentación registrada), acá no hay nada de
 * eso todavía -> mostrarlo igual sería confuso (ceros por todos lados).
 * En su lugar: un checklist guiado de los 3 pasos que sí le aplican
 * (Ficha -> Documentación -> Productos) y qué sigue después.
 */
export default function PanelAspirante() {
  const ficha = useQuery({ queryKey: ['mi-ficha'], queryFn: fichaApi.obtenerMiFicha, retry: false });
  const documentos = useQuery({ queryKey: ['mi-documentos'], queryFn: documentacionApi.obtenerChecklist, retry: false });
  const productos = useQuery({
    queryKey: ['resumen-registro'],
    queryFn: () => productosApi.obtenerResumenRegistro(),
    retry: false,
  });

  const cargando = ficha.isLoading || documentos.isLoading || productos.isLoading;

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const porcentajeFicha = ficha.data ? calcularPorcentajeFicha(ficha.data) : 0;
  const fichaRechazada = ficha.data?.estado_calificacion_general === 'Rechazado';
  const fichaCompleta = porcentajeFicha === 100 && !fichaRechazada;
  const camposFichaRechazados = ficha.data
    ? Object.values(ficha.data.calificaciones_campos).filter((c) => c.estado === 'Rechazado').length
    : 0;

  const tiposDocumentos = documentos.data?.documentos ?? [];
  const obligatoriosFaltantes = tiposDocumentos.filter((t) => t.obligatorio && t.documentos.length === 0);
  const documentosRechazados = tiposDocumentos
    .flatMap((t) => t.documentos)
    .filter((d) => d.estado_calificacion === 'Rechazado');
  const documentacionRegistrada = documentos.data?.registrado ?? false;
  const documentacionCompleta = documentacionRegistrada && documentosRechazados.length === 0;

  const productosRechazados = productos.data?.productos_rechazados ?? 0;
  const correccionesPendientesProductos = productos.data?.correcciones_pendientes ?? false;
  const productosRegistrados =
    (productos.data?.productos_en_revision ?? 0) > 0 ||
    (productos.data?.productos_aprobados ?? 0) > 0 ||
    productosRechazados > 0;
  const productosCompleta = productosRegistrados && !correccionesPendientesProductos;

  // El primer paso sin terminar es "el actual" -> los de más adelante
  // quedan "pendiente" (todavía no tiene sentido tocarlos) y los de
  // atrás, "completado". Si algún paso ya recorrido viene con un
  // rechazo, se marca aparte para que no se pierda entre los demás.
  const pasos: Paso[] = [
    {
      numero: 1,
      titulo: 'Complete su Ficha de Proveedor',
      descripcion: fichaRechazada
        ? `El equipo encontró ${camposFichaRechazados} campo(s) por corregir.`
        : 'Datos generales, clases y categorías de su empresa.',
      estado: fichaRechazada ? 'rechazado' : fichaCompleta ? 'completado' : 'actual',
      to: '/mi-ficha',
      textoBoton: fichaRechazada ? 'Corregir ficha' : 'Completar ficha',
    },
    {
      numero: 2,
      titulo: 'Cargue su documentación',
      descripcion:
        documentosRechazados.length > 0
          ? `${documentosRechazados.length} documento(s) por corregir.`
          : obligatoriosFaltantes.length > 0
          ? `Faltan ${obligatoriosFaltantes.length} documento(s) obligatorio(s).`
          : 'RUC, certificados y demás documentos obligatorios.',
      estado:
        documentosRechazados.length > 0
          ? 'rechazado'
          : documentacionCompleta
          ? 'completado'
          : fichaCompleta
          ? 'actual'
          : 'pendiente',
      to: '/documentos',
      textoBoton: documentosRechazados.length > 0 ? 'Corregir documentos' : 'Cargar documentos',
    },
    {
      numero: 3,
      titulo: 'Registre su Ficha de Productos',
      descripcion: correccionesPendientesProductos
        ? `${productosRechazados} producto(s) por corregir.`
        : 'Cargue la ficha técnica y el análisis de laboratorio de su catálogo.',
      estado: correccionesPendientesProductos
        ? 'rechazado'
        : productosCompleta
        ? 'completado'
        : fichaCompleta && documentacionCompleta
        ? 'actual'
        : 'pendiente',
      to: '/productos',
      textoBoton: correccionesPendientesProductos ? 'Corregir productos' : 'Ir a Ficha Productos',
    },
  ];

  const todoListo = pasos.every((p) => p.estado === 'completado');
  const hayCorrecciones = fichaRechazada || documentosRechazados.length > 0 || correccionesPendientesProductos;

  return (
    <div className="space-y-5">
      <div className="rounded-lg bg-brand-900 p-6">
        <p className="font-display text-lg font-semibold text-white">
          ¡Bienvenido al Portal de Proveedores Hanaska!
        </p>
        <p className="text-sm text-white/70 mt-1 max-w-2xl">
          Su postulación como proveedor consta de tres pasos: completar su ficha como proveedor, cargar su
          documentación vigente y registrar su oferta de productos.
        </p>
      </div>

      {hayCorrecciones && (
        <div className="rounded-lg border border-brand-wine/20 bg-brand-wine/[0.03] px-4 py-3 flex items-start gap-2.5">
          <IconoAlerta className="shrink-0 mt-0.5 text-brand-wine" />
          <p className="text-sm text-brand-900">
            El equipo revisó su postulación y encontró algunas cosas por corregir. Revise los pasos marcados como{' '}
            <span className="text-brand-wine font-medium">"Por corregir"</span> abajo.
          </p>
        </div>
      )}

      <div className="space-y-2.5">
        {pasos.map((paso) => (
          <TarjetaPaso key={paso.numero} paso={paso} />
        ))}
      </div>

      <div className={`rounded-lg border p-6 ${todoListo ? 'bg-emerald-50 border-emerald-200' : 'bg-brand-900/[0.02] border-brand-900/8'}`}>
        <p className="text-sm font-medium text-brand-900">
          {todoListo ? 'Completó los 3 pasos' : hayCorrecciones ? 'Después de las correcciones' : 'Después de estos 3 pasos'}
        </p>
        <p className="text-xs text-brand-900/60 mt-1">
          {todoListo
            ? 'Su postulación ya está en manos de nuestro equipo de calidad. Podrá seguir el estado de la evaluación desde Calificación.'
            : hayCorrecciones
              ? 'Nuestro equipo revisará nuevamente su postulación. Recuerde que puede seguir el estado de su postulación en cualquier momento desde Calificación.'
              : 'Nuestro equipo de calidad revisará su ficha, documentación y productos. Podrá seguir el estado de esa evaluación en cualquier momento desde Calificación.'}
        </p>
        <Link
          to="/calificacion"
          className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline mt-2 cursor-pointer"
        >
          Ver estado de mi calificación <IconoFlecha />
        </Link>
      </div>
    </div>
  );
}