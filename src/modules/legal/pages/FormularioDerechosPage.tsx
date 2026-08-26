// src/modules/legal/pages/FormularioDerechosPage.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import PaginaLegal, { DestacadoLegal } from '../components/PaginaLegal';
import Button from '../../../shared/components/Button';
import {
  DATOS_EMPRESA,
  ENLACES_GOOGLE,
  RUTAS_LEGALES,
} from '../../../shared/config/datosEmpresa';
import { DERECHOS, enviarSolicitudDerechos, type SolicitudDerechos } from '../api/derechosApi';

const VACIO: SolicitudDerechos = {
  nombre_completo: '',
  email: '',
  cedula: '',
  celular: '',
  derecho: '',
  detalle: '',
  declaracion: false,
};

/** Errores de validación que devuelve Laravel: { campo: [mensaje, ...] }. */
type ErroresApi = Record<string, string[]>;

/**
 * Formulario de atención de derechos sobre datos personales.
 *
 * Es PÚBLICO a propósito (ver PaginaLegal): quien quiere que borren sus
 * datos puede ser justamente alguien sin cuenta activa.
 *
 * Los errores se muestran campo por campo con los mensajes del backend, no
 * con un cartel genérico: este formulario lo va a llenar gente que no usa el
 * portal todos los días, y "revisa los datos" no le dice dónde se equivocó.
 */
export default function FormularioDerechosPage() {
  const [datos, setDatos] = useState<SolicitudDerechos>(VACIO);
  const [errores, setErrores] = useState<ErroresApi>({});

  const enviar = useMutation({
    mutationFn: () => enviarSolicitudDerechos(datos),
    onSuccess: () => {
      setErrores({});
      setDatos(VACIO);
    },
    onError: (error: AxiosError<{ message?: string; errors?: ErroresApi }>) => {
      setErrores(error.response?.data?.errors ?? {});
    },
  });

  function actualizar<C extends keyof SolicitudDerechos>(campo: C, valor: SolicitudDerechos[C]) {
    setDatos((previo) => ({ ...previo, [campo]: valor }));
    // Se limpia el error de ESE campo al escribirlo: dejar el mensaje rojo
    // mientras el usuario corrige da la sensación de que sigue mal.
    setErrores((previo) => {
      if (!previo[campo]) return previo;
      const copia = { ...previo };
      delete copia[campo];
      return copia;
    });
  }

  const errorGeneral =
    enviar.isError && Object.keys(errores).length === 0
      ? ((enviar.error as AxiosError<{ message?: string }>).response?.data?.message ??
        'No pudimos enviar tu solicitud. Inténtalo de nuevo en unos minutos.')
      : null;

  return (
    <PaginaLegal
      titulo="Formulario de atención de derechos"
      bajada={`${DATOS_EMPRESA.marca} pone a tu disposición este formulario para atender tus solicitudes en materia de datos personales. Para continuar, necesitamos los datos del titular.`}
    >
      {enviar.isSuccess ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-5">
          <p className="font-display text-lg font-semibold text-emerald-900">Solicitud recibida</p>
          <p className="mt-2 text-[15px] leading-relaxed text-emerald-900/85">{enviar.data.message}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              to={RUTAS_LEGALES.politicaDatos}
              className="text-sm text-emerald-900 underline hover:no-underline"
            >
              Leer la política de protección de datos
            </Link>
            <button
              type="button"
              onClick={() => enviar.reset()}
              className="text-sm text-emerald-900 underline hover:no-underline"
            >
              Enviar otra solicitud
            </button>
          </div>
        </div>
      ) : (
        <form
          noValidate
          onSubmit={(evento) => {
            evento.preventDefault();
            enviar.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Campo etiqueta="Nombre y apellidos" nombre="nombre_completo" errores={errores}>
              <input
                type="text"
                autoComplete="name"
                value={datos.nombre_completo}
                onChange={(e) => actualizar('nombre_completo', e.target.value)}
                className={claseInput(errores.nombre_completo)}
              />
            </Campo>

            <Campo etiqueta="Correo electrónico" nombre="email" errores={errores}>
              <input
                type="email"
                autoComplete="email"
                value={datos.email}
                onChange={(e) => actualizar('email', e.target.value)}
                className={claseInput(errores.email)}
              />
            </Campo>

            <Campo etiqueta="Cédula" nombre="cedula" errores={errores}>
              <input
                type="text"
                inputMode="numeric"
                value={datos.cedula}
                onChange={(e) => actualizar('cedula', e.target.value)}
                className={claseInput(errores.cedula)}
              />
            </Campo>

            <Campo etiqueta="Número de celular" nombre="celular" errores={errores}>
              <input
                type="tel"
                autoComplete="tel"
                value={datos.celular}
                onChange={(e) => actualizar('celular', e.target.value)}
                className={claseInput(errores.celular)}
              />
            </Campo>
          </div>

          <Campo etiqueta="Derecho que deseas ejercer" nombre="derecho" errores={errores}>
            <select
              value={datos.derecho}
              onChange={(e) => actualizar('derecho', e.target.value as SolicitudDerechos['derecho'])}
              className={claseInput(errores.derecho)}
            >
              <option value="">Selecciona una opción…</option>
              {DERECHOS.map(({ valor, etiqueta }) => (
                <option key={valor} value={valor}>
                  {etiqueta}
                </option>
              ))}
            </select>
          </Campo>

          <Campo
            etiqueta="Cuéntanos de manera clara y precisa el derecho que deseas ejercer, y por qué"
            nombre="detalle"
            errores={errores}
          >
            <textarea
              rows={5}
              value={datos.detalle}
              onChange={(e) => actualizar('detalle', e.target.value)}
              className={`${claseInput(errores.detalle)} resize-y`}
            />
            <p className="mt-1.5 text-xs text-brand-900/45">
              {datos.detalle.length} de 3000 caracteres
            </p>
          </Campo>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={datos.declaracion}
                onChange={(e) => actualizar('declaracion', e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 rounded border-brand-900/25 text-brand-700 focus:ring-brand-700"
              />
              <span className="text-[14px] leading-relaxed text-brand-900/75">
                Declaro que la información sobre los datos personales entregada a las empresas del
                grupo {DATOS_EMPRESA.marca} es exacta, precisa, clara y verdadera. Además, declaro
                que he recibido suficiente información, de manera clara, respecto a las consecuencias
                jurídicas en caso de que los datos personales consignados sean erróneos, inexactos,
                ambiguos, falsos o inexistentes.
              </span>
            </label>
            {errores.declaracion && (
              <p className="mt-1.5 text-[13px] text-brand-wine">{errores.declaracion[0]}</p>
            )}
          </div>

          {errorGeneral && (
            <div className="rounded-lg border border-brand-wine/30 bg-brand-wine/5 px-4 py-3">
              <p className="text-[14px] text-brand-wine">{errorGeneral}</p>
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" isLoading={enviar.isPending}>
              Enviar solicitud
            </Button>
          </div>

          {/* Atribución de reCAPTCHA. Google la exige cuando se usa su
              servicio, y los enlaces tienen que estar visibles. Se muestra
              siempre para que el aviso no dependa de si las claves están
              cargadas en ese ambiente. */}
          <p className="text-[12px] leading-relaxed text-brand-900/45 border-t border-brand-900/8 pt-4">
            Este sitio está protegido por reCAPTCHA. Se aplican la{' '}
            <a
              href={ENLACES_GOOGLE.privacidad}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-brand-900/70"
            >
              Política de privacidad
            </a>{' '}
            y los{' '}
            <a
              href={ENLACES_GOOGLE.terminos}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-brand-900/70"
            >
              Términos de servicio
            </a>{' '}
            de Google.
          </p>
        </form>
      )}

      <div className="mt-8">
        <DestacadoLegal>
          <p className="text-[14px]">
            También puedes escribirnos directamente a{' '}
            <a
              className="text-brand-700 underline font-medium"
              href={`mailto:${DATOS_EMPRESA.emailProteccionDatos}`}
            >
              {DATOS_EMPRESA.emailProteccionDatos}
            </a>
            . Recuerda adjuntar copia de un documento oficial que acredite tu identidad: sin eso no
            podemos confirmar que eres el titular de los datos y no podríamos atender la solicitud.
          </p>
          <p className="mt-2 text-[14px]">
            Puedes revisar qué datos tratamos y con qué finalidad en la{' '}
            <Link to={RUTAS_LEGALES.politicaDatos} className="text-brand-700 underline">
              Política de Protección de Datos Personales
            </Link>
            .
          </p>
        </DestacadoLegal>
      </div>
    </PaginaLegal>
  );
}

function claseInput(error?: string[]): string {
  return [
    'w-full rounded-md border px-3 py-2.5 text-[15px] text-brand-900 bg-white',
    'focus:outline-none focus:ring-2 focus:ring-brand-700/40 focus:border-brand-700',
    error ? 'border-brand-wine' : 'border-brand-900/15',
  ].join(' ');
}

function Campo({
  etiqueta,
  nombre,
  errores,
  children,
}: {
  etiqueta: string;
  nombre: string;
  errores: ErroresApi;
  children: React.ReactNode;
}) {
  const error = errores[nombre];

  return (
    <label className="block">
      <span className="block text-[14px] font-medium text-brand-900 mb-1.5">
        {etiqueta} <span className="text-brand-wine">*</span>
      </span>
      {children}
      {error && <p className="mt-1.5 text-[13px] text-brand-wine">{error[0]}</p>}
    </label>
  );
}
