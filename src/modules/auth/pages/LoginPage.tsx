import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../../../shared/layouts/AuthLayout';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { CLAVE_MOTIVO_SALIDA } from '../../../shared/api/apiClient';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  // Si al usuario lo sacó el interceptor por estar suspendido, se muestra
  // acá el motivo y se limpia -> es un aviso de una sola vez, no debe
  // reaparecer cada vez que vuelva a la pantalla de login.
  useEffect(() => {
    try {
      const motivo = sessionStorage.getItem(CLAVE_MOTIVO_SALIDA);
      if (motivo) {
        setErrorGeneral(motivo);
        sessionStorage.removeItem(CLAVE_MOTIVO_SALIDA);
      }
    } catch {
      // sin sessionStorage no hay motivo que mostrar, no pasa nada
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginFormValues) {
    setErrorGeneral(null);
    try {
      await login(values.email, values.password);
      navigate('/panel');
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        // Se muestra el mensaje que manda el backend, no uno fijo: además de
        // "credenciales no válidas", el login puede responder que la cuenta
        // está suspendida y hay que contactar al administrador (ver
        // AuthService::MENSAJE_ACCESO_SUSPENDIDO). Antes acá se pisaba
        // siempre con el texto de credenciales y ese aviso no se veía nunca.
        const errores = error.response.data?.errors as Record<string, string[]> | undefined;
        setErrorGeneral(
          errores ? Object.values(errores).flat()[0] : (error.response.data?.message ?? 'Las credenciales no son válidas.')
        );
      } else {
        setErrorGeneral('Ocurrió un error al iniciar sesión. Intenta de nuevo.');
      }
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Portal de Proveedores">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="animar-fila flex flex-col gap-1" style={{ animationDelay: '80ms' }}>
          <label className="text-sm font-medium text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
            Correo
          </label>
          <Input
            type="email"
            {...register('email')}
            error={errors.email?.message}
            className="!bg-black/30 !border-white/25 !text-white placeholder:!text-white/40 shadow-lg focus:!ring-brand-yellow focus:!border-brand-yellow/60"
          />
        </div>
        <div className="animar-fila flex flex-col gap-1" style={{ animationDelay: '140ms' }}>
          <label className="text-sm font-medium text-white/90" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
            Contraseña
          </label>
          <Input
            type="password"
            {...register('password')}
            error={errors.password?.message}
            errorClassName="text-brand-yellow"
            toggleClassName="text-white/50 hover:text-white/80"
            className="!bg-black/30 !border-white/25 !text-white placeholder:!text-white/40 shadow-lg focus:!ring-brand-yellow focus:!border-brand-yellow/60"
          />
        </div>

        {errorGeneral && (
          <p className="animar-fila text-sm text-red-300">{errorGeneral}</p>
        )}

        <div className="animar-fila" style={{ animationDelay: '200ms' }}>
          <Button type="submit" isLoading={isSubmitting} className="w-full">
            Ingresar
          </Button>
        </div>

        <div className="animar-fila text-center pt-1" style={{ animationDelay: '250ms' }}>
          <Link
            to="/olvide-password"
            className="text-sm text-white/80 hover:text-white hover:underline transition-colors"
            style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
          >
            Olvidé mi contraseña
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}