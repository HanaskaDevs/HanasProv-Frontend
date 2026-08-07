import { useEffect, useLayoutEffect, useState } from 'react';
import { obtenerGuiaPasos, type GuiaPasoPublico } from '../api/publicConfigApi';

const PASOS_RESPALDO: GuiaPasoPublico[] = [
    {
        Target_Id: 'tour-mi-ficha',
        Titulo: 'Paso 1 · Ficha de Proveedor',
        Texto: 'Complete los datos de su empresa: información general, clase de proveedor y categoría de productos o servicios.',
    },
    {
        Target_Id: 'tour-documentacion',
        Titulo: 'Paso 2 · Documentación',
        Texto: 'Cargue en formato PDF la documentación requerida. Encontrará documentos obligatorios y opcionales.',
    },
    {
        Target_Id: 'tour-productos',
        Titulo: 'Paso 3 · Ficha de Productos',
        Texto: 'Registre sus productos junto con su ficha técnica, análisis y carta de alérgenos. Una vez completado, podrá enviarlos a calificación.',
    },
];

const ANCHO_TARJETA = 300;
const ESPACIO_RESALTADO = 8;
const ESPACIO_TARJETA = 14;

export default function GuiaInicioTour({
    visible,
    onCerrar,
    pasos: pasosPersonalizados,
}: {
    visible: boolean;
    onCerrar: () => void;
    /** Si se pasa, se usa tal cual (sin ir a buscar los pasos configurados
     *  en el backend) -> pensado para el tour del proveedor Aprobado, que
     *  apunta a otras secciones (Mis Productos, Calificación, Pedidos,
     *  Reclamos) y no tiene sentido que un admin lo edite desde la misma
     *  pantalla de configuración que la guía de onboarding del aspirante. */
    pasos?: GuiaPasoPublico[];
}) {
    const [pasosBackend, setPasosBackend] = useState<GuiaPasoPublico[]>(PASOS_RESPALDO);
    const [paso, setPaso] = useState(0);
    const [rect, setRect] = useState<DOMRect | null>(null);

    useEffect(() => {
        if (pasosPersonalizados) return; // no hace falta pedirle nada al backend
        obtenerGuiaPasos()
            .then((data) => {
                if (data.length > 0) setPasosBackend(data);
            })
            .catch(() => {
                // Se queda con PASOS_RESPALDO si falla.
            });
    }, [pasosPersonalizados]);

    const pasos = pasosPersonalizados ?? pasosBackend;

    useEffect(() => {
        if (visible) setPaso(0);
    }, [visible]);

    useLayoutEffect(() => {
        if (!visible) return;

        function actualizarPosicion() {
            const el = document.getElementById(pasos[paso]?.Target_Id);
            if (el) setRect(el.getBoundingClientRect());
        }

        actualizarPosicion();
        window.addEventListener('resize', actualizarPosicion);
        return () => window.removeEventListener('resize', actualizarPosicion);
    }, [visible, paso, pasos]);

    if (!visible || !rect || pasos.length === 0) return null;

    const esUltimo = paso === pasos.length - 1;
    const pasoActual = pasos[paso];

    const centroTarget = rect.left + rect.width / 2;
    let izquierdaTarjeta = centroTarget - ANCHO_TARJETA / 2;
    izquierdaTarjeta = Math.max(12, Math.min(izquierdaTarjeta, window.innerWidth - ANCHO_TARJETA - 12));

    const flechaIzquierda = Math.max(20, Math.min(centroTarget - izquierdaTarjeta, ANCHO_TARJETA - 20));

    function siguiente() {
        if (esUltimo) {
            onCerrar();
        } else {
            setPaso((p) => p + 1);
        }
    }

    return (
        <>
            {/* Spotlight sobre el elemento del menú */}
            <div
                className="fixed rounded-lg pointer-events-none transition-all duration-300 ease-out z-[60]"
                style={{
                    top: rect.top - ESPACIO_RESALTADO,
                    left: rect.left - ESPACIO_RESALTADO,
                    width: rect.width + ESPACIO_RESALTADO * 2,
                    height: rect.height + ESPACIO_RESALTADO * 2,
                    boxShadow: '0 0 0 9999px rgba(20,40,49,0.72)',
                    border: '2px solid #E2DE3D',
                }}
            />

            {/* Bloqueo de clicks fuera de la tarjeta */}
            <div className="fixed inset-0 z-[59]" onClick={siguiente} />

            {/* Tarjeta explicativa */}
            <div
                className="fixed z-[61] rounded-xl bg-brand-900 text-white shadow-2xl transition-all duration-300 ease-out"
                style={{
                    top: rect.bottom + ESPACIO_RESALTADO + ESPACIO_TARJETA,
                    left: izquierdaTarjeta,
                    width: ANCHO_TARJETA,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div
                    className="absolute -top-1.5 h-3 w-3 rotate-45 bg-brand-900"
                    style={{ left: flechaIzquierda }}
                />

                <div className="p-4">
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-yellow">
                            {pasoActual.Titulo}
                        </span>
                        <button onClick={onCerrar} className="text-white/40 hover:text-white text-xs">
                            Saltar
                        </button>
                    </div>

                    <p className="text-sm text-white/90 leading-relaxed mb-4">{pasoActual.Texto}</p>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-1.5">
                            {pasos.map((_, i) => (
                                <span
                                    key={i}
                                    className={`h-1.5 rounded-full transition-all ${i === paso ? 'w-4 bg-brand-yellow' : 'w-1.5 bg-white/25'
                                        }`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            {paso > 0 && (
                                <button
                                    onClick={() => setPaso((p) => p - 1)}
                                    className="text-xs font-medium text-white/60 hover:text-white px-2 py-1.5"
                                >
                                    Atrás
                                </button>
                            )}
                            <button
                                onClick={siguiente}
                                className="text-xs font-medium bg-brand-yellow text-brand-900 px-3 py-1.5 rounded-md hover:bg-brand-yellow/90"
                            >
                                {esUltimo ? 'Entendido, comenzar' : 'Siguiente'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}