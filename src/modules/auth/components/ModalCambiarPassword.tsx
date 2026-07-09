import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import * as authApi from '../api/authApi';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const schema = z
  .object({
    password_actual: z.string().min(1, 'Requerida'),
    password_nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    password_nueva_confirmation: z.string().min(1, 'Requerida'),
  })
  .refine((data) => data.password_nueva === data.password_nueva_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_nueva_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

export default function ModalCambiarPassword({ onClose }: { onClose: () => void }) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await authApi.cambiarPassword(values.password_actual, values.password_nueva, values.password_nueva_confirmation);
      setExito(true);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        setErrorGeneral('La contraseña actual no es correcta.');
      } else {
        setErrorGeneral('Ocurrió un error al cambiar la contraseña.');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-4">Cambiar contraseña</h2>

        {exito ? (
          <div className="space-y-4">
            <p className="text-sm text-brand-900/70">Tu contraseña se actualizó correctamente.</p>
            <Button className="w-full" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              {...register('password_actual')}
              error={errors.password_actual?.message}
            />
            <Input
              label="Contraseña nueva"
              type="password"
              {...register('password_nueva')}
              error={errors.password_nueva?.message}
            />
            <Input
              label="Confirmar contraseña nueva"
              type="password"
              {...register('password_nueva_confirmation')}
              error={errors.password_nueva_confirmation?.message}
            />

            {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Guardar
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}