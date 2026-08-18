import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../auth/hooks/useAuth';
import RoleRoute from '../../../routes/RoleRoute';
import * as recepcionesApi from '../api/recepcionesApi';
import type { CalificacionRecepcionDetalle, ProveedorParaRecepcion } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import Modal from '../../../shared/components/Modal';
import Avatar from '../../../shared/components/Avatar';
import AroProgreso from '../../../shared/components/AroProgreso';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import FilaParametroRecepcion from '../components/FilaParametroRecepcion';

function formatearFecha(iso: string | null): string {
    if (!iso) return '—';
    return new Date(`${iso}T00:00:00`).toLocaleDateString('es-EC', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}

/** Paso 1: a quién calificar. Los que tocan hoy vienen primero del backend. */
function SeleccionProveedor({
    proveedores,
    cargando,
    iniciando,
    onElegir,
}: {
    proveedores: ProveedorParaRecepcion[];
    cargando: boolean;
    iniciando: boolean;
    onElegir: (p: ProveedorParaRecepcion) => void;
}) {
    const [busqueda, setBusqueda] = useState('');

    const filtrados = useMemo(() => {
        const texto = busqueda.trim().toLowerCase();
        if (!texto) return proveedores;
        return proveedores.filter(
            (p) =>
                p.razon_social.toLowerCase().includes(texto) ||
                (p.nombre_comercial ?? '').toLowerCase().includes(texto) ||
                (p.ruc ?? '').toLowerCase().includes(texto)
        );
    }, [proveedores, busqueda]);

    const tocanHoy = proveedores.filter((p) => p.le_toca_hoy).length;

    if (cargando) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div
                className={`rounded-lg border px-4 py-3 ${
                    tocanHoy > 0 ? 'border-brand-700/25 bg-brand-700/[0.04]' : 'border-brand-900/10 bg-white'
                }`}
            >
                <p className="text-sm text-brand-900">
                    {tocanHoy === 0 ? (
                        <>Hoy no le toca la auditoría de recepción a ningún proveedor. Podés calificar a cualquiera igual.</>
                    ) : (
                        <>
                            Hoy le toca la auditoría de recepción a{' '}
                            <span className="font-semibold">
                                {tocanHoy} proveedor{tocanHoy === 1 ? '' : 'es'}
                            </span>
                            . Aparecen primeros en la lista.
                        </>
                    )}
                </p>
            </div>

            <div className="max-w-lg">
                <BarraBusqueda
                    valor={busqueda}
                    onCambiar={setBusqueda}
                    placeholder="Buscar por razón social, nombre comercial o RUC"
                    className="!py-1.5 !text-xs"
                />
            </div>

            <Card className="!p-0 overflow-hidden">
                {filtrados.length === 0 ? (
                    <p className="text-center text-sm text-brand-900/50 py-12">
                        No hay proveedores que coincidan con la búsqueda.
                    </p>
                ) : (
                    <div className="divide-y divide-brand-900/8">
                        {filtrados.map((p) => (
                            <div
                                key={p.id_proveedor}
                                className={`flex items-center gap-3 px-4 py-3 ${p.le_toca_hoy ? 'bg-brand-700/[0.03]' : ''}`}
                            >
                                <Avatar nombre={p.razon_social} className="h-9 w-9" />

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-brand-900 truncate">{p.razon_social}</p>
                                        {p.le_toca_hoy && <Badge tone="info">Le toca hoy</Badge>}
                                        {!p.puede_calificar && <Badge tone="neutral">Tope del año</Badge>}
                                    </div>
                                    <p className="text-[12px] text-brand-900/50 mt-0.5">
                                        {p.ruc ?? 'Sin RUC'} · agendada {formatearFecha(p.fecha_programada)} ·{' '}
                                        {p.calificaciones_del_anio} de 2 este año
                                    </p>
                                </div>

                                {p.ultima_calificacion?.porcentaje_obtenido != null && (
                                    <div className="hidden sm:flex flex-col items-end shrink-0 mr-1">
                                        <span className="text-[11px] text-brand-900/40">Última</span>
                                        <span className="text-sm font-semibold text-brand-900">
                                            {p.ultima_calificacion.porcentaje_obtenido}%
                                        </span>
                                    </div>
                                )}

                                <Button
                                    variant={p.le_toca_hoy ? 'primary' : 'ghost'}
                                    className={`text-xs px-3 py-1.5 shrink-0 ${
                                        !p.le_toca_hoy ? '!bg-brand-200/40 hover:!bg-brand-200/60' : ''
                                    }`}
                                    disabled={!p.puede_calificar || iniciando}
                                    onClick={() => onElegir(p)}
                                >
                                    Calificar
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </Card>
        </div>
    );
}

/** Paso 2: el formulario FGH04.15.05-1 propiamente dicho. */
function Formulario({
    detalle,
    guardandoId,
    finalizando,
    errorFinalizar,
    onVolver,
    onResponder,
    onGuardarObservacion,
    onGuardarCabecera,
    onFinalizar,
}: {
    detalle: CalificacionRecepcionDetalle;
    guardandoId: number | null;
    finalizando: boolean;
    errorFinalizar: string | null;
    onVolver: () => void;
    onResponder: (idParametro: number, cumple: boolean) => void;
    onGuardarObservacion: (idParametro: number, observacion: string | null) => void;
    onGuardarCabecera: (payload: { fecha_recepcion?: string; contacto?: string }) => void;
    onFinalizar: () => void;
}) {
    const [confirmando, setConfirmando] = useState(false);
    const [contacto, setContacto] = useState(detalle.contacto ?? '');
    const soloLectura = detalle.finalizada;
    const { resumen } = detalle;
    const completo = resumen.respondidos === resumen.total_parametros;

    return (
        <div className="space-y-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                    <button onClick={onVolver} className="text-xs text-brand-700 font-medium mb-1">
                        ‹ Volver a la lista
                    </button>
                    <h2 className="font-display text-lg font-semibold text-brand-900">
                        {detalle.proveedor.razon_social}
                    </h2>
                    <p className="text-xs text-brand-900/55">
                        {detalle.proveedor.ruc ?? 'Sin RUC'}
                        {detalle.auditor && <> · Auditor: {detalle.auditor}</>}
                    </p>
                </div>
                {soloLectura && <Badge tone="success">Finalizada</Badge>}
            </div>

            {/* Cabecera del formulario: fecha de la recepción evaluada y con quién se atendió. */}
            <Card className="!p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-brand-900/60 mb-1">Fecha de recepción</label>
                        <input
                            type="date"
                            disabled={soloLectura}
                            value={detalle.fecha_recepcion ?? ''}
                            onChange={(e) => onGuardarCabecera({ fecha_recepcion: e.target.value })}
                            className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 disabled:bg-brand-900/5"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-brand-900/60 mb-1">Contacto</label>
                        <input
                            type="text"
                            disabled={soloLectura}
                            value={contacto}
                            onChange={(e) => setContacto(e.target.value)}
                            onBlur={() => onGuardarCabecera({ contacto })}
                            placeholder="Quién entregó / atendió la recepción"
                            className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-700 disabled:bg-brand-900/5"
                        />
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
                <Card className="!p-0 overflow-hidden">
                    <div className="px-4 sm:px-5 py-3 border-b border-brand-900/8 bg-brand-900/[0.02]">
                        <p className="text-xs font-medium text-brand-900/60">
                            Parámetros para Evaluación de Calidad, Ambiente y SSO
                        </p>
                    </div>
                    <div className="divide-y divide-brand-900/8">
                        {detalle.parametros.map((p) => (
                            <FilaParametroRecepcion
                                key={p.id_recepcion_parametro}
                                parametro={p}
                                soloLectura={soloLectura}
                                guardando={guardandoId === p.id_recepcion_parametro}
                                onResponder={(cumple) => onResponder(p.id_recepcion_parametro, cumple)}
                                onGuardarObservacion={(obs) => onGuardarObservacion(p.id_recepcion_parametro, obs)}
                            />
                        ))}
                    </div>
                </Card>

                {/* Resumen pegado arriba mientras se hace scroll por los 13 ítems. */}
                <div className="lg:sticky lg:top-4 space-y-3">
                    <div className="rounded-xl border border-brand-900/10 bg-white shadow-sm p-4 space-y-3">
                        <h3 className="font-display text-sm font-semibold text-brand-900">Resumen</h3>

                        <div className="flex items-center gap-3">
                            <AroProgreso porcentaje={Math.round(resumen.porcentaje_obtenido)} />
                            <div className="min-w-0">
                                <p className="text-sm font-semibold text-brand-900">
                                    {resumen.puntaje_obtenido} / {resumen.puntaje_total_posible}
                                </p>
                                <p className="text-[11px] text-brand-900/50">
                                    {resumen.respondidos} de {resumen.total_parametros} respondidos
                                </p>
                            </div>
                        </div>

                        {!soloLectura && (
                            <>
                                <Button
                                    className="w-full !text-xs"
                                    disabled={!completo}
                                    isLoading={finalizando}
                                    onClick={() => setConfirmando(true)}
                                >
                                    Finalizar calificación
                                </Button>
                                {!completo && (
                                    <p className="text-[11px] text-brand-900/40 text-center">
                                        Se habilita al responder los {resumen.total_parametros} parámetros
                                    </p>
                                )}
                            </>
                        )}

                        {errorFinalizar && <p className="text-[11px] text-brand-wine">{errorFinalizar}</p>}
                    </div>
                </div>
            </div>

            {confirmando && (
                <Modal onClose={() => !finalizando && setConfirmando(false)} title="Finalizar calificación">
                    <p className="text-sm text-brand-900">
                        La calificación quedará en{' '}
                        <span className="font-semibold">
                            {resumen.puntaje_obtenido} de {resumen.puntaje_total_posible} ({resumen.porcentaje_obtenido}%)
                        </span>
                        .
                    </p>
                    <p className="text-xs text-brand-900/50 mt-1">
                        Una vez finalizada no se puede modificar, solo consultar.
                    </p>
                    <div className="flex justify-end gap-2 mt-5">
                        <Button variant="ghost" onClick={() => setConfirmando(false)} disabled={finalizando}>
                            Cancelar
                        </Button>
                        <Button
                            isLoading={finalizando}
                            onClick={() => {
                                setConfirmando(false);
                                onFinalizar();
                            }}
                        >
                            Sí, finalizar
                        </Button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

function CalificacionRecepcionesContent() {
    const queryClient = useQueryClient();
    const [detalle, setDetalle] = useState<CalificacionRecepcionDetalle | null>(null);
    const [guardandoId, setGuardandoId] = useState<number | null>(null);
    const [errorFinalizar, setErrorFinalizar] = useState<string | null>(null);

    const { data: proveedores, isLoading } = useQuery({
        queryKey: ['recepciones-proveedores'],
        queryFn: recepcionesApi.listarProveedores,
    });

    const iniciar = useMutation({
        mutationFn: (p: ProveedorParaRecepcion) => recepcionesApi.iniciar({ id_proveedor: p.id_proveedor }),
        onSuccess: (data) => {
            setDetalle(data);
            setErrorFinalizar(null);
        },
    });

    const responder = useMutation({
        mutationFn: ({ idParametro, cumple }: { idParametro: number; cumple: boolean }) =>
            recepcionesApi.guardarRespuesta(detalle!.id_calificacion_recepcion, {
                id_recepcion_parametro: idParametro,
                cumple,
                // La observación se guarda por separado (al salir del campo)
                // -> acá se manda la que ya tenía para no borrarla.
                observacion:
                    detalle!.parametros.find((p) => p.id_recepcion_parametro === idParametro)?.observacion ?? null,
            }),
        onMutate: ({ idParametro }) => setGuardandoId(idParametro),
        onSuccess: (data) => setDetalle(data),
        onSettled: () => setGuardandoId(null),
    });

    const guardarObservacion = useMutation({
        mutationFn: ({ idParametro, observacion }: { idParametro: number; observacion: string | null }) => {
            const parametro = detalle!.parametros.find((p) => p.id_recepcion_parametro === idParametro);
            return recepcionesApi.guardarRespuesta(detalle!.id_calificacion_recepcion, {
                id_recepcion_parametro: idParametro,
                // Guardar una observación no debe cambiar la respuesta: si
                // todavía no eligió Sí/No, se asume que no cumple (es el
                // caso en que se está justificando un incumplimiento).
                cumple: parametro?.cumple ?? false,
                observacion,
            });
        },
        onSuccess: (data) => setDetalle(data),
    });

    const guardarCabecera = useMutation({
        mutationFn: (payload: { fecha_recepcion?: string; contacto?: string }) =>
            recepcionesApi.actualizarCabecera(detalle!.id_calificacion_recepcion, payload),
        onSuccess: (data) => setDetalle(data),
    });

    const finalizar = useMutation({
        mutationFn: () => recepcionesApi.finalizar(detalle!.id_calificacion_recepcion),
        onSuccess: (data) => {
            setDetalle(data);
            setErrorFinalizar(null);
            // La lista de proveedores cambia (sube el conteo del año y la
            // última calificación) -> se invalida para cuando vuelva.
            queryClient.invalidateQueries({ queryKey: ['recepciones-proveedores'] });
        },
        onError: (error) => {
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const errores = error.response.data?.errors;
                setErrorFinalizar(
                    errores ? (Object.values(errores)[0] as string[])?.[0] : 'No se pudo finalizar.'
                );
            } else {
                setErrorFinalizar('No se pudo finalizar la calificación.');
            }
        },
    });

    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            <div>
                <h1 className="font-display text-xl font-semibold text-brand-900">Calificación de Recepciones</h1>
                <p className="text-xs text-brand-900/55 mt-0.5">
                    Evaluación de Calidad del Proveedor en la recepción · FGH04.15.05-1 · 200 puntos posibles
                </p>
            </div>

            {detalle ? (
                <Formulario
                    detalle={detalle}
                    guardandoId={guardandoId}
                    finalizando={finalizar.isPending}
                    errorFinalizar={errorFinalizar}
                    onVolver={() => {
                        setDetalle(null);
                        setErrorFinalizar(null);
                    }}
                    onResponder={(idParametro, cumple) => responder.mutate({ idParametro, cumple })}
                    onGuardarObservacion={(idParametro, observacion) =>
                        guardarObservacion.mutate({ idParametro, observacion })
                    }
                    onGuardarCabecera={(payload) => guardarCabecera.mutate(payload)}
                    onFinalizar={() => finalizar.mutate()}
                />
            ) : (
                <>
                    <SeleccionProveedor
                        proveedores={proveedores ?? []}
                        cargando={isLoading}
                        iniciando={iniciar.isPending}
                        onElegir={(p) => iniciar.mutate(p)}
                    />
                    {iniciar.isError && (
                        <p className="text-xs text-brand-wine">
                            {axios.isAxiosError(iniciar.error) && iniciar.error.response?.data?.errors
                                ? Object.values(iniciar.error.response.data.errors).flat().join(' ')
                                : 'No se pudo abrir la calificación. Intentá de nuevo.'}
                        </p>
                    )}
                </>
            )}
        </div>
    );
}

export default function CalificacionRecepcionesPage() {
    const { esSistemas, esAdmin, esCalidad } = useAuth();

    return (
        <RoleRoute allow={esSistemas || esAdmin || esCalidad}>
            <CalificacionRecepcionesContent />
        </RoleRoute>
    );
}
