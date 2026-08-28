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
import RequisitosPassword from '../../../shared/components/RequisitosPassword';
import { passwordSegura } from '../../../shared/utils/reglasPassword';

const schema = z
  .object({
    email: z.string().email('Correo inválido'),
    codigo: z.string().min(1, 'El código es requerido'),
    nombre_completo: z.string().min(1, 'El nombre completo es requerido'),
    cargo: z.string().min(1, 'El cargo es requerido'),
    telefono: z.string().min(1, 'El teléfono es requerido'),
    // Solo se le piden a un proveedor en su primera activación (el servidor
    // lo dice en el paso 1), así que acá van opcionales: si se marcaran como
    // requeridos, un usuario interno no podría pasar del paso 2 por unos
    // campos que ni siquiera ve. La exigencia real se aplica más abajo,
    // cuando corresponde, y el backend la vuelve a validar igual.
    ruc: z.string().optional(),
    razon_social: z.string().optional(),
    password_nueva: passwordSegura,
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
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  /** Lo responde el servidor en el paso 1. */
  const [pideDatosProveedor, setPideDatosProveedor] = useState(false);

  const {
    register,
    handleSubmit,
    trigger,
    setError,
    getValues,
    watch,
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
      2: pideDatosProveedor
        ? ['nombre_completo', 'cargo', 'telefono', 'ruc', 'razon_social']
        : ['nombre_completo', 'cargo', 'telefono'],
    };

    const valido = await trigger(camposPorPaso[paso]);
    if (!valido) return;

    // Paso 1: se comprueba el código CONTRA EL SERVIDOR antes de seguir.
    // Antes solo se validaba al final: alguien con el código vencido llenaba
    // las tres pantallas para enterarse recién al guardar. De paso, acá el
    // servidor dice si hay que pedirle los datos de su empresa.
    if (paso === 1) {
      setErrorGeneral(null);
      setValidandoCodigo(true);
      try {
        const { requiere_datos_proveedor } = await authApi.validarCodigoActivacion(
          getValues('email'),
          getValues('codigo')
        );
        setPideDatosProveedor(requiere_datos_proveedor);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 422) {
          // El error se marca EN EL CAMPO del código, no solo como texto
          // suelto arriba: así queda claro cuál de los dos datos está mal
          // (el correo o el código), sobre todo cuando los dos vinieron
          // rellenados desde el enlace del correo y la persona no los tipeó.
          const errores = error.response.data?.errors;
          const mensaje = errores?.codigo?.[0] ?? 'El código no es válido o ya fue utilizado.';
          setError('codigo', { message: mensaje });
          setErrorGeneral(mensaje);
        } else {
          setErrorGeneral('No se pudo verificar el código. Revisa tu conexión e intenta de nuevo.');
        }
        return;
      } finally {
        setValidandoCodigo(false);
      }
    }

    // Los dos campos de empresa no están en el esquema como requeridos (ver
    // el comentario del schema), así que su obligatoriedad se comprueba acá,
    // solo cuando el servidor dijo que corresponden.
    if (paso === 2 && pideDatosProveedor) {
      const ruc = getValues('ruc')?.trim() ?? '';
      const razonSocial = getValues('razon_social')?.trim() ?? '';
      let hayError = false;

      if (ruc.length !== 13) {
        setError('ruc', { message: 'El RUC debe tener 13 dígitos' });
        hayError = true;
      }
      if (!razonSocial) {
        setError('razon_social', { message: 'La razón social es requerida' });
        hayError = true;
      }
      if (hayError) return;
    }

    setPaso((p) => p + 1);
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
        ...(pideDatosProveedor
          ? { ruc: values.ruc?.trim(), razon_social: values.razon_social?.trim() }
          : {}),
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
        // RUC repetido o razón social faltante: el error corresponde al
        // paso 2, así que se vuelve ahí y se marca el campo concreto en vez
        // de dejar el mensaje suelto arriba de la pantalla de contraseña.
        if (errores?.ruc || errores?.razon_social) {
          if (errores.ruc) setError('ruc', { message: errores.ruc[0] });
          if (errores.razon_social) setError('razon_social', { message: errores.razon_social[0] });
          setPaso(2);
        }
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

            {/* Solo a un proveedor en su primera activación. Antes la ficha
                se creaba vacía y quedaba en los listados sin nombre ni RUC,
                imposible de identificar para quien la tenía que revisar. */}
            {pideDatosProveedor && (
              <>
                <div className="pt-2">
                  <p
                    className="text-sm font-medium text-white/90"
                    style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}
                  >
                    Datos de tu empresa
                  </p>
                  <p className="text-xs text-white/60" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                    Con estos datos se crea tu ficha de proveedor.
                  </p>
                </div>
                <CampoOscuro
                  label="RUC"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="13 dígitos"
                  {...register('ruc')}
                  error={errors.ruc?.message}
                />
                <CampoOscuro
                  label="Razón social"
                  placeholder="Nombre legal de tu empresa"
                  {...register('razon_social')}
                  error={errors.razon_social?.message}
                />
              </>
            )}
          </>
        )}

        {paso === 3 && (
          <>
            <div>
              <CampoOscuro
                label="Nueva contraseña"
                type="password"
                {...register('password_nueva')}
                error={errors.password_nueva?.message}
              />
              <RequisitosPassword valor={watch('password_nueva') ?? ''} variante="oscura" />
            </div>
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
            <Button type="button" onClick={irSiguiente} isLoading={validandoCodigo} className="flex-1">
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