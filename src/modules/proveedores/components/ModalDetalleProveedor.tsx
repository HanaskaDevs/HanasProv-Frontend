// src/modules/proveedores/components/ModalDetalleProveedor.tsx
import { useQuery } from '@tanstack/react-query';
import Modal from '../../../shared/components/Modal';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import * as proveedoresApi from '../api/proveedoresApi';
import { DesgloseCalificacion } from '../../../shared/components/CalificacionGlobal';
import * as calificacionGlobalApi from '../../../shared/api/calificacionGlobalApi';

function Fila({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) {
  return (
    <div>
      <p className="text-[10.5px] uppercase tracking-wide text-brand-900/45">{etiqueta}</p>
      <p className="text-sm text-brand-900">{valor?.trim() ? valor : '—'}</p>
    </div>
  );
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-brand-900/70 uppercase tracking-wide">{titulo}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
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

          <Bloque titulo="Datos Generales">
            <Fila etiqueta="RUC" valor={s1?.ruc} />
            <Fila etiqueta="Clase de contribuyente" valor={s1?.clase_contribuyente} />
            <Fila etiqueta="Razón social" valor={s1?.razon_social} />
            <Fila etiqueta="Nombre comercial" valor={s1?.nombre_comercial} />
            <Fila etiqueta="Correo" valor={s1?.email} />
            <Fila etiqueta="Teléfono" valor={s1?.telefono} />
            <Fila etiqueta="Dirección" valor={s1?.direccion} />
            <Fila etiqueta="Ciudad" valor={s1?.ciudad} />
            <Fila etiqueta="Página web" valor={s1?.pagina_web} />
          </Bloque>

          <Bloque titulo="Representante Legal">
            <Fila etiqueta="Nombre" valor={s1?.representante_legal} />
            <Fila etiqueta="Correo" valor={s1?.correo_representante} />
            <Fila etiqueta="Teléfono" valor={s1?.telefono_representante} />
          </Bloque>

          <Bloque titulo="Contacto de Ventas">
            <Fila etiqueta="Nombre" valor={s1?.contacto_venta} />
            <Fila etiqueta="Correo" valor={s1?.correo_venta} />
            <Fila etiqueta="Teléfono" valor={s1?.telefono_contacto_venta} />
          </Bloque>

          <Bloque titulo="Contacto de Calidad">
            <Fila etiqueta="Nombre" valor={s1?.contacto_calidad} />
            <Fila etiqueta="Correo" valor={s1?.correo_calidad} />
            <Fila etiqueta="Teléfono" valor={s1?.telefono_contacto_calidad} />
          </Bloque>

          <Bloque titulo="Contacto de Contabilidad">
            <Fila etiqueta="Nombre" valor={s1?.contacto_contabilidad} />
            <Fila etiqueta="Correo" valor={s1?.correo_contabilidad} />
            <Fila etiqueta="Teléfono" valor={s1?.telefono_contabilidad} />
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
                Categoría de Productos
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