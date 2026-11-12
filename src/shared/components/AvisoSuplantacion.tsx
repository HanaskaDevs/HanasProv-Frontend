import { useState } from 'react';
import { useAuth } from '../../modules/auth/hooks/useAuth';

/**
 * Franja fija arriba de todo mientras Sistemas está dentro de la cuenta de
 * otro usuario ("Entrar como este usuario"), para que nunca se le olvide en
 * qué cuenta está ni haga algo creyendo que es la suya.
 */
export default function AvisoSuplantacion() {
  const { suplantadoPor, usuario, volverAMiCuenta } = useAuth();
  const [saliendo, setSaliendo] = useState(false);

  if (!suplantadoPor || !usuario) return null;

  return (
    <div className="shrink-0 bg-amber-400 text-brand-900 px-4 py-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm">
      <p>
        Estás viendo el portal como <strong>{usuario.nombre_completo}</strong>{' '}
        <span className="text-brand-900/70">({usuario.email})</span>. Lo que hagas queda hecho en su cuenta.
      </p>
      <button
        onClick={() => {
          setSaliendo(true);
          void volverAMiCuenta();
        }}
        disabled={saliendo}
        className="rounded-full bg-brand-900 text-white px-3 py-1 text-xs font-semibold hover:bg-brand-700 disabled:opacity-60"
      >
        {saliendo ? 'Volviendo…' : 'Volver a mi cuenta'}
      </button>
    </div>
  );
}
