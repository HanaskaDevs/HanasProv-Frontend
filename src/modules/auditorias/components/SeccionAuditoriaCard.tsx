import { Fragment, useMemo } from 'react';
import type { SeccionAuditoria } from '../types';
import Card from '../../../shared/components/Card';
import FilaPregunta from './FilaPregunta';

export default function SeccionAuditoriaCard({
    seccion,
    soloLectura,
    onGuardarRespuesta,
}: {
    seccion: SeccionAuditoria;
    soloLectura: boolean;
    onGuardarRespuesta: (idPregunta: number, payload: { puntaje_obtenido: number | null; no_aplica: boolean; observacion: string | null }) => void;
}) {
    const puntajeMaxSeccion = useMemo(
        () => seccion.preguntas.reduce((acc, p) => acc + p.puntaje_max, 0),
        [seccion.preguntas]
    );

    const puntajeObtenidoSeccion = useMemo(
        () => seccion.preguntas.reduce((acc, p) => acc + (p.no_aplica ? 0 : p.puntaje_obtenido ?? 0), 0),
        [seccion.preguntas]
    );

    // Agrupa por subsección conservando el orden, sin perder las preguntas
    // que no tienen subsección (van en un grupo sin encabezado).
    const grupos = useMemo(() => {
        const mapa = new Map<string | null, typeof seccion.preguntas>();
        for (const pregunta of seccion.preguntas) {
            const clave = pregunta.subseccion;
            if (!mapa.has(clave)) mapa.set(clave, []);
            mapa.get(clave)!.push(pregunta);
        }
        return Array.from(mapa.entries());
    }, [seccion.preguntas]);

    return (
        <Card className="p-0 overflow-hidden">
            <div className="px-4 sm:px-5 py-3.5 flex items-center justify-between gap-2">
                <h3 className="font-display text-base font-semibold text-brand-900">{seccion.nombre_seccion}</h3>
                <span className="text-xs font-medium text-brand-900/40 shrink-0">
                    {puntajeObtenidoSeccion} / {puntajeMaxSeccion} pts
                </span>
            </div>

            {/* 2 columnas en pantallas anchas (mejor uso del espacio), 1 en móvil */}
            <div className="grid grid-cols-1 lg:grid-cols-2 lg:gap-x-5">
                {grupos.map(([subseccion, preguntas]) => (
                    <Fragment key={subseccion ?? '__sin_subseccion__'}>
                        {subseccion && (
                            <p className="col-span-full px-4 sm:px-5 pt-3 pb-1 text-xs font-semibold text-brand-700">
                                {subseccion}
                            </p>
                        )}
                        {preguntas.map((pregunta) => (
                            <div key={pregunta.id_auditoria_pregunta} className="border-b border-brand-900/6">
                                <FilaPregunta
                                    pregunta={pregunta}
                                    soloLectura={soloLectura}
                                    onGuardar={(payload) => onGuardarRespuesta(pregunta.id_auditoria_pregunta, payload)}
                                />
                            </div>
                        ))}
                    </Fragment>
                ))}
            </div>
        </Card>
    );
}