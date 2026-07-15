import { Link } from 'react-router-dom';
import Badge from '../../../shared/components/Badge';
import CampoFicha from './CampoFicha';
import type { FichaProveedor } from '../types';

function aTexto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

/**
 * Misma cara visual que InformacionProveedorForm (CampoFicha, grilla de 2
 * columnas, títulos de sección en negrita) pero 100% de solo lectura:
 * todos los inputs van "disabled" -> el usuario ve exactamente el mismo
 * formato que cuando la ficha estaba en edición, sin poder tocar nada.
 */
function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2 pb-3 border-b border-brand-900/10 last:border-0">
      <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
        {titulo}
      </h3>
      <div className="grid grid-cols-2 gap-x-10 gap-y-3">{children}</div>
    </section>
  );
}

export default function VistaFichaCompleta({ ficha }: { ficha: FichaProveedor }) {
  const s1 = ficha.seccion_1;
  const ubicacion =
    s1.latitud && s1.longitud ? `${s1.latitud}, ${s1.longitud}` : '';

  return (
    <div className="space-y-4">
      <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
        <p className="text-sm text-emerald-800">
          Tu ficha está completa. No se puede editar, pero recuerda que el proceso sigue con tu{' '}
          <span className="font-semibold">documentación</span>.
        </p>
        <Link
          to="/documentos"
          className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
        >
          Ir a Documentación
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
            <polyline points="12 5 19 12 12 19" />
          </svg>
        </Link>
      </div>

      <Seccion titulo="Datos generales">
        <CampoFicha label="RUC" value={aTexto(s1.ruc)} disabled />
        <CampoFicha label="Clase de contribuyente" value={aTexto(s1.clase_contribuyente)} disabled />
        <CampoFicha label="Razón social" value={aTexto(s1.razon_social)} disabled />
        <CampoFicha label="Nombre comercial" value={aTexto(s1.nombre_comercial)} disabled />
        <CampoFicha label="Correo" value={aTexto(s1.email)} disabled />
        <CampoFicha label="Teléfono" value={aTexto(s1.telefono)} disabled />
        <CampoFicha label="Dirección" value={aTexto(s1.direccion)} disabled />
        <CampoFicha label="Ciudad" value={aTexto(s1.ciudad)} disabled />
        <CampoFicha label="Página web (opcional)" value={aTexto(s1.pagina_web)} disabled />
        <CampoFicha label="Ubicación" value={ubicacion} disabled />
      </Seccion>

      <Seccion titulo="Representante legal">
        <CampoFicha label="Nombre" value={aTexto(s1.representante_legal)} disabled />
        <CampoFicha label="Teléfono" value={aTexto(s1.telefono_representante)} disabled />
        <CampoFicha label="Correo" value={aTexto(s1.correo_representante)} disabled />
      </Seccion>

      <Seccion titulo="Contacto de ventas">
        <CampoFicha label="Nombre" value={aTexto(s1.contacto_venta)} disabled />
        <CampoFicha label="Teléfono" value={aTexto(s1.telefono_contacto_venta)} disabled />
        <CampoFicha label="Correo" value={aTexto(s1.correo_venta)} disabled />
      </Seccion>

      <Seccion titulo="Contacto de calidad">
        <CampoFicha label="Nombre" value={aTexto(s1.contacto_calidad)} disabled />
        <CampoFicha label="Teléfono" value={aTexto(s1.telefono_contacto_calidad)} disabled />
        <CampoFicha label="Correo" value={aTexto(s1.correo_calidad)} disabled />
      </Seccion>

      <Seccion titulo="Contacto de contabilidad">
        <CampoFicha label="Nombre" value={aTexto(s1.contacto_contabilidad)} disabled />
        <CampoFicha label="Teléfono" value={aTexto(s1.telefono_contabilidad)} disabled />
        <CampoFicha label="Correo" value={aTexto(s1.correo_contabilidad)} disabled />
      </Seccion>

      <section className="space-y-2 pb-1">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
          Clase de proveedor
        </h3>
        <div className="flex flex-wrap gap-2">
          {ficha.seccion_2.clases.map((c) => (
            <Badge key={c.id_clase_proveedor} tone="info">
              {c.nombre_clase}
            </Badge>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
          Categoría de productos
        </h3>
        <div className="flex flex-wrap gap-2">
          {ficha.seccion_3.categorias.map((c) => (
            <Badge key={c.id_categoria_producto} tone="info">
              {c.nombre_categoria}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}