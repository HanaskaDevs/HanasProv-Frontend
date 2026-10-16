import { useMemo, useState } from 'react';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import type { FilaReporteCalificacion } from '../types';

function colorPorcentaje(porcentaje: number): string {
    if (porcentaje >= 85) return 'text-emerald-700';
    if (porcentaje >= 70) return 'text-orange-600';
    return 'text-brand-wine';
}

/**
 * La fecha llega como 'YYYY-MM-DD'. new Date() la toma como medianoche UTC
 * y en Ecuador (UTC-5) se mostraba el día anterior: se arma en hora local.
 */
function formatearFecha(fecha: string | null): string {
    if (!fecha) return '—';
    const [anio, mes, dia] = fecha.split('-').map(Number);
    if (!anio || !mes || !dia) return '—';
    return new Date(anio, mes - 1, dia).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
}

/**
 * Mini reporte de Auditorías y de Calificación de Recepciones: qué
 * proveedores ya se calificaron y con qué nota. Una fila por proveedor con
 * su ÚLTIMA calificación finalizada, la misma que cuenta en la calificación
 * global.
 */
export default function MiniReporteCalificaciones({
    titulo,
    filas,
    cargando,
    mostrarTipo = false,
}: {
    titulo: string;
    filas: FilaReporteCalificacion[];
    cargando: boolean;
    mostrarTipo?: boolean;
}) {
    const [busqueda, setBusqueda] = useState('');

    const filtradas = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return filas;
        return filas.filter(
            (f) => (f.proveedor ?? '').toLowerCase().includes(texto) || (f.ruc ?? '').includes(texto)
        );
    }, [filas, busqueda]);

    const promedio = filas.length
        ? Math.round((filas.reduce((suma, f) => suma + f.porcentaje, 0) / filas.length) * 10) / 10
        : null;

    return (
        <Card className="!p-0 overflow-hidden">
            <div className="flex flex-wrap items-end justify-between gap-3 px-5 pt-5 pb-3">
                <div>
                    <h2 className="font-display text-base font-semibold text-brand-900">{titulo}</h2>
                    <p className="text-xs text-brand-900/55 mt-0.5">
                        {filas.length === 1 ? '1 proveedor calificado' : `${filas.length} proveedores calificados`}
                        {promedio !== null && <> · promedio {promedio}%</>}
                        {' '}· se muestra la última calificación de cada uno
                    </p>
                </div>
                {filas.length > 0 && (
                    <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar proveedor o RUC..." />
                )}
            </div>

            {cargando ? (
                <div className="flex justify-center py-8">
                    <Spinner className="h-5 w-5" />
                </div>
            ) : filas.length === 0 ? (
                <p className="px-5 pb-6 text-sm text-brand-900/50">Todavía no se calificó a ningún proveedor.</p>
            ) : filtradas.length === 0 ? (
                <p className="px-5 pb-6 text-sm text-brand-900/50">Ningún proveedor coincide con la búsqueda.</p>
            ) : (
                <div className="max-h-96 overflow-auto border-t border-brand-900/8">
                    <table className="w-full text-sm">
                        <thead className="sticky top-0 bg-brand-200/30 text-left text-brand-900/70 backdrop-blur">
                            <tr>
                                <th className="px-4 py-2.5 font-medium">Proveedor</th>
                                {mostrarTipo && <th className="hidden md:table-cell px-4 py-2.5 font-medium">Tipo</th>}
                                <th className="hidden sm:table-cell px-4 py-2.5 font-medium">Fecha</th>
                                <th className="hidden lg:table-cell px-4 py-2.5 font-medium">Calificó</th>
                                <th className="hidden sm:table-cell px-4 py-2.5 font-medium text-center">Veces</th>
                                <th className="px-4 py-2.5 font-medium text-right">Puntaje</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-900/8">
                            {filtradas.map((f) => (
                                <tr key={f.id_proveedor}>
                                    <td className="px-4 py-2.5">
                                        <p className="font-medium text-brand-900">{f.proveedor ?? 'Proveedor'}</p>
                                        <p className="text-[12px] text-brand-900/50">
                                            {f.ruc ?? 'Sin RUC'}
                                            <span className="sm:hidden"> · {formatearFecha(f.fecha)}</span>
                                        </p>
                                    </td>
                                    {mostrarTipo && (
                                        <td className="hidden md:table-cell px-4 py-2.5 text-brand-900/70">{f.tipo_auditoria ?? '—'}</td>
                                    )}
                                    <td className="hidden sm:table-cell px-4 py-2.5 whitespace-nowrap text-brand-900/70">
                                        {formatearFecha(f.fecha)}
                                    </td>
                                    <td className="hidden lg:table-cell px-4 py-2.5 text-brand-900/70">{f.auditor ?? '—'}</td>
                                    <td className="hidden sm:table-cell px-4 py-2.5 text-center text-brand-900/70">{f.cantidad}</td>
                                    <td className={`px-4 py-2.5 text-right font-semibold ${colorPorcentaje(f.porcentaje)}`}>
                                        {f.porcentaje}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </Card>
    );
}
