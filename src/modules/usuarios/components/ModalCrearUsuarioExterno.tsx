import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { crearExterno } from '../api/usuariosApi';

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type FormValues = z.infer<typeof schema>;

export default function ModalCrearUsuarioExterno({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado: () => void;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await crearExterno(values.email);
      onCreado();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo crear el usuario.');
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorGeneral('No tienes permiso para crear usuarios externos.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">Nuevo usuario externo</h2>
        <p className="text-sm text-brand-900/60 mb-4">
          Se enviará un código de activación al correo del proveedor. Podrá completar
          su Ficha de Proveedor una vez active su cuenta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Correo del proveedor" type="email" {...register('email')} error={errors.email?.message} />

          {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
