import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as pedidosInternosApi from '../api/pedidosInternosApi';
import type { LineaPedidoInterno, LineaRecepcionInput, PedidoInterno } from '../types';
import Button from '../../../shared/components/Button';

interface EstadoLinea {
    incluida: boolean;
    cantidad_recibida: string;
    recepcion_completa: boolean;
    observacion: string;
    imagenes: File[];
}

export default function ModalRegistrarRecepcion({
    pedido,
    onClose,
}: {
    pedido: PedidoInterno;
    onClose: () => void;
}) {
    const queryClient = useQueryClient();
    const hoy = new Date().toISOString().slice(0, 10);
    const [fechaRecepcion, setFechaRecepcion] = useState(hoy);
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

    const lineasPendientes = pedido.lineas.filter(
        (l) => Number(l.cantidad_recibida) < Number(l.cantidad_pedida)
    );

    const [estados, setEstados] = useState<Record<number, EstadoLinea>>(() => {
        const inicial: Record<number, EstadoLinea> = {};
        for (const l of lineasPendientes) {
            inicial[l.id_detalle_pedido_compra] = {
                incluida: false,
                cantidad_recibida: '',
                recepcion_completa: false,
                observacion: '',
                imagenes: [],
            };
        }
        return inicial;
    });

    const registrar = useMutation({
        mutationFn: (lineas: LineaRecepcionInput[]) =>
            pedidosInternosApi.registrarRecepcion(pedido.id_pedido_compra, fechaRecepcion, lineas),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pedidos-internos'] });
            onClose();
        },
        onError: () => setErrorGeneral('No se pudo registrar la recepción. Verifica los datos e intenta de nuevo.'),
    });

    function actualizarLinea(id: number, cambios: Partial<EstadoLinea>) {
        setEstados((prev) => ({ ...prev, [id]: { ...prev[id], ...cambios } }));
    }

    function manejarImagenes(id: number, archivos: FileList | null) {
        if (!archivos) return;
        const actuales = estados[id].imagenes;
        const nuevas = Array.from(archivos).slice(0, 3 - actuales.length);
        actualizarLinea(id, { imagenes: [...actuales, ...nuevas] });
    }

    function quitarImagen(id: number, index: number) {
        const actuales = estados[id].imagenes;
        actualizarLinea(id, { imagenes: actuales.filter((_, i) => i !== index) });
    }

    function handleSubmit() {
        setErrorGeneral(null);

        const lineasSeleccionadas = Object.entries(estados).filter(([, e]) => e.incluida);

        if (lineasSeleccionadas.length === 0) {
            setErrorGeneral('Selecciona al menos una línea para registrar recepción.');
            return;
        }

        for (const [, e] of lineasSeleccionadas) {
            if (!e.cantidad_recibida || Number(e.cantidad_recibida) < 0) {
                setErrorGeneral('Todas las líneas seleccionadas necesitan una cantidad recibida válida.');
                return;
            }
        }

        const payload: LineaRecepcionInput[] = lineasSeleccionadas.map(([id, e]) => ({
            id_detalle_pedido_compra: Number(id),
            cantidad_recibida: Number(e.cantidad_recibida),
            recepcion_completa: e.recepcion_completa,
            observacion: e.observacion || undefined,
            imagenes: e.imagenes,
        }));

        registrar.mutate(payload);
    }

    return (
        <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">Registrar recepción</h2>
                <p className="text-sm text-brand-900/60 mb-4">
                    {pedido.nro_pedido} · {pedido.proveedor.razon_social}
                </p>

                <div className="flex flex-col gap-1 mb-4">
                    <label className="text-sm font-medium text-brand-900">Fecha de recepción</label>
                    <input
                        type="date"
                        value={fechaRecepcion}
                        onChange={(e) => setFechaRecepcion(e.target.value)}
                        className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900 w-fit"
                    />
                </div>

                {lineasPendientes.length === 0 ? (
                    <p className="text-sm text-brand-900/60 py-6 text-center">
                        Todas las líneas de este pedido ya fueron recibidas por completo.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {lineasPendientes.map((linea: LineaPedidoInterno) => {
                            const id = linea.id_detalle_pedido_compra;
                            const estado = estados[id];
                            const pendiente = Number(linea.cantidad_pedida) - Number(linea.cantidad_recibida);

                            return (
                                <div
                                    key={id}
                                    className={`rounded-lg border px-3 py-3 transition-colors ${
                                        estado.incluida ? 'border-brand-700/30 bg-brand-700/[0.03]' : 'border-brand-900/10'
                                    }`}
                                >
                                    <label className="flex items-start gap-2.5 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={estado.incluida}
                                            onChange={(e) => actualizarLinea(id, { incluida: e.target.checked })}
                                            className="mt-0.5 h-4 w-4 accent-brand-700"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-brand-900">{linea.descripcion ?? linea.codigo_producto}</p>
                                            <p className="text-xs text-brand-900/50">
                                                Pedido: {linea.cantidad_pedida} · Recibido: {linea.cantidad_recibida} ·{' '}
                                                <span className="font-medium text-brand-900/70">Pendiente: {pendiente}</span>
                                            </p>
                                        </div>
                                    </label>

                                    {estado.incluida && (
                                        <div className="mt-3 pl-6 space-y-3">
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-xs font-medium text-brand-900">Cantidad recibida</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={estado.cantidad_recibida}
                                                        onChange={(e) => actualizarLinea(id, { cantidad_recibida: e.target.value })}
                                                        className="rounded-md border border-brand-900/15 px-2.5 py-1.5 text-sm w-28"
                                                    />
                                                </div>

                                                <label className="flex items-center gap-2 text-sm text-brand-900/80 mt-4 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={estado.recepcion_completa}
                                                        onChange={(e) => actualizarLinea(id, { recepcion_completa: e.target.checked })}
                                                        className="h-4 w-4 accent-brand-700"
                                                    />
                                                    Recepción completa
                                                </label>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs font-medium text-brand-900">Observación</label>
                                                <textarea
                                                    value={estado.observacion}
                                                    onChange={(e) => actualizarLinea(id, { observacion: e.target.value })}
                                                    placeholder="Ej. Proveedor no entrega producto completo / Producto dañado"
                                                    rows={2}
                                                    className="rounded-md border border-brand-900/15 px-2.5 py-1.5 text-sm resize-none"
                                                />
                                            </div>

                                            <div className="flex flex-col gap-1.5">
                                                <label className="text-xs font-medium text-brand-900">
                                                    Imágenes de respaldo ({estado.imagenes.length}/3)
                                                </label>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {estado.imagenes.map((img, i) => (
                                                        <div key={i} className="flex items-center gap-1 bg-brand-900/5 rounded-md px-2 py-1 text-xs text-brand-900/70">
                                                            <span className="truncate max-w-[100px]">{img.name}</span>
                                                            <button onClick={() => quitarImagen(id, i)} className="text-brand-wine font-medium">×</button>
                                                        </div>
                                                    ))}
                                                    {estado.imagenes.length < 3 && (
                                                        <label className="text-xs font-medium text-brand-700 border border-dashed border-brand-700/30 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-brand-700/5">
                                                            + Agregar imagen
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                multiple
                                                                className="hidden"
                                                                onChange={(e) => manejarImagenes(id, e.target.files)}
                                                            />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {errorGeneral && <p className="text-sm text-brand-wine mt-4">{errorGeneral}</p>}

                <div className="flex justify-end gap-2 pt-5">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} isLoading={registrar.isPending} disabled={lineasPendientes.length === 0}>
                        Guardar recepción
                    </Button>
                </div>
            </div>
        </div>
    );
}