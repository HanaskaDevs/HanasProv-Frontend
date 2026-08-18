import { useEffect, useState } from 'react';
import type { ParametroRecepcion } from '../types';

/**
 * Una fila del formulario FGH04.15.05-1. A diferencia de FilaPregunta (las
 * auditorías de calificación, donde se escribe un puntaje libre de 0 a
 * Puntaje_Max), acá la respuesta es binaria: se elige una de las dos
 * opciones y el puntaje sale solo del catálogo.
 *
 * Las etiquetas de los dos botones vienen del backend y NO son siempre
 * "Si"/"No" -> ver "Puntualidad de Entrega" en el formulario.
 */
export default function FilaParametroRecepcion({
    parametro,
    soloLectura,
    guardando,
    onResponder,
    onGuardarObservacion,
}: {
    parametro: ParametroRecepcion;
    soloLectura: boolean;
    guardando: boolean;
    onResponder: (cumple: boolean) => void;
    onGuardarObservacion: (observacion: string | null) => void;
}) {
    const [observacion, setObservacion] = useState(parametro.observacion ?? '');
    const [mostrarObservacion, setMostrarObservacion] = useState(!!parametro.observacion);

    useEffect(() => {
        setObservacion(parametro.observacion ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parametro.id_recepcion_parametro, parametro.observacion]);

    const respondida = parametro.cumple !== null;

    // Se resalta con el color de la marca cuando cumple y en vino cuando no
    // -> mismo criterio de color que el resto de la app (emerald/wine).
    function clasesBoton(activo: boolean, afirmativo: boolean): string {
        if (!activo) {
            return 'bg-brand-900/6 text-brand-900/50 hover:bg-brand-900/10';
        }
        return afirmativo ? 'bg-emerald-600 text-white' : 'bg-brand-wine text-white';
    }

    return (
        <div className="px-4 sm:px-5 py-4">
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                        respondida ? 'bg-emerald-600 text-white' : 'bg-brand-900/8 text-brand-900/40'
                    }`}
                >
                    {respondida ? '✓' : parametro.orden}
                </span>
                <p className="text-sm text-brand-900 leading-snug flex-1 pt-0.5">{parametro.descripcion}</p>
                <span className="shrink-0 text-xs text-brand-900/40 pt-0.5">{parametro.puntaje} pts</span>
            </div>

            <div className="flex items-center gap-2 mt-3 pl-9 flex-wrap">
                <button
                    type="button"
                    onClick={() => onResponder(true)}
                    disabled={soloLectura || guardando}
                    className={`h-8 px-3 rounded-full text-[12px] font-medium transition-colors disabled:opacity-60 ${clasesBoton(
                        parametro.cumple === true,
                        true
                    )}`}
                >
                    {parametro.etiqueta_afirmativa}
                </button>
                <button
                    type="button"
                    onClick={() => onResponder(false)}
                    disabled={soloLectura || guardando}
                    className={`h-8 px-3 rounded-full text-[12px] font-medium transition-colors disabled:opacity-60 ${clasesBoton(
                        parametro.cumple === false,
                        false
                    )}`}
                >
                    {parametro.etiqueta_negativa}
                </button>

                {!mostrarObservacion && !soloLectura && (
                    <button
                        type="button"
                        onClick={() => setMostrarObservacion(true)}
                        className="text-xs text-brand-700 font-medium ml-1"
                    >
                        + Observación
                    </button>
                )}
            </div>

            {(mostrarObservacion || (soloLectura && observacion)) && (
                <textarea
                    disabled={soloLectura}
                    value={observacion}
                    onChange={(e) => setObservacion(e.target.value)}
                    onBlur={() => onGuardarObservacion(observacion || null)}
                    placeholder="Observaciones..."
                    rows={2}
                    className="mt-2.5 ml-9 w-[calc(100%-2.25rem)] rounded-lg border border-brand-900/12 px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-700 disabled:bg-brand-900/5"
                />
            )}
        </div>
    );
}
