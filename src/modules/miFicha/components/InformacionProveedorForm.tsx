import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import CampoFicha from './CampoFicha';
import CampoFichaCombo from './CampoFichaCombo';
import CampoFichaTelefono from './CampoFichaTelefono';
import Button from '../../../shared/components/Button';
import LocationPicker from './LocationPicker';
import AceptacionPoliticas from './AceptacionPoliticas';
import { MENSAJE_POLITICAS_REQUERIDAS } from '../constants/politicas';
import { guardarSeccion1 } from '../api/fichaApi';
import { listarGruposImpuesto } from '../api/catalogosApi';
import { CIUDADES_ECUADOR } from '../constants/ciudadesEcuador';
import { enfocarPrimerCampoConError } from '../utils/enfocarCampo';
import { mensajeDeError } from '../utils/mensajeDeError';
import { soloDigitos } from '../utils/telefono';
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

/**
 * Los teléfonos entran al formulario ya limpios. Lo guardado hoy son solo
 * dígitos, pero una ficha vieja podría traer espacios o guiones: si se
 * cargaran tal cual, el campo los mostraría y el backend rechazaría el
 * guardado por el max:10 de las columnas de contacto.
 */
function aTelefono(valor: string | number | null | undefined): string {
  return soloDigitos(aTexto(valor));
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

/**
 * Orden EN QUE SE VEN los campos de Contactos. Hace falta para llevar al
 * usuario al primero que le falta bajando la página, y no a uno del medio
 * (el objeto de errores no garantiza ningún orden).
 */
const CAMPOS_CONTACTOS: (keyof FormValues)[] = [
  'representante_legal',
  'telefono_representante',
  'correo_representante',
  'contacto_venta',
  'telefono_contacto_venta',
  'correo_venta',
  'contacto_calidad',
  'telefono_contacto_calidad',
  'correo_calidad',
  'contacto_contabilidad',
  'telefono_contabilidad',
  'correo_contabilidad',
];

function Divisor() {
  return <hr className="border-t border-brand-900/10" />;
}

/**
 * Los 5 teléfonos de la ficha van CONTROLADOS (Controller y no register):
 * el campo muestra el número agrupado (095 899 1687) reescribiendo lo que
 * se teclea, y eso un input no controlado no lo permite. En el estado del
 * formulario siguen viviendo solo los dígitos, que es lo que se guarda
 * -ver utils/telefono.ts para el porqué.
 */

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
  requiereAceptarPoliticas = false,
}: {
  subPaso: 1 | 2;
  datosIniciales: Seccion1Data;
  onIrAPaso: (paso: number) => void;
  onGuardado: (ficha: FichaProveedor) => void;
  /** Ver Seccion3Form: solo si ESTE guardado completa la ficha (clase y
   *  categoría ya elegidas). Pasa cuando el proveedor vuelve a un paso
   *  anterior desde la barra de progreso y guarda desde ahí. */
  requiereAceptarPoliticas?: boolean;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [errorPoliticas, setErrorPoliticas] = useState<string | null>(null);

  // Clase de contribuyente: catálogo de BC, no texto libre. Si la
  // consulta falla se deja el selector vacío en vez de tumbar el
  // formulario -> el proveedor puede seguir llenando el resto y volver.
  const { data: gruposImpuesto } = useQuery({
    queryKey: ['catalogo-grupos-impuesto'],
    queryFn: listarGruposImpuesto,
    staleTime: 60 * 60 * 1000,
  });

  const opcionesGrupoImpuesto = (gruposImpuesto ?? []).map((g) => ({
    valor: g.codigo,
    etiqueta: g.descripcion,
  }));

  const {
    register,
    control,
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
      telefono: aTelefono(datosIniciales.telefono),
      direccion: aTexto(datosIniciales.direccion),
      ciudad: aTexto(datosIniciales.ciudad),
      pagina_web: aTexto(datosIniciales.pagina_web),
      latitud: aTexto(datosIniciales.latitud),
      longitud: aTexto(datosIniciales.longitud),
      representante_legal: aTexto(datosIniciales.representante_legal),
      correo_representante: aTexto(datosIniciales.correo_representante),
      telefono_representante: aTelefono(datosIniciales.telefono_representante),
      contacto_venta: aTexto(datosIniciales.contacto_venta),
      correo_venta: aTexto(datosIniciales.correo_venta),
      telefono_contacto_venta: aTelefono(datosIniciales.telefono_contacto_venta),
      contacto_calidad: aTexto(datosIniciales.contacto_calidad),
      correo_calidad: aTexto(datosIniciales.correo_calidad),
      telefono_contacto_calidad: aTelefono(datosIniciales.telefono_contacto_calidad),
      contacto_contabilidad: aTexto(datosIniciales.contacto_contabilidad),
      correo_contabilidad: aTexto(datosIniciales.correo_contabilidad),
      telefono_contabilidad: aTelefono(datosIniciales.telefono_contabilidad),
    },
  });

  async function irASiguiente() {
    const valido = await trigger(CAMPOS_DATOS_GENERALES);

    if (valido) {
      onIrAPaso(2);
      return;
    }

    // No avanza -> hay que decirle DÓNDE está el problema. El botón está
    // al pie y los campos que faltan suelen quedar fuera de la pantalla:
    // sin esto, al hacer clic no pasaba nada visible.
    enfocarPrimerCampoConError(errors, CAMPOS_DATOS_GENERALES as readonly string[]);
  }

  /**
   * Mismo tratamiento en el paso de Contactos. Va como onInvalid de
   * handleSubmit: react-hook-form llama a ese callback cuando la
   * validación falla, y ahí los errores ya están calculados.
   *
   * Su shouldFocusError no alcanza acá -ver el comentario de
   * enfocarPrimerCampoConError-: los teléfonos son campos controlados y
   * RHF no tiene ref para enfocarlos, así que tampoco desplazaría la
   * página hasta ellos.
   */
  function alFallarValidacion() {
    // Primero en el paso que se está viendo.
    if (enfocarPrimerCampoConError(errors, CAMPOS_CONTACTOS as readonly string[])) {
      return;
    }

    // Si lo que falta quedó en Datos Generales (se puede volver atrás y
    // borrar algo), no alcanza con desplazar: ese campo ni siquiera está
    // dibujado. Hay que volver a ese paso y recién ahí buscarlo.
    const faltaEnDatosGenerales = CAMPOS_DATOS_GENERALES.some((campo) => errors[campo]);

    if (faltaEnDatosGenerales) {
      onIrAPaso(1);
      // En el próximo cuadro: el campo existe en el DOM recién después de
      // que React dibuje el paso 1.
      requestAnimationFrame(() =>
        enfocarPrimerCampoConError(errors, CAMPOS_DATOS_GENERALES as readonly string[])
      );
    }
  }

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    setErrorPoliticas(null);

    if (requiereAceptarPoliticas && !aceptaPoliticas) {
      setErrorPoliticas(MENSAJE_POLITICAS_REQUERIDAS);
      return;
    }

    try {
      const ficha = await guardarSeccion1(
        {
          ...values,
          latitud: values.latitud ? Number(values.latitud) : null,
          longitud: values.longitud ? Number(values.longitud) : null,
        } as Partial<Seccion1Data>,
        requiereAceptarPoliticas ? aceptaPoliticas : undefined
      );
      onGuardado(ficha);
    } catch (e) {
      setErrorGeneral(mensajeDeError(e, 'No se pudo guardar. Revisa los campos e intenta de nuevo.'));
    }
  }

  return (
    <div className="space-y-4">
      {subPaso === 1 && (
        <>
          <div className="grid grid-cols-2 gap-x-10 gap-y-3">
            <CampoFicha label="RUC" {...register('ruc')} error={errors.ruc?.message} />
            <Controller
              name="clase_contribuyente"
              control={control}
              render={({ field }) => (
                <CampoFichaCombo
                  id={field.name}
                  label="Clase de contribuyente"
                  opciones={opcionesGrupoImpuesto}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.clase_contribuyente?.message}
                />
              )}
            />
            <CampoFicha label="Razón social" {...register('razon_social')} error={errors.razon_social?.message} />
            <CampoFicha
              label="Nombre comercial"
              {...register('nombre_comercial')}
              error={errors.nombre_comercial?.message}
            />
            <CampoFicha label="Correo" type="email" {...register('email')} error={errors.email?.message} />
            <Controller
              name="telefono"
              control={control}
              render={({ field }) => (
                <CampoFichaTelefono
                  id={field.name}
                  label="Teléfono"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.telefono?.message}
                />
              )}
            />
            <CampoFicha label="Dirección" {...register('direccion')} error={errors.direccion?.message} />
            <Controller
              name="ciudad"
              control={control}
              render={({ field }) => (
                <CampoFichaCombo
                  id={field.name}
                  label="Ciudad"
                  opciones={CIUDADES_ECUADOR}
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.ciudad?.message}
                />
              )}
            />
            <CampoFicha label="Página web (opcional)" {...register('pagina_web')} />
          </div>

          <Divisor />

          {/* id="latitud": la ubicación se elige en el mapa, no en un input,
              así que no hay ningún elemento con ese id al que desplazarse
              cuando es lo único que falta. Con este envoltorio,
              enfocarPrimerCampoConError lo encuentra igual y sube hasta el
              mapa. (focus() sobre un div no hace nada, pero el
              desplazamiento y la sacudida sí, que es lo que se necesita.) */}
          <div id="latitud">
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
          </div>
        </>
      )}

      {subPaso === 2 && (
        <div className="space-y-3">
          <section className="space-y-1.5">
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Representante legal
            </h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <CampoFicha
                label="Nombre"
                {...register('representante_legal')}
                error={errors.representante_legal?.message}
              />
              <Controller
                name="telefono_representante"
                control={control}
                render={({ field }) => (
                  <CampoFichaTelefono
                    id={field.name}
                    label="Teléfono"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telefono_representante?.message}
                  />
                )}
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
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Contacto de ventas
            </h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <CampoFicha label="Nombre" {...register('contacto_venta')} error={errors.contacto_venta?.message} />
              <Controller
                name="telefono_contacto_venta"
                control={control}
                render={({ field }) => (
                  <CampoFichaTelefono
                    id={field.name}
                    label="Teléfono"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telefono_contacto_venta?.message}
                  />
                )}
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
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Contacto de calidad
            </h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <CampoFicha
                label="Nombre"
                {...register('contacto_calidad')}
                error={errors.contacto_calidad?.message}
              />
              <Controller
                name="telefono_contacto_calidad"
                control={control}
                render={({ field }) => (
                  <CampoFichaTelefono
                    id={field.name}
                    label="Teléfono"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telefono_contacto_calidad?.message}
                  />
                )}
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
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
              Contacto de contabilidad
            </h3>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3">
              <CampoFicha
                label="Nombre"
                {...register('contacto_contabilidad')}
                error={errors.contacto_contabilidad?.message}
              />
              <Controller
                name="telefono_contabilidad"
                control={control}
                render={({ field }) => (
                  <CampoFichaTelefono
                    id={field.name}
                    label="Teléfono"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.telefono_contabilidad?.message}
                  />
                )}
              />
              <CampoFicha
                label="Correo"
                type="email"
                {...register('correo_contabilidad')}
                error={errors.correo_contabilidad?.message}
              />
            </div>
          </section>

          {requiereAceptarPoliticas && (
            <>
              <Divisor />
              <AceptacionPoliticas
                aceptado={aceptaPoliticas}
                onChange={(v) => {
                  setAceptaPoliticas(v);
                  if (v) setErrorPoliticas(null);
                }}
                error={errorPoliticas}
              />
            </>
          )}
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
          <Button type="button" onClick={handleSubmit(onSubmit, alFallarValidacion)} isLoading={isSubmitting}>
            {requiereAceptarPoliticas ? 'Guardar y enviar a revisión' : 'Guardar y continuar'}
          </Button>
        )}
      </div>
    </div>
  );
}