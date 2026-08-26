interface PanelEstadisticasProps {
    totalAbiertos: number;
    totalCerrados: number;
    /**
     * Fill rate: promedio del porcentaje de entrega de los pedidos ya
     * cerrados. Es el MISMO número que vale el 50% de la calificación
     * global del proveedor, no un promedio suelto de esta pantalla.
     */
    porcentajeEntregaPromedio: number;
}

export default function PanelEstadisticas({ totalAbiertos, totalCerrados, porcentajeEntregaPromedio }: PanelEstadisticasProps) {
    const total = totalAbiertos + totalCerrados;

    const tarjetas = [
        { emoji: '📦', valor: totalAbiertos, etiqueta: 'Pedidos vigentes', bg: '#EAF1FB' },
        { emoji: '✅', valor: totalCerrados, etiqueta: 'Pedidos históricos', bg: '#EAF3DE' },
        { emoji: '📊', valor: `${porcentajeEntregaPromedio}%`, etiqueta: 'Fill rate (cuenta para tu nota)', bg: '#FAEEDA' },
        { emoji: '📋', valor: total, etiqueta: 'Total de pedidos', bg: '#F1EFE8' },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            {tarjetas.map((t) => (
                <div key={t.etiqueta} className="rounded-xl bg-brand-200/10 p-4">
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center text-xl mb-2.5" style={{ backgroundColor: t.bg }}>
                        {t.emoji}
                    </div>
                    <p className="text-2xl font-semibold text-brand-900 leading-none">{t.valor}</p>
                    <p className="text-sm text-brand-900/60 mt-1.5">{t.etiqueta}</p>
                </div>
            ))}
        </div>
    );
}