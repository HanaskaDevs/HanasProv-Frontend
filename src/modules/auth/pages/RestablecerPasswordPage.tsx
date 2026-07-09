import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import * as authApi from '../api/authApi';
import AuthLayout from '../../../shared/layouts/AuthLayout';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const schema = z
  .object({
    email: z.string().email('Correo inválido'),
    codigo: z.string().min(1, 'El código es requerido'),
    password_nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    password_nueva_confirmation: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.password_nueva === data.password_nueva_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_nueva_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

function CampoOscuro({ label, ...props }: { label: string } & Parameters<typeof Input>[0]) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white/90">{label}</label>
      <Input {...props} />
    </div>
  );
}

export default function RestablecerPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await authApi.activarCuenta({
        email: values.email,
        codigo: values.codigo,
        password_nueva: values.password_nueva,
        password_nueva_confirmation: values.password_nueva_confirmation,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo restablecer la contraseña.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  if (exito) {
    return (
      <AuthLayout title="Contraseña actualizada">
        <p className="text-sm text-white/80 text-center">
          Tu contraseña se actualizó correctamente. Serás redirigido al inicio de sesión...
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Restablecer contraseña" subtitle="Ingresa el código que recibiste por correo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <CampoOscuro label="Correo" type="email" {...register('email')} error={errors.email?.message} />
        <CampoOscuro label="Código de recuperación" {...register('codigo')} error={errors.codigo?.message} />
        <CampoOscuro
          label="Nueva contraseña"
          type="password"
          {...register('password_nueva')}
          error={errors.password_nueva?.message}
        />
        <CampoOscuro
          label="Confirmar contraseña"
          type="password"
          {...register('password_nueva_confirmation')}
          error={errors.password_nueva_confirmation?.message}
        />

        {errorGeneral && <p className="text-sm text-red-300">{errorGeneral}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Restablecer contraseña
        </Button>
      </form>
    </AuthLayout>
  );
}