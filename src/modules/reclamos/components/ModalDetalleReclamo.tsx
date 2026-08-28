import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as reclamosApi from '../api/reclamosApi';
import { useAuth } from '../../auth/hooks/useAuth';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';

function formatearFechaHora(fecha: string): string {
    const d = new Date(fecha);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short' }) + ' · ' +
        d.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
}

export default function ModalDetalleReclamo({
    idReclamo,
    onClose,
}: {
    idReclamo: number;
    onClose: () => void;
}) {
    const { usuario, esProveedor } = useAuth();
    const queryClient = useQueryClient();
    const [texto, setTexto] = useState('');
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [confirmandoCierre, setConfirmandoCierre] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Modal armado a mano (sin el componente Modal compartido). Si está
    // abierta la confirmación inline de "¿marcar como resuelto?", atrás
    // la cancela primero; si no, cierra el modal entero.
    useBackHandler(confirmandoCierre ? () => setConfirmandoCierre(false) : onClose);

    const queryKeyDetalle = ['reclamo-detalle', idReclamo, esProveedor];

    const { data: reclamo, isLoading } = useQuery({
        queryKey: queryKeyDetalle,
        queryFn: () => (esProveedor ? reclamosApi.obtenerMiReclamo(idReclamo) : reclamosApi.obtenerReclamo(idReclamo)),
    });

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
    }, [reclamo?.mensajes?.length]);

    const responder = useMutation({
        mutationFn: () =>
            esProveedor
                ? reclamosApi.responderMiReclamo(idReclamo, texto, imagenes)
                : reclamosApi.responderReclamo(idReclamo, texto, imagenes),
        onSuccess: () => {
            setTexto('');
            setImagenes([]);
            queryClient.invalidateQueries({ queryKey: queryKeyDetalle });
        },
    });

    const cerrar = useMutation({
        mutationFn: () => reclamosApi.cerrarReclamo(idReclamo),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeyDetalle });
            queryClient.invalidateQueries({ queryKey: ['reclamos-abiertos'] });
            queryClient.invalidateQueries({ queryKey: ['reclamos-cerrados'] });
            onClose();
        },
    });

    function manejarImagenes(archivos: FileList | null) {
        if (!archivos) return;
        const nuevas = Array.from(archivos).slice(0, 5 - imagenes.length);
        setImagenes((prev) => [...prev, ...nuevas]);
    }

    const esCreador = !esProveedor && reclamo?.creado_por.id_usuario === usuario?.id;
    const cerrado = reclamo?.estado === 'Cerrado';

    return (
        <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-xl max-h-[88vh] flex flex-col">
                {isLoading || !reclamo ? (
                    <div className="flex justify-center py-16">
                        <Spinner className="h-6 w-6" />
                    </div>
                ) : (
                    <>
                        <div className="px-5 py-4 border-b border-brand-900/8 flex items-start justify-between gap-3 shrink-0">
                            <div className="min-w-0">
                                <h2 className="font-display text-base font-semibold text-brand-900 truncate">{reclamo.asunto}</h2>
                                <p className="text-xs text-brand-900/50 mt-0.5">{reclamo.proveedor.razon_social}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {cerrado && (
                                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
                                        Cerrado
                                    </span>
                                )}
                                <button onClick={onClose} className="text-brand-900/40 hover:text-brand-900 h-7 w-7 rounded-full flex items-center justify-center hover:bg-brand-900/5">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-brand-200/[0.04]">
                            {(reclamo.mensajes ?? []).map((m) => {
                                const esMio = esProveedor ? m.autor.tipo_usuario === 'Proveedor' : m.autor.tipo_usuario === 'Interno';
                                return (
                                    <div key={m.id_reclamo_mensaje} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${esMio ? 'bg-brand-900 text-white' : 'bg-white border border-brand-900/8 text-brand-900'
                                            }`}>
                                            <p className={`text-[12px] font-medium mb-1 ${esMio ? 'text-white/60' : 'text-brand-900/40'}`}>
                                                {m.autor.nombre_completo} · {m.autor.tipo_usuario === 'Proveedor' ? 'Proveedor' : 'Interno'}
                                            </p>
                                            <p className="text-sm whitespace-pre-wrap">{m.mensaje}</p>
                                            {m.imagenes.length > 0 && (
                                                <div className="flex gap-1.5 flex-wrap mt-2">
                                                    {m.imagenes.map((img) => (
                                                        <button
                                                            key={img.id_reclamo_mensaje_imagen}
                                                            onClick={() =>
                                                                esProveedor
                                                                    ? reclamosApi.verImagenMiReclamo(img.id_reclamo_mensaje_imagen)
                                                                    : reclamosApi.verImagenReclamo(img.id_reclamo_mensaje_imagen)
                                                            }
                                                            className={`text-[12px] px-2 py-1 rounded-md flex items-center gap-1 hover:opacity-80 transition-opacity ${
                                                                esMio ? 'bg-white/10' : 'bg-brand-900/5'
                                                            }`}
                                                        >
                                                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                                                            </svg>
                                                            {img.nombre_original}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            <p className={`text-[11px] mt-1.5 ${esMio ? 'text-white/40' : 'text-brand-900/30'}`}>
                                                {formatearFechaHora(m.fecha_creacion)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {!cerrado && (
                            <div className="px-5 py-3.5 border-t border-brand-900/8 shrink-0 space-y-2">
                                {imagenes.length > 0 && (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                        {imagenes.map((img, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-brand-900/5 rounded-md px-2 py-1 text-xs text-brand-900/70">
                                                <span className="truncate max-w-[90px]">{img.name}</span>
                                                <button onClick={() => setImagenes((prev) => prev.filter((_, idx) => idx !== i))} className="text-brand-wine font-medium">×</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-end gap-2">
                                    <label className="h-9 w-9 shrink-0 rounded-md border border-brand-900/15 flex items-center justify-center text-brand-900/50 hover:bg-brand-900/5 cursor-pointer">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" />
                                        </svg>
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => manejarImagenes(e.target.files)} disabled={imagenes.length >= 5} />
                                    </label>
                                    <textarea
                                        value={texto}
                                        onChange={(e) => setTexto(e.target.value)}
                                        placeholder="Escribe una respuesta..."
                                        rows={1}
                                        className="flex-1 rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
                                    />
                                    <Button
                                        className="shrink-0"
                                        onClick={() => responder.mutate()}
                                        isLoading={responder.isPending}
                                        disabled={!texto.trim()}
                                    >
                                        Enviar
                                    </Button>
                                </div>

                                {esCreador && (
                                    confirmandoCierre ? (
                                        <div className="flex items-center gap-2 pt-1">
                                            <span className="text-xs text-brand-900/60">¿Marcar como resuelto?</span>
                                            <button
                                                onClick={() => cerrar.mutate()}
                                                disabled={cerrar.isPending}
                                                className="text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-700 text-white"
                                            >
                                                Confirmar
                                            </button>
                                            <button
                                                onClick={() => setConfirmandoCierre(false)}
                                                className="text-xs font-medium px-2 py-1 text-brand-900/40"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setConfirmandoCierre(true)}
                                            className="text-xs font-medium text-emerald-700 hover:underline pt-1"
                                        >
                                            Cerrar reclamo (resuelto)
                                        </button>
                                    )
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}