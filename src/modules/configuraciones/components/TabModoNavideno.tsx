import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import Logo from '../../../shared/components/Logo';
import GorroNavideno from '../../../shared/components/navidad/GorroNavideno';
import GuirnaldaLuces from '../../../shared/components/navidad/GuirnaldaLuces';
import Nevada from '../../../shared/components/navidad/Nevada';
import { CLAVE_MODO_NAVIDENO } from '../../../shared/hooks/useModoNavideno';
import * as configuracionesApi from '../api/configuracionesApi';

/**
 * Interruptor del modo navideño (04-nov-2026, pedido del usuario). Solo
 * Sistemas, como todo Configuraciones.
 *
 * Al cambiarlo se actualiza también la clave que lee el resto del portal
 * (CLAVE_MODO_NAVIDENO): quien lo enciende ve la nieve, las luces y el gorro
 * de Hana al instante, sin recargar. Los demás usuarios lo ven en su próxima
 * carga (o a los 10 minutos, ver useModoNavideno).
 *
 * La vista previa de abajo siempre muestra la decoración, esté encendido o no,
 * para que se pueda ver cómo queda antes de prenderlo para todos.
 */
const QUE_CAMBIA = [
  {
    titulo: 'Hana con gorro de Papá Noel',
    texto: 'El círculo de Hana y su avatar en el chat llevan gorro, y Hana saluda deseando felices fiestas.',
  },
  {
    titulo: 'Guirnalda de luces',
    texto: 'Luces en los colores de Hanaska cuelgan del borde de la barra superior y titilan suave.',
  },
  {
    titulo: 'Nieve',
    texto:
      'Copos discretos en todo el portal, también en el login. No tapan nada ni reciben clics, quedan detrás de las ventanas y no aparecen en el Modo TV.',
  },
];

/**
 * Maqueta del portal con la decoración puesta: barra azul con luces,
 * contenido con nieve y Hana con su gorro en la esquina (mismas proporciones
 * que el círculo real de 80 px, escaladas a 56 px).
 */
function VistaPreviaNavidad() {
  return (
    <div className="relative mx-5 mb-5 h-64 overflow-hidden rounded-lg border border-brand-900/10 bg-[#f7fafc]">
      <div className="relative h-12 bg-brand-900 flex items-center gap-3 px-4">
        <Logo className="h-6" variant="light" />
        <span className="ml-auto h-2 w-14 rounded-full bg-white/25" />
        <span className="h-2 w-10 rounded-full bg-white/15" />
        <span className="h-2 w-12 rounded-full bg-white/15" />
      </div>
      <GuirnaldaLuces />
      <div className="p-4 pt-9 space-y-2">
        <div className="h-3 w-40 rounded bg-brand-900/20" />
        <div className="h-2.5 w-28 rounded bg-brand-900/10" />
        <div className="h-4 w-36 rounded-full bg-brand-wine/10 border border-brand-wine/15" />
        <div className="grid grid-cols-3 gap-2 pt-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 rounded-md bg-white border border-brand-900/8 shadow-sm" />
          ))}
        </div>
      </div>
      <Nevada enCaja />
      <div className="absolute bottom-3 right-3 z-50">
        <div className="relative">
          <div className="h-14 w-14 rounded-full overflow-hidden border-2 border-[#f3d9da] ring-2 ring-brand-wine/30 shadow-md bg-brand-200/20">
            <video src="/hana-bot.mp4" muted playsInline preload="auto" className="h-full w-full object-cover" />
          </div>
          <GorroNavideno className="gorro-navideno absolute -top-[23px] -left-0.5 w-[53px] drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}

export default function TabModoNavideno() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['config-modo-navideno'],
    queryFn: configuracionesApi.obtenerModoNavideno,
  });

  const cambiar = useMutation({
    mutationFn: (activo: boolean) => configuracionesApi.definirModoNavideno(activo),
    onSuccess: (nuevo) => {
      queryClient.setQueryData(['config-modo-navideno'], nuevo);
      // El resto del portal lee esta otra clave: se actualiza al toque.
      queryClient.setQueryData(CLAVE_MODO_NAVIDENO, nuevo.activo);
    },
  });

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-10">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-brand-900 flex items-center gap-2">
              Modo navideño
              <Badge tone={data.activo ? 'success' : 'neutral'}>{data.activo ? 'Encendido' : 'Apagado'}</Badge>
            </h2>
            <p className="text-sm text-brand-900/60 mt-1 max-w-2xl">
              Viste el portal para las fiestas: <strong>todos los usuarios</strong> (proveedores y personal interno)
              lo ven. Es solo decoración: no cambia ningún dato, permiso ni proceso, y se apaga con el mismo
              interruptor cuando pasen las fiestas.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={data.activo}
            aria-label="Modo navideño"
            disabled={cambiar.isPending}
            onClick={() => cambiar.mutate(!data.activo)}
            className={`relative shrink-0 h-7 w-12 rounded-full transition-colors disabled:opacity-50 ${
              data.activo ? 'bg-emerald-600' : 'bg-brand-900/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                data.activo ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        {cambiar.isError && (
          <p className="text-xs text-brand-wine mt-3">No se pudo cambiar la configuración. Intenta de nuevo.</p>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <Card className="!p-0 overflow-hidden">
          <p className="px-5 pt-4 pb-2 text-[11px] font-semibold uppercase tracking-wide text-brand-900/45">
            Vista previa
          </p>
          <VistaPreviaNavidad />
        </Card>

        <Card>
          <h3 className="font-display text-sm font-semibold text-brand-900 mb-3">Qué cambia al encenderlo</h3>
          <ul className="space-y-3">
            {QUE_CAMBIA.map((item) => (
              <li key={item.titulo} className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-wine" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-900">{item.titulo}</p>
                  <p className="text-xs text-brand-900/55 mt-0.5">{item.texto}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-brand-900/40 mt-4">
            Quien tenga activado «reducir movimiento» en su equipo ve la decoración quieta y sin nieve.
          </p>
        </Card>
      </div>
    </div>
  );
}
