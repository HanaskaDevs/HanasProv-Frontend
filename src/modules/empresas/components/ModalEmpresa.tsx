import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as empresasApi from '../api/empresasApi';
import type { Empresa } from '../types';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const schema = z.object({
  razon_social: z.string().min(1, 'Requerido'),
  ruc: z.string().min(13, 'El RUC debe tener 13 dígitos').max(13, 'El RUC debe tener 13 dígitos'),
  nombre_comercial: z.string().optional(),
  empresa_bc: z.string().optional(),
  logo_url: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ModalEmpresa({ empresa, onClose }: { empresa: Empresa | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const esEdicion = !!empresa;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      razon_social: empresa?.razon_social ?? '',
      ruc: empresa?.ruc ?? '',
      nombre_comercial: empresa?.nombre_comercial ?? '',
      empresa_bc: empresa?.empresa_bc ?? '',
      logo_url: empresa?.logo_url ?? '',
    },
  });

  const guardar = useMutation({
    mutationFn: (values: FormValues) =>
      esEdicion ? empresasApi.actualizarEmpresa(empresa!.id_empresa, values) : empresasApi.crearEmpresa(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empresas'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-4">
          {esEdicion ? 'Editar empresa' : 'Nueva empresa'}
        </h2>

        <form onSubmit={handleSubmit((values) => guardar.mutate(values))} className="space-y-4">
          <Input label="Razón social" {...register('razon_social')} error={errors.razon_social?.message} />
          <Input label="RUC" {...register('ruc')} error={errors.ruc?.message} />
          <Input label="Nombre comercial (opcional)" {...register('nombre_comercial')} />
          <Input label="Código Business Central (opcional)" {...register('empresa_bc')} />
          <Input label="URL del logo (opcional)" {...register('logo_url')} />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting || guardar.isPending}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}