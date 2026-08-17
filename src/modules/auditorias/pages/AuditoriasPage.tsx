import { useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../auth/hooks/useAuth';
import * as auditoriasApi from '../api/auditoriasApi';
import type { AuditoriaDetalle, SeccionAuditoria } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import BarraBusqueda from '../../../shared/components/BarraBusqueda';
import ProximamentePage from '../../../shared/pages/ProximamentePage';
import SeccionAuditoriaCard from '../components/SeccionAuditoriaCard';
import ResumenAuditoria from '../components/ResumenAuditoria';
import ResumenPorSeccion from '../components/ResumenPorSeccion';
import PasosSeccionesAuditoria from '../components/PasosSeccionesAuditoria';
import ModalConfirmarFinalizar from '../components/ModalConfirmarFinalizar';

function seccionCompleta(seccion: SeccionAuditoria): boolean {
    return seccion.preguntas.every((p) => p.no_aplica || p.puntaje_obtenido !== null);
}

export default function AuditoriasPage() {
    const { esAdmin, esSistemas, esCalidad } = useAuth();
    const tieneAcceso = esAdmin || esSistemas || esCalidad;

    const [idTipoElegido, setIdTipoElegido] = useState<number | null>(null);
    const [busquedaProveedor, setBusquedaProveedor] = useState('');
    const [auditoria, setAuditoria] = useState<AuditoriaDetalle | null>(null);
    const [indiceSeccion, setIndiceSeccion] = useState(0);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [errorFinalizar, setErrorFinalizar] = useState<string | null>(null);
    const [mensajeFinalizada, setMensajeFinalizada] = useState(false);

    const { data: tipos, isLoading: cargandoTipos } = useQuery({
        queryKey: ['auditorias-tipos'],
        queryFn: auditoriasApi.listarTipos,
        enabled: tieneAcceso,
    });

    const { data: proveedores, isLoading: cargandoProveedores } = useQuery({
        queryKey: ['auditorias-proveedores', idTipoElegido],
        queryFn: () => auditoriasApi.listarProveedores(idTipoElegido ?? undefined),
        enabled: tieneAcceso && idTipoElegido !== null,
    });

    const iniciarMutation = useMutation({
        mutationFn: ({ idTipo, idProveedor }: { idTipo: number; idProveedor: number }) =>
            auditoriasApi.iniciar(idTipo, idProveedor),
        onSuccess: (data) => {
            setAuditoria(data);
            setIndiceSeccion(0);
        },
    });

    const finalizarMutation = useMutation({
        mutationFn: (idAuditoria: number) => auditoriasApi.finalizar(idAuditoria),
        onSuccess: (data) => {
            setAuditoria(data);
            setMensajeFinalizada(true);
            setMostrarConfirmacion(false);
            setErrorFinalizar(null);
        },
        onError: (error) => {
            setMostrarConfirmacion(false);
            if (axios.isAxiosError(error) && error.response?.status === 422) {
                const errores = error.response.data?.errors;
                setErrorFinalizar(errores ? (Object.values(errores)[0] as string[])?.[0] : 'No se pudo finalizar.');
            } else {
                setErrorFinalizar('No se pudo finalizar la auditoría.');
            }
        },
    });

    const proveedoresFiltrados = useMemo(() => {
        const texto = busquedaProveedor.trim().toLowerCase();
        return (proveedores ?? []).filter((p) => {
            if (!texto) return true;
            return (
                p.razon_social.toLowerCase().includes(texto) ||
                (p.nombre_comercial ?? '').toLowerCase().includes(texto) ||
                (p.ruc ?? '').includes(texto)
            );
        });
    }, [proveedores, busquedaProveedor]);

    if (!tieneAcceso) {
        return <ProximamentePage titulo="Auditorías" />;
    }

    function elegirTipo(idTipo: number) {
        setIdTipoElegido(idTipo);
        setAuditoria(null);
        setMensajeFinalizada(false);
    }

    function elegirProveedor(idProveedor: number) {
        if (!idTipoElegido) return;
        setMensajeFinalizada(false);
        setErrorFinalizar(null);
        iniciarMutation.mutate({ idTipo: idTipoElegido, idProveedor });
    }

    function cambiarProveedor() {
        setAuditoria(null);
        setMensajeFinalizada(false);
    }

    function cambiarTipo() {
        setIdTipoElegido(null);
        setAuditoria(null);
        setMensajeFinalizada(false);
    }

    async function guardarRespuesta(
        idPregunta: number,
        payload: { puntaje_obtenido: number | null; no_aplica: boolean; observacion: string | null }
    ) {
        if (!auditoria) return;
        const actualizada = await auditoriasApi.guardarRespuesta(auditoria.id_auditoria, {
            id_auditoria_pregunta: idPregunta,
            ...payload,
        });
        setAuditoria(actualizada);
    }

    function confirmarFinalizar() {
        if (!auditoria) return;
        finalizarMutation.mutate(auditoria.id_auditoria);
    }

    function pedirFinalizar() {
        setErrorFinalizar(null);
        setMostrarConfirmacion(true);
    }

    // --- Formulario (Borrador o Finalizada) ---
    if (auditoria) {
        const soloLectura = auditoria.estado === 'Finalizada';
        const totalPreguntas = auditoria.secciones.reduce((acc, s) => acc + s.preguntas.length, 0);
        const totalRespondidas = auditoria.secciones.reduce(
            (acc, s) => acc + s.preguntas.filter((p) => p.no_aplica || p.puntaje_obtenido !== null).length,
            0
        );
        const porcentajeRespondido = totalPreguntas > 0 ? Math.round((totalRespondidas / totalPreguntas) * 100) : 0;
        const todasCompletas = totalRespondidas === totalPreguntas;
        const completadasPorSeccion = auditoria.secciones.map(seccionCompleta);

        return (
            <div className="space-y-4 max-w-6xl mx-auto">
                {mostrarConfirmacion && (
                    <ModalConfirmarFinalizar
                        isLoading={finalizarMutation.isPending}
                        onConfirmar={confirmarFinalizar}
                        onCancelar={() => setMostrarConfirmacion(false)}
                    />
                )}

                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
                                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            {auditoria.tipo_auditoria.nombre}
                        </h1>
                        <p className="text-brand-900/50 text-xs mt-0.5">
                            {auditoria.proveedor.nombre_comercial ?? auditoria.proveedor.razon_social} · {auditoria.proveedor.ruc}
                            {soloLectura && <span className="ml-2 text-emerald-700 font-medium">· Finalizada</span>}
                        </p>
                    </div>
                    <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={cambiarProveedor}>
                        Cambiar proveedor
                    </Button>
                </div>

                {mensajeFinalizada && (
                    <p className="text-xs text-emerald-700 flex items-center gap-1.5">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Auditoría finalizada correctamente.
                    </p>
                )}

                {errorFinalizar && (
                    <p className="text-xs text-brand-wine bg-brand-wine/8 rounded-md px-3 py-2">{errorFinalizar}</p>
                )}

                {/* Datos básicos del proveedor */}
                <div className="flex items-center gap-x-5 gap-y-1.5 flex-wrap text-sm px-1">
                    <span className="font-medium text-brand-900">{auditoria.proveedor.razon_social}</span>
                    <span className="text-brand-900/40">·</span>
                    <span className="text-brand-900/60">{auditoria.proveedor.ruc ?? '—'}</span>
                    {auditoria.proveedor.estado && (
                        <>
                            <span className="text-brand-900/40">·</span>
                            <span className="text-brand-900/60">{auditoria.proveedor.estado}</span>
                        </>
                    )}
                    {auditoria.proveedor.clases.length > 0 && (
                        <>
                            <span className="text-brand-900/40">·</span>
                            <span className="text-brand-900/60">{auditoria.proveedor.clases.join(', ')}</span>
                        </>
                    )}
                    <span className="text-brand-900/40">·</span>
                    <span className="text-brand-900/60">{auditoria.fecha_auditoria}</span>
                    {auditoria.auditor && (
                        <>
                            <span className="text-brand-900/40">·</span>
                            <span className="text-brand-900/60">Auditor: {auditoria.auditor}</span>
                        </>
                    )}
                    </div>

                {soloLectura ? (
                    // --- Auditoría ya finalizada: todo a la vista, sin wizard ---
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
                        <div className="space-y-4">
                            {auditoria.secciones.map((seccion) => (
                                <SeccionAuditoriaCard
                                    key={seccion.id_auditoria_seccion}
                                    seccion={seccion}
                                    soloLectura
                                    onGuardarRespuesta={guardarRespuesta}
                                />
                            ))}
                        </div>
                        <div className="space-y-3 lg:sticky lg:top-4">
                            <ResumenAuditoria resumen={auditoria.resumen} />
                            <ResumenPorSeccion secciones={auditoria.secciones} />
                        </div>
                    </div>
                ) : (
                    // --- En progreso: wizard, una sección a la vez ---
                    <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-4 items-start">
                        <div className="space-y-3">
                            <Card>
                                <PasosSeccionesAuditoria
                                    nombresSecciones={auditoria.secciones.map((s) => s.nombre_seccion)}
                                    completadas={completadasPorSeccion}
                                    indiceActual={indiceSeccion}
                                    onIrASeccion={setIndiceSeccion}
                                    porcentajeRespondido={porcentajeRespondido}
                                />
                            </Card>

                            <SeccionAuditoriaCard
                                seccion={auditoria.secciones[indiceSeccion]}
                                soloLectura={false}
                                onGuardarRespuesta={guardarRespuesta}
                            />

                            <div className="flex items-center justify-between gap-2">
                                <Button
                                    variant="ghost"
                                    className="text-sm px-4 py-2"
                                    disabled={indiceSeccion === 0}
                                    onClick={() => setIndiceSeccion((i) => Math.max(0, i - 1))}
                                >
                                    ← Anterior
                                </Button>
                                {indiceSeccion < auditoria.secciones.length - 1 ? (
                                    <Button
                                        className="text-sm px-4 py-2"
                                        onClick={() => setIndiceSeccion((i) => Math.min(auditoria.secciones.length - 1, i + 1))}
                                    >
                                        Siguiente →
                                    </Button>
                                ) : (
                                    <Button
                                        className="text-sm px-4 py-2"
                                        disabled={!todasCompletas}
                                        onClick={pedirFinalizar}
                                    >
                                        Finalizar auditoría
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3 lg:sticky lg:top-4">
                            <ResumenAuditoria resumen={auditoria.resumen} />
                            {!todasCompletas && (
                                <p className="text-xs text-brand-900/50 text-center px-2">
                                    Completa todas las preguntas (puntaje o "No aplica") de todas las secciones para poder finalizar.
                                </p>
                            )}
                            {todasCompletas && (
                                <Button className="w-full text-sm py-2.5" onClick={pedirFinalizar}>
                                    Finalizar auditoría
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // --- Paso 2: elegir proveedor ---
    if (idTipoElegido) {
        return (
            <div className="space-y-4 max-w-6xl mx-auto">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-display text-xl font-semibold text-brand-900">Elige el proveedor</h1>
                        <p className="text-brand-900/50 text-xs mt-0.5">
                            {tipos?.find((t) => t.id_tipo_auditoria === idTipoElegido)?.nombre}
                        </p>
                    </div>
                    <Button variant="ghost" className="text-xs px-3 py-1.5" onClick={cambiarTipo}>
                        Cambiar tipo
                    </Button>
                </div>

                <BarraBusqueda valor={busquedaProveedor} onCambiar={setBusquedaProveedor} placeholder="Buscar proveedor o RUC..." />

                {cargandoProveedores || iniciarMutation.isPending ? (
                    <div className="flex justify-center py-12">
                        <Spinner className="h-6 w-6" />
                    </div>
                ) : proveedoresFiltrados.length === 0 ? (
                    <Card>
                        <p className="text-sm text-brand-900/60 text-center py-10">Sin resultados.</p>
                    </Card>
                ) : (
                    <Card className="p-0 overflow-hidden">
                        <div className="divide-y divide-brand-900/6">
                            {proveedoresFiltrados.map((p) => (
                                <button
                                    key={p.id_proveedor}
                                    onClick={() => elegirProveedor(p.id_proveedor)}
                                    className="w-full text-left px-4 py-3 hover:bg-brand-200/[0.06] transition-colors flex items-center justify-between gap-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-brand-900 flex items-center gap-1.5">
                                            {p.nombre_comercial ?? p.razon_social}
                                            {p.sugerido && (
                                                <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                                                    Sugerido
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-brand-900/50">{p.ruc} {p.clases.length > 0 && `· ${p.clases.join(', ')}`}</p>
                                    </div>
                                    {p.estado && (
                                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-900/6 text-brand-900/60 shrink-0">
                                            {p.estado}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // --- Paso 1: elegir tipo de auditoría ---
    return (
        <div className="space-y-4 max-w-6xl mx-auto">
            <div>
                <h1 className="font-display text-xl font-semibold text-brand-900">Auditorías</h1>
                <p className="text-brand-900/50 text-xs mt-0.5">Elige el tipo de auditoría que vas a realizar.</p>
            </div>

            {cargandoTipos ? (
                <div className="flex justify-center py-12">
                    <Spinner className="h-6 w-6" />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {(tipos ?? []).map((tipo) => (
                        <button
                            key={tipo.id_tipo_auditoria}
                            onClick={() => elegirTipo(tipo.id_tipo_auditoria)}
                            className="rounded-xl border border-brand-900/10 bg-white shadow-sm p-5 text-left hover:border-brand-700/40 hover:shadow-md transition-all"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700 mb-3">
                                <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            <p className="font-display text-base font-semibold text-brand-900">{tipo.nombre}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}