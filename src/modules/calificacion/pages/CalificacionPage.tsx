// src/modules/calificacion/pages/CalificacionPage.tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as fichaApi from '../../miFicha/api/fichaApi';
import * as documentacionApi from '../../documentacion/api/documentacionApi';
import * as productosApi from '../../fichaProductos/api/productosApi';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';

type EstadoGeneral = 'Aprobado' | 'Rechazado' | 'En revisión' | 'Incompleto' | 'Sin iniciar';

function IconoFicha({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="12" y2="16" />
    </svg>
  );
}

function IconoDocumentacion({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  );
}

function IconoProductos({ className = '' }: { className?: string }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function BadgeEstado({ estado }: { estado: EstadoGeneral }) {
  if (estado === 'Aprobado') return <Badge tone="success">Aprobado</Badge>;
  if (estado === 'Rechazado')
    return (
      <Badge tone="danger" className="!bg-amber-100 !text-amber-800">
        Por corregir
      </Badge>
    );
  if (estado === 'En revisión') return <Badge tone="info">En revisión</Badge>;
  if (estado === 'Incompleto') return <Badge tone="warning">Incompleto</Badge>;
  return <Badge tone="neutral">Sin iniciar</Badge>;
}

function TarjetaCategoria({
  icono,
  titulo,
  estado,
  detalle,
  items,
  enlace,
  textoEnlace,
}: {
  icono: React.ReactNode;
  titulo: string;
  estado: EstadoGeneral;
  detalle: string;
  items: { etiqueta: string; valor: string }[];
  enlace: string;
  textoEnlace: string;
}) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="h-9 w-9 rounded-full bg-brand-200/40 flex items-center justify-center text-brand-900 shrink-0">
            {icono}
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold text-brand-900">{titulo}</h3>
            <p className="text-[11px] text-brand-900/50 mt-0.5">{detalle}</p>
          </div>
        </div>
        <BadgeEstado estado={estado} />
      </div>

      <div className="mt-4 space-y-2 flex-1">
        {items.map((item) => (
          <div key={item.etiqueta} className="flex items-center justify-between text-xs">
            <span className="text-brand-900/55">{item.etiqueta}</span>
            <span className="font-medium text-brand-900">{item.valor}</span>
          </div>
        ))}
      </div>

      <Link
        to={enlace}
        className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-md border border-brand-900/15
          px-3 py-1.5 text-xs font-medium text-brand-900 hover:bg-brand-900/[0.03] transition-colors"
      >
        {textoEnlace}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </Link>
    </Card>
  );
}

export default function CalificacionPage() {
  const ficha = useQuery({ queryKey: ['mi-ficha'], queryFn: fichaApi.obtenerMiFicha, retry: false });
  const documentos = useQuery({ queryKey: ['mi-documentos'], queryFn: documentacionApi.obtenerChecklist, retry: false });
  // Ojo: NO se usa productosApi.listarProductos() acá -> esa función
  // está paginada (trae 20 productos por vez), y esta pantalla necesita
  // el panorama COMPLETO del catálogo (conteos totales). resumenRegistro
  // ya trae esos conteos calculados en el propio SQL, sin pedir el
  // catálogo entero solo para contarlo en el navegador.
  const resumenProductos = useQuery({
    queryKey: ['resumen-registro-productos'],
    queryFn: () => productosApi.obtenerResumenRegistro(),
    retry: false,
  });

  const cargando = ficha.isLoading || documentos.isLoading || resumenProductos.isLoading;

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  // Estado GENERAL del proveedor (Aspirante/Aprobado) -> distinto de
  // estado_calificacion_general, que es solo el veredicto de la Ficha
  // en sí. El proveedor pasa a "Aprobado" automáticamente cuando se
  // cumplen las 3 condiciones mínimas (ver
  // CalificacionProveedorService::activarSiCorresponde): ficha
  // aprobada + toda la documentación aprobada + al menos 1 producto
  // aprobado.
  const proveedorAprobado = ficha.data?.estado?.trim().toLowerCase() === 'aprobado';

  // --- Ficha ---
  const porcentajeFicha = ficha.data ? Number(ficha.data.porcentaje_completado) : 0;
  const todasCalificacionesFicha = ficha.data ? Object.values(ficha.data.calificaciones_campos) : [];
  const totalCamposCalificados = todasCalificacionesFicha.length;
  const camposAprobadosFicha = todasCalificacionesFicha.filter((c) => c.estado === 'Aprobado').length;
  const camposRechazadosFicha = todasCalificacionesFicha.filter((c) => c.estado === 'Rechazado').length;
  // Sobre 100 pts: cuántos de los campos ya calificados están Aprobados.
  const calificacionFicha =
    totalCamposCalificados > 0 ? Math.round((camposAprobadosFicha / totalCamposCalificados) * 100) : null;
  const estadoFicha: EstadoGeneral =
    porcentajeFicha < 100
      ? 'Incompleto'
      : ficha.data?.estado_calificacion_general === 'Aprobado'
        ? 'Aprobado'
        : ficha.data?.estado_calificacion_general === 'Rechazado'
          ? 'Rechazado'
          : 'En revisión';

  // --- Documentación ---
  const todosLosDocumentos = (documentos.data?.documentos ?? []).flatMap((t) => t.documentos);
  const totalDocumentos = todosLosDocumentos.length;
  const documentosAprobados = todosLosDocumentos.filter((d) => d.estado_calificacion === 'Aprobado').length;
  const documentosRechazados = todosLosDocumentos.filter((d) => d.estado_calificacion === 'Rechazado').length;
  const documentosPendientes = totalDocumentos - documentosAprobados - documentosRechazados;
  const documentacionRegistrada = documentos.data?.registrado ?? false;
  // Sobre 100 pts: aprobados sobre el total cargado (ej. 9 cargados y
  // los 9 aprobados -> 100 pts).
  const calificacionDocumentacion =
    totalDocumentos > 0 ? Math.round((documentosAprobados / totalDocumentos) * 100) : null;

  const estadoDocumentacion: EstadoGeneral = !documentacionRegistrada
    ? 'Incompleto'
    : documentosRechazados > 0
      ? 'Rechazado'
      : documentosPendientes > 0
        ? 'En revisión'
        : totalDocumentos > 0
          ? 'Aprobado'
          : 'Sin iniciar';

  // --- Productos ---
  const totalProductos = resumenProductos.data?.productos_totales_catalogo ?? 0;
  const productosAprobados = resumenProductos.data?.productos_aprobados ?? 0;
  const productosRechazados = resumenProductos.data?.productos_rechazados ?? 0;
  const productosPendientes = totalProductos - productosAprobados - productosRechazados;
  const productosRegistrados = (resumenProductos.data?.productos_en_revision ?? 0) > 0;
  // Mismo criterio que documentación: aprobados sobre el total cargado.
  const calificacionProductos =
    totalProductos > 0 ? Math.round((productosAprobados / totalProductos) * 100) : null;

  const estadoProductos: EstadoGeneral = totalProductos === 0
    ? 'Sin iniciar'
    : !productosRegistrados
      ? 'Incompleto'
      : productosRechazados > 0
        ? 'Rechazado'
        : productosPendientes > 0
          ? 'En revisión'
          : 'Aprobado';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Calificación</h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Resumen de cómo va tu postulación: Ficha, Documentación y Ficha de Productos.
        </p>
      </div>

      {proveedorAprobado && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 flex items-start gap-3">
          <span className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-emerald-800">¡Ya es un proveedor aprobado!</p>
            <p className="text-xs text-emerald-800/80 mt-0.5">
              Cumplió con los 3 requisitos mínimos: su ficha aprobada, toda su documentación aprobada y al menos
              un producto aprobado. Ya puede operar como proveedor de Hanaska.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TarjetaCategoria
          icono={<IconoFicha />}
          titulo="Ficha de Proveedor"
          estado={estadoFicha}
          detalle={porcentajeFicha < 100 ? 'Todavía no está completa' : 'Completa'}
          items={[
            { etiqueta: 'Campos Aprobados', valor: totalCamposCalificados > 0 ? String(camposAprobadosFicha) : '—' },
            { etiqueta: 'Campos Rechazados', valor: camposRechazadosFicha > 0 ? String(camposRechazadosFicha) : '—' },
            {
              etiqueta: 'Calificación',
              valor:
                calificacionFicha !== null && (estadoFicha === 'Aprobado' || estadoFicha === 'Rechazado')
                  ? `${calificacionFicha}/100 pts`
                  : '—',
            },
          ]}
          enlace="/mi-ficha"
          textoEnlace="Ir a Mi Ficha"
        />

        <TarjetaCategoria
          icono={<IconoDocumentacion />}
          titulo="Documentación"
          estado={estadoDocumentacion}
          detalle={documentacionRegistrada ? 'Registrada' : 'Todavía no registrada'}
          items={[
            { etiqueta: 'Documentos cargados', valor: `${totalDocumentos}` },
            { etiqueta: 'Aprobados', valor: `${documentosAprobados}` },
            {
              etiqueta: 'Rechazados',
              valor: documentosRechazados > 0 ? String(documentosRechazados) : '—',
            },
            {
              etiqueta: 'Calificación',
              valor:
                calificacionDocumentacion !== null && (estadoDocumentacion === 'Aprobado' || estadoDocumentacion === 'Rechazado')
                  ? `${calificacionDocumentacion}/100 pts`
                  : '—',
            },
          ]}
          enlace="/documentos"
          textoEnlace="Ir a Documentación"
        />

        <TarjetaCategoria
          icono={<IconoProductos />}
          titulo="Ficha de Productos"
          estado={estadoProductos}
          detalle={productosRegistrados ? 'Registrada' : 'Todavía no registrada'}
          items={[
            { etiqueta: 'Productos cargados', valor: `${totalProductos}` },
            { etiqueta: 'Aprobados', valor: `${productosAprobados}` },
            {
              etiqueta: 'Rechazados',
              valor: productosRechazados > 0 ? String(productosRechazados) : '—',
            },
            {
              etiqueta: 'Calificación',
              valor:
                calificacionProductos !== null && (estadoProductos === 'Aprobado' || estadoProductos === 'Rechazado')
                  ? `${calificacionProductos}/100 pts`
                  : '—',
            },
          ]}
          enlace="/productos"
          textoEnlace="Ir a Ficha Productos"
        />
      </div>
    </div>
  );
}