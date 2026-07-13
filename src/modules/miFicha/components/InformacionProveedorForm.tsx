import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import CampoFicha from './CampoFicha';
import Button from '../../../shared/components/Button';
import LocationPicker from './LocationPicker';
import { guardarSeccion1 } from '../api/fichaApi';
import type { FichaProveedor, Seccion1Data } from '../types';

const requerido = (mensaje = 'Requerido') => z.string().min(1, mensaje);
const correoRequerido = z.string().min(1, 'Requerido').email('Correo inválido');

const schema = z.object({
  ruc: z.string().length(13, 'El RUC debe tener 13 dígitos'),
  clase_contribuyente: requerido(),
  razon_social: requerido(),
  nombre_comercial: requerido(),
  email: correoRequerido,
  telefono: requerido(),
  direccion: requerido(),
  ciudad: requerido(),
  pagina_web: z.string().optional(),
  latitud: requerido('Selecciona la ubicación en el mapa'),
  longitud: requerido('Selecciona la ubicación en el mapa'),
  representante_legal: requerido(),
  correo_representante: correoRequerido,
  telefono_representante: requerido(),
  contacto_venta: requerido(),
  correo_venta: correoRequerido,
  telefono_contacto_venta: requerido(),
  contacto_calidad: requerido(),
  correo_calidad: correoRequerido,
  telefono_contacto_calidad: requerido(),
  contacto_contabilidad: requerido(),
  correo_contabilidad: correoRequerido,
  telefono_contabilidad: requerido(),
});

type FormValues = z.infer<typeof schema>;

function aTexto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

const CAMPOS_DATOS_GENERALES: (keyof FormValues)[] = [
  'ruc',
  'clase_contribuyente',
  'razon_social',
  'nombre_comercial',
  'email',
  'telefono',
  'direccion',
  'ciudad',
  'latitud',
  'longitud',
];

function Divisor() {
  return <hr className="border-t border-brand-900/10" />;
}

/**
 * Cubre los pasos 1 (Datos Generales) y 2 (Contactos) del wizard -> el
 * backend solo tiene UNA sección real (seccion-1) para toda esta info, así
 * que ambos pasos comparten esta misma instancia de formulario (no se
 * pierde lo escrito al ir y volver entre ellos) y se guardan juntos al
 * terminar el paso 2.
 *
 * IMPORTANTE: el <form> NO tiene onSubmit nativo a propósito -> ver nota
 * en los botones al final del archivo.
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
    <div className="space-y-4">
      {subPaso === 1 && (
        <>
          <div className="grid grid-cols-3 gap-x-6 gap-y-2">
            <CampoFicha label="RUC" {...register('ruc')} error={errors.ruc?.message} />
            <CampoFicha
              label="Clase de contribuyente"
              {...register('clase_contribuyente')}
              error={errors.clase_contribuyente?.message}
            />
            <CampoFicha label="Razón social" {...register('razon_social')} error={errors.razon_social?.message} />
            <CampoFicha
              label="Nombre comercial"
              {...register('nombre_comercial')}
              error={errors.nombre_comercial?.message}
            />
            <CampoFicha label="Correo" type="email" {...register('email')} error={errors.email?.message} />
            <CampoFicha label="Teléfono" {...register('telefono')} error={errors.telefono?.message} />
            <CampoFicha label="Dirección" {...register('direccion')} error={errors.direccion?.message} />
            <CampoFicha label="Ciudad" {...register('ciudad')} error={errors.ciudad?.message} />
            <CampoFicha label="Página web (opcional)" {...register('pagina_web')} />
          </div>

          <Divisor />

          <LocationPicker
            latitudInicial={datosIniciales.latitud ? Number(datosIniciales.latitud) : null}
            longitudInicial={datosIniciales.longitud ? Number(datosIniciales.longitud) : null}
            onSeleccionar={(lat, lng) => {
              setValue('latitud', String(lat));
              setValue('longitud', String(lng));
            }}
          />
          {(errors.latitud || errors.longitud) && (
            <p className="text-xs text-brand-wine">{errors.latitud?.message ?? errors.longitud?.message}</p>
          )}
        </>
      )}

      {subPaso === 2 && (
        <div className="space-y-3">
          <section className="space-y-1.5">
            <h3 className="font-display text-[11px] font-semibold text-brand-900/70 uppercase tracking-wide">
              Representante legal
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <CampoFicha
                label="Nombre"
                {...register('representante_legal')}
                error={errors.representante_legal?.message}
              />
              <CampoFicha
                label="Teléfono"
                {...register('telefono_representante')}
                error={errors.telefono_representante?.message}
              />
              <CampoFicha
                label="Correo"
                type="email"
                {...register('correo_representante')}
                error={errors.correo_representante?.message}
              />
            </div>
          </section>

          <Divisor />

          <section className="space-y-1.5">
            <h3 className="font-display text-[11px] font-semibold text-brand-900/70 uppercase tracking-wide">
              Contacto de ventas
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <CampoFicha label="Nombre" {...register('contacto_venta')} error={errors.contacto_venta?.message} />
              <CampoFicha
                label="Teléfono"
                {...register('telefono_contacto_venta')}
                error={errors.telefono_contacto_venta?.message}
              />
              <CampoFicha
                label="Correo"
                type="email"
                {...register('correo_venta')}
                error={errors.correo_venta?.message}
              />
            </div>
          </section>

          <Divisor />

          <section className="space-y-1.5">
            <h3 className="font-display text-[11px] font-semibold text-brand-900/70 uppercase tracking-wide">
              Contacto de calidad
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <CampoFicha
                label="Nombre"
                {...register('contacto_calidad')}
                error={errors.contacto_calidad?.message}
              />
              <CampoFicha
                label="Teléfono"
                {...register('telefono_contacto_calidad')}
                error={errors.telefono_contacto_calidad?.message}
              />
              <CampoFicha
                label="Correo"
                type="email"
                {...register('correo_calidad')}
                error={errors.correo_calidad?.message}
              />
            </div>
          </section>

          <Divisor />

          <section className="space-y-1.5">
            <h3 className="font-display text-[11px] font-semibold text-brand-900/70 uppercase tracking-wide">
              Contacto de contabilidad
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-2">
              <CampoFicha
                label="Nombre"
                {...register('contacto_contabilidad')}
                error={errors.contacto_contabilidad?.message}
              />
              <CampoFicha
                label="Teléfono"
                {...register('telefono_contabilidad')}
                error={errors.telefono_contabilidad?.message}
              />
              <CampoFicha
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