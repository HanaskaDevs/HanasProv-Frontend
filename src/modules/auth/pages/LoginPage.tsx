import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import AuthLayout from '../../../shared/layouts/AuthLayout';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const loginSchema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

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
        setErrorGeneral('Las credenciales no son válidas.');
      } else {
        setErrorGeneral('Ocurrió un error al iniciar sesión. Intenta de nuevo.');
      }
    }
  }

  return (
    <AuthLayout title="Iniciar sesión" subtitle="Portal de Proveedores">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />
        <Input label="Contraseña" type="password" {...register('password')} error={errors.password?.message} />

        {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Ingresar
        </Button>

        <div className="text-center pt-1">
          <Link to="/olvide-password" className="text-sm text-brand-700 hover:underline">
            Olvidé mi contraseña
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
