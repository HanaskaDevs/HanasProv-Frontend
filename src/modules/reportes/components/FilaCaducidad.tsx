import type { DocumentoPorCaducar, EstadoSuspension } from '../api/reportesApi';
import { ESTILO_TRAMO, ESTILO_TRAMO_POR_DEFECTO, formatearFecha, nombreProveedor, textoDeDias } from '../utils/caducidad';

function IconoCorreo() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

/**
 * Una fila del reporte.
 *
 * TRES COSAS QUE NO ESTABAN Y SON LAS QUE HACEN EL TRABAJO:
 *
 *  1. EL CORREO DEL PROVEEDOR, como enlace mailto con el asunto ya escrito.
 *     El reporte existe para perseguir a alguien; antes había que salir a
 *     buscar a quién escribirle a la ficha del proveedor, en otra pantalla.
 *  2. LA CUENTA REGRESIVA DE SUSPENSIÓN para lo ya vencido, que no es lo
 *     mismo que los días de vencido (la suspensión llega recién a los
 *     `dias_gracia` días después). Y solo se dibuja si la suspensión de
 *     verdad está activa: prometer una consecuencia que no va a ocurrir es
 *     peor que no decir nada.
 *  3. CUÁNDO SE LE AVISÓ POR ÚLTIMA VEZ, para saber si el silencio del
 *     proveedor es porque nadie le escribió o porque está ignorando.
 */
export default function FilaCaducidad({
  documento,
  suspension,
}: {
  documento: DocumentoPorCaducar;
  suspension: EstadoSuspension;
}) {
  const estilo = ESTILO_TRAMO[documento.tramo] ?? ESTILO_TRAMO_POR_DEFECTO;
  const nombre = nombreProveedor(documento);

  const asunto = encodeURIComponent(`Documentación por vencer: ${documento.documento}`);
  const cuerpo = encodeURIComponent(
    `Estimados ${nombre}:\n\nSu documento "${documento.documento}" ${
      documento.dias_restantes < 0 ? 'venció' : 'vence'
    } el ${formatearFecha(documento.fecha_caducidad)}. Le solicitamos cargar la versión actualizada en el portal de proveedores.\n\nSaludos cordiales.`
  );

  // La cuenta regresiva a la suspensión solo tiene sentido si la suspensión
  // está realmente en pie: activa por configuración Y con la fecha cumplida.
  const muestraSuspension =
    documento.dias_para_suspension !== null && suspension.activa && suspension.ya_es_exigible;

  return (
    <li
      className={`grid gap-3 px-4 py-2.5 border-l-4 ${estilo.borde} border-b border-brand-900/5 last:border-b-0 hover:bg-brand-900/[0.02] transition-colors items-center`}
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) 150px' }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <p className="text-sm font-medium text-brand-900 truncate">{nombre}</p>
          {documento.proveedor_suspendido && (
            <span className="shrink-0 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-red-100 text-red-800">
              Suspendido
            </span>
          )}
        </div>
        <p className="text-[12px] text-brand-900/45 truncate flex items-center gap-2">
          <span>{documento.ruc ?? 'Sin RUC'}</span>
          {documento.email && (
            <a
              href={`mailto:${documento.email}?subject=${asunto}&body=${cuerpo}`}
              className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-900 hover:underline shrink-0"
              title={`Escribir a ${documento.email}`}
            >
              <IconoCorreo />
              Escribir
            </a>
          )}
        </p>
      </div>

      <div className="min-w-0">
        <p className="text-[13px] text-brand-900/80 truncate">{documento.documento}</p>
        <p className="text-[11.5px] text-brand-900/40 truncate">
          {documento.fecha_ultima_notificacion
            ? `Último aviso: ${formatearFecha(documento.fecha_ultima_notificacion)}`
            : 'Todavía sin aviso enviado'}
        </p>
      </div>

      <div className="text-right">
        <p className="text-[13px] font-semibold text-brand-900 tabular-nums leading-tight">
          {formatearFecha(documento.fecha_caducidad)}
        </p>
        <p className={`text-[11.5px] font-medium ${estilo.texto}`}>{textoDeDias(documento.dias_restantes)}</p>
        {muestraSuspension && (
          <p className="text-[11px] text-red-700 font-medium">
            {documento.dias_para_suspension! > 0
              ? `Suspende en ${documento.dias_para_suspension} d`
              : 'Suspensión ya exigible'}
          </p>
        )}
      </div>
    </li>
  );
}
