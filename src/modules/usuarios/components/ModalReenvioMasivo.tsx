import { useState } from 'react';
import { isAxiosError } from 'axios';
import { reenviarActivacionMasivo, type ReporteReenvioMasivo, type UsuarioExterno } from '../api/usuariosApi';
import Button from '../../../shared/components/Button';

/**
 * Reenvío masivo del código de activación: primero confirma, después
 * muestra qué pasó con cada uno.
 *
 * LA CONFIRMACIÓN NO ES DE ADORNO: un clic manda decenas de correos
 * reales, y una selección equivocada no se puede "deshacer" — los
 * proveedores ya los recibieron.
 *
 * EL REPORTE DICE "ENCOLADO", NO "ENVIADO". Los correos salen de a uno y
 * espaciados, para que el servidor de correo no los frene por volumen;
 * en el momento de cerrar este modal la mayoría todavía no salió.
 */
export default function ModalReenvioMasivo({
  usuarios,
  onCerrar,
  onTerminado,
}: {
  usuarios: UsuarioExterno[];
  onCerrar: () => void;
  onTerminado: () => void;
}) {
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reporte, setReporte] = useState<ReporteReenvioMasivo | null>(null);

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      setReporte(await reenviarActivacionMasivo(usuarios.map((u) => u.id)));
      onTerminado();
    } catch (e) {
      const datos = isAxiosError(e) ? (e.response?.data as { message?: string } | undefined) : undefined;
      setError(
        isAxiosError(e) && e.response?.status === 429
          ? 'Se hicieron demasiados reenvíos seguidos. Espera un minuto y vuelve a intentarlo.'
          : (datos?.message ?? 'No se pudieron reenviar los códigos.')
      );
    } finally {
      setEnviando(false);
    }
  }

  const omitidos = reporte?.filas.filter((f) => f.estado === 'omitido') ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="flex-1 overflow-y-auto px-6 pb-5 pt-6">
          {!reporte ? (
            <>
              <h2 className="font-display text-base font-semibold text-brand-900">
                Reenviar el código de activación
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-brand-900/75">
                Se le va a mandar un código nuevo a{' '}
                <strong>
                  {usuarios.length} proveedor{usuarios.length === 1 ? '' : 'es'}
                </strong>{' '}
                que nunca activ{usuarios.length === 1 ? 'ó su' : 'aron su'} cuenta. El código anterior
                deja de servir.
              </p>

              <ul className="mt-3 max-h-48 overflow-y-auto rounded-md border border-brand-900/10 text-xs divide-y divide-brand-900/[0.06]">
                {usuarios.map((u) => (
                  <li key={u.id} className="px-3 py-1.5 text-brand-900/75">
                    {u.email}
                  </li>
                ))}
              </ul>

              {error && <p className="mt-3 text-sm text-brand-wine">{error}</p>}
            </>
          ) : (
            <>
              <h2 className="font-display text-base font-semibold text-brand-900">
                {reporte.resumen.encolados > 0 ? 'Códigos reenviados' : 'No se reenvió ningún código'}
              </h2>

              {reporte.resumen.encolados > 0 && (
                <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-800">
                  Se encolaron <strong>{reporte.resumen.encolados}</strong> código
                  {reporte.resumen.encolados === 1 ? '' : 's'} de activación.
                  {reporte.minutos_estimados_envio > 0 && (
                    <>
                      {' '}
                      Salen de a uno y espaciados para que el servidor de correo no los frene: el último
                      sale en unos {reporte.minutos_estimados_envio} minuto
                      {reporte.minutos_estimados_envio === 1 ? '' : 's'}.
                    </>
                  )}
                </div>
              )}

              {omitidos.length > 0 && (
                <div className="mt-3">
                  <p className="text-sm font-medium text-brand-900">
                    {omitidos.length} no se reenvi{omitidos.length === 1 ? 'ó' : 'aron'}
                  </p>
                  <ul className="mt-1.5 max-h-48 overflow-y-auto rounded-md border border-brand-900/10 text-xs divide-y divide-brand-900/[0.06]">
                    {omitidos.map((f) => (
                      <li key={f.id} className="px-3 py-1.5">
                        <span className="text-brand-900">{f.email ?? `#${f.id}`}</span>
                        <span className="text-brand-900/55"> · {f.mensaje}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-brand-900/8 bg-brand-900/[0.02] px-6 py-3">
          {!reporte ? (
            <>
              <Button variant="ghost" onClick={onCerrar} disabled={enviando}>
                Cancelar
              </Button>
              <Button onClick={confirmar} isLoading={enviando}>
                Reenviar a {usuarios.length}
              </Button>
            </>
          ) : (
            <Button onClick={onCerrar}>Entendido</Button>
          )}
        </div>
      </div>
    </div>
  );
}
