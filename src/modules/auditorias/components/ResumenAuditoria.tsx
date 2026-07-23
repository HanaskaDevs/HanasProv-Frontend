import type { ResumenAuditoria as ResumenAuditoriaType } from '../types';

export default function ResumenAuditoria({ resumen }: { resumen: ResumenAuditoriaType }) {
    const aprobado = resumen.porcentaje_cumplimiento >= 80;

    return (
        <div className="rounded-xl border border-brand-900/10 bg-white shadow-sm p-4 space-y-3">
            <h3 className="font-display text-sm font-semibold text-brand-900">Resumen</h3>

            <div className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                    <span className="text-brand-900/60">Puntaje Total Posible</span>
                    <span className="font-medium text-brand-900">{resumen.puntaje_total_posible}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-brand-900/60">Puntaje No Aplica</span>
                    <span className="font-medium text-brand-900">{resumen.puntaje_no_aplica}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-brand-900/60">Puntaje Total Aplica</span>
                    <span className="font-medium text-brand-900">{resumen.puntaje_total_aplica}</span>
                </div>
                <div className="flex items-center justify-between pt-1.5 border-t border-brand-900/8">
                    <span className="text-brand-900/60">Puntaje Total Obtenido</span>
                    <span className="font-semibold text-brand-900">{resumen.puntaje_total_obtenido}</span>
                </div>
            </div>

            <div className={`rounded-lg px-3 py-2.5 text-center ${aprobado ? 'bg-emerald-50' : 'bg-brand-wine/10'}`}>
                <p className={`text-2xl font-display font-bold ${aprobado ? 'text-emerald-700' : 'text-brand-wine'}`}>
                    {resumen.porcentaje_cumplimiento}%
                </p>
                <p className="text-xs text-brand-900/50">Porcentaje de Cumplimiento</p>
            </div>
        </div>
    );
}