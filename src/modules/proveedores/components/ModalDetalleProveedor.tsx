// src/modules/proveedores/components/ModalDetalleProveedor.tsx
import { useQuery } from '@tanstack/react-query';
import { formatearTelefono } from '../../miFicha/utils/telefono';
import Modal from '../../../shared/components/Modal';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import * as proveedoresApi from '../api/proveedoresApi';
import { DesgloseCalificacion } from '../../../shared/components/CalificacionGlobal';
import * as calificacionGlobalApi from '../../../shared/api/calificacionGlobalApi';

/**
 * Mete un punto de corte invisible después de cada "@" y cada ".".
 *
 * POR QUÉ: un correo es una sola "palabra" sin espacios, y el navegador no
 * tiene dónde partirlo. En una columna angosta se derramaba sobre la de al
 * lado: el correo quedaba encima del teléfono. Con estos cortes, si no
 * entra, salta de renglón en un lugar que se lee natural
 * ("operaciones1@" / "drmullernutricion.com") en vez de a mitad de palabra.
 */
function conCortes(texto: string): React.ReactNode {
  // Sin lookbehind (`(?<=...)`) a propósito: en Safari anterior a 16.4 esa
  // sintaxis no solo no funciona, rompe la carga del archivo completo.
  return texto.replace(/([@.])/g, '$1\u0000').split('\u0000').map((parte, i) => (
    <span key={i}>
      {parte}
      <wbr />
    </span>
  ));
}

function Dato({
  etiqueta,
  valor,
  ancho = 'simple',
  href,
}: {
  etiqueta: string;
  valor: string | null | undefined;
  /** 'doble' para los campos largos (razón social, correo, dirección). */
  ancho?: 'simple' | 'doble' | 'completo';
  href?: string;
}) {
  const vacio = !valor?.trim();
  const columnas = { simple: '', doble: 'sm:col-span-2', completo: 'sm:col-span-3' }[ancho];

  return (
    // min-w-0: sin esto, una celda de grilla se estira al contenido y
    // empuja (o tapa) a la de al lado.
    <div className={`min-w-0 ${columnas}`}>
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-brand-900/45">{etiqueta}</p>
      {vacio ? (
        <p className="mt-0.5 text-sm text-brand-900/30">—</p>
      ) : href ? (
        <a
          href={href}
          className="mt-0.5 block text-sm text-brand-700 [overflow-wrap:anywhere] hover:underline"
        >
          {conCortes(valor!)}
        </a>
      ) : (
        <p className="mt-0.5 text-sm text-brand-900 [overflow-wrap:anywhere]">{valor}</p>
      )}
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-900/70">{titulo}</h3>
      {children}
    </section>
  );
}

function IconoCorreo() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconoTelefono() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-[3px] shrink-0">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}

/**
 * Un contacto del proveedor como tarjeta: el nombre arriba y, debajo, el
 * correo y el teléfono cada uno en SU renglón.
 *
 * Antes eran tres columnas (nombre / correo / teléfono) de un tercio del
 * modal cada una. Un correo como operaciones1@drmullernutricion.com no
 * entra en un tercio y se encimaba sobre el teléfono. En la tarjeta el
 * correo tiene todo el ancho, y además se puede tocar: abre el correo o
 * marca el número.
 */
function Contacto({
  titulo,
  nombre,
  correo,
  telefono,
}: {
  titulo: string;
  nombre: string | null | undefined;
  correo: string | null | undefined;
  telefono: string | null | undefined;
}) {
  const telefonoVisible = telefono ? formatearTelefono(telefono) : '';

  return (
    <div className="min-w-0 rounded-lg border border-brand-900/8 bg-brand-900/[0.015] px-4 py-3">
      <p className="text-[10.5px] font-medium uppercase tracking-wide text-brand-900/45">{titulo}</p>
      <p className={`mt-1 text-sm font-medium [overflow-wrap:anywhere] ${nombre?.trim() ? 'text-brand-900' : 'text-brand-900/30'}`}>
        {nombre?.trim() || 'Sin registrar'}
      </p>

      <div className="mt-2 space-y-1.5 text-sm">
        {correo?.trim() ? (
          <a href={`mailto:${correo}`} className="flex min-w-0 items-start gap-2 text-brand-700 hover:underline">
            <IconoCorreo />
            <span className="min-w-0 [overflow-wrap:anywhere]">{conCortes(correo)}</span>
          </a>
        ) : (
          <p className="flex items-start gap-2 text-brand-900/30">
            <IconoCorreo />
            Sin correo
          </p>
        )}

        {telefonoVisible ? (
          <a href={`tel:${telefono}`} className="flex items-start gap-2 tabular-nums text-brand-900/75 hover:text-brand-900">
            <IconoTelefono />
            {telefonoVisible}
          </a>
        ) : (
          <p className="flex items-start gap-2 text-brand-900/30">
            <IconoTelefono />
            Sin teléfono
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Aprovecha 2 endpoints que YA existían (no hizo falta tocar el
 * backend): obtenerFichaCalificacion (misma data que usa el flujo de
 * Calificación, ya trae latitud/longitud) para todo el detalle, más el
 * estado general que ya viene en la lista.
 *
 * El mapa es un iframe de Google Maps con la lat/lng -> no hace falta
 * ninguna librería nueva ni API key para esto (el modo "embed" de
 * Google Maps es gratuito y público). Si más adelante hace falta algo
 * más interactivo (varios proveedores en un mismo mapa, filtros,
 * clusters, etc.) ahí sí conviene sumar una librería como Leaflet.
 */
export default function ModalDetalleProveedor({
  idProveedor,
  razonSocial,
  onClose,
}: {
  idProveedor: number;
  razonSocial: string;
  onClose: () => void;
}) {
  const { data: ficha, isLoading } = useQuery({
    queryKey: ['ficha-calificacion', idProveedor],
    queryFn: () => proveedoresApi.obtenerFichaCalificacion(idProveedor),
  });

  // Nota de desempeño del proveedor. Query aparte de la ficha: si el
  // endpoint falla, el detalle del proveedor se muestra igual y solo
  // desaparece el bloque de la nota.
  const { data: calificacion } = useQuery({
    queryKey: ['calificacion-global-proveedor', idProveedor],
    queryFn: () => calificacionGlobalApi.obtenerCalificacionGlobalDeProveedor(idProveedor),
    retry: false,
  });

  const s1 = ficha?.seccion_1;
  const lat = s1?.latitud != null ? Number(s1.latitud) : null;
  const lng = s1?.longitud != null ? Number(s1.longitud) : null;
  const tieneUbicacion = lat != null && lng != null && !Number.isNaN(lat) && !Number.isNaN(lng);

  return (
    <Modal onClose={onClose} title={razonSocial} maxWidth="max-w-3xl" expandible>
      {isLoading || !ficha ? (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* La nota va primero: es lo que Compras y Calidad vienen a ver.
              En variante COMPACTA a propósito: acá es un bloque más de una
              ficha que ya tiene datos generales, cuatro contactos y un mapa,
              y en tamaño completo (anillo grande, barras por componente y
              pie explicativo) se comía la pantalla antes de llegar a lo
              demás. El desglose completo vive en la tabla de Calificación de
              Proveedores, a un clic sobre la nota. */}
          {calificacion && (
            <div className="rounded-lg border border-brand-900/8 px-4 py-3">
              <p className="text-[10.5px] font-semibold uppercase tracking-wide text-brand-900/45 mb-2">
                Calificación del proveedor
              </p>
              <DesgloseCalificacion datos={calificacion} compacto />
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge tone={ficha.estado_calificacion_general === 'Aprobado' ? 'success' : 'neutral'}>
              Ficha: {ficha.estado_calificacion_general ?? 'En revisión'}
            </Badge>
            <Badge tone="neutral">{Number(ficha.porcentaje_completado)}% completa</Badge>
          </div>

          {/* Los campos LARGOS (razón social, nombre comercial, correo,
              dirección) ocupan dos tercios y los cortos uno: así un nombre
              o un correo largo nunca comparten renglón con algo que
              puedan tapar. */}
          <Bloque titulo="Datos generales">
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Dato etiqueta="Razón social" valor={s1?.razon_social} ancho="doble" />
              <Dato etiqueta="RUC" valor={s1?.ruc} />
              <Dato etiqueta="Nombre comercial" valor={s1?.nombre_comercial} ancho="doble" />
              <Dato etiqueta="Clase de contribuyente" valor={s1?.clase_contribuyente} />
              <Dato
                etiqueta="Correo"
                valor={s1?.email}
                ancho="doble"
                href={s1?.email ? `mailto:${s1.email}` : undefined}
              />
              <Dato etiqueta="Teléfono" valor={s1?.telefono ? formatearTelefono(s1.telefono) : s1?.telefono} />
              <Dato etiqueta="Dirección" valor={s1?.direccion} ancho="doble" />
              <Dato etiqueta="Ciudad" valor={s1?.ciudad} />
              <Dato etiqueta="Página web" valor={s1?.pagina_web} ancho="completo" />
            </div>
          </Bloque>

          <Bloque titulo="Contactos">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Contacto
                titulo="Representante legal"
                nombre={s1?.representante_legal}
                correo={s1?.correo_representante}
                telefono={s1?.telefono_representante}
              />
              <Contacto
                titulo="Ventas"
                nombre={s1?.contacto_venta}
                correo={s1?.correo_venta}
                telefono={s1?.telefono_contacto_venta}
              />
              <Contacto
                titulo="Calidad"
                nombre={s1?.contacto_calidad}
                correo={s1?.correo_calidad}
                telefono={s1?.telefono_contacto_calidad}
              />
              <Contacto
                titulo="Contabilidad"
                nombre={s1?.contacto_contabilidad}
                correo={s1?.correo_contabilidad}
                telefono={s1?.telefono_contabilidad}
              />
            </div>
          </Bloque>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-brand-900/70 uppercase tracking-wide mb-2">
                Clase de Proveedor
              </p>
              {ficha.seccion_2.clases.length === 0 ? (
                <p className="text-sm text-brand-900/40">Sin registrar</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.seccion_2.clases.map((c) => (
                    <Badge key={c.id_clase_proveedor} tone="neutral">
                      {c.nombre_clase}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-brand-900/70 uppercase tracking-wide mb-2">
                Categoría de producto/servicio
              </p>
              {ficha.seccion_3.categorias.length === 0 ? (
                <p className="text-sm text-brand-900/40">Sin registrar</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {ficha.seccion_3.categorias.map((c) => (
                    <Badge key={c.id_categoria_producto} tone="neutral">
                      {c.nombre_categoria}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-900/70 uppercase tracking-wide mb-2">Ubicación</p>
            {tieneUbicacion ? (
              <div className="space-y-2">
                <div className="rounded-lg overflow-hidden border border-brand-900/10">
                  <iframe
                    title="Ubicación del proveedor"
                    width="100%"
                    height="260"
                    style={{ border: 0 }}
                    loading="lazy"
                    src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                  />
                </div>
                <a
                  href={`https://www.google.com/maps?q=${lat},${lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-brand-700 hover:underline"
                >
                  Abrir en Google Maps →
                </a>
              </div>
            ) : (
              <p className="text-sm text-brand-900/40">El proveedor no registró su ubicación.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}