import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import * as authApi from '../api/authApi';
import AuthLayout from '../../../shared/layouts/AuthLayout';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';

const schema = z.object({
  email: z.string().email('Correo inválido'),
});

type FormValues = z.infer<typeof schema>;

export default function OlvidePasswordPage() {
  const navigate = useNavigate();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    setMensajeExito(null);
    try {
      await authApi.olvidePassword(values.email);
      setMensajeExito('Si el correo existe y está activo, se envió un código de recuperación.');
      setTimeout(() => navigate(`/activar-cuenta?email=${encodeURIComponent(values.email)}`), 2000);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo procesar la solicitud.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  return (
    <AuthLayout title="Olvidé mi contraseña" subtitle="Te enviaremos un código de recuperación">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />

        {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}
        {mensajeExito && <p className="text-sm text-emerald-700">{mensajeExito}</p>}

        <Button type="submit" isLoading={isSubmitting} className="w-full">
          Enviar código
        </Button>

        <div className="text-center pt-1">
          <Link to="/login" className="text-sm text-brand-700 hover:underline">
            Volver al inicio de sesión
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
