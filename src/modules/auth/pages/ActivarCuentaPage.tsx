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
    cargo: z.string().min(1, 'El cargo es requerido'),
    telefono: z.string().min(1, 'El teléfono es requerido'),
    password_nueva: z.string().min(8, 'Mínimo 8 caracteres'),
    password_nueva_confirmation: z.string().min(1, 'Requerido'),
  })
  .refine((data) => data.password_nueva === data.password_nueva_confirmation, {
    message: 'Las contraseñas no coinciden',
    path: ['password_nueva_confirmation'],
  });

type FormValues = z.infer<typeof schema>;

function CampoOscuro({ label, className = '', ...props }: { label: string } & Parameters<typeof Input>[0]) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
        {label}
      </label>
      <Input
        {...props}
        errorClassName="text-brand-yellow"
        toggleClassName="text-white/50 hover:text-white/80"
        className={`!bg-black/30 !border-white/25 !text-white placeholder:!text-white/40 shadow-lg focus:!ring-brand-yellow focus:!border-brand-yellow/60 ${className}`}
      />
    </div>
  );
}

const TOTAL_PASOS = 3;

export default function ActivarCuentaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paso, setPaso] = useState(1);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [exito, setExito] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: searchParams.get('email') ?? '',
      codigo: searchParams.get('codigo') ?? '',
    },
  });

  async function irSiguiente() {
    const camposPorPaso: Record<number, (keyof FormValues)[]> = {
      1: ['email', 'codigo'],
      2: ['nombre_completo', 'cargo', 'telefono'],
    };
    const valido = await trigger(camposPorPaso[paso]);
    if (valido) setPaso((p) => p + 1);
  }

  function irAtras() {
    setPaso((p) => p - 1);
  }

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await authApi.activarCuenta({
        email: values.email,
        codigo: values.codigo,
        password_nueva: values.password_nueva,
        password_nueva_confirmation: values.password_nueva_confirmation,
        nombre_completo: values.nombre_completo,
        cargo: values.cargo,
        telefono: values.telefono,
      });
      setExito(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo activar la cuenta.');
        // Un código inválido/expirado solo se detecta al guardar (paso 3) -> regresamos al paso 1
        if (errores?.codigo) setPaso(1);
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  if (exito) {
    return (
      <AuthLayout title="Cuenta activada">
        <p className="text-sm text-white/80 text-center" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
          Tu cuenta quedó activada correctamente. Serás redirigido al inicio de sesión...
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Activa tu cuenta" subtitle={`Paso ${paso} de ${TOTAL_PASOS}`}>
      <div className="flex gap-1.5 mb-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className={`h-1 flex-1 rounded-full ${n <= paso ? 'bg-brand-yellow' : 'bg-white/20'}`} />
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {paso === 1 && (
          <>
            <CampoOscuro label="Correo" type="email" {...register('email')} error={errors.email?.message} />
            <CampoOscuro label="Código de activación" {...register('codigo')} error={errors.codigo?.message} />
          </>
        )}

        {paso === 2 && (
          <>
            <CampoOscuro
              label="Nombre completo"
              {...register('nombre_completo')}
              error={errors.nombre_completo?.message}
            />
            <CampoOscuro label="Cargo" {...register('cargo')} error={errors.cargo?.message} />
            <CampoOscuro label="Teléfono" {...register('telefono')} error={errors.telefono?.message} />
          </>
        )}

        {paso === 3 && (
          <>
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
          </>
        )}

        {errorGeneral && (
          <p className="text-sm text-red-300" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
            {errorGeneral}
          </p>
        )}

        <div className="flex gap-2 pt-2">
          {paso > 1 && (
            <Button
              type="button"
              variant="ghost"
              onClick={irAtras}
              className="flex-1 !bg-white/10 !text-white hover:!bg-white/20 !border !border-white/25"
            >
              Atrás
            </Button>
          )}

          {paso < TOTAL_PASOS ? (
            <Button type="button" onClick={irSiguiente} className="flex-1">
              Siguiente
            </Button>
          ) : (
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Activar cuenta
            </Button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}