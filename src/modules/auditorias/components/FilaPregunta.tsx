import { useEffect, useState } from 'react';
import type { PreguntaAuditoria } from '../types';

export default function FilaPregunta({
    pregunta,
    soloLectura,
    onGuardar,
}: {
    pregunta: PreguntaAuditoria;
    soloLectura: boolean;
    onGuardar: (payload: { puntaje_obtenido: number | null; no_aplica: boolean; observacion: string | null }) => void;
}) {
    const [puntaje, setPuntaje] = useState(pregunta.puntaje_obtenido?.toString() ?? '');
    const [noAplica, setNoAplica] = useState(pregunta.no_aplica);
    const [observacion, setObservacion] = useState(pregunta.observacion ?? '');
    const [mostrarObservacion, setMostrarObservacion] = useState(!!pregunta.observacion);

    useEffect(() => {
        setPuntaje(pregunta.puntaje_obtenido?.toString() ?? '');
        setNoAplica(pregunta.no_aplica);
        setObservacion(pregunta.observacion ?? '');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pregunta.id_auditoria_pregunta, pregunta.puntaje_obtenido, pregunta.no_aplica, pregunta.observacion]);

    function guardarPuntaje() {
        const valor = puntaje.trim() === '' ? null : Number(puntaje);
        const acotado = valor === null ? null : Math.min(Math.max(valor, 0), pregunta.puntaje_max);
        if (acotado !== valor) setPuntaje(acotado?.toString() ?? '');
        onGuardar({ puntaje_obtenido: acotado, no_aplica: noAplica, observacion: observacion || null });
    }

    function alternarNoAplica() {
        if (soloLectura) return;
        const nuevoValor = !noAplica;
        setNoAplica(nuevoValor);
        onGuardar({ puntaje_obtenido: nuevoValor ? null : (puntaje.trim() === '' ? null : Number(puntaje)), no_aplica: nuevoValor, observacion: observacion || null });
    }

    function guardarObservacion() {
        onGuardar({ puntaje_obtenido: noAplica ? null : (puntaje.trim() === '' ? null : Number(puntaje)), no_aplica: noAplica, observacion: observacion || null });
    }

    const respondida = noAplica || puntaje.trim() !== '';

    return (
        <div className="px-4 sm:px-5 py-4">
            <div className="flex items-start gap-3">
                <span
                    className={`mt-0.5 shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-[12px] font-semibold transition-colors ${
                        respondida ? 'bg-emerald-600 text-white' : 'bg-brand-900/8 text-brand-900/40'
                    }`}
                >
                    {respondida ? '✓' : pregunta.numero}
                </span>
                <p className="text-sm text-brand-900 leading-snug flex-1 pt-0.5">{pregunta.descripcion}</p>
            </div>

            <div className="flex items-stretch sm:items-center gap-2.5 mt-3 sm:pl-9 flex-wrap">
                <div className="flex items-center gap-1.5">
                    <input
                        type="number"
                        min={0}
                        max={pregunta.puntaje_max}
                        step="0.5"
                        disabled={soloLectura || noAplica}
                        value={puntaje}
                        onChange={(e) => setPuntaje(e.target.value)}
                        onBlur={guardarPuntaje}
                        placeholder="—"
                        className="w-16 min-h-11 rounded-lg border-2 border-brand-900/12 text-center text-base font-medium text-brand-900 focus:outline-none focus:border-brand-700 disabled:bg-brand-900/5 disabled:text-brand-900/25 disabled:border-transparent"
                    />
                    <span className="text-xs text-brand-900/40">de {pregunta.puntaje_max}</span>
                </div>

                <button
                    type="button"
                    onClick={alternarNoAplica}
                    disabled={soloLectura}
                    className={`min-h-11 px-4 rounded-full text-[13px] font-medium transition-colors disabled:opacity-60 ${
                        noAplica ? 'bg-brand-900 text-white' : 'bg-brand-900/6 text-brand-900/50 hover:bg-brand-900/10'
                    }`}
                >
                    No aplica
                </button>

                {!mostrarObservacion && !soloLectura && (
                    <button
                        type="button"
                        onClick={() => setMostrarObservacion(true)}
                        className="text-xs text-brand-700 font-medium min-h-11 px-2"
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
                    onBlur={guardarObservacion}
                    placeholder="Observaciones..."
                    rows={2}
                    className="mt-2.5 sm:ml-9 w-full sm:w-[calc(100%-2.25rem)] rounded-lg border border-brand-900/12 px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand-700 disabled:bg-brand-900/5"
                />
            )}
        </div>
    );
}