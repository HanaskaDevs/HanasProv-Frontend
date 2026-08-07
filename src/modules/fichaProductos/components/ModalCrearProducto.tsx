import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const schema = z.object({
  nombre_producto: z.string().min(1, 'El nombre es requerido'),
  codigo_barras: z.string().optional(),
  id_unidad_presentacion: z.coerce.number().min(1, 'Selecciona una unidad'),
  precio: z.coerce.number().min(0, 'El precio debe ser positivo').optional(),
  peso: z.coerce.number().min(0, 'El peso debe ser positivo').optional(),
  volumen: z.coerce.number().min(0, 'El volumen debe ser positivo').optional(),
  unidad_por_caja: z.coerce.number().int().min(1, 'Debe ser al menos 1').optional(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function ModalCrearProducto({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();

  const { data: unidades } = useQuery({
    queryKey: ['unidades-presentacion'],
    queryFn: productosApi.listarUnidadesPresentacion,
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });

  const crear = useMutation({
    mutationFn: (values: FormOutput) => productosApi.crearProducto(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      window.dispatchEvent(new Event('hana:celebrar'));
      onClose();
    },
  });

  // Muestra el texto en mayúsculas en vivo mientras el proveedor escribe,
  // sin importar si tipea en minúsculas o intercalado. El backend igual
  // vuelve a normalizar al guardar, esto es solo para que la vista previa
  // coincida con el resultado final.
  const { onChange: onChangeNombre, ...restNombre } = register('nombre_producto');

  function handleNombreChange(e: React.ChangeEvent<HTMLInputElement>) {
    const mayusculas = e.target.value.toUpperCase();
    setValue('nombre_producto', mayusculas, { shouldValidate: true });
    e.target.value = mayusculas;
    onChangeNombre(e);
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-4">Nuevo producto</h2>

        <form onSubmit={handleSubmit((values) => crear.mutate(values))} className="space-y-4">
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

          <Input label="Precio" type="number" step="0.01" {...register('precio')} error={errors.precio?.message} />

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

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting || crear.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}