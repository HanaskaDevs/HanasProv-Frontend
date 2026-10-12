import logo from '../../assets/logo-hanaska.png';

/**
 * El logo de Hanaska "trabajando": un círculo con la marca en el centro,
 * un anillo de los colores de detalle girando alrededor y un halo de luz
 * que late detrás.
 *
 * Es una pieza aparte de la pantalla completa (Procesando.tsx) porque
 * también se usa dentro de un modal, a menor tamaño, mientras se espera
 * la respuesta del servidor de correo.
 *
 * El PNG de la marca es BLANCO, por eso va siempre sobre el círculo
 * oscuro: sobre fondo claro no se vería.
 */
export default function LogoProcesando({ tamano = 'grande' }: { tamano?: 'grande' | 'chico' }) {
  const grande = tamano === 'grande';
  const caja = grande ? 'h-32 w-32' : 'h-16 w-16';
  const logoAlto = grande ? 'h-12' : 'h-6';
  const grosorAnillo = grande ? 4 : 3;

  return (
    <div className={`relative ${caja} shrink-0`} aria-hidden="true">
      {/* Halo de luz detrás del círculo. */}
      <div className="procesando-halo absolute -inset-3 rounded-full bg-brand-yellow/30 blur-xl" />

      {/* Anillo: un degradado cónico recortado como aro con una máscara,
          así gira solo el borde y no el logo. */}
      <div
        className="procesando-anillo absolute inset-0 rounded-full"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, transparent 70deg, var(--color-brand-200) 160deg, var(--color-brand-yellow) 290deg, transparent 360deg)',
          WebkitMask: `radial-gradient(farthest-side, transparent calc(100% - ${grosorAnillo}px), #000 calc(100% - ${grosorAnillo}px))`,
          mask: `radial-gradient(farthest-side, transparent calc(100% - ${grosorAnillo}px), #000 calc(100% - ${grosorAnillo}px))`,
        }}
      />

      {/* Pista tenue del anillo, para que se lea como un círculo completo. */}
      <div className="absolute inset-0 rounded-full border border-white/10" style={{ borderWidth: grosorAnillo }} />

      {/* El círculo con la marca. */}
      <div
        className="absolute flex items-center justify-center rounded-full bg-brand-900 shadow-lg shadow-black/30"
        style={{ inset: grosorAnillo + (grande ? 6 : 3) }}
      >
        <img src={logo} alt="" className={`procesando-logo ${logoAlto} w-auto select-none`} draggable={false} />
      </div>
    </div>
  );
}
