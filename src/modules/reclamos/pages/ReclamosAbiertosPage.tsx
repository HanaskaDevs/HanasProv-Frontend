import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as reclamosApi from '../api/reclamosApi';
import { useAuth } from '../../auth/hooks/useAuth';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import FilaReclamo from '../components/FilaReclamo';
import ModalCrearReclamo from '../components/ModalCrearReclamo';
import ModalDetalleReclamo from '../components/ModalDetalleReclamo';

export default function ReclamosAbiertosPage() {
    const { esProveedor } = useAuth();
    const [busqueda, setBusqueda] = useState('');
    const [modalCrearAbierto, setModalCrearAbierto] = useState(false);
    const [idReclamoAbierto, setIdReclamoAbierto] = useState<number | null>(null);

    const { data, isLoading } = useQuery({
        queryKey: ['reclamos-abiertos', esProveedor],
        queryFn: () => (esProveedor ? reclamosApi.listarMisReclamosAbiertos() : reclamosApi.listarReclamosAbiertos()),
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
        <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                    <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-wine">
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                        Reclamos abiertos
                    </h1>
                    <p className="text-brand-900/50 text-xs mt-0.5">
                        {esProveedor ? 'Reclamos activos sobre tu empresa.' : 'Reclamos activos con proveedores.'}
                    </p>
                </div>
                {!esProveedor && (
                    <Button onClick={() => setModalCrearAbierto(true)}>+ Nuevo reclamo</Button>
                )}
            </div>

            <BarraBusqueda valor={busqueda} onCambiar={setBusqueda} placeholder="Buscar por asunto o proveedor..." />

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : filtrados.length === 0 ? (
                <Card>
                    <p className="text-sm text-brand-900/60 text-center py-10">
                        {(data ?? []).length === 0 ? 'No hay reclamos abiertos.' : 'Sin resultados para tu búsqueda.'}
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

            {modalCrearAbierto && <ModalCrearReclamo onClose={() => setModalCrearAbierto(false)} />}

            {idReclamoAbierto !== null && (
                <ModalDetalleReclamo idReclamo={idReclamoAbierto} onClose={() => setIdReclamoAbierto(null)} />
            )}
        </div>
    );
}