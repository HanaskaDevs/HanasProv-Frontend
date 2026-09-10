import { useState } from 'react';
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

const schema = z.object({
  nombre_producto: z.string().min(1, 'El nombre es requerido'),
  codigo_barras: z.string().optional(),
  id_unidad_presentacion: z.coerce.number().min(1, 'Selecciona una unidad'),
  precio: numeroOpcional('El precio debe ser positivo'),
  peso: numeroOpcional('El peso debe ser positivo'),
  volumen: numeroOpcional('El volumen debe ser positivo'),
  unidad_por_caja: z.preprocess(
    (valor) => (valor === '' || valor === null || valor === undefined ? undefined : valor),
    z.coerce.number().int().min(1, 'Debe ser al menos 1').optional()
  ),
});

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
          volumen: producto.volumen ?? '',
          unidad_por_caja: producto.unidad_por_caja ?? '',
        }
      : undefined,
  });

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
    <Modal onClose={onClose} title={esEdicion ? 'Editar producto' : 'Nuevo producto'}>
      <form onSubmit={handleSubmit((values) => guardar.mutate(values))} className="space-y-4">
        {reenviaACalificacion && (
          <div className="rounded-md bg-amber-50 border border-amber-200 px-3 py-2 flex gap-2">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-700 shrink-0 mt-0.5">
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <p className="text-[12.5px] text-amber-900 leading-relaxed">
              Este producto <strong>ya está aprobado</strong>. Si guardas cambios volverá a calificación y
              quedará en revisión hasta que lo aprueben de nuevo.
            </p>
          </div>
        )}

        <Input
          label="Nombre del producto"
          {...restNombre}
          onChange={handleNombreChange}
          error={errors.nombre_producto?.message}
          style={{ textTransform: 'uppercase' }}
        />

        <Input label="Código de barras" {...register('codigo_barras')} error={errors.codigo_barras?.message} />

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-brand-900">Unidad de presentación</label>
          {/* Sin defaultValue ni key de por medio: el id ya viene en
              defaultValues del formulario (lo expone ProductoResource), así
              que react-hook-form deja el <select> en la unidad correcta
              desde el primer render, sin depender de que el catálogo haya
              terminado de cargar ni de comparar por nombre. */}
          <select
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

        <div>
          <Input
            label="Precio"
            type="number"
            step="0.01"
            disabled={precioBloqueado}
            {...register('precio')}
            error={errors.precio?.message}
          />
          {precioBloqueado && (
            <p className="text-[12px] text-amber-700 mt-1">
              Hay una solicitud de cambio de precio pendiente de aprobación; el precio no se puede editar hasta
              que se resuelva.
            </p>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Input label="Peso (kg)" type="number" step="0.001" {...register('peso')} error={errors.peso?.message} />
          <Input label="Volumen (m³)" type="number" step="0.001" {...register('volumen')} error={errors.volumen?.message} />
          <Input
            label="Unidad por caja"
            type="number"
            step="1"
            {...register('unidad_por_caja')}
            error={errors.unidad_por_caja?.message}
          />
        </div>

        <SelectorGruposProducto seleccionados={grupos} onCambiar={setGrupos} />

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
