// src/shared/config/datosEmpresa.ts

/**
 * Datos de la empresa y textos legales, en un solo lugar.
 *
 * Están acá y no repartidos entre el footer y las páginas legales porque
 * son datos que cambian por decisión de la empresa (se muda una oficina,
 * cambia un teléfono) y no debería haber que buscarlos en tres archivos
 * distintos ni arriesgarse a que el footer diga una dirección y la política
 * otra.
 *
 * MARCA vs. SOCIEDADES: la distinción no es de estilo, es legal.
 *
 *  - `marca` ("Hanaska") es el nombre comercial del grupo. Es lo que se
 *    muestra en el footer y en toda la interfaz.
 *  - `responsables` son las personas jurídicas. La LOPDP exige identificar
 *    al Responsable del Tratamiento, y una marca no es un sujeto de
 *    derecho: la política legal tiene que nombrar sociedades concretas, con
 *    su RUC y un domicilio de contacto.
 *
 * POR QUÉ SON DOS Y NO UNA: el portal lo operan las dos empresas del grupo,
 * y cada una decide sobre los datos de los proveedores con los que ella
 * trabaja (la tabla Empresa del backend es la misma lista). Nombrar una sola
 * sería declarar un responsable que no lo es de la mitad de los datos. La
 * LOPDP admite la corresponsabilidad, y el canal de atención al titular es
 * uno solo y compartido (el Delegado), que es como funciona en la práctica.
 */

export const DATOS_EMPRESA = {
  /** Nombre comercial del grupo. Es lo que ve el usuario. */
  marca: 'Hanaska',

  direccion: 'Av. General Rumiñahui y C. G',
  ciudad: 'Sangolquí',
  pais: 'Ecuador',

  telefono: '(02) 3970900',
  /** Teléfono en formato E.164, para el enlace tel: */
  telefonoEnlace: '+59323970900',

  /** Contacto general del portal de proveedores. */
  email: 'infoproveedores@hanaska.com',

  /**
   * Delegado de Protección de Datos. La LOPDP obliga a publicar un canal
   * de contacto para que el titular ejerza sus derechos, y este es ese
   * canal: es la dirección a la que llega el formulario de atención de
   * derechos.
   */
  emailProteccionDatos: 'protecciondedatos@hanaska.com',

  politicaVersion: 'Versión 1',
} as const;

/**
 * Sociedades responsables del tratamiento de datos personales en el Portal
 * de Proveedores. Los RUC son los registrados en el propio portal (tabla
 * Empresa del backend).
 *
 * Hoy hay UNA. Es una lista y no un objeto suelto porque el portal ya opera
 * con dos empresas del grupo, y cuando FROZENTROPIC (RUC 1791949439001)
 * entre también como responsable, alcanza con agregar la línea: la política
 * detecta que hay más de una y pasa sola a redactar en corresponsabilidad
 * (ver PoliticaProteccionDatosPage).
 */
export const RESPONSABLES_TRATAMIENTO = [
  { razonSocial: 'Caterfood Broadliner', ruc: '1792347726001' },
] as const;

export const REDES_SOCIALES = [
  { nombre: 'YouTube', href: 'https://www.youtube.com/@hanaska5854' },
  { nombre: 'LinkedIn', href: 'https://www.linkedin.com/company/hanaska/' },
  { nombre: 'Facebook', href: 'https://www.facebook.com/hanaskagrupo' },
  { nombre: 'Instagram', href: 'https://www.instagram.com/grupohanaska/' },
] as const;

export const RUTAS_LEGALES = {
  politicaDatos: '/politica-de-proteccion-de-datos',
  formularioDerechos: '/formulario-atencion-de-derechos',
} as const;

/** Enlaces de Google, obligatorios como atribución cuando se usa reCAPTCHA. */
export const ENLACES_GOOGLE = {
  privacidad: 'https://policies.google.com/privacy',
  terminos: 'https://policies.google.com/terms',
} as const;
