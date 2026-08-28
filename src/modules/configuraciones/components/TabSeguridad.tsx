import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import * as configuracionesApi from '../api/configuracionesApi';

/**
 * IP bloqueadas automáticamente por fuerza bruta.
 *
 * Esta pantalla no es un lujo: el bloqueo de IP NO caduca solo (decisión
 * del negocio), así que sin un lugar donde verlas y liberarlas, una IP mal
 * bloqueada dejaría a esa red sin portal hasta que alguien entrara a la
 * base de datos a mano.
 */
export default function TabSeguridad() {
  const queryClient = useQueryClient();

  const { data: ips, isLoading } = useQuery({
    queryKey: ['ips-bloqueadas'],
    queryFn: configuracionesApi.listarIpsBloqueadas,
  });

  const desbloquear = useMutation({
    mutationFn: (id: number) => configuracionesApi.desbloquearIp(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ips-bloqueadas'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const vigentes = (ips ?? []).filter((i) => i.Activa);
  const liberadas = (ips ?? []).filter((i) => !i.Activa);

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-display text-base font-semibold text-brand-900">
          Bloqueo automático por intentos de acceso
        </h2>
        <p className="text-sm text-brand-900/60 mt-1 max-w-3xl">
          El portal se defiende solo de quien prueba contraseñas: a los <strong>3 intentos fallidos seguidos</strong> se
          bloquea esa cuenta, y a los <strong>5 intentos seguidos con correos que no existen</strong> se bloquea la
          dirección de red desde la que vienen. Las cuentas se destraban desde{' '}
          <strong>Usuarios</strong>; las direcciones de red, desde acá.
        </p>
        <p className="text-xs text-brand-900/45 mt-2">
          El bloqueo de una dirección no se levanta solo con el tiempo: queda hasta que alguien de Sistemas la libere.
        </p>
      </Card>

      <Card>
        <h3 className="font-display text-sm font-semibold text-brand-900 mb-3">
          Bloqueadas ahora {vigentes.length > 0 && <Badge tone="danger">{vigentes.length}</Badge>}
        </h3>

        {vigentes.length === 0 ? (
          <p className="text-sm text-brand-900/50 py-4 text-center">
            No hay ninguna dirección bloqueada. Es lo esperable: solo aparecen acá cuando alguien intentó entrar
            probando correos al azar.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-brand-900/50 text-xs uppercase tracking-wide border-b border-brand-900/10">
                  <th className="py-2 pr-4">Dirección</th>
                  <th className="py-2 pr-4">Motivo</th>
                  <th className="py-2 pr-4">Desde</th>
                  <th className="py-2 pr-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {vigentes.map((ip) => (
                  <tr key={ip.Id_Ip_Bloqueada} className="border-b border-brand-900/5">
                    <td className="py-2.5 pr-4 font-medium text-brand-900 tabular-nums">{ip.Ip}</td>
                    <td className="py-2.5 pr-4 text-brand-900/60">{ip.Motivo ?? '—'}</td>
                    <td className="py-2.5 pr-4 text-brand-900/60 tabular-nums">
                      {new Date(ip.Fecha_Bloqueo).toLocaleString('es-EC')}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <Button
                        variant="ghost"
                        className="text-xs px-2 py-1 text-emerald-700"
                        isLoading={desbloquear.isPending && desbloquear.variables === ip.Id_Ip_Bloqueada}
                        onClick={() => desbloquear.mutate(ip.Id_Ip_Bloqueada)}
                      >
                        Desbloquear
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {desbloquear.isError && (
          <p className="text-xs text-brand-wine mt-3">No se pudo desbloquear. Intentá de nuevo.</p>
        )}
      </Card>

      {liberadas.length > 0 && (
        <Card>
          <h3 className="font-display text-sm font-semibold text-brand-900 mb-1">Historial</h3>
          <p className="text-xs text-brand-900/45 mb-3">
            Direcciones que estuvieron bloqueadas y ya se liberaron. No se borran a propósito: sirven para reconocer a
            quien vuelve a intentarlo.
          </p>
          <ul className="space-y-1.5">
            {liberadas.slice(0, 20).map((ip) => (
              <li key={ip.Id_Ip_Bloqueada} className="text-xs text-brand-900/55 flex items-center gap-2">
                <span className="tabular-nums font-medium text-brand-900/75">{ip.Ip}</span>
                <span>·</span>
                <span>bloqueada el {new Date(ip.Fecha_Bloqueo).toLocaleDateString('es-EC')}</span>
                {ip.Fecha_Desbloqueo && (
                  <>
                    <span>·</span>
                    <span>liberada el {new Date(ip.Fecha_Desbloqueo).toLocaleDateString('es-EC')}</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
