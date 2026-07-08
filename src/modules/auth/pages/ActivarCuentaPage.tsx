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
    nombre_completo: z.string().min(1, 'El nombre completo es requerido'),
    cargo: z.string().optional(),
    telefono: z.string().optional(),
    password_nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    password_nueva_confirmation: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.password_nueva === data.password_nueva_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_nueva_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

/**
 * A esta pantalla llega el usuario desde el enlace/código que recibió por
 * correo (código de 20 min, tipo "Bienvenida" o "Reset"). Si viene con
 * ?email=... en la URL, se precarga (el correo suele traer ese link armado).
 */
export default function ActivarCuentaPage() {
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
    defaultValues: {
      email: searchParams.get('email') ?? '',
      codigo: searchParams.get('codigo') ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await authApi.activarCuenta({
        email: values.email,
        codigo: values.codigo,
        password_nueva: values.password_nueva,
        password_nueva_confirmation: values.password_nueva_confirmation,
        nombre_completo: values.nombre_completo,
        cargo: values.cargo || undefined,
        telefono: values.telefono || undefined,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo activar la cuenta.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  if (exito) {
    return (
      <AuthLayout title="Cuenta activada">
        <p className="text-sm text-brand-900/70">
          Tu cuenta quedó activada correctamente. Serás redirigido al inicio de sesión...
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Activa tu cuenta" subtitle="Ingresa el código que recibiste por correo">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Código de activación" {...register('codigo')} error={errors.codigo?.message} />
        <Input label="Nombre completo" {...register('nombre_completo')} error={errors.nombre_completo?.message} />
        <Input label="Cargo (opcional)" {...register('cargo')} />
        <Input label="Teléfono (opcional)" {...register('telefono')} />
        <Input
          label="Nueva contraseña"
          type="password"
          {...register('password_nueva')}
          error={errors.password_nueva?.message}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          {...register('password_nueva_confirmation')}
          error={errors.password_nueva_confirmation?.message}
        />

        {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Activar cuenta
        </Button>
      </form>
    </AuthLayout>
  );
}
