// src/modules/auth/components/PanelProveedor.tsx
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import * as fichaApi from '../../miFicha/api/fichaApi';
import * as documentacionApi from '../../documentacion/api/documentacionApi';
import * as productosApi from '../../fichaProductos/api/productosApi';
import * as pedidosApi from '../../pedidos/api/pedidosApi';
import * as reclamosApi from '../../reclamos/api/reclamosApi';
import type { FichaProveedor } from '../../miFicha/types';

function IconoFicha({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" />
      <path d="M9 12h6M9 16h6" />
    </svg>
  );
}

function IconoCarpeta({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
    </svg>
  );
}

function IconoCaja({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}

function IconoProductos({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M3 12h18" />
    </svg>
  );
}

function IconoCalificacion({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function IconoReclamo({ className = '' }: { className?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z" />
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

function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return !!ficha.seccion_1.ruc && !!ficha.seccion_1.razon_social;
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

function diasHasta(fechaIso: string): number {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaIso + 'T00:00:00');
  return Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
}

/** Tarjeta de estadística chica, mismo lenguaje visual que PanelEstadisticas (pedidos). */
function TarjetaStat({
  icono,
  valor,
  etiqueta,
  color,
  to,
}: {
  icono: React.ReactNode;
  valor: string | number;
  etiqueta: string;
  color: string;
  to: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border border-brand-900/8 bg-white p-3 flex items-center gap-3 hover:border-brand-900/20 hover:shadow-sm transition-all"
    >
      <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>{icono}</div>
      <div className="min-w-0">
        <p className="text-lg font-semibold text-brand-900 leading-none">{valor}</p>
        <p className="text-[11px] text-brand-900/50 truncate mt-1">{etiqueta}</p>
      </div>
    </Link>
  );
}

function Alerta({
  tono,
  titulo,
  descripcion,
  to,
  textoBoton,
}: {
  tono: 'wine' | 'yellow';
  titulo: string;
  descripcion: string;
  to: string;
  textoBoton: string;
}) {
  const estilos =
    tono === 'wine'
      ? { borde: 'border-brand-wine/20', fondo: 'bg-brand-wine/[0.03]', icono: 'text-brand-wine', boton: 'text-brand-wine' }
      : { borde: 'border-brand-yellow/40', fondo: 'bg-brand-yellow/10', icono: 'text-brand-900/70', boton: 'text-brand-700' };

  return (
    <div className={`rounded-lg border ${estilos.borde} ${estilos.fondo} px-4 py-3 flex items-center justify-between gap-4`}>
      <div className="flex items-start gap-2.5 min-w-0">
        <IconoAlerta className={`shrink-0 mt-0.5 ${estilos.icono}`} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-brand-900">{titulo}</p>
          <p className="text-xs text-brand-900/55 mt-0.5">{descripcion}</p>
        </div>
      </div>
      <Link
        to={to}
        className={`shrink-0 inline-flex items-center gap-1 text-xs font-medium ${estilos.boton} hover:underline`}
      >
        {textoBoton} <IconoFlecha />
      </Link>
    </div>
  );
}

export default function PanelProveedor() {
  const ficha = useQuery({ queryKey: ['mi-ficha'], queryFn: fichaApi.obtenerMiFicha, retry: false });
  const documentos = useQuery({ queryKey: ['mi-documentos'], queryFn: documentacionApi.obtenerChecklist, retry: false });
  const productos = useQuery({
    queryKey: ['resumen-registro'],
    queryFn: () => productosApi.obtenerResumenRegistro(),
    retry: false,
  });
  const pedidosAbiertos = useQuery({
    queryKey: ['pedidos-abiertos'],
    queryFn: pedidosApi.listarPedidosAbiertos,
    retry: false,
  });
  const reclamosAbiertos = useQuery({
    queryKey: ['mis-reclamos-abiertos'],
    queryFn: reclamosApi.listarMisReclamosAbiertos,
    retry: false,
  });

  const cargando = ficha.isLoading || documentos.isLoading || pedidosAbiertos.isLoading || reclamosAbiertos.isLoading;

  const porcentajeFicha = ficha.data ? calcularPorcentajeFicha(ficha.data) : 0;
  const fichaCompleta = porcentajeFicha === 100;
  const fichaRechazada = ficha.data?.estado_calificacion_general === 'Rechazado';
  const camposFichaRechazados = ficha.data
    ? Object.values(ficha.data.calificaciones_campos).filter((c) => c.estado === 'Rechazado').length
    : 0;

  const tiposDocumentos = documentos.data?.documentos ?? [];
  const obligatoriosFaltantes = tiposDocumentos.filter((t) => t.obligatorio && t.documentos.length === 0);
  const totalObligatorios = tiposDocumentos.filter((t) => t.obligatorio).length;
  const obligatoriosCargados = totalObligatorios - obligatoriosFaltantes.length;
  const documentacionRegistrada = documentos.data?.registrado ?? false;
  // OJO: antes esto solo miraba "en revisión" (Bloqueado=1 + Pendiente)
  // -> apenas el admin terminaba de aprobar el único producto, dejaba de
  // contar como "en revisión" y la alerta de abajo volvía a aparecer
  // como si nunca hubiera registrado nada, aunque ya tuviera productos
  // Aprobados. Un proveedor "tiene productos registrados" si registró
  // AL MENOS UNO alguna vez, esté en el estado que esté ahora.
  const productosRegistrados =
    (productos.data?.productos_en_revision ?? 0) > 0 ||
    (productos.data?.productos_aprobados ?? 0) > 0 ||
    (productos.data?.productos_rechazados ?? 0) > 0;

  const documentosRechazados = useMemo(
    () => tiposDocumentos.flatMap((t) => t.documentos).filter((d) => d.estado_calificacion === 'Rechazado'),
    [tiposDocumentos]
  );

  // Documentos con fecha de caducidad próxima a vencer (<=30 días) o ya
  // vencidos -> junta todos los archivos de todos los tipos, no solo los
  // tipos en sí, porque en los que permiten varios cada archivo tiene su
  // propia fecha.
  const documentosPorVencer = useMemo(() => {
    const resultado: { nombre: string; dias: number }[] = [];
    for (const tipo of tiposDocumentos) {
      for (const doc of tipo.documentos) {
        if (!doc.fecha_caducidad) continue;
        const dias = diasHasta(doc.fecha_caducidad);
        if (dias <= 30) resultado.push({ nombre: doc.nombre_original, dias });
      }
    }
    return resultado.sort((a, b) => a.dias - b.dias);
  }, [tiposDocumentos]);

  const pedidosVencidos = useMemo(() => {
    return (pedidosAbiertos.data ?? []).filter((p) => {
      if (!p.fecha_recepcion_esperada) return false;
      return diasHasta(p.fecha_recepcion_esperada) < 0;
    });
  }, [pedidosAbiertos.data]);

  const pedidosProximos5 = useMemo(() => {
    return [...(pedidosAbiertos.data ?? [])]
      .sort((a, b) => (a.fecha_recepcion_esperada ?? '').localeCompare(b.fecha_recepcion_esperada ?? ''))
      .slice(0, 5);
  }, [pedidosAbiertos.data]);

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Alertas: solo las que aplican */}
      <div className="space-y-2">
        {fichaRechazada && (
          <Alerta
            tono="wine"
            titulo="El equipo rechazó tu Ficha de Proveedor"
            descripcion={
              camposFichaRechazados === 1
                ? 'Hay 1 campo por corregir.'
                : `Hay ${camposFichaRechazados} campos por corregir.`
            }
            to="/mi-ficha"
            textoBoton="Corregir ficha"
          />
        )}
        {documentosRechazados.length > 0 && (
          <Alerta
            tono="wine"
            titulo={`${documentosRechazados.length} documento(s) rechazado(s)`}
            descripcion={`${documentosRechazados[0].nombre_original}: ${
              documentosRechazados[0].comentario_calificacion ?? 'revisa y vuelve a cargarlo.'
            }`}
            to="/documentos"
            textoBoton="Corregir documentos"
          />
        )}
        {!fichaCompleta && (
          <Alerta
            tono="yellow"
            titulo="Tu Ficha de Proveedor tiene datos pendientes"
            descripcion={`Llevas ${porcentajeFicha}% completado. Termina de llenarla para mantenerla al día.`}
            to="/mi-ficha"
            textoBoton="Completar ficha"
          />
        )}
        {fichaCompleta && !documentacionRegistrada && obligatoriosFaltantes.length > 0 && (
          <Alerta
            tono="yellow"
            titulo="Te falta cargar documentación obligatoria"
            descripcion={`Faltan ${obligatoriosFaltantes.length} documento(s): ${obligatoriosFaltantes
              .slice(0, 3)
              .map((t) => t.nombre_documento)
              .join(', ')}${obligatoriosFaltantes.length > 3 ? '…' : ''}.`}
            to="/documentos"
            textoBoton="Cargar documentos"
          />
        )}
        {documentacionRegistrada && !productosRegistrados && (
          <Alerta
            tono="yellow"
            titulo="Tienes productos sin registrar"
            descripcion="Registra tu Ficha de Productos para que el equipo pueda revisarla y calificarla."
            to="/productos"
            textoBoton="Ir a Ficha Productos"
          />
        )}
        {pedidosVencidos.length > 0 && (
          <Alerta
            tono="wine"
            titulo={`Tienes ${pedidosVencidos.length} pedido(s) vencido(s)`}
            descripcion="La fecha de recepción esperada ya pasó."
            to="/pedidos"
            textoBoton="Ver pedidos"
          />
        )}
        {documentosPorVencer.length > 0 && (
          <Alerta
            tono={documentosPorVencer[0].dias < 0 ? 'wine' : 'yellow'}
            titulo={
              documentosPorVencer[0].dias < 0
                ? `Tienes ${documentosPorVencer.filter((d) => d.dias < 0).length} documento(s) caducado(s)`
                : `${documentosPorVencer.length} documento(s) por caducar`
            }
            descripcion={`${documentosPorVencer[0].nombre} ${
              documentosPorVencer[0].dias < 0
                ? `caducó hace ${Math.abs(documentosPorVencer[0].dias)} día(s)`
                : `caduca en ${documentosPorVencer[0].dias} día(s)`
            }.`}
            to="/documentos"
            textoBoton="Revisar documentos"
          />
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TarjetaStat
          icono={<IconoReclamo />}
          valor={reclamosAbiertos.data?.length ?? 0}
          etiqueta="Reclamos abiertos"
          color={
            (reclamosAbiertos.data?.length ?? 0) > 0
              ? 'text-brand-wine bg-brand-wine/10'
              : 'text-brand-900/40 bg-brand-900/5'
          }
          to="/reclamos/abiertos"
        />
        <TarjetaStat
          icono={<IconoCarpeta />}
          valor={`${obligatoriosCargados}/${totalObligatorios}`}
          etiqueta={documentacionRegistrada ? 'Documentación registrada' : 'Documentos obligatorios'}
          color={documentacionRegistrada ? 'text-emerald-700 bg-emerald-50' : 'text-brand-700 bg-brand-700/10'}
          to="/documentos"
        />
        <TarjetaStat
          icono={<IconoCaja />}
          valor={pedidosAbiertos.data?.length ?? 0}
          etiqueta="Pedidos abiertos"
          color="text-brand-700 bg-brand-700/10"
          to="/pedidos"
        />
        <TarjetaStat
          icono={<IconoAlerta />}
          valor={pedidosVencidos.length}
          etiqueta="Pedidos vencidos"
          color={pedidosVencidos.length > 0 ? 'text-brand-wine bg-brand-wine/10' : 'text-brand-900/40 bg-brand-900/5'}
          to="/pedidos"
        />
      </div>

      {/* Pedidos próximos + accesos rápidos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Próximas entregas
            </h3>
            <Link to="/pedidos" className="text-xs font-medium text-brand-700 hover:underline">
              Ver todos
            </Link>
          </div>

          {pedidosProximos5.length === 0 ? (
            <p className="text-sm text-brand-900/50 px-5 pb-5 pt-2">No tienes pedidos abiertos por ahora.</p>
          ) : (
            <div className="divide-y divide-brand-900/6">
              {pedidosProximos5.map((p) => {
                const dias = p.fecha_recepcion_esperada ? diasHasta(p.fecha_recepcion_esperada) : null;
                return (
                  <Link
                    key={p.id_pedido_compra}
                    to="/pedidos"
                    className="flex items-center justify-between gap-3 px-5 py-2.5 hover:bg-brand-900/[0.02]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-900 truncate">{p.nro_pedido}</p>
                      <p className="text-[11px] text-brand-900/45">
                        {p.fecha_recepcion_esperada ? `Recepción esperada ${p.fecha_recepcion_esperada}` : 'Sin fecha esperada'}
                      </p>
                    </div>
                    {dias !== null && (
                      <Badge tone={dias < 0 ? 'danger' : dias <= 1 ? 'warning' : 'neutral'}>
                        {dias < 0 ? `Vencido hace ${Math.abs(dias)}d` : dias === 0 ? 'Hoy' : `En ${dias}d`}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide mb-3">
            Accesos rápidos
          </h3>
          <div className="space-y-1">
            {[
              { to: '/mi-ficha', icono: <IconoFicha />, texto: 'Mi Ficha de Proveedor' },
              { to: '/documentos', icono: <IconoCarpeta />, texto: 'Documentación' },
              { to: '/productos', icono: <IconoProductos />, texto: 'Mis Productos' },
              { to: '/pedidos', icono: <IconoCaja />, texto: 'Pedidos' },
              { to: '/calificacion', icono: <IconoCalificacion />, texto: 'Calificación' },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="flex items-center justify-between gap-2 rounded-md px-2.5 py-2 text-sm text-brand-900 hover:bg-brand-900/[0.04]"
              >
                <span className="flex items-center gap-2.5">
                  <span className="text-brand-900/40">{item.icono}</span>
                  {item.texto}
                </span>
                <IconoFlecha className="text-brand-900/30" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}