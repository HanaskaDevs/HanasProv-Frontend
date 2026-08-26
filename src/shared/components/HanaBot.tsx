import { useEffect, useRef, useState } from 'react';
import { descargarExcel, nombreArchivoConFecha } from '../utils/descargarExcel';
import { useNavigate } from 'react-router-dom';
import * as asistenteApi from '../api/asistenteApi';
import { haySaludoPendiente, olvidarSaludoPendiente } from '../utils/saludoDeSesion';
import type { MensajeChat } from '../api/asistenteApi';

// Dentro de una clase de caracteres la barra no necesita escape, y con
// escape eslint la marca como innecesaria. El guion va al final para que
// se lea como literal y no como rango.
const REGEX_IR_A = /\[IR_A:(\/[a-zA-Z0-9/-]*)\]/;

const SEGMENTOS = {
    saludo: { inicio: 0, fin: 1 },
    guino: { inicio: 2, fin: 3 },
    salto: { inicio: 3, fin: 4 },
} as const;

const INTERVALO_GUINO_MS = 2 * 60 * 1000;

// Bienvenida genérica: la ve cualquier usuario que NO tenga un saludo propio.
// Cuando sí lo tiene (la regla de Sistemas para su correo, o la felicitación
// de un proveedor recién aprobado) se muestra ese en su lugar y esta no
// aparece: dejar las dos ponía una burbuja genérica encima del saludo real.
const BIENVENIDA: MensajeChat = {
    rol: 'hana',
    contenido: '¡Hola! Soy Hana, tu asistente virtual de Hanaska. ¿En qué puedo ayudarte hoy?',
};

export default function HanaBot() {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const animandoRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [chatAbierto, setChatAbierto] = useState(false);
    // Arranca con la bienvenida SALVO justo después de iniciar sesión, que es
    // el único momento en que puede haber saludo propio: ahí se espera la
    // respuesta del backend y se pone uno o el otro (ver el efecto de más
    // abajo). Así el usuario común ve su "¡Hola! Soy Hana..." de entrada, sin
    // esperar nada, y quien tiene saludo configurado no ve las dos burbujas.
    const [mensajes, setMensajes] = useState<MensajeChat[]>(
        haySaludoPendiente() ? [] : [BIENVENIDA]
    );
    const [texto, setTexto] = useState('');
    const [enviando, setEnviando] = useState(false);

    function reproducirSegmento(
        segmento: { inicio: number; fin: number },
        opciones: { prioridad?: boolean; velocidad?: number } = {}
    ) {
        const { prioridad = false, velocidad = 1 } = opciones;
        const video = videoRef.current;
        if (!video) return;
        if (animandoRef.current && !prioridad) return;

        animandoRef.current = true;
        video.playbackRate = velocidad;

        function alTerminar() {
            if (!video) return;
            if (video.currentTime >= segmento.fin - 0.05) {
                video.pause();
                video.removeEventListener('timeupdate', alTerminar);
                video.playbackRate = 1;
                setTimeout(() => {
                    video.currentTime = 0;
                    animandoRef.current = false;
                }, 150);
            }
        }

        video.currentTime = segmento.inicio;
        video.addEventListener('timeupdate', alTerminar);
        video.play().catch(() => {});
    }

    useEffect(() => {
        const timeoutSaludo = setTimeout(() => {
            reproducirSegmento(SEGMENTOS.saludo, { velocidad: 0.5 });
        }, 400);

        const intervaloGuino = setInterval(() => {
            reproducirSegmento(SEGMENTOS.guino, { velocidad: 0.5 });
        }, INTERVALO_GUINO_MS);

        function alCelebrar() {
            reproducirSegmento(SEGMENTOS.salto, { prioridad: true });
        }

        window.addEventListener('hana:celebrar', alCelebrar);

        return () => {
            clearTimeout(timeoutSaludo);
            clearInterval(intervaloGuino);
            window.removeEventListener('hana:celebrar', alCelebrar);
        };
    }, []);

    // Saludo proactivo SIN que el usuario abra el chat: cuando la API trae
    // texto abrimos el panel solos y metemos el mensaje como si Hana ya lo
    // hubiera escrito, con la misma animación de salto que usa 'hana:celebrar'.
    //
    // Trae texto en dos casos: un saludo configurado por Sistemas para ese
    // correo (con su frase motivacional), o la felicitación de un proveedor
    // recién Aprobado la primera vez que entra. Se pide para CUALQUIER
    // usuario: quién recibe saludo lo decide el backend.
    //
    // SOLO AL INICIAR SESIÓN. La bandera la deja login() en useAuth (ver
    // saludoDeSesion). Antes bastaba con que este componente se montara, y el
    // saludo volvía a salir en cada recarga de la pestaña, cambio de empresa o
    // vuelta desde una página pública: eso es el "a cada rato" que se reportó.
    //
    // La bandera se borra recién cuando el backend contestó, no al montar: en
    // StrictMode el efecto se monta dos veces y el primer montaje se la
    // llevaría, dejando al segundo (el que queda vivo) sin saludo. Como el
    // pedido sale 1200 ms después, el montaje descartado nunca llega a
    // hacerlo.
    useEffect(() => {
        if (!haySaludoPendiente()) {
            return;
        }

        let cancelado = false;

        const timeout = setTimeout(async () => {
            try {
                const mensaje = await asistenteApi.obtenerBienvenidaProactiva();

                // Entregado: haya venido saludo o no, este login ya se
                // consultó y no se vuelve a preguntar.
                olvidarSaludoPendiente();

                if (cancelado) return;

                // Sin saludo propio (el caso de casi todos los usuarios): la
                // bienvenida de siempre, sin abrir el chat solo.
                if (!mensaje) {
                    setMensajes((prev) => (prev.length === 0 ? [BIENVENIDA] : prev));

                    return;
                }

                setMensajes((prev) => [...prev, { rol: 'hana', contenido: mensaje }]);
                setChatAbierto(true);
                reproducirSegmento(SEGMENTOS.salto, { prioridad: true });
            } catch {
                // Falló la consulta: se deja la bienvenida genérica para no
                // dejar el chat vacío, y la bandera queda puesta -> si fue un
                // corte de red, el próximo montaje lo reintenta.
                if (!cancelado) {
                    setMensajes((prev) => (prev.length === 0 ? [BIENVENIDA] : prev));
                }
            }
        }, 1200);

        return () => {
            cancelado = true;
            clearTimeout(timeout);
        };
    }, []);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [mensajes, enviando]);

    async function descargar(tabla: NonNullable<MensajeChat['tabla']>) {
        try {
            await descargarExcel(tabla.filas, tabla.titulo || 'Datos', nombreArchivoConFecha(tabla.titulo));
        } catch {
            setMensajes((prev) => [
                ...prev,
                { rol: 'hana', contenido: 'No pude generar el archivo. Intenta pedírmelo de nuevo.' },
            ]);
        }
    }

    async function enviar() {
        const contenido = texto.trim();
        if (!contenido || enviando) return;

        const nuevoHistorial: MensajeChat[] = [...mensajes, { rol: 'usuario', contenido }];
        setMensajes(nuevoHistorial);
        setTexto('');
        setEnviando(true);

        try {
            const { texto: respuesta, tabla } = await asistenteApi.enviarMensaje(contenido, mensajes.slice(-10));

            const matchIrA = respuesta.match(REGEX_IR_A);
            const debeAbrirGuia = respuesta.includes('[ABRIR_GUIA]');

            const respuestaLimpia = respuesta
                .replace('[ABRIR_GUIA]', '')
                .replace(REGEX_IR_A, '')
                .trim();

            // La tabla viaja junto al mensaje: así el botón de descarga queda
            // pegado a la respuesta que lo generó y no se pierde cuando la
            // conversación sigue.
            setMensajes((prev) => [...prev, { rol: 'hana', contenido: respuestaLimpia, tabla }]);

            if (debeAbrirGuia) {
                setTimeout(() => window.dispatchEvent(new Event('guia-inicio:abrir')), 600);
            }

            if (matchIrA) {
                const ruta = matchIrA[1];
                setTimeout(() => navigate(ruta), 600);
            }
        } catch {
            setMensajes((prev) => [
                ...prev,
                { rol: 'hana', contenido: 'Ocurrió un problema al procesar tu mensaje. Intenta de nuevo en un momento.' },
            ]);
        } finally {
            setEnviando(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            enviar();
        }
    }

    return (
        <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
            {chatAbierto && (
                <div className="w-80 h-96 rounded-xl bg-white shadow-2xl border border-brand-900/10 flex flex-col overflow-hidden">
                    <div className="bg-brand-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-white/10">
                                <video src="/hana-bot.mp4" muted playsInline className="h-full w-full object-cover" />
                            </div>
                            <span className="text-sm font-medium">Hana · Asistente virtual</span>
                        </div>
                        <button onClick={() => setChatAbierto(false)} className="text-white/60 hover:text-white">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 bg-brand-200/[0.04]">
                        {mensajes.map((m, i) => (
                            <div key={i} className={`flex ${m.rol === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-[85%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                                        m.rol === 'usuario'
                                            ? 'bg-brand-900 text-white'
                                            : 'bg-white border border-brand-900/8 text-brand-900'
                                    }`}
                                >
                                    {m.contenido}

                                    {/* Botón de descarga: solo aparece si ESA
                                        respuesta trajo filas de una consulta.
                                        El archivo se arma en el navegador con
                                        la librería xlsx que el portal ya
                                        carga (ver descargarExcel). */}
                                    {m.tabla && m.tabla.filas.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => descargar(m.tabla!)}
                                            className="mt-2.5 flex w-full items-center gap-2 rounded-lg border border-brand-700/25
                                                bg-brand-200/25 px-2.5 py-2 text-left text-xs text-brand-900
                                                hover:bg-brand-200/45 transition-colors
                                                focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-700"
                                        >
                                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-brand-700">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                <polyline points="7 10 12 15 17 10" />
                                                <line x1="12" y1="15" x2="12" y2="3" />
                                            </svg>
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-medium">Descargar Excel</span>
                                                <span className="block text-[11px] text-brand-900/55">
                                                    {m.tabla.filas.length} fila{m.tabla.filas.length === 1 ? '' : 's'}
                                                </span>
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}

                        {enviando && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-brand-900/8 rounded-xl px-3 py-2 text-sm text-brand-900/40">
                                    Hana está escribiendo...
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-2.5 border-t border-brand-900/8 shrink-0 flex items-end gap-2">
                        <textarea
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe tu pregunta..."
                            rows={1}
                            className="flex-1 rounded-md border border-brand-900/15 px-2.5 py-2 text-sm resize-none"
                        />
                        <button
                            onClick={enviar}
                            disabled={enviando || !texto.trim()}
                            className="h-9 w-9 shrink-0 rounded-md bg-brand-900 text-white flex items-center justify-center disabled:opacity-40"
                        >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

            <button
                onClick={() => setChatAbierto((v) => !v)}
                onMouseEnter={() => reproducirSegmento(SEGMENTOS.guino, { velocidad: 0.5 })}
                className="h-20 w-20 rounded-full overflow-hidden shadow-lg border-2 border-white hover:scale-105 transition-transform bg-brand-200/20"
                title="Hana, tu asistente virtual"
            >
                <video
                    ref={videoRef}
                    src="/hana-bot.mp4"
                    muted
                    playsInline
                    className="h-full w-full object-cover pointer-events-none"
                />
            </button>
        </div>
    );
}