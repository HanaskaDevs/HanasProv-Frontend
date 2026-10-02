import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import * as bannerApi from '../api/bannerApi';
import type { AudienciaBanner, FrecuenciaBanner, PiezaBanner } from '../api/bannerApi';
import { TIPOS_ACEPTADOS } from '../api/bannerApi';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { marcaActual, recordarCierre } from '../utils/cierreBanner';

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (isAxiosError(error)) {
    const datos = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return Object.values(datos?.errors ?? {})[0]?.[0] ?? datos?.message ?? porDefecto;
  }
  return porDefecto;
}

/**
 * Banner informativo: el aviso que ve todo el que inicia sesión.
 *
 * Dos partes, y el orden en pantalla es el orden en que se usan: primero
 * el interruptor con los textos generales, después las imágenes o el
 * video. Se puede cargar todo con el banner apagado y recién encenderlo
 * cuando esté listo.
 */
export default function TabBannerInformativo() {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [audiencia, setAudiencia] = useState<AudienciaBanner | null>(null);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaBanner | null>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tituloPieza, setTituloPieza] = useState('');
  const [descripcionPieza, setDescripcionPieza] = useState('');
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [vistaPrevia, setVistaPrevia] = useState<string | null>(null);
  const [progreso, setProgreso] = useState<number | null>(null);

  const { data: banner, isLoading } = useQuery({
    queryKey: ['banner-admin'],
    queryFn: bannerApi.obtenerBannerAdmin,
  });

  /**
   * Refresca la pantalla después de un cambio y, de paso, da el banner
   * por visto PARA QUIEN LO ESTÁ EDITANDO.
   *
   * POR QUÉ ESTO ÚLTIMO: cualquier cambio renueva la versión, que es lo
   * que hace que el aviso vuelva a aparecerle a todo el mundo. Pero a
   * Sistemas eso le caía encima en cada guardado, subida o borrado: el
   * modal se abría sobre la propia pantalla de administración. Marcando
   * la versión nueva como vista solo en ESTE navegador, el resto la
   * recibe igual y quien edita puede seguir trabajando.
   *
   * Se usa fetchQuery y no invalidate a secas porque hace falta la
   * versión NUEVA, ya traída, para poder marcarla.
   */
  async function refrescar() {
    const actualizado = await queryClient.fetchQuery({
      queryKey: ['banner-admin'],
      queryFn: bannerApi.obtenerBannerAdmin,
      staleTime: 0,
    });

    recordarCierre(marcaActual(actualizado));

    // El banner que ven los usuarios es otra consulta: sin esto, quien
    // está editando no vería su propio cambio reflejado.
    queryClient.invalidateQueries({ queryKey: ['banner-informativo'] });
  }

  const guardar = useMutation({
    mutationFn: (activo: boolean) =>
      bannerApi.guardarBanner({
        activo,
        titulo: titulo ?? banner?.titulo ?? '',
        mensaje: mensaje ?? banner?.mensaje ?? '',
        audiencia: audiencia ?? banner?.audiencia ?? 'todos',
        frecuencia: frecuencia ?? banner?.frecuencia ?? 'una_vez',
      }),
    onSuccess: () => {
      refrescar();
      setTitulo(null);
      setMensaje(null);
      setAudiencia(null);
      setFrecuencia(null);
    },
  });

  const agregarPieza = useMutation({
    mutationFn: () => {
      setProgreso(0);
      return bannerApi.crearPieza(
        {
          media: archivo!,
          titulo: tituloPieza || undefined,
          descripcion: descripcionPieza || undefined,
        },
        setProgreso
      );
    },
    onSuccess: () => {
      refrescar();
      limpiarFormularioPieza();
    },
    onSettled: () => setProgreso(null),
  });

  function limpiarFormularioPieza() {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    setArchivo(null);
    setTituloPieza('');
    setDescripcionPieza('');
    setErrorArchivo(null);
  }

  /**
   * Valida ANTES de subir. Un archivo de más viajaba entero para que el
   * servidor lo rechazara al final —o peor: si supera el tope de PHP, la
   * petición llega vacía y el error ni siquiera menciona el tamaño—.
   * Comprobarlo acá es instantáneo y no gasta la subida.
   */
  function elegirArchivo(nuevo: File | null) {
    if (vistaPrevia) URL.revokeObjectURL(vistaPrevia);
    setVistaPrevia(null);
    setErrorArchivo(null);
    setArchivo(null);

    if (!nuevo) return;

    if (!TIPOS_ACEPTADOS.includes(nuevo.type as (typeof TIPOS_ACEPTADOS)[number])) {
      setErrorArchivo('Formato no admitido. Usa JPG, PNG, WEBP o GIF para imágenes, y MP4 o WEBM para video.');
      return;
    }

    const maxMb = banner?.max_mb ?? 10;

    if (nuevo.size > maxMb * 1024 * 1024) {
      const pesa = (nuevo.size / (1024 * 1024)).toFixed(1);
      setErrorArchivo(`El archivo pesa ${pesa} MB y el servidor acepta hasta ${maxMb} MB. Comprimilo o elegí otro.`);
      return;
    }

    setArchivo(nuevo);
    setVistaPrevia(URL.createObjectURL(nuevo));
  }

  const cambiarActivoPieza = useMutation({
    mutationFn: (pieza: PiezaBanner) =>
      bannerApi.actualizarPieza(pieza.id_banner_informativo, { activo: !pieza.activo }),
    onSuccess: refrescar,
  });

  const borrarPieza = useMutation({
    mutationFn: (id: number) => bannerApi.eliminarPieza(id),
    onSuccess: refrescar,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const encendido = banner?.activo === true;
  // null = no se tocó el campo, así que manda lo guardado. Evita que un
  // refetch pise lo que la persona está escribiendo.
  const valorTitulo = titulo ?? banner?.titulo ?? '';
  const valorMensaje = mensaje ?? banner?.mensaje ?? '';
  const valorAudiencia: AudienciaBanner = audiencia ?? banner?.audiencia ?? 'todos';
  const valorFrecuencia: FrecuenciaBanner = frecuencia ?? banner?.frecuencia ?? 'una_vez';
  const hayPiezasActivas = (banner?.piezas ?? []).some((p) => p.activo);

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <h3 className="font-medium text-brand-900">Banner informativo</h3>
            <p className="mt-0.5 text-sm text-brand-900/60">
              Mientras esté encendido, cualquier usuario lo ve al iniciar sesión. Se cierra con la X
              y no le vuelve a aparecer, salvo que acá se cambie algo.
            </p>
          </div>

          <button
            onClick={() => guardar.mutate(!encendido)}
            disabled={guardar.isPending}
            role="switch"
            aria-checked={encendido}
            aria-label={encendido ? 'Apagar el banner' : 'Encender el banner'}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
              encendido ? 'bg-emerald-500' : 'bg-brand-900/20'
            }`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                encendido ? 'left-6' : 'left-1'
              }`}
            />
          </button>
        </div>

        <div className={`mt-4 rounded-md px-3 py-2 text-sm ${
          encendido ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-900/[0.04] text-brand-900/60'
        }`}>
          {encendido
            ? `${
                hayPiezasActivas
                  ? 'Encendido'
                  : 'Encendido, pero sin ninguna imagen o video activo (solo se ve el texto)'
              }. Lo ven ${
                { todos: 'todos', internos: 'solo los internos', proveedores: 'solo los proveedores' }[
                  banner?.audiencia ?? 'todos'
                ]
              }, ${
                banner?.frecuencia === 'siempre' ? 'en cada inicio de sesión' : 'una sola vez'
              }.`
            : 'Apagado: nadie lo ve. Podés dejar todo preparado y encenderlo después.'}
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-brand-900">¿Quién lo ve?</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {(
                [
                  ['todos', 'Todos', 'Personal de Hanaska y proveedores'],
                  ['internos', 'Solo internos', 'Personal de Hanaska'],
                  ['proveedores', 'Solo proveedores', 'Usuarios externos'],
                ] as [AudienciaBanner, string, string][]
              ).map(([valor, etiqueta, ayuda]) => (
                <label key={valor} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="audiencia-banner"
                    checked={valorAudiencia === valor}
                    onChange={() => setAudiencia(valor)}
                    className="mt-0.5 accent-brand-700"
                  />
                  <span>
                    <span className="block text-sm text-brand-900">{etiqueta}</span>
                    <span className="block text-xs text-brand-900/50">{ayuda}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-brand-900">¿Cada cuánto aparece?</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {(
                [
                  [
                    'una_vez',
                    'Una sola vez',
                    'Lo cierra y no le vuelve a aparecer, aunque vuelva a entrar',
                  ],
                  [
                    'siempre',
                    'En cada inicio de sesión',
                    'Vuelve a aparecer cada vez que la persona entra al portal',
                  ],
                ] as [FrecuenciaBanner, string, string][]
              ).map(([valor, etiqueta, ayuda]) => (
                <label key={valor} className="flex cursor-pointer items-start gap-2">
                  <input
                    type="radio"
                    name="frecuencia-banner"
                    checked={valorFrecuencia === valor}
                    onChange={() => setFrecuencia(valor)}
                    className="mt-0.5 accent-brand-700"
                  />
                  <span>
                    <span className="block text-sm text-brand-900">{etiqueta}</span>
                    <span className="block text-xs text-brand-900/50">{ayuda}</span>
                  </span>
                </label>
              ))}
            </div>

            {/* Si cambiás algo del banner, vuelve a aparecerle incluso a
                quien ya lo había cerrado. Conviene decirlo: es lo que hace
                que un aviso nuevo llegue a todos, pero también lo que
                explica que reaparezca tras una corrección de una coma. */}
            <p className="mt-2 rounded-md bg-brand-900/[0.04] px-2.5 py-1.5 text-xs text-brand-900/55">
              Cualquier cambio que guardes acá vuelve a mostrarles el banner a todos, incluso a
              quienes ya lo habían cerrado.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Título</label>
            <input
              value={valorTitulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              placeholder="Ej. Cambio en el horario de recepción"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Mensaje</label>
            <textarea
              value={valorMensaje}
              onChange={(e) => setMensaje(e.target.value)}
              rows={3}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              placeholder="El texto que acompaña a la imagen o al video. Puede ir vacío."
            />
          </div>
        </div>

        {guardar.isError && (
          <p className="mt-2 text-sm text-brand-wine">{mensajeDeError(guardar.error, 'No se pudo guardar.')}</p>
        )}

        <div className="mt-3">
          <Button onClick={() => guardar.mutate(encendido)} isLoading={guardar.isPending}>
            Guardar texto
          </Button>
        </div>
      </Card>

      <Card>
        <h3 className="font-medium text-brand-900">Imágenes y video</h3>
        <p className="mt-0.5 mb-4 text-sm text-brand-900/60">
          Podés subir una sola imagen, varias (se muestran como carrusel, en orden) o un video.
          Imágenes JPG, PNG, WEBP o GIF; videos MP4 o WEBM, hasta 20 MB.
        </p>

        {(banner?.piezas ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-brand-900/50">
            Todavía no hay nada cargado.
          </p>
        ) : (
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 items-start">
            {(banner?.piezas ?? []).map((pieza) => (
              <div
                key={pieza.id_banner_informativo}
                className={`overflow-hidden rounded-lg border ${
                  pieza.activo ? 'border-brand-900/10' : 'border-dashed border-brand-900/20 opacity-60'
                }`}
              >
                {/* SIN aspect-video: forzar formato apaisado a un afiche
                    vertical lo dejaba diminuto entre dos franjas negras.
                    Se cap a la altura y la imagen conserva su proporción,
                    sobre un fondo claro para que el sobrante no parezca
                    un error de carga. */}
                <div className="flex items-center justify-center bg-brand-900/[0.04] p-2">
                  {pieza.tipo_media === 'video' ? (
                    <video
                      src={pieza.url_media ?? undefined}
                      className="max-h-72 w-auto max-w-full object-contain"
                      controls
                    />
                  ) : (
                    <img
                      src={pieza.url_media ?? undefined}
                      alt={pieza.titulo ?? 'Pieza del banner'}
                      className="block h-auto max-h-72 w-auto max-w-full object-contain"
                    />
                  )}
                </div>

                <div className="px-3 py-2">
                  {pieza.titulo && <p className="truncate text-sm font-medium text-brand-900">{pieza.titulo}</p>}
                  {pieza.descripcion && (
                    <p className="line-clamp-2 text-xs text-brand-900/55">{pieza.descripcion}</p>
                  )}

                  <div className="mt-1.5 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs"
                      onClick={() => cambiarActivoPieza.mutate(pieza)}
                    >
                      {pieza.activo ? 'Ocultar' : 'Mostrar'}
                    </Button>
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs text-brand-wine"
                      onClick={() => borrarPieza.mutate(pieza.id_banner_informativo)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-md border border-brand-900/10 p-3">
          <p className="mb-2 text-sm font-medium text-brand-900">Agregar</p>

          <div className="grid gap-3">
            <div>
              <input
                type="file"
                accept={TIPOS_ACEPTADOS.join(',')}
                onChange={(e) => elegirArchivo(e.target.files?.[0] ?? null)}
                disabled={agregarPieza.isPending}
                className="text-sm"
              />
              <p className="mt-1 text-xs text-brand-900/45">
                JPG, PNG, WEBP, GIF, MP4 o WEBM. Hasta {banner?.max_mb ?? 10} MB.
              </p>
            </div>

            {/* La vista previa es LOCAL, del archivo elegido: se ve antes
                de subir nada y confirma que es el que se quería. */}
            {vistaPrevia && archivo && (
              <div className="flex items-start gap-3 rounded-md bg-brand-900/[0.03] p-2">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded bg-brand-900">
                  {archivo.type.startsWith('video') ? (
                    <video src={vistaPrevia} className="h-full w-full object-contain" muted />
                  ) : (
                    <img src={vistaPrevia} alt="Vista previa" className="h-full w-full object-contain" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-brand-900">{archivo.name}</p>
                  <p className="text-xs text-brand-900/50">
                    {(archivo.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                  {!agregarPieza.isPending && (
                    <button
                      onClick={() => elegirArchivo(null)}
                      className="mt-1 text-xs text-brand-wine hover:underline"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              </div>
            )}

            <input
              value={tituloPieza}
              onChange={(e) => setTituloPieza(e.target.value)}
              disabled={agregarPieza.isPending}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              placeholder="Título de esta imagen (opcional)"
            />
            <input
              value={descripcionPieza}
              onChange={(e) => setDescripcionPieza(e.target.value)}
              disabled={agregarPieza.isPending}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              placeholder="Descripción (opcional)"
            />
          </div>

          {errorArchivo && <p className="mt-2 text-sm text-brand-wine">{errorArchivo}</p>}

          {agregarPieza.isError && (
            <p className="mt-2 text-sm text-brand-wine">
              {mensajeDeError(agregarPieza.error, 'No se pudo subir el archivo.')}
            </p>
          )}

          {/* La barra de progreso es lo que distingue "subiendo" de
              "colgado". Al llegar a 100 el archivo terminó de viajar pero
              el servidor todavía lo está guardando y optimizando, así que
              el texto cambia en vez de quedarse clavado en 100%. */}
          {progreso !== null && (
            <div className="mt-3">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-brand-900/10">
                <div
                  className="h-full rounded-full bg-brand-700 transition-all duration-200"
                  style={{ width: `${progreso}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-brand-900/55">
                {progreso < 100 ? `Subiendo... ${progreso}%` : 'Procesando el archivo en el servidor...'}
              </p>
            </div>
          )}

          <div className="mt-3">
            <Button
              onClick={() => agregarPieza.mutate()}
              isLoading={agregarPieza.isPending}
              disabled={!archivo || agregarPieza.isPending}
            >
              {agregarPieza.isPending ? 'Subiendo' : 'Subir'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
