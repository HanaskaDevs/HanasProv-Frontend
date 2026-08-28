import { useEffect, useRef, useState } from 'react';
import type { EstadoHorario, HorarioHoy } from './types';
import {
  MENSAJES_POR_ESTADO,
  anunciar,
  cancelarTodo,
  normalizarNombreParaVoz,
  precalentarVoces,
  soportaVoz,
} from './anunciosVoz';

/**
 * Detecta CAMBIOS de estado entre dos lecturas del calendario de hoy y
 * canta el anuncio que corresponda.
 *
 * Cómo sabe que algo cambió: guarda un mapa id -> estado de la lectura
 * anterior y lo compara contra la nueva. El Modo TV ya refresca solo cada
 * 20 segundos, así que no hace falta websocket ni nada parecido: cuando el
 * Guardia marca arribo, en la próxima vuelta esa fila viene con estado
 * distinto y ahí se anuncia.
 *
 * TRES REGLAS QUE NO SON OBVIAS:
 *
 *  1. LA PRIMERA LECTURA NO ANUNCIA NADA. Es la línea base. Sin esto, al
 *     abrir la TV a media mañana se cantarían de golpe todos los
 *     proveedores que ya habían arribado durante el día.
 *
 *  2. UNA FILA NUEVA TAMPOCO ANUNCIA. Las 3 clasificaciones se piden en
 *     paralelo y resuelven en momentos distintos, así que la lista crece de
 *     a pedazos; un id que no estaba en el mapa anterior es "recién
 *     cargado", no "recién cambiado".
 *
 *  3. SE COMPARA CONTRA TODO EL DÍA, NO CONTRA LO VISIBLE. La pantalla solo
 *     muestra la franja de la hora en curso, pero un proveedor de las 9:00
 *     que arriba 10:15 ya no está en la franja y su arribo igual importa
 *     (pedido explícito del usuario).
 */
export function useAnunciosVoz(filasDelDia: HorarioHoy[], vozActiva: boolean) {
  /** null = todavía no hubo primera lectura (ver regla 1). */
  const estadosPreviosRef = useRef<Map<number, EstadoHorario> | null>(null);

  /** El navegador bloqueó el audio hasta que alguien toque la pantalla. */
  const [audioBloqueado, setAudioBloqueado] = useState(false);

  // Las filas se recalculan en cada render (el reloj del Modo TV redibuja
  // cada segundo), así que depender del array haría correr el efecto 60
  // veces por minuto al pedo. Esta firma solo cambia cuando de verdad
  // cambió algún estado o entró/salió alguna fila.
  const firma = filasDelDia
    .map((f) => `${f.id_horario_entrega_proveedor}:${f.estado}`)
    .join('|');

  // El efecto de abajo necesita los datos completos (el nombre del
  // proveedor, que no entra en la firma) pero NO debe dispararse por ellos
  // -> se leen por ref.
  //
  // La copia se hace dentro de un efecto y no en el cuerpo del hook porque
  // escribir un ref durante el render es un efecto secundario en pleno
  // render (lo marca react-hooks/refs). Este efecto va declarado ANTES del
  // que anuncia: React los corre en orden de declaración, así que cuando el
  // de abajo se ejecuta, los refs ya tienen el valor de este render.
  const filasRef = useRef(filasDelDia);
  const vozActivaRef = useRef(vozActiva);

  useEffect(() => {
    filasRef.current = filasDelDia;
    vozActivaRef.current = vozActiva;
  });

  useEffect(() => {
    precalentarVoces();
    return () => cancelarTodo();
  }, []);

  useEffect(() => {
    const filas = filasRef.current;

    // Sin datos todavía: no se fija línea base con una lista vacía, porque
    // entonces la primera carga real contaría como "todo cambió".
    if (filas.length === 0) return;

    const estadosActuales = new Map<number, EstadoHorario>(
      filas.map((f) => [f.id_horario_entrega_proveedor, f.estado])
    );

    const estadosPrevios = estadosPreviosRef.current;

    // El mapa se actualiza SIEMPRE, incluso con la voz apagada: así, si
    // Sistemas la enciende a media tarde, no se dispara de golpe todo lo
    // que pasó mientras estuvo muda.
    estadosPreviosRef.current = estadosActuales;

    if (estadosPrevios === null) return; // regla 1: línea base
    if (!vozActivaRef.current || !soportaVoz()) return;

    // Se juntan TODOS los cambios de esta vuelta y se mandan como un solo
    // lote: así suena una campanita y después las frases seguidas, en vez
    // de un din-don por cada proveedor (ver anunciar()).
    const frases: string[] = [];

    for (const fila of filas) {
      const estadoAnterior = estadosPrevios.get(fila.id_horario_entrega_proveedor);

      if (estadoAnterior === undefined) continue; // regla 2: fila recién cargada
      if (estadoAnterior === fila.estado) continue;

      const armarMensaje = MENSAJES_POR_ESTADO[fila.estado];
      if (!armarMensaje) continue; // 'Programado' no anuncia

      const nombre = fila.nombre_proveedor?.trim();
      if (!nombre) continue; // sin nombre no hay nada que cantar

      frases.push(armarMensaje(normalizarNombreParaVoz(nombre), fila.anden_puerta));
    }

    anunciar(frases, { alBloquearse: () => setAudioBloqueado(true) });
  }, [firma]);

  // Cualquier gesto sobre la pantalla habilita el audio en el navegador.
  // Se escucha siempre (no solo cuando ya falló) porque el bloqueo se
  // detecta recién al intentar hablar, y para entonces ese anuncio ya se
  // perdió: con esto, el primer toque destraba y el siguiente ya suena.
  useEffect(() => {
    if (!audioBloqueado) return;

    function destrabar() {
      setAudioBloqueado(false);
    }

    const eventos: (keyof DocumentEventMap)[] = ['click', 'keydown', 'touchstart'];
    eventos.forEach((e) => document.addEventListener(e, destrabar, { once: true }));

    return () => eventos.forEach((e) => document.removeEventListener(e, destrabar));
  }, [audioBloqueado]);

  return { audioBloqueado };
}
