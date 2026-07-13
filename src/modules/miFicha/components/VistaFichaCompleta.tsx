import Badge from '../../../shared/components/Badge';
import type { FichaProveedor } from '../types';

function Campo({ label, valor }: { label: string; valor: string | number | null | undefined }) {
  return (
    <div>
      <p className="text-xs text-brand-900/50">{label}</p>
      <p className="text-sm text-brand-900">{valor || '—'}</p>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1.5 pb-3 border-b border-brand-900/10 last:border-0">
      <h3 className="font-display text-[11px] font-semibold text-brand-900/70 uppercase tracking-wide">
        {titulo}
      </h3>
      <div className="grid grid-cols-3 gap-x-6 gap-y-2">{children}</div>
    </section>
  );
}

export default function VistaFichaCompleta({ ficha }: { ficha: FichaProveedor }) {
  const s1 = ficha.seccion_1;

  return (
    <div className="space-y-6">
      <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
        Tu ficha está completa y en revisión. No se puede editar mientras el equipo la evalúa.
      </div>

      <Seccion titulo="Datos generales">
        <Campo label="RUC" valor={s1.ruc} />
        <Campo label="Clase de contribuyente" valor={s1.clase_contribuyente} />
        <Campo label="Razón social" valor={s1.razon_social} />
        <Campo label="Nombre comercial" valor={s1.nombre_comercial} />
        <Campo label="Correo" valor={s1.email} />
        <Campo label="Teléfono" valor={s1.telefono} />
        <Campo label="Dirección" valor={s1.direccion} />
        <Campo label="Ciudad" valor={s1.ciudad} />
        <Campo label="Página web" valor={s1.pagina_web} />
        <Campo
          label="Ubicación"
          valor={s1.latitud && s1.longitud ? `${s1.latitud}, ${s1.longitud}` : null}
        />
      </Seccion>

      <Seccion titulo="Representante legal">
        <Campo label="Nombre" valor={s1.representante_legal} />
        <Campo label="Teléfono" valor={s1.telefono_representante} />
        <Campo label="Correo" valor={s1.correo_representante} />
      </Seccion>

      <Seccion titulo="Contacto de ventas">
        <Campo label="Nombre" valor={s1.contacto_venta} />
        <Campo label="Teléfono" valor={s1.telefono_contacto_venta} />
        <Campo label="Correo" valor={s1.correo_venta} />
      </Seccion>

      <Seccion titulo="Contacto de calidad">
        <Campo label="Nombre" valor={s1.contacto_calidad} />
        <Campo label="Teléfono" valor={s1.telefono_contacto_calidad} />
        <Campo label="Correo" valor={s1.correo_calidad} />
      </Seccion>

      <Seccion titulo="Contacto de contabilidad">
        <Campo label="Nombre" valor={s1.contacto_contabilidad} />
        <Campo label="Teléfono" valor={s1.telefono_contabilidad} />
        <Campo label="Correo" valor={s1.correo_contabilidad} />
      </Seccion>

      <section className="space-y-2">
        <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
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
        <h3 className="font-display text-xs font-semibold text-brand-900 uppercase tracking-wide">
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