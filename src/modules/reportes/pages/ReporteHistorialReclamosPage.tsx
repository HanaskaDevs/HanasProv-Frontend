import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import * as historialApi from '../api/historialReclamosApi';
import type { ProveedorConReclamos, ReclamoHistorial } from '../api/historialReclamosApi';

/**
 * REPORTE: HISTORIAL DE RECLAMOS (12-nov-2026, pedido del usuario).
 *
 * Las pantallas de Reclamos abiertos / cerrados sirven para trabajar el
 * reclamo del día. Esto contesta otra pregunta: "¿qué le hemos reclamado
 * a ESTE proveedor, desde siempre?" -antes de renovarle el contrato, en
 * una reunión, o cuando alguien pide el antecedente completo-.
 *
 * Por eso el flujo es proveedor -> sus reclamos -> la conversación, y por
 * eso lo importante es poder LLEVARSE el historial: cada reclamo se baja
 * en PDF con sus imágenes, y también el proveedor entero de una vez.
 *
 * Es SOLO LECTURA: desde acá no se responde ni se cierra nada.
 */
function IconoDescarga() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function nombreProveedor(p: { razon_social: string | null; nombre_comercial: string | null }): string {
  return p.nombre_comercial || p.razon_social || 'Proveedor sin nombre';
}

/** "2026-11-12 09:30" -> "12/11/2026 09:30" (y deja pasar lo que no sea fecha). */
function formatearFecha(valor: string | null): string {
  if (!valor) return '—';
  const [fecha, hora] = valor.split(' ');
  const partes = fecha.split('-');
  if (partes.length !== 3) return valor;
  return `${partes[2]}/${partes[1]}/${partes[0]}${hora ? ` ${hora}` : ''}`;
}

export default function ReporteHistorialReclamosPage() {
  // Calidad, Admin y Sistemas, igual que HistorialReclamosService::verificarAcceso.
  const { esSistemas, esAdmin, esCalidad } = useAuth();
  const tieneAcceso = esSistemas || esAdmin || esCalidad;

  const [busqueda, setBusqueda] = useState('');
  const [idProveedor, setIdProveedor] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<string | null>(null);
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null);

  const proveedores = useQuery({
    queryKey: ['historial-reclamos-proveedores'],
    queryFn: historialApi.listarProveedores,
    enabled: tieneAcceso,
  });

  const historial = useQuery({
    queryKey: ['historial-reclamos', idProveedor],
    queryFn: () => historialApi.obtenerHistorial(idProveedor!),
    enabled: tieneAcceso && idProveedor !== null,
  });

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const lista = proveedores.data ?? [];
    if (!termino) return lista;

    return lista.filter((p) =>
      [p.razon_social, p.nombre_comercial, p.ruc]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termino))
    );
  }, [proveedores.data, busqueda]);

  async function descargar(clave: string, accion: () => Promise<void>) {
    setErrorDescarga(null);
    setDescargando(clave);
    try {
      await accion();
    } catch {
      setErrorDescarga('No se pudo generar el PDF. Si el proveedor tiene muchas imágenes, puede tardar: vuelve a intentarlo.');
    } finally {
      setDescargando(null);
    }
  }

  return (
    <RoleRoute allow={tieneAcceso}>
      <div className="space-y-4">
        <div>
          <h1 className="font-display text-xl font-semibold text-brand-900">Historial de reclamos</h1>
          <p className="text-sm text-brand-900/60">
            Todo lo reclamado a cada proveedor, con la conversación completa. Se puede descargar en PDF.
          </p>
        </div>

        {errorDescarga && (
          <Card className="border-brand-wine/30 bg-brand-wine/5">
            <p className="text-sm text-brand-wine">{errorDescarga}</p>
          </Card>
        )}

        {idProveedor === null ? (
          <ListaProveedores
            cargando={proveedores.isLoading}
            proveedores={filtrados}
            busqueda={busqueda}
            onBuscar={setBusqueda}
            onElegir={setIdProveedor}
          />
        ) : (
          <DetalleProveedor
            cargando={historial.isLoading}
            datos={historial.data}
            descargando={descargando}
            onVolver={() => setIdProveedor(null)}
            onDescargarReclamo={(id) => descargar(`reclamo-${id}`, () => historialApi.descargarPdfReclamo(id))}
            onDescargarTodo={() =>
              descargar('proveedor', () =>
                historialApi.descargarPdfProveedor(
                  idProveedor,
                  (historial.data ? nombreProveedor(historial.data.proveedor) : 'proveedor')
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                )
              )
            }
            onVerImagen={(url) => historialApi.verImagen(url)}
          />
        )}
      </div>
    </RoleRoute>
  );
}

function ListaProveedores({
  cargando,
  proveedores,
  busqueda,
  onBuscar,
  onElegir,
}: {
  cargando: boolean;
  proveedores: ProveedorConReclamos[];
  busqueda: string;
  onBuscar: (valor: string) => void;
  onElegir: (idProveedor: number) => void;
}) {
  if (cargando) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 sm:px-5 py-3">
        <BarraBusqueda
          valor={busqueda}
          onCambiar={onBuscar}
          placeholder="Buscar por razón social, nombre comercial o RUC..."
        />
      </div>

      {proveedores.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-brand-900/50">
          {busqueda
            ? 'Ningún proveedor coincide con la búsqueda.'
            : 'Todavía no hay reclamos registrados en esta empresa.'}
        </p>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-brand-900/4 text-xs uppercase tracking-wide text-brand-900/50">
            <tr>
              <th className="px-4 sm:px-5 py-2.5">Proveedor</th>
              <th className="px-3 py-2.5">RUC</th>
              <th className="px-3 py-2.5 text-center">Reclamos</th>
              <th className="px-3 py-2.5 text-center">Abiertos</th>
              <th className="px-3 py-2.5">Último</th>
              <th className="px-3 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-900/6">
            {proveedores.map((p) => (
              <tr key={p.id_proveedor} className="hover:bg-brand-900/3">
                <td className="px-4 sm:px-5 py-2.5">
                  <p className="font-medium text-brand-900">{nombreProveedor(p)}</p>
                  {p.nombre_comercial && p.razon_social && (
                    <p className="text-xs text-brand-900/45">{p.razon_social}</p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-brand-900/60">{p.ruc ?? '—'}</td>
                <td className="px-3 py-2.5 text-center tabular-nums">{p.total}</td>
                <td className="px-3 py-2.5 text-center">
                  {p.abiertos > 0 ? (
                    <Badge tone="danger">{p.abiertos}</Badge>
                  ) : (
                    <span className="text-brand-900/30">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-brand-900/60">{formatearFecha(p.ultimo_reclamo)}</td>
                <td className="px-3 py-2.5 text-right">
                  <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => onElegir(p.id_proveedor)}>
                    Ver historial
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function DetalleProveedor({
  cargando,
  datos,
  descargando,
  onVolver,
  onDescargarReclamo,
  onDescargarTodo,
  onVerImagen,
}: {
  cargando: boolean;
  datos: historialApi.HistorialDeProveedor | undefined;
  descargando: string | null;
  onVolver: () => void;
  onDescargarReclamo: (idReclamo: number) => void;
  onDescargarTodo: () => void;
  onVerImagen: (url: string) => void;
}) {
  if (cargando || !datos) {
    return (
      <Card>
        <Spinner />
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <Card className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Button variant="ghost" className="text-xs px-0 py-0 mb-1" onClick={onVolver}>
            ← Volver a la lista
          </Button>
          <h2 className="font-display text-lg font-semibold text-brand-900">{nombreProveedor(datos.proveedor)}</h2>
          <p className="text-xs text-brand-900/50">
            RUC {datos.proveedor.ruc ?? 'no registrado'} · {datos.reclamos.length}{' '}
            {datos.reclamos.length === 1 ? 'reclamo' : 'reclamos'}
          </p>
        </div>

        <Button
          className="text-sm px-4 py-2 flex items-center gap-2"
          disabled={descargando !== null || datos.reclamos.length === 0}
          onClick={onDescargarTodo}
        >
          <IconoDescarga />
          {descargando === 'proveedor' ? 'Generando...' : 'Descargar todo en PDF'}
        </Button>
      </Card>

      {datos.reclamos.map((reclamo) => (
        <TarjetaReclamo
          key={reclamo.id_reclamo}
          reclamo={reclamo}
          descargando={descargando === `reclamo-${reclamo.id_reclamo}`}
          onDescargar={() => onDescargarReclamo(reclamo.id_reclamo)}
          onVerImagen={onVerImagen}
        />
      ))}
    </div>
  );
}

function TarjetaReclamo({
  reclamo,
  descargando,
  onDescargar,
  onVerImagen,
}: {
  reclamo: ReclamoHistorial;
  descargando: boolean;
  onDescargar: () => void;
  onVerImagen: (url: string) => void;
}) {
  // La conversación arranca plegada: un proveedor con 20 reclamos sería
  // ilegible si todos se abrieran de golpe.
  const [abierto, setAbierto] = useState(false);

  return (
    <Card className="p-0 overflow-hidden">
      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-brand-900/40">#{reclamo.id_reclamo}</span>
            <h3 className="font-medium text-brand-900">{reclamo.asunto}</h3>
            <Badge tone={reclamo.estado === 'Abierto' ? 'danger' : 'success'}>{reclamo.estado}</Badge>
          </div>
          <p className="text-xs text-brand-900/50 mt-1">
            {reclamo.tipo_reclamo ?? 'Sin tipo'} · creado el {formatearFecha(reclamo.fecha_creacion)}
            {reclamo.fecha_cierre ? ` · cerrado el ${formatearFecha(reclamo.fecha_cierre)}` : ''}
            {' · '}
            {reclamo.total_mensajes} {reclamo.total_mensajes === 1 ? 'mensaje' : 'mensajes'}
            {reclamo.total_imagenes > 0 ? ` · ${reclamo.total_imagenes} imágenes` : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={() => setAbierto((v) => !v)}>
            {abierto ? 'Ocultar conversación' : 'Ver conversación'}
          </Button>
          <Button
            variant="ghost"
            className="text-xs px-3 py-1.5 flex items-center gap-1.5"
            disabled={descargando}
            onClick={onDescargar}
          >
            <IconoDescarga />
            {descargando ? 'Generando...' : 'PDF'}
          </Button>
        </div>
      </div>

      {abierto && (
        <div className="border-t border-brand-900/8 px-4 sm:px-5 py-3 space-y-3 bg-brand-900/2">
          {reclamo.mensajes.map((mensaje) => (
            <div key={mensaje.id_reclamo_mensaje} className="border-l-2 border-brand-900/12 pl-3">
              <p className="text-sm font-medium text-brand-900">{mensaje.autor}</p>
              <p className="text-[11px] text-brand-900/40">{formatearFecha(mensaje.fecha)}</p>
              <p className="text-sm text-brand-900/80 whitespace-pre-wrap mt-1">{mensaje.mensaje}</p>

              {mensaje.imagenes.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {mensaje.imagenes.map((imagen) => (
                    <button
                      key={imagen.id}
                      type="button"
                      onClick={() => onVerImagen(imagen.url)}
                      className="text-xs text-brand-700 underline underline-offset-2"
                    >
                      {imagen.nombre ?? `Imagen ${imagen.id}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {reclamo.mensajes.length === 0 && (
            <p className="text-sm text-brand-900/45">Este reclamo no tiene mensajes registrados.</p>
          )}
        </div>
      )}
    </Card>
  );
}
