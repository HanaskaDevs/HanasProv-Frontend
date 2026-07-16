import Badge from '../../../shared/components/Badge';
import CampoFicha from './CampoFicha';
import type { FichaProveedor } from '../types';

function aTexto(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(valor);
}

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

/**
 * Todos los campos de la Ficha de Proveedor en modo solo lectura (mismo
 * CampoFicha/puntitos/grilla que el resto del sistema). Se extrajo de
 * VistaFichaCompleta para poder reusarlo también en la vista de
 * calificación del admin (ModuloProveedores) sin duplicar los ~30 campos
 * ni arrastrar el banner "Ir a Documentación" que es específico del
 * proveedor viendo SU PROPIA ficha.
 */
export default function CamposFichaSoloLectura({ ficha }: { ficha: FichaProveedor }) {
  const s1 = ficha.seccion_1;
  const ubicacion = s1.latitud && s1.longitud ? `${s1.latitud}, ${s1.longitud}` : '';

  return (
    <div className="space-y-4">
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
          {ficha.seccion_2.clases.length === 0 ? (
            <span className="text-xs text-brand-900/40 italic">Sin seleccionar</span>
          ) : (
            ficha.seccion_2.clases.map((c) => (
              <Badge key={c.id_clase_proveedor} tone="info">
                {c.nombre_clase}
              </Badge>
            ))
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
          Categoría de productos
        </h3>
        <div className="flex flex-wrap gap-2">
          {ficha.seccion_3.categorias.length === 0 ? (
            <span className="text-xs text-brand-900/40 italic">Sin seleccionar</span>
          ) : (
            ficha.seccion_3.categorias.map((c) => (
              <Badge key={c.id_categoria_producto} tone="info">
                {c.nombre_categoria}
              </Badge>
            ))
          )}
        </div>
      </section>
    </div>
  );
}