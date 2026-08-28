export default function PasosSeccionesAuditoria({
    nombresSecciones,
    completadas,
    indiceActual,
    onIrASeccion,
    porcentajeRespondido,
}: {
    nombresSecciones: string[];
    completadas: boolean[];
    indiceActual: number;
    onIrASeccion: (indice: number) => void;
    porcentajeRespondido: number;
}) {
    return (
        <div>
            <div className="flex items-center justify-between gap-2 mb-2.5">
                <p className="font-display text-sm font-semibold text-brand-900 truncate">
                    {nombresSecciones[indiceActual]}
                </p>
                <span className="text-xs text-brand-900/40 shrink-0">
                    {indiceActual + 1}/{nombresSecciones.length} · {porcentajeRespondido}%
                </span>
            </div>

            <div className="flex items-center gap-1 overflow-x-auto py-1">
                {nombresSecciones.map((nombre, indice) => {
                    const completada = completadas[indice];
                    const esActual = indice === indiceActual;

                    return (
                        <button
                            key={indice}
                            type="button"
                            onClick={() => onIrASeccion(indice)}
                            aria-label={nombre}
                            title={nombre}
                            className="shrink-0 flex items-center justify-center h-8 w-8 sm:h-5 sm:w-3.5"
                        >
                            <span
                                className={`h-2 rounded-full transition-all duration-200 ${
                                    esActual ? 'w-7 bg-brand-700' : completada ? 'w-2 bg-emerald-600' : 'w-2 bg-brand-900/15'
                                }`}
                            />
                        </button>
                    );
                })}
            </div>
        </div>
    );
}