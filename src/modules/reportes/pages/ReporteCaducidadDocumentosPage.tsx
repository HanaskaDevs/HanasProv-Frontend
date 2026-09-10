import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import SelectFiltro from '../../../shared/components/SelectFiltro';
import { descargarExcel, nombreArchivoConFecha } from '../../../shared/utils/descargarExcel';
import * as reportesApi from '../api/reportesApi';
import type { DocumentoPorCaducar } from '../api/reportesApi';
import FilaCaducidad from '../components/FilaCaducidad';
import {
  ESTILO_TRAMO,
  ESTILO_TRAMO_POR_DEFECTO,
  formatearFecha,
  nombreProveedor,
  textoDeDias,
} from '../utils/caducidad';

/**
 * REPORTE DE CADUCIDAD DE DOCUMENTOS
 *
 * La pregunta que tiene que contestar en tres segundos es "¿a quién
 * persigo HOY?". Todo lo demás está subordinado a eso.
 *
 * QUÉ CAMBIÓ RESPECTO DE LA VERSIÓN ANTERIOR (10-sep-2026, pedido del
 * usuario: "está horrible, algo más intuitivo y visual, con filtros"):
 *
 *  - LAS TARJETAS DEL RESUMEN AHORA FILTRAN. Antes eran cinco números que
 *    no hacían nada: se veía "8 vencidos" y para llegar a esos 8 había que
 *    bajar y buscarlos a ojo. Ahora se tocan y la lista queda en ese tramo.
 *  - HAY BÚSQUEDA Y FILTROS DE VERDAD: por tipo de documento, y un
 *    interruptor de "solo lo que requiere acción" (vencido o por vencer en
 *    15 días o menos), que es el 90% de los usos reales.
 *  - DOS VISTAS: agrupada por urgencia (para repasar) y una tabla ordenable
 *    por fecha o por proveedor (para trabajar de corrido). Antes solo
 *    existía la agrupada, y al ordenar por urgencia el mismo proveedor
 *    aparecía repartido en tres bloques distintos.
 *  - SE PUEDE CONTACTAR SIN SALIR DE ACÁ (mailto con el asunto escrito) y
 *    se ve la cuenta regresiva a la suspensión, no solo los días de vencido.
 *  - SE DESCARGA A EXCEL exactamente lo que se está viendo, con los filtros
 *    aplicados, para repartir el trabajo.
 *  - EL CARTEL DE SUSPENSIÓN AHORA DICE LA VERDAD: la versión anterior
 *    afirmaba "el proveedor puede quedar suspendido" en todos los vencidos,
 *    cuando la suspensión automática todavía no es exigible.
 */

type Vista = 'urgencia' | 'tabla';
type Orden = 'fecha' | 'proveedor' | 'documento';

/** Tramos que cuentan como "requiere acción": vencido o 15 días o menos. */
const DIAS_REQUIERE_ACCION = 15;

function IconoDescarga() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ReporteCaducidadContenido() {
  const [busqueda, setBusqueda] = useState('');
  const [tramosElegidos, setTramosElegidos] = useState<string[]>([]);
  const [idTipoDocumento, setIdTipoDocumento] = useState('');
  const [soloAccion, setSoloAccion] = useState(false);
  const [vista, setVista] = useState<Vista>('urgencia');
  const [orden, setOrden] = useState<Orden>('fecha');
  const [descargando, setDescargando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['reporte-caducidad-documentos'],
    queryFn: reportesApi.obtenerReporteCaducidad,
  });

  const documentos = useMemo(() => data?.documentos ?? [], [data]);

  /**
   * Los filtros se aplican en el navegador y no en el servidor a propósito:
   * el universo son los documentos CON fecha de vencimiento de una empresa
   * (decenas, a lo sumo unos pocos miles), ya vienen todos en una consulta,
   * y filtrar acá hace que tocar una tarjeta responda al instante en vez de
   * esperar una ida y vuelta.
   */
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    const resultado = documentos.filter((d) => {
      if (texto) {
        const coincide =
          nombreProveedor(d).toLowerCase().includes(texto) ||
          d.documento.toLowerCase().includes(texto) ||
          (d.ruc ?? '').toLowerCase().includes(texto) ||
          (d.email ?? '').toLowerCase().includes(texto);

        if (!coincide) return false;
      }

      if (tramosElegidos.length > 0 && !tramosElegidos.includes(d.tramo)) return false;
      if (idTipoDocumento && String(d.id_tipo_documento) !== idTipoDocumento) return false;
      if (soloAccion && d.dias_restantes > DIAS_REQUIERE_ACCION) return false;

      return true;
    });

    // La lista base ya viene ordenada por fecha desde el backend; acá solo se
    // reordena cuando el usuario pide otra cosa. El desempate siempre es por
    // fecha: dos documentos del mismo proveedor tienen que salir del más
    // urgente al menos urgente, no en un orden arbitrario.
    if (orden === 'proveedor') {
      return [...resultado].sort(
        (a, b) =>
          nombreProveedor(a).localeCompare(nombreProveedor(b), 'es') ||
          a.dias_restantes - b.dias_restantes
      );
    }

    if (orden === 'documento') {
      return [...resultado].sort(
        (a, b) => a.documento.localeCompare(b.documento, 'es') || a.dias_restantes - b.dias_restantes
      );
    }

    return resultado;
  }, [documentos, busqueda, tramosElegidos, idTipoDocumento, soloAccion, orden]);

  /** Conteo por tramo sobre TODO el universo, no sobre lo filtrado. */
  const conteoPorTramo = useMemo(() => {
    const mapa: Record<string, number> = {};
    documentos.forEach((d) => {
      mapa[d.tramo] = (mapa[d.tramo] ?? 0) + 1;
    });
    return mapa;
  }, [documentos]);

  const porTramo = useMemo(
    () =>
      (data?.tramos ?? []).map((tramo) => ({
        ...tramo,
        documentos: filtrados.filter((d) => d.tramo === tramo.clave),
      })),
    [data, filtrados]
  );

  function alternarTramo(clave: string) {
    setTramosElegidos((previos) =>
      previos.includes(clave) ? previos.filter((t) => t !== clave) : [...previos, clave]
    );
  }

  function limpiarFiltros() {
    setBusqueda('');
    setTramosElegidos([]);
    setIdTipoDocumento('');
    setSoloAccion(false);
  }

  async function descargar() {
    setDescargando(true);
    try {
      await descargarExcel(
        filtrados.map((d: DocumentoPorCaducar) => ({
          Proveedor: nombreProveedor(d),
          RUC: d.ruc ?? '',
          Correo: d.email ?? '',
          Teléfono: d.telefono ?? '',
          Documento: d.documento,
          Categoría: d.categoria ?? '',
          Vence: formatearFecha(d.fecha_caducidad),
          Situación: textoDeDias(d.dias_restantes),
          'Días restantes': d.dias_restantes,
          'Días para suspensión': d.dias_para_suspension ?? '',
          'Último aviso': d.fecha_ultima_notificacion ? formatearFecha(d.fecha_ultima_notificacion) : '',
          'Proveedor suspendido': d.proveedor_suspendido ? 'Sí' : 'No',
        })),
        'Caducidad',
        nombreArchivoConFecha('caducidad-de-documentos')
      );
    } finally {
      setDescargando(false);
    }
  }

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-7 w-7" />
      </div>
    );
  }

  const total = documentos.length;
  const visibles = filtrados.length;
  const requierenAccion = documentos.filter((d) => d.dias_restantes <= DIAS_REQUIERE_ACCION).length;
  const hayFiltros = !!busqueda || tramosElegidos.length > 0 || !!idTipoDocumento || soloAccion;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      {/* ---------------------------------------------------------------- */}
      {/* Encabezado                                                        */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <line x1="9" y1="15" x2="15" y2="15" />
            </svg>
            Caducidad de documentos
          </h1>
          <p className="text-brand-900/50 text-xs mt-0.5">
            {requierenAccion > 0 ? (
              <>
                <strong className="text-brand-wine">
                  {requierenAccion} documento{requierenAccion === 1 ? '' : 's'} requiere
                  {requierenAccion === 1 ? '' : 'n'} acción
                </strong>{' '}
                de {total} con fecha de vencimiento.
              </>
            ) : (
              <>Ningún documento vencido ni por vencer en los próximos {DIAS_REQUIERE_ACCION} días.</>
            )}
          </p>
        </div>

        <Button
          variant="secondary"
          className="!text-xs !px-3 !py-1.5"
          onClick={descargar}
          isLoading={descargando}
          disabled={visibles === 0}
        >
          <span className="inline-flex items-center gap-1.5">
            <IconoDescarga />
            Descargar {hayFiltros ? 'lo filtrado' : 'todo'}
          </span>
        </Button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Aviso honesto sobre la suspensión automática                      */}
      {/* ---------------------------------------------------------------- */}
      {!(data.suspension.activa && data.suspension.ya_es_exigible) && (
        <div className="rounded-lg border border-sky-200 bg-sky-50 px-3.5 py-2.5 flex gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-700 shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="text-[12.5px] text-sky-900 leading-relaxed">
            <strong>Hoy nadie se suspende por documentación vencida.</strong>{' '}
            {!data.suspension.ya_es_exigible
              ? `La suspensión automática recién empieza a aplicarse el ${formatearFecha(data.suspension.vigente_desde)}.`
              : 'El interruptor de suspensión automática está apagado en Configuraciones.'}{' '}
            Los avisos por correo sí se siguen enviando ({data.suspension.dias_primer_aviso} días antes y luego cada
            semana).
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* Resumen: cada tarjeta ES un filtro                                */}
      {/* ---------------------------------------------------------------- */}
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {data.tramos.map((tramo) => {
            const estilo = ESTILO_TRAMO[tramo.clave] ?? ESTILO_TRAMO_POR_DEFECTO;
            const cantidad = conteoPorTramo[tramo.clave] ?? 0;
            const elegido = tramosElegidos.includes(tramo.clave);
            const proporcion = total > 0 ? Math.round((cantidad / total) * 100) : 0;

            return (
              <button
                key={tramo.clave}
                onClick={() => alternarTramo(tramo.clave)}
                // aria-pressed: para un lector de pantalla esto es un filtro
                // de dos estados, no un enlace ni un dato suelto.
                aria-pressed={elegido}
                title={tramo.descripcion}
                className={`text-left rounded-lg border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-brand-700 ${
                  elegido ? estilo.chipActivo : estilo.chip
                } ${cantidad === 0 && !elegido ? 'opacity-45' : 'hover:shadow-sm'}`}
              >
                <p className="text-2xl font-bold tabular-nums leading-none">{cantidad}</p>
                <p className="text-[11px] font-medium mt-1.5 leading-tight">{tramo.etiqueta}</p>

                {/* Barra de proporción: convierte cinco números sueltos en
                    una forma que se lee de un vistazo. Decorativa -> el dato
                    real ya está escrito arriba en cifras. */}
                <div className="mt-2 h-1 rounded-full bg-brand-900/10 overflow-hidden" aria-hidden="true">
                  <div className={`h-full rounded-full ${estilo.barra}`} style={{ width: `${proporcion}%` }} />
                </div>
              </button>
            );
          })}
        </div>

        {tramosElegidos.length > 0 && (
          <p className="text-[11.5px] text-brand-900/50 mt-1.5">
            Mostrando solo los tramos seleccionados. Toca de nuevo una tarjeta para quitarla del filtro.
          </p>
        )}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Filtros                                                           */}
      {/* ---------------------------------------------------------------- */}
      <Card className="!p-3">
        <div className="flex items-center gap-2 flex-wrap">
          <BarraBusqueda
            valor={busqueda}
            onCambiar={setBusqueda}
            placeholder="Proveedor, RUC, documento o correo..."
            className="!py-1.5 !text-xs"
          />

          <SelectFiltro
            valor={idTipoDocumento}
            onCambiar={setIdTipoDocumento}
            etiquetaTodos="Todos los documentos"
            opciones={data.tipos_documento.map((t) => ({
              valor: String(t.id_tipo_documento),
              etiqueta: t.nombre,
            }))}
            className="w-56"
          />

          {/* SelectFiltro reserva el value "" para su opción por defecto, así
              que el orden por fecha (que ES el default, tal como llega del
              backend) viaja como "" y se traduce en los dos sentidos. Sin
              esta traducción el select arrancaba en blanco y elegir "por
              fecha" dejaba el estado en un valor que no es un Orden. */}
          <SelectFiltro
            valor={orden === 'fecha' ? '' : orden}
            onCambiar={(v) => setOrden((v || 'fecha') as Orden)}
            etiquetaTodos="Ordenar por fecha"
            opciones={[
              { valor: 'proveedor', etiqueta: 'Ordenar por proveedor' },
              { valor: 'documento', etiqueta: 'Ordenar por documento' },
            ]}
            className="w-52"
          />

          <label className="flex items-center gap-1.5 text-xs text-brand-900/70 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloAccion}
              onChange={(e) => setSoloAccion(e.target.checked)}
              className="h-4 w-4 accent-brand-700 cursor-pointer"
            />
            Solo lo que requiere acción
          </label>

          <div className="flex items-center gap-2 ml-auto">
            {hayFiltros && (
              <button
                onClick={limpiarFiltros}
                className="text-[12px] font-medium text-brand-900/50 hover:text-brand-900 transition-colors"
              >
                Limpiar filtros
              </button>
            )}

            {/* Dos vistas del mismo dato: agrupada para repasar por urgencia,
                tabla corrida para trabajar de arriba a abajo. */}
            <div className="flex rounded-md border border-brand-900/12 overflow-hidden">
              {(
                [
                  ['urgencia', 'Por urgencia'],
                  ['tabla', 'Lista'],
                ] as const
              ).map(([id, etiqueta]) => (
                <button
                  key={id}
                  onClick={() => setVista(id)}
                  aria-pressed={vista === id}
                  className={`px-2.5 py-1 text-[12px] font-medium transition-colors ${
                    vista === id ? 'bg-brand-900 text-white' : 'bg-white text-brand-900/50 hover:text-brand-900'
                  }`}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {hayFiltros && (
          <p className="text-[11.5px] text-brand-900/45 mt-2">
            {visibles} de {total} documento{total === 1 ? '' : 's'}
          </p>
        )}
      </Card>

      {/* ---------------------------------------------------------------- */}
      {/* Resultados                                                        */}
      {/* ---------------------------------------------------------------- */}
      {visibles === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/55 text-center py-10">
            {total === 0
              ? 'No hay documentos con fecha de vencimiento registrada. Los que no caducan (como el RUC) no aparecen en este reporte.'
              : 'Ningún documento coincide con los filtros aplicados.'}
          </p>
        </Card>
      ) : vista === 'tabla' ? (
        <Card className="overflow-hidden p-0">
          <ul>
            {filtrados.map((documento) => (
              <FilaCaducidad
                key={documento.id_documento_proveedor}
                documento={documento}
                suspension={data.suspension}
              />
            ))}
          </ul>
        </Card>
      ) : (
        porTramo
          // Un tramo vacío no aporta nada en el listado: ya se ve arriba con
          // su cero.
          .filter((tramo) => tramo.documentos.length > 0)
          .map((tramo) => {
            const estilo = ESTILO_TRAMO[tramo.clave] ?? ESTILO_TRAMO_POR_DEFECTO;

            return (
              <Card key={tramo.clave} className="overflow-hidden p-0">
                <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-brand-900/8 bg-brand-900/[0.015]">
                  <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${estilo.punto}`} aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="font-display text-sm font-semibold text-brand-900">
                      {tramo.etiqueta}{' '}
                      <span className="text-brand-900/45 font-normal">({tramo.documentos.length})</span>
                    </h2>
                    <p className="text-[11px] text-brand-900/50">{tramo.descripcion}</p>
                  </div>
                </div>

                <ul>
                  {tramo.documentos.map((documento) => (
                    <FilaCaducidad
                      key={documento.id_documento_proveedor}
                      documento={documento}
                      suspension={data.suspension}
                    />
                  ))}
                </ul>
              </Card>
            );
          })
      )}
    </div>
  );
}

/** Admin, Calidad y Sistemas (el backend lo vuelve a validar). */
export default function ReporteCaducidadDocumentosPage() {
  const { esSistemas, esAdmin, esCalidad } = useAuth();

  return (
    <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
      <ReporteCaducidadContenido />
    </RoleRoute>
  );
}
