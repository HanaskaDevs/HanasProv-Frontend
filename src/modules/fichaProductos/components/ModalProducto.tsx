import { useMemo, useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import type { IdProveedorObjetivo } from '../api/productosApi';
import type { Producto } from '../types';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import SelectorGruposProducto from './SelectorGruposProducto';

/**
 * Un campo numérico vacío es "no lo sé", no "cero".
 *
 * z.coerce.number() a secas convierte "" en 0, así que borrar el peso de un
 * producto para dejarlo sin dato lo guardaba como 0 kg. Con el preprocess,
 * el campo vacío llega como undefined y el backend lo guarda NULL.
 */
const numeroOpcional = (mensaje: string) =>
  z.preprocess(
    (valor) => (valor === '' || valor === null || valor === undefined ? undefined : valor),
    z.coerce.number().min(0, mensaje).optional()
  );

/** Igual que numeroOpcional pero para cantidades (enteros, mínimo 1). */
const enteroOpcional = () =>
  z.preprocess(
    (valor) => (valor === '' || valor === null || valor === undefined ? undefined : valor),
    z.coerce.number().int().min(1, 'Debe ser al menos 1').optional()
  );

/** Medida en centímetros: opcional, y si se pone tiene que ser > 0. */
const medidaCm = () =>
  z.preprocess(
    (valor) => (valor === '' || valor === null || valor === undefined ? undefined : valor),
    z.coerce.number().positive('Debe ser mayor a 0').max(999999.99).optional()
  );

const schema = z.object({
  nombre_producto: z.string().min(1, 'El nombre es requerido'),
  codigo_barras: z.string().optional(),
  id_unidad_presentacion: z.coerce.number().min(1, 'Selecciona una unidad'),
  precio: numeroOpcional('El precio debe ser positivo'),
  peso: numeroOpcional('El peso debe ser positivo'),
  // "Unidades x Masterpack (caja)" en pantalla; el nombre del campo sigue
  // siendo el histórico para no migrar la columna ni los 300 productos ya
  // cargados.
  unidad_por_caja: enteroOpcional(),
  contenido_paquete: enteroOpcional(),
  masterpack_largo_cm: medidaCm(),
  masterpack_ancho_cm: medidaCm(),
  masterpack_alto_cm: medidaCm(),
  unidad_largo_cm: medidaCm(),
  unidad_ancho_cm: medidaCm(),
  unidad_alto_cm: medidaCm(),
  // 'volumen' no está: se calcula de las medidas de la unidad y lo escribe
  // el backend (ver ProductoService::volumenDeLaUnidad).
});

/**
 * Encabezado de sección. Cuatro bloques cortos y rotulados se recorren
 * mucho mejor que trece campos seguidos: el formulario creció de 6 campos
 * a 16 y sin agrupar era una lista plana donde nada se relacionaba con
 * nada.
 */
function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="font-display text-[11px] font-bold uppercase tracking-wide text-brand-900/40">
        {titulo}
      </h3>
      {children}
    </section>
  );
}

/**
 * Fila de dos campos.
 *
 * items-start (el de por sí, escrito igual para que se lea la intención):
 * cada celda es label + input, y si una muestra un error de validación
 * crece solo ella hacia abajo sin mover a la de al lado. Lo que NO puede
 * pasar es que una etiqueta ocupe dos líneas y la otra una -ahí los
 * recuadros arrancan a distinta altura y la fila se ve chueca, que es
 * justo lo que había-. Por eso las etiquetas de acá son cortas.
 */
function Fila({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 items-start">{children}</div>;
}

/**
 * Las tres medidas de una caja o de una unidad, con su volumen calculado
 * al lado del título.
 *
 * Van juntas porque son un solo dato en tres partes. La unidad ("cm") no
 * va en la etiqueta sino DENTRO de cada campo, como sufijo: la etiqueta se
 * lee una vez al llegar y después se olvida, y en tres casillas iguales esa
 * es la diferencia entre cargar 50 cm y cargar 50 m. Además así la etiqueta
 * entra en una línea, que es lo que mantiene la fila alineada.
 */
function Medidas({
  titulo,
  volumen,
  children,
}: {
  titulo: string;
  volumen: number | null;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-brand-900/10 bg-brand-900/[0.015] p-3">
      <div className="flex items-baseline justify-between gap-2 mb-2">
        <p className="text-[12px] font-medium text-brand-900/70">
          {titulo} <span className="font-normal text-brand-900/35">· opcional</span>
        </p>

        {/* El volumen vive acá, junto al título del grupo del que sale, y
            no como un renglón suelto al pie: así se lee como el resultado
            de estas tres medidas y no como un campo más. */}
        {volumen !== null && (
          <span className="shrink-0 rounded-full bg-brand-200 px-2 py-0.5 text-[11px] font-semibold text-brand-700 tabular-nums">
            {volumen.toFixed(6)} m³
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">{children}</div>
    </div>
  );
}

/** Lo que se muestra bajo las medidas de la unidad, en m³. Null si falta alguna. */
function volumenEnM3(largo?: number, ancho?: number, alto?: number): number | null {
  if (!largo || !ancho || !alto) return null;

  // /1.000.000 = paso de cm³ a m³ (100³). Mismo cálculo que hace el
  // backend al guardar; acá es solo la vista previa.
  return (largo * ancho * alto) / 1_000_000;
}

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

/**
 * ¿Este producto se puede editar?
 *
 * Es EXACTAMENTE la misma regla que aplica el backend
 * (ProductoService::actualizar). Lo único que NO se edita es un producto
 * que está en revisión en este preciso momento: hay alguien de Calidad
 * mirándolo y cambiarle los datos por debajo le haría aprobar o rechazar
 * algo distinto de lo que tiene en pantalla.
 *
 * Un producto YA APROBADO sí se edita (decisión del usuario,
 * 10-sep-2026), con la consecuencia de que vuelve a calificación -ver
 * volveraCalificacion.
 *
 * Está acá para no ofrecer un botón que el servidor va a rechazar con 403,
 * no para decidir el permiso: quien decide sigue siendo el backend.
 */
export function sePuedeEditar(producto: Producto, correccionesPendientes: boolean): boolean {
  if (!producto.bloqueado) return true;
  if (producto.estado_calificacion === 'Aprobado') return true;

  return correccionesPendientes && producto.estado_calificacion === 'Rechazado';
}

/**
 * ¿Guardar este producto lo va a mandar de vuelta a calificación?
 *
 * Solo pasa con los que ya estaban aprobados. Hay que avisarlo ANTES de
 * guardar: corregirle una tilde al nombre a un producto aprobado le
 * hace perder la aprobación hasta que Calidad lo vuelva a mirar, y eso
 * no es algo que nadie pueda adivinar.
 */
export function volveraCalificacion(producto?: Producto): boolean {
  return producto?.estado_calificacion === 'Aprobado';
}

export default function ModalProducto({
  onClose,
  producto,
  idProveedor,
}: {
  onClose: () => void;
  /** Sin producto = alta. Con producto = edición. */
  producto?: Producto;
  /** Sin id = el propio proveedor. Con id = el comprador sobre ese proveedor. */
  idProveedor?: IdProveedorObjetivo;
}) {
  const queryClient = useQueryClient();
  const esEdicion = !!producto;

  const [grupos, setGrupos] = useState<number[]>(
    producto?.grupos?.map((g) => g.id_grupo_producto) ?? []
  );
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const { data: unidades } = useQuery({
    queryKey: ['unidades-presentacion'],
    queryFn: productosApi.listarUnidadesPresentacion,
  });

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: producto
      ? {
          nombre_producto: producto.nombre_producto,
          codigo_barras: producto.codigo_barras ?? '',
          id_unidad_presentacion: producto.id_unidad_presentacion,
          precio: producto.precio ?? '',
          peso: producto.peso ?? '',
          unidad_por_caja: producto.unidad_por_caja ?? '',
          contenido_paquete: producto.contenido_paquete ?? '',
          masterpack_largo_cm: producto.masterpack_largo_cm ?? '',
          masterpack_ancho_cm: producto.masterpack_ancho_cm ?? '',
          masterpack_alto_cm: producto.masterpack_alto_cm ?? '',
          unidad_largo_cm: producto.unidad_largo_cm ?? '',
          unidad_ancho_cm: producto.unidad_ancho_cm ?? '',
          unidad_alto_cm: producto.unidad_alto_cm ?? '',
        }
      : undefined,
  });

  /*
   * "Contenido x paquete" solo existe cuando la unidad elegida es
   * Paquete. Se compara contra el NOMBRE que trae el catálogo y no contra
   * un id escrito a mano: las unidades se administran desde Catálogos y
   * sus ids pueden ser otros en otro entorno.
   */
  const idUnidadElegida = Number(watch('id_unidad_presentacion')) || 0;
  const esPaquete =
    unidades?.find((u) => u.Id_Unidad_Presentacion === idUnidadElegida)?.Nombre_Unidad === 'Paquete';

  const [largoUnidad, anchoUnidad, altoUnidad, largoCaja, anchoCaja, altoCaja] = watch([
    'unidad_largo_cm',
    'unidad_ancho_cm',
    'unidad_alto_cm',
    'masterpack_largo_cm',
    'masterpack_ancho_cm',
    'masterpack_alto_cm',
  ]);

  // Los dos volúmenes se muestran en vivo mientras se cargan las medidas:
  // así se ve el efecto de lo que se escribe y un cero de más salta al
  // toque, en vez de descubrirse recién al guardar.
  const volumenUnidad = useMemo(
    () => volumenEnM3(Number(largoUnidad) || 0, Number(anchoUnidad) || 0, Number(altoUnidad) || 0),
    [largoUnidad, anchoUnidad, altoUnidad]
  );

  const volumenMasterpack = useMemo(
    () => volumenEnM3(Number(largoCaja) || 0, Number(anchoCaja) || 0, Number(altoCaja) || 0),
    [largoCaja, anchoCaja, altoCaja]
  );

  /**
   * El "obligatorio si es Paquete" se comprueba acá y no en el esquema de
   * zod: depende del catálogo de unidades, que llega por red después de
   * montar el formulario, y cambiar el resolver de react-hook-form una vez
   * montado no es confiable. El backend lo valida igual (ver
   * GuardarProductoRequest), esto solo evita el viaje al servidor.
   */
  function alEnviar(values: FormOutput) {
    if (esPaquete && !values.contenido_paquete) {
      setError('contenido_paquete', { message: 'Indica cuántas unidades trae el paquete.' });
      return;
    }

    guardar.mutate(values);
  }

  const guardar = useMutation({
    mutationFn: (values: FormOutput) => {
      const payload = { ...values, grupos };

      return esEdicion
        ? productosApi.actualizarProducto(producto.id_producto, payload, idProveedor)
        : productosApi.crearProducto(payload, idProveedor);
    },
    onSuccess: () => {
      // Por PREFIJO: alcanza con la primera clave para invalidar todas las
      // páginas/filtros y también las del comprador (ver ListaProductos).
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      queryClient.invalidateQueries({ queryKey: ['proveedores-con-productos'] });

      // Solo se celebra un alta. Corregir un dato no es un logro.
      if (!esEdicion) {
        window.dispatchEvent(new Event('hana:celebrar'));
      }

      onClose();
    },
    onError: (error) => {
      const respuesta = axios.isAxiosError(error) ? error.response?.data : null;
      const deValidacion = respuesta?.errors
        ? (Object.values(respuesta.errors).flat() as string[]).join(' ')
        : null;

      setErrorServidor(deValidacion ?? respuesta?.message ?? 'No se pudo guardar. Intenta de nuevo.');
    },
  });

  // Muestra el texto en mayúsculas en vivo mientras se escribe, sin importar
  // si tipea en minúsculas o intercalado. El backend igual vuelve a
  // normalizar al guardar, esto es solo para que la vista previa coincida
  // con el resultado final.
  const { onChange: onChangeNombre, ...restNombre } = register('nombre_producto');

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mayusculas = e.target.value.toUpperCase();
    setValue('nombre_producto', mayusculas, { shouldValidate: true });
    e.target.value = mayusculas;
    onChangeNombre(e);
  }

  const precioBloqueado = !!producto?.precio_en_revision;
  const reenviaACalificacion = volveraCalificacion(producto);

  return (
    <Modal onClose={onClose} title={esEdicion ? 'Editar producto' : 'Nuevo producto'} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit(alEnviar)} className="space-y-5">
        {reenviaACalificacion && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 flex gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700 shrink-0 mt-0.5">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              Este producto <strong>ya está aprobado</strong>. Si guardas cambios —el precio incluido— volverá
              a calificación y quedará en revisión hasta que lo aprueben de nuevo.
            </p>
          </div>
        )}

        <Seccion titulo="Identificación">
          <Input
            label="Nombre del producto"
            {...restNombre}
            onChange={handleNombreChange}
            error={errors.nombre_producto?.message}
            style={{ textTransform: 'uppercase' }}
          />

          <Fila>
            <Input label="Código de barras" {...register('codigo_barras')} error={errors.codigo_barras?.message} />
            <div>
              <Input
                label="Precio"
                sufijo="USD"
                type="number"
                step="0.01"
                disabled={precioBloqueado}
                {...register('precio')}
                error={errors.precio?.message}
              />
              {precioBloqueado && (
                <p className="text-[12px] text-amber-700 mt-1">
                  Hay un cambio de precio pendiente de aprobación; no se puede editar hasta que se resuelva.
                </p>
              )}
            </div>
          </Fila>
        </Seccion>

        <Seccion titulo="Presentación">
          <Fila>
            <div className="flex flex-col gap-1">
              <label htmlFor="id_unidad_presentacion" className="text-sm font-medium text-brand-900">
                Unidad
              </label>
              {/* Sin defaultValue ni key de por medio: el id ya viene en
                  defaultValues del formulario (lo expone ProductoResource),
                  así que react-hook-form deja el <select> en la unidad
                  correcta desde el primer render, sin depender de que el
                  catálogo haya terminado de cargar ni de comparar por nombre. */}
              <select
                id="id_unidad_presentacion"
                {...register('id_unidad_presentacion')}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900 focus:outline-none focus:ring-2 focus:ring-brand-700"
              >
                <option value="">Selecciona...</option>
                {unidades?.map((u) => (
                  <option key={u.Id_Unidad_Presentacion} value={u.Id_Unidad_Presentacion}>
                    {u.Nombre_Unidad}
                  </option>
                ))}
              </select>
              {errors.id_unidad_presentacion && (
                <span className="text-xs text-brand-wine">{errors.id_unidad_presentacion.message}</span>
              )}
            </div>

            {/* Solo aplica al Paquete, y ocupa la celda de al lado de la
                unidad -aparece justo donde se acaba de elegir "Paquete", no
                empujando el resto del formulario hacia abajo-. */}
            {esPaquete && (
              <Input
                label="Contenido x paquete"
                type="number"
                step="1"
                min="1"
                placeholder="¿Cuántas unidades trae?"
                {...register('contenido_paquete')}
                error={errors.contenido_paquete?.message}
              />
            )}
          </Fila>
        </Seccion>

        <Seccion titulo="Empaque y medidas">
          {/* Cuántas unidades trae la caja va ANTES de sus medidas: primero
              se dice qué es el masterpack y recién después cuánto mide. */}
          <Fila>
            <Input
              label="Unidades x Masterpack"
              type="number"
              step="1"
              min="1"
              {...register('unidad_por_caja')}
              error={errors.unidad_por_caja?.message}
            />
            <Input label="Peso" sufijo="kg" type="number" step="0.001" {...register('peso')} error={errors.peso?.message} />
          </Fila>

          <Medidas titulo="Masterpack (caja)" volumen={volumenMasterpack}>
            <Input label="Largo" sufijo="cm" type="number" step="0.01" min="0" {...register('masterpack_largo_cm')} error={errors.masterpack_largo_cm?.message} />
            <Input label="Ancho" sufijo="cm" type="number" step="0.01" min="0" {...register('masterpack_ancho_cm')} error={errors.masterpack_ancho_cm?.message} />
            <Input label="Altura" sufijo="cm" type="number" step="0.01" min="0" {...register('masterpack_alto_cm')} error={errors.masterpack_alto_cm?.message} />
          </Medidas>

          <Medidas titulo="Unidad" volumen={volumenUnidad}>
            <Input label="Largo" sufijo="cm" type="number" step="0.01" min="0" {...register('unidad_largo_cm')} error={errors.unidad_largo_cm?.message} />
            <Input label="Ancho" sufijo="cm" type="number" step="0.01" min="0" {...register('unidad_ancho_cm')} error={errors.unidad_ancho_cm?.message} />
            <Input label="Altura" sufijo="cm" type="number" step="0.01" min="0" {...register('unidad_alto_cm')} error={errors.unidad_alto_cm?.message} />
          </Medidas>

          {volumenUnidad === null && volumenMasterpack === null && (
            <p className="text-[12px] text-brand-900/40">
              El volumen se calcula solo cuando cargues las tres medidas de cada uno.
            </p>
          )}
        </Seccion>

        <Seccion titulo="Clasificación">
          <SelectorGruposProducto seleccionados={grupos} onCambiar={setGrupos} />
        </Seccion>

        {errorServidor && (
          <p className="text-xs text-brand-wine bg-brand-wine/5 border border-brand-wine/15 rounded-md px-3 py-2">
            {errorServidor}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting || guardar.isPending}>
            {/* El botón dice lo que realmente va a pasar: en un producto
                aprobado, "Guardar cambios" escondería que además pierde la
                aprobación. */}
            {reenviaACalificacion ? 'Guardar y enviar a aprobación' : esEdicion ? 'Guardar cambios' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
