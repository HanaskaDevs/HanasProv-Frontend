interface PanelEstadisticasProps {
    totalAbiertos: number;
    totalCerrados: number;
    vencidos: number;
    proximos: number;
}

function IconoCaja() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
            <path d="m3.3 7 8.7 5 8.7-5" />
            <path d="M12 22V12" />
        </svg>
    );
}

function IconoCheck() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    );
}

function IconoAlerta() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    );
}

function IconoReloj() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

export default function PanelEstadisticas({ totalAbiertos, totalCerrados, vencidos, proximos }: PanelEstadisticasProps) {
    const total = totalAbiertos + totalCerrados;
    const pctCumplimiento = total > 0 ? Math.round((totalCerrados / total) * 100) : 0;

    const tarjetas = [
        { icono: <IconoCaja />, valor: totalAbiertos, etiqueta: 'Pedidos abiertos', color: 'text-brand-700 bg-brand-700/10' },
        { icono: <IconoCheck />, valor: `${pctCumplimiento}%`, etiqueta: 'Cumplimiento', color: 'text-emerald-700 bg-emerald-50' },
        { icono: <IconoReloj />, valor: proximos, etiqueta: 'Por vencer (≤1 día)', color: 'text-brand-900 bg-brand-yellow/20' },
        { icono: <IconoAlerta />, valor: vencidos, etiqueta: 'Vencidos', color: 'text-brand-wine bg-brand-wine/10' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {tarjetas.map((t) => (
                <div key={t.etiqueta} className="rounded-xl border border-brand-900/8 bg-white p-3 flex items-center gap-3">
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${t.color}`}>{t.icono}</div>
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-brand-900 leading-none">{t.valor}</p>
                        <p className="text-[11px] text-brand-900/50 truncate mt-1">{t.etiqueta}</p>
                    </div>
                </div>
            ))}
        </div>
    );
}