import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import LocationPicker from './LocationPicker';
import { guardarSeccion1 } from '../api/fichaApi';
import type { FichaProveedor, Seccion1Data } from '../types';

const schema = z.object({
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  clase_contribuyente: z.string().optional(),
  razon_social: z.string().min(1, 'Requerido'),
  nombre_comercial: z.string().optional(),
  email: z.string().email('Correo inválido'),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  pagina_web: z.string().optional(),
  latitud: z.string().optional(),
  longitud: z.string().optional(),
  representante_legal: z.string().optional(),
  correo_representante: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono_representante: z.string().optional(),
  contacto_venta: z.string().optional(),
  correo_venta: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono_contacto_venta: z.string().optional(),
  contacto_calidad: z.string().optional(),
  correo_calidad: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono_contacto_calidad: z.string().optional(),
  contacto_contabilidad: z.string().optional(),
  correo_contabilidad: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono_contabilidad: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

function aTexto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

const CAMPOS_DATOS_GENERALES: (keyof FormValues)[] = ['ruc', 'razon_social', 'email'];

/**
 * Cubre los pasos 1 (Datos Generales) y 2 (Contactos) del wizard -> el
 * backend solo tiene UNA sección real (seccion-1) para toda esta info, así
 * que ambos pasos comparten esta misma instancia de formulario (no se
 * pierde lo escrito al ir y volver entre ellos) y se guardan juntos al
 * terminar el paso 2.
 *
 * IMPORTANTE: el <form> NO tiene onSubmit nativo a propósito. "Siguiente"
 * y "Guardar y continuar" son ambos type="button", disparando la lógica
 * explícitamente por código (handleSubmit(onSubmit)() en vez de depender
 * de un submit real) -> evita que un cambio de layout a mitad de un clic
 * (el botón "Siguiente" es reemplazado por "Guardar y continuar" en la
 * misma posición al avanzar de paso) pueda disparar un submit accidental.
 */
export default function InformacionProveedorForm({
  subPaso,
  datosIniciales,
  onIrAPaso,
  onGuardado,
}: {
  subPaso: 1 | 2;
  datosIniciales: Seccion1Data;
  onIrAPaso: (paso: number) => void;
  onGuardado: (ficha: FichaProveedor) => void;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ruc: aTexto(datosIniciales.ruc),
      clase_contribuyente: aTexto(datosIniciales.clase_contribuyente),
      razon_social: aTexto(datosIniciales.razon_social),
      nombre_comercial: aTexto(datosIniciales.nombre_comercial),
      email: aTexto(datosIniciales.email),
      telefono: aTexto(datosIniciales.telefono),
      direccion: aTexto(datosIniciales.direccion),
      ciudad: aTexto(datosIniciales.ciudad),
      pagina_web: aTexto(datosIniciales.pagina_web),
      latitud: aTexto(datosIniciales.latitud),
      longitud: aTexto(datosIniciales.longitud),
      representante_legal: aTexto(datosIniciales.representante_legal),
      correo_representante: aTexto(datosIniciales.correo_representante),
      telefono_representante: aTexto(datosIniciales.telefono_representante),
      contacto_venta: aTexto(datosIniciales.contacto_venta),
      correo_venta: aTexto(datosIniciales.correo_venta),
      telefono_contacto_venta: aTexto(datosIniciales.telefono_contacto_venta),
      contacto_calidad: aTexto(datosIniciales.contacto_calidad),
      correo_calidad: aTexto(datosIniciales.correo_calidad),
      telefono_contacto_calidad: aTexto(datosIniciales.telefono_contacto_calidad),
      contacto_contabilidad: aTexto(datosIniciales.contacto_contabilidad),
      correo_contabilidad: aTexto(datosIniciales.correo_contabilidad),
      telefono_contabilidad: aTexto(datosIniciales.telefono_contabilidad),
    },
  });

  async function irASiguiente() {
    const valido = await trigger(CAMPOS_DATOS_GENERALES);
    if (valido) onIrAPaso(2);
  }

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      const ficha = await guardarSeccion1({
        ...values,
        latitud: values.latitud ? Number(values.latitud) : null,
        longitud: values.longitud ? Number(values.longitud) : null,
      } as Partial<Seccion1Data>);
      onGuardado(ficha);
    } catch {
      setErrorGeneral('No se pudo guardar. Revisa los campos e intenta de nuevo.');
    }
  }

  return (
    <div className="space-y-6">
      {subPaso === 1 && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Input label="RUC" {...register('ruc')} error={errors.ruc?.message} />
            <Input label="Clase de contribuyente" {...register('clase_contribuyente')} />
            <Input label="Razón social" {...register('razon_social')} error={errors.razon_social?.message} />
            <Input label="Nombre comercial" {...register('nombre_comercial')} />
            <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />
            <Input label="Teléfono" {...register('telefono')} />
            <Input label="Dirección" {...register('direccion')} />
            <Input label="Ciudad" {...register('ciudad')} />
            <Input label="Página web" {...register('pagina_web')} />
          </div>

          <LocationPicker
            latitudInicial={datosIniciales.latitud ? Number(datosIniciales.latitud) : null}
            longitudInicial={datosIniciales.longitud ? Number(datosIniciales.longitud) : null}
            onSeleccionar={(lat, lng) => {
              setValue('latitud', String(lat));
              setValue('longitud', String(lng));
            }}
          />
        </>
      )}

      {subPaso === 2 && (
        <div className="space-y-6">
          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
              Representante legal
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" {...register('representante_legal')} />
              <Input label="Teléfono" {...register('telefono_representante')} />
              <Input
                label="Correo"
                type="email"
                {...register('correo_representante')}
                error={errors.correo_representante?.message}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
              Contacto de ventas
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" {...register('contacto_venta')} />
              <Input label="Teléfono" {...register('telefono_contacto_venta')} />
              <Input
                label="Correo"
                type="email"
                {...register('correo_venta')}
                error={errors.correo_venta?.message}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
              Contacto de calidad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" {...register('contacto_calidad')} />
              <Input label="Teléfono" {...register('telefono_contacto_calidad')} />
              <Input
                label="Correo"
                type="email"
                {...register('correo_calidad')}
                error={errors.correo_calidad?.message}
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
              Contacto de contabilidad
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nombre" {...register('contacto_contabilidad')} />
              <Input label="Teléfono" {...register('telefono_contabilidad')} />
              <Input
                label="Correo"
                type="email"
                {...register('correo_contabilidad')}
                error={errors.correo_contabilidad?.message}
              />
            </div>
          </section>
        </div>
      )}

      {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

      <div className="flex justify-between pt-2">
        {subPaso === 2 ? (
          <Button type="button" variant="ghost" onClick={() => onIrAPaso(1)}>
            Atrás
          </Button>
        ) : (
          <span />
        )}

        {subPaso === 1 ? (
          <Button type="button" onClick={irASiguiente}>
            Siguiente
          </Button>
        ) : (
          <Button type="button" onClick={handleSubmit(onSubmit)} isLoading={isSubmitting}>
            Guardar y continuar
          </Button>
        )}
      </div>
    </div>
  );
}
