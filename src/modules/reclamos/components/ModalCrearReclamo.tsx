import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as reclamosApi from '../api/reclamosApi';
import type { ContactoProveedor, ImpactoProveedor, ProveedorBusqueda, TipoReclamo } from '../types';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';

const OPCIONES_TIPO_RECLAMO: TipoReclamo[] = ['Calidad', 'Salubridad', 'Inocuidad'];
const OPCIONES_IMPACTO_PROVEEDOR: ImpactoProveedor[] = ['Alto', 'Medio', 'Bajo'];

export default function ModalCrearReclamo({ onClose }: { onClose: () => void }) {
    const queryClient = useQueryClient();
    const [paso, setPaso] = useState<1 | 2>(1);

    // Modal armado a mano (sin el componente Modal compartido) y con un
    // paso interno propio -> atrás vuelve del paso 2 al 1, y del 1 cierra
    // el modal, en vez de saltar directo a la página de atrás.
    useBackHandler(paso === 2 ? () => setPaso(1) : onClose);
    const [termino, setTermino] = useState('');
    const [resultados, setResultados] = useState<ProveedorBusqueda[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState<ProveedorBusqueda | null>(null);
    const [contactosSeleccionados, setContactosSeleccionados] = useState<ContactoProveedor[]>([]);
    const [asunto, setAsunto] = useState('');
    const [tipoReclamo, setTipoReclamo] = useState<TipoReclamo | ''>('');
    const [impactoProveedor, setImpactoProveedor] = useState<ImpactoProveedor | ''>('');
    const [mensaje, setMensaje] = useState('');
    const [imagenes, setImagenes] = useState<File[]>([]);
    const [error, setError] = useState<string | null>(null);

    let debounceTimer: ReturnType<typeof setTimeout>;

    function manejarBusqueda(valor: string) {
        setTermino(valor);
        clearTimeout(debounceTimer);

        if (valor.trim().length < 2) {
            setResultados([]);
            return;
        }

        debounceTimer = setTimeout(async () => {
            setBuscando(true);
            try {
                const data = await reclamosApi.buscarProveedores(valor.trim());
                setResultados(data);
            } finally {
                setBuscando(false);
            }
        }, 350);
    }

    function seleccionarProveedor(p: ProveedorBusqueda) {
        setProveedorSeleccionado(p);
        setContactosSeleccionados([]);
        setPaso(2);
    }

    function alternarContacto(contacto: ContactoProveedor) {
        setContactosSeleccionados((prev) => {
            const existe = prev.some((c) => c.email === contacto.email);
            return existe ? prev.filter((c) => c.email !== contacto.email) : [...prev, contacto];
        });
    }

    function manejarImagenes(archivos: FileList | null) {
        if (!archivos) return;
        const nuevas = Array.from(archivos).slice(0, 5 - imagenes.length);
        setImagenes((prev) => [...prev, ...nuevas]);
    }

    const crear = useMutation({
        mutationFn: () =>
            reclamosApi.crearReclamo({
                id_proveedor: proveedorSeleccionado!.id_proveedor,
                asunto,
                tipo_reclamo: tipoReclamo as TipoReclamo,
                impacto_proveedor: impactoProveedor as ImpactoProveedor,
                mensaje,
                destinatarios: contactosSeleccionados.map((c) => ({
                    rol_contacto: c.rol_contacto,
                    nombre_contacto: c.nombre_contacto ?? undefined,
                    email: c.email,
                })),
                imagenes,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reclamos-abiertos'] });
            onClose();
        },
        onError: () => setError('No se pudo crear el reclamo. Verifica los datos e intenta de nuevo.'),
    });

    function handleSubmit() {
        setError(null);

        if (!asunto.trim() || !mensaje.trim()) {
            setError('El asunto y la descripción son obligatorios.');
            return;
        }
        if (!tipoReclamo || !impactoProveedor) {
            setError('Selecciona el tipo de reclamo y el impacto en el proveedor.');
            return;
        }
        if (contactosSeleccionados.length === 0) {
            setError('Selecciona al menos un contacto destinatario.');
            return;
        }

        crear.mutate();
    }

    return (
        <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">Nuevo reclamo</h2>
                <p className="text-sm text-brand-900/60 mb-4">
                    {paso === 1 ? 'Busca el proveedor por razón social o RUC.' : proveedorSeleccionado?.razon_social}
                </p>

                {paso === 1 ? (
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={termino}
                            onChange={(e) => manejarBusqueda(e.target.value)}
                            placeholder="Buscar por razón social o RUC..."
                            className="w-full rounded-md border border-brand-900/15 px-3 py-2.5 text-sm"
                            autoFocus
                        />

                        {buscando && (
                            <div className="flex justify-center py-4">
                                <Spinner className="h-5 w-5" />
                            </div>
                        )}

                        {!buscando && resultados.length > 0 && (
                            <div className="border border-brand-900/10 rounded-lg divide-y divide-brand-900/6 max-h-72 overflow-y-auto">
                                {resultados.map((p) => (
                                    <button
                                        key={p.id_proveedor}
                                        onClick={() => seleccionarProveedor(p)}
                                        className="w-full text-left px-3.5 py-2.5 hover:bg-brand-200/10 transition-colors"
                                    >
                                        <p className="text-sm font-medium text-brand-900">{p.razon_social}</p>
                                        <p className="text-xs text-brand-900/50">{p.ruc}</p>
                                    </button>
                                ))}
                            </div>
                        )}

                        {!buscando && termino.trim().length >= 2 && resultados.length === 0 && (
                            <p className="text-sm text-brand-900/50 text-center py-4">Sin resultados.</p>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        <button
                            onClick={() => setPaso(1)}
                            className="text-xs font-medium text-brand-700 flex items-center gap-1"
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="15 18 9 12 15 6" />
                            </svg>
                            Cambiar proveedor
                        </button>

                        <div>
                            <label className="text-sm font-medium text-brand-900 block mb-1.5">Asunto</label>
                            <input
                                type="text"
                                value={asunto}
                                onChange={(e) => setAsunto(e.target.value)}
                                placeholder="Ej. Producto dañado en el pedido CP-PD-0000021369"
                                className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-sm font-medium text-brand-900 block mb-1.5">Tipo de reclamo</label>
                                <select
                                    value={tipoReclamo}
                                    onChange={(e) => setTipoReclamo(e.target.value as TipoReclamo)}
                                    className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900"
                                >
                                    <option value="">Selecciona...</option>
                                    {OPCIONES_TIPO_RECLAMO.map((opcion) => (
                                        <option key={opcion} value={opcion}>
                                            {opcion}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-brand-900 block mb-1.5">Impacto en proveedor</label>
                                <select
                                    value={impactoProveedor}
                                    onChange={(e) => setImpactoProveedor(e.target.value as ImpactoProveedor)}
                                    className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900"
                                >
                                    <option value="">Selecciona...</option>
                                    {OPCIONES_IMPACTO_PROVEEDOR.map((opcion) => (
                                        <option key={opcion} value={opcion}>
                                            {opcion}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium text-brand-900 block mb-1.5">Enviar a</label>
                            {proveedorSeleccionado!.contactos.length === 0 ? (
                                <p className="text-xs text-brand-900/50">Este proveedor no tiene contactos con correo registrado.</p>
                            ) : (
                                <div className="border border-brand-900/15 rounded-md divide-y divide-brand-900/8">
                                    {proveedorSeleccionado!.contactos.map((c) => (
                                        <label key={c.email} className="flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={contactosSeleccionados.some((s) => s.email === c.email)}
                                                onChange={() => alternarContacto(c)}
                                                className="h-4 w-4 accent-brand-700"
                                            />
                                            <div className="min-w-0">
                                                <span className="font-medium text-brand-900">{c.rol_contacto}</span>
                                                <span className="text-brand-900/50"> · {c.email}</span>
                                                {c.nombre_contacto && (
                                                    <span className="text-brand-900/40 text-xs block">{c.nombre_contacto}</span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-medium text-brand-900 block mb-1.5">Descripción del reclamo</label>
                            <textarea
                                value={mensaje}
                                onChange={(e) => setMensaje(e.target.value)}
                                rows={4}
                                placeholder="Describe el problema con el pedido o producto..."
                                className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-brand-900 block mb-1.5">
                                Imágenes de respaldo ({imagenes.length}/5)
                            </label>
                            <div className="flex items-center gap-2 flex-wrap">
                                {imagenes.map((img, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-brand-900/5 rounded-md px-2 py-1 text-xs text-brand-900/70">
                                        <span className="truncate max-w-[100px]">{img.name}</span>
                                        <button onClick={() => setImagenes((prev) => prev.filter((_, idx) => idx !== i))} className="text-brand-wine font-medium">×</button>
                                    </div>
                                ))}
                                {imagenes.length < 5 && (
                                    <label className="text-xs font-medium text-brand-700 border border-dashed border-brand-700/30 rounded-md px-2.5 py-1.5 cursor-pointer hover:bg-brand-700/5">
                                        + Agregar imagen
                                        <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => manejarImagenes(e.target.files)} />
                                    </label>
                                )}
                            </div>
                        </div>

                        {error && <p className="text-sm text-brand-wine">{error}</p>}

                        <div className="flex justify-end gap-2 pt-2">
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Cancelar
                            </Button>
                            <Button onClick={handleSubmit} isLoading={crear.isPending}>
                                Enviar reclamo
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}