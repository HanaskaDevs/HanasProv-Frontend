import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reclamosApi from '../api/reclamosApi';
import { useAuth } from '../../auth/hooks/useAuth';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import FilaReclamo from '../components/FilaReclamo';
import ModalDetalleReclamo from '../components/ModalDetalleReclamo';

export default function ReclamosCerradosPage() {
    const { esProveedor } = useAuth();
    const [busqueda, setBusqueda] = useState('');
    const [idReclamoAbierto, setIdReclamoAbierto] = useState<number | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['reclamos-cerrados', esProveedor],
        queryFn: () => (esProveedor ? reclamosApi.listarMisReclamosCerrados() : reclamosApi.listarReclamosCerrados()),
    });

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        return (data ?? []).filter(
            (r) =>
                !texto ||
                r.asunto.toLowerCase().includes(texto) ||
                r.proveedor.razon_social.toLowerCase().includes(texto)
        );
    }, [data, busqueda]);

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            <div>
                <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-700">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                    Reclamos cerrados
                </h1>
                <p className="text-brand-900/50 text-xs mt-0.5">Historial de reclamos ya resueltos.</p>
            </div>

            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por asunto o proveedor..." />

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : filtrados.length === 0 ? (
                <Card>
                    <p className="text-sm text-brand-900/60 text-center py-10">
                        {(data ?? []).length === 0 ? 'No hay reclamos cerrados todavía.' : 'Sin resultados para tu búsqueda.'}
                    </p>
                </Card>
            ) : (
                <Card className="p-0 overflow-hidden">
                    <div className="divide-y divide-brand-900/6">
                        {filtrados.map((reclamo) => (
                            <FilaReclamo
                                key={reclamo.id_reclamo}
                                reclamo={reclamo}
                                onAbrir={() => setIdReclamoAbierto(reclamo.id_reclamo)}
                            />
                        ))}
                    </div>
                </Card>
            )}

            {idReclamoAbierto !== null && (
                <ModalDetalleReclamo idReclamo={idReclamoAbierto} onClose={() => setIdReclamoAbierto(null)} />
            )}
        </div>
    );
}