import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as asistenteApi from '../api/asistenteApi';
import type { MensajeChat } from '../api/asistenteApi';

const REGEX_IR_A = /\[IR_A:(\/[a-zA-Z0-9\-\/]*)\]/;

const SEGMENTOS = {
    saludo: { inicio: 0, fin: 1 },
    guino: { inicio: 2, fin: 3 },
    salto: { inicio: 3, fin: 4 },
} as const;

const INTERVALO_GUINO_MS = 2 * 60 * 1000;

export default function HanaBot() {
    const navigate = useNavigate();
    const videoRef = useRef<HTMLVideoElement>(null);
    const animandoRef = useRef(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [chatAbierto, setChatAbierto] = useState(false);
    const [mensajes, setMensajes] = useState<MensajeChat[]>([
        { rol: 'hana', contenido: '¡Hola! Soy Hana, tu asistente virtual de Hanaska. ¿En qué puedo ayudarte hoy?' },
    ]);
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

    // Saludo proactivo SIN que el usuario abra el chat: casi siempre la
    // API devuelve null (ver asistenteApi.obtenerBienvenidaProactiva) y
    // acá no pasa nada. Cuando sí trae texto (proveedor recién Aprobado,
    // primera vez que entra), abrimos el panel solos y metemos el
    // mensaje como si Hana ya lo hubiera escrito, con la misma
    // animación de salto que usa 'hana:celebrar'.
    useEffect(() => {
        let cancelado = false;

        const timeout = setTimeout(async () => {
            try {
                const mensaje = await asistenteApi.obtenerBienvenidaProactiva();
                if (cancelado || !mensaje) return;

                setMensajes((prev) => [...prev, { rol: 'hana', contenido: mensaje }]);
                setChatAbierto(true);
                reproducirSegmento(SEGMENTOS.salto, { prioridad: true });
            } catch {
                // Silencioso a propósito: es un extra proactivo, no debe
                // interrumpir ni mostrar error si falla.
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

    async function enviar() {
        const contenido = texto.trim();
        if (!contenido || enviando) return;

        const nuevoHistorial: MensajeChat[] = [...mensajes, { rol: 'usuario', contenido }];
        setMensajes(nuevoHistorial);
        setTexto('');
        setEnviando(true);

        try {
            const respuesta = await asistenteApi.enviarMensaje(contenido, mensajes.slice(-10));

            const matchIrA = respuesta.match(REGEX_IR_A);
            const debeAbrirGuia = respuesta.includes('[ABRIR_GUIA]');

            const respuestaLimpia = respuesta
                .replace('[ABRIR_GUIA]', '')
                .replace(REGEX_IR_A, '')
                .trim();

            setMensajes((prev) => [...prev, { rol: 'hana', contenido: respuestaLimpia }]);

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