import type { SeccionAuditoria } from '../types';

export default function ResumenPorSeccion({ secciones }: { secciones: SeccionAuditoria[] }) {
    return (
        <div className="rounded-xl border border-brand-900/10 bg-white shadow-sm p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-brand-900">Puntaje por sección</h3>
            <div className="space-y-2.5">
                {secciones.map((seccion) => {
                    const max = seccion.preguntas.reduce((acc, p) => acc + p.puntaje_max, 0);
                    const obtenido = seccion.preguntas.reduce((acc, p) => acc + (p.no_aplica ? 0 : p.puntaje_obtenido ?? 0), 0);
                    const aplica = seccion.preguntas.reduce((acc, p) => acc + (p.no_aplica ? 0 : p.puntaje_max), 0);
                    const porcentaje = aplica > 0 ? Math.round((obtenido / aplica) * 100) : 0;

                    return (
                        <div key={seccion.id_auditoria_seccion}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-brand-900/70 truncate pr-2">{seccion.nombre_seccion}</span>
                                <span className="font-medium text-brand-900 shrink-0">{obtenido} / {max}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-brand-900/8 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${porcentaje >= 80 ? 'bg-emerald-600' : 'bg-brand-yellow'}`}
                                    style={{ width: `${porcentaje}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}