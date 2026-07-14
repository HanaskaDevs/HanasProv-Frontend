interface PanelEstadisticasProps {
    totalAbiertos: number;
    totalCerrados: number;
    vencidos: number;
    proximos: number;
}

export default function PanelEstadisticas({ totalAbiertos, totalCerrados, vencidos, proximos }: PanelEstadisticasProps) {
    const total = totalAbiertos + totalCerrados;
    const pctCumplimiento = total > 0 ? Math.round((totalCerrados / total) * 100) : 0;

    const tarjetas = [
        { emoji: '📦', valor: totalAbiertos, etiqueta: 'Pedidos abiertos', bg: 'bg-brand-700/10', emoji_bg: 'bg-brand-700/10' },
        { emoji: '✅', valor: `${pctCumplimiento}%`, etiqueta: 'Cumplimiento', bg: 'bg-emerald-50' },
        { emoji: '⏰', valor: proximos, etiqueta: 'Por vencer (≤1 día)', bg: 'bg-brand-yellow/20' },
        { emoji: '🚨', valor: vencidos, etiqueta: 'Vencidos', bg: 'bg-brand-wine/10' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tarjetas.map((t) => (
                <div key={t.etiqueta} className="rounded-xl border border-brand-900/8 bg-white p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 text-lg ${t.bg}`}>
                        {t.emoji}
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-brand-900 leading-none">{t.valor}</p>
                        <p className="text-[11px] text-brand-900/50 truncate mt-1">{t.etiqueta}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}