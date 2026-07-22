// src/modules/miFicha/components/FormularioCorreccionFicha.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import CampoFicha from './CampoFicha';
import CampoFichaSelect from './CampoFichaSelect';
import TooltipObservacion from './TooltipObservacion';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import Spinner from '../../../shared/components/Spinner';
import { guardarSeccion1, guardarSeccion2, guardarSeccion3 } from '../api/fichaApi';
import { listarClasesProveedor, listarCategoriasProducto, type ClaseProveedorCatalogo, type CategoriaProductoCatalogo } from '../api/catalogosApi';
import { CIUDADES_ECUADOR } from '../constants/ciudadesEcuador';
import { CAMPO_CATEGORIA, CAMPO_CLASE } from '../../../shared/constants/camposFichaProveedor';
import type { FichaProveedor } from '../types';

const requerido = (mensaje = 'Requerido') => z.string().min(1, mensaje);
const correoRequerido = z.string().min(1, 'Requerido').email('Correo inválido');

// Mismo esquema que el formulario normal: los campos bloqueados nunca
// cambian (ya venían válidos), así que solo el que el proveedor edite de
// verdad necesita pasar su propia regla.
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

function Divisor() {
  return <hr className="border-t border-brand-900/10" />;
}

interface CampoProps {
  campo: keyof FormValues;
  label: string;
  tipo?: string;
}

export default function FormularioCorreccionFicha({
  ficha,
  onGuardado,
}: {
  ficha: FichaProveedor;
  onGuardado: (ficha: FichaProveedor) => void;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ruc: aTexto(ficha.seccion_1.ruc),
      clase_contribuyente: aTexto(ficha.seccion_1.clase_contribuyente),
      razon_social: aTexto(ficha.seccion_1.razon_social),
      nombre_comercial: aTexto(ficha.seccion_1.nombre_comercial),
      email: aTexto(ficha.seccion_1.email),
      telefono: aTexto(ficha.seccion_1.telefono),
      direccion: aTexto(ficha.seccion_1.direccion),
      ciudad: aTexto(ficha.seccion_1.ciudad),
      pagina_web: aTexto(ficha.seccion_1.pagina_web),
      representante_legal: aTexto(ficha.seccion_1.representante_legal),
      correo_representante: aTexto(ficha.seccion_1.correo_representante),
      telefono_representante: aTexto(ficha.seccion_1.telefono_representante),
      contacto_venta: aTexto(ficha.seccion_1.contacto_venta),
      correo_venta: aTexto(ficha.seccion_1.correo_venta),
      telefono_contacto_venta: aTexto(ficha.seccion_1.telefono_contacto_venta),
      contacto_calidad: aTexto(ficha.seccion_1.contacto_calidad),
      correo_calidad: aTexto(ficha.seccion_1.correo_calidad),
      telefono_contacto_calidad: aTexto(ficha.seccion_1.telefono_contacto_calidad),
      contacto_contabilidad: aTexto(ficha.seccion_1.contacto_contabilidad),
      correo_contabilidad: aTexto(ficha.seccion_1.correo_contabilidad),
      telefono_contabilidad: aTexto(ficha.seccion_1.telefono_contabilidad),
    },
  });

  const [claseCatalogo, setClaseCatalogo] = useState<ClaseProveedorCatalogo[]>([]);
  const [categoriaCatalogo, setCategoriaCatalogo] = useState<CategoriaProductoCatalogo[]>([]);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(false);
  const [clasesSeleccionadas, setClasesSeleccionadas] = useState<number[]>(
    ficha.seccion_2.clases.map((c) => c.id_clase_proveedor)
  );
  const [categoriasSeleccionadas, setCategoriasSeleccionadas] = useState<number[]>(
    ficha.seccion_3.categorias.map((c) => c.id_categoria_producto)
  );

  function esEditable(campo: string): boolean {
    return ficha.calificaciones_campos[campo]?.estado === 'Rechazado';
  }

  function observacionDe(campo: string): string | null {
    return ficha.calificaciones_campos[campo]?.observacion ?? null;
  }

  const claseEditable = esEditable(CAMPO_CLASE);
  const categoriaEditable = esEditable(CAMPO_CATEGORIA);

  // Los catálogos de Clase/Categoría solo hacen falta cargarlos si el
  // proveedor puede editar esa sección -> si están bloqueadas, alcanza
  // con mostrar lo que ya tiene seleccionado (ficha.seccion_2/3).
  useEffect(() => {
    if (claseEditable || categoriaEditable) {
      setCargandoCatalogos(true);
      Promise.all([
        claseEditable ? listarClasesProveedor() : Promise.resolve([]),
        categoriaEditable ? listarCategoriasProducto() : Promise.resolve([]),
      ])
        .then(([clases, categorias]) => {
          setClaseCatalogo(clases);
          setCategoriaCatalogo(categorias);
        })
        .finally(() => setCargandoCatalogos(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleClase(id: number) {
    setClasesSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleCategoria(id: number) {
    setCategoriasSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    setEnviando(true);
    try {
      // Sección 1 siempre se re-envía (siempre está visible en esta
      // vista) -> los campos bloqueados van con su mismo valor de
      // siempre, así que no cambia nada para ellos. latitud/longitud no
      // están en este formulario (no son campos calificables, no hay
      // mapa acá), pero el endpoint los pide obligatorios -> se mandan
      // tal cual ya estaban guardados, sin tocarlos.
      let fichaActualizada = await guardarSeccion1({
        ...values,
        latitud: ficha.seccion_1.latitud,
        longitud: ficha.seccion_1.longitud,
      });

      if (claseEditable) {
        fichaActualizada = await guardarSeccion2(clasesSeleccionadas);
      }
      if (categoriaEditable) {
        fichaActualizada = await guardarSeccion3(categoriasSeleccionadas);
      }

      onGuardado(fichaActualizada);
    } catch {
      setErrorGeneral('No se pudo guardar. Revisa los campos e intenta de nuevo.');
    } finally {
      setEnviando(false);
    }
  }

  function Campo({ campo, label, tipo }: CampoProps) {
    const editable = esEditable(campo);
    return (
      <CampoFicha
        label={label}
        type={tipo}
        disabled={!editable}
        resaltado={editable}
        accesorio={editable ? <TooltipObservacion texto={observacionDe(campo)} /> : undefined}
        {...register(campo)}
        error={errors[campo]?.message}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <section className="space-y-1.5">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">Datos generales</h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Campo campo="ruc" label="RUC" />
          <Campo campo="clase_contribuyente" label="Clase de contribuyente" />
          <Campo campo="razon_social" label="Razón social" />
          <Campo campo="nombre_comercial" label="Nombre comercial" />
          <Campo campo="email" label="Correo" tipo="email" />
          <Campo campo="telefono" label="Teléfono" />
          <Campo campo="direccion" label="Dirección" />
          <CampoFichaSelect
            label="Ciudad"
            opciones={CIUDADES_ECUADOR}
            disabled={!esEditable('ciudad')}
            resaltado={esEditable('ciudad')}
            accesorio={esEditable('ciudad') ? <TooltipObservacion texto={observacionDe('ciudad')} /> : undefined}
            {...register('ciudad')}
            error={errors.ciudad?.message}
          />
          <CampoFicha
            label="Página web (opcional)"
            disabled={!esEditable('pagina_web')}
            resaltado={esEditable('pagina_web')}
            accesorio={esEditable('pagina_web') ? <TooltipObservacion texto={observacionDe('pagina_web')} /> : undefined}
            {...register('pagina_web')}
          />
        </div>
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">Representante legal</h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Campo campo="representante_legal" label="Nombre" />
          <Campo campo="telefono_representante" label="Teléfono" />
          <Campo campo="correo_representante" label="Correo" tipo="email" />
        </div>
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">Contacto de ventas</h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Campo campo="contacto_venta" label="Nombre" />
          <Campo campo="telefono_contacto_venta" label="Teléfono" />
          <Campo campo="correo_venta" label="Correo" tipo="email" />
        </div>
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">Contacto de calidad</h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Campo campo="contacto_calidad" label="Nombre" />
          <Campo campo="telefono_contacto_calidad" label="Teléfono" />
          <Campo campo="correo_calidad" label="Correo" tipo="email" />
        </div>
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
          Contacto de contabilidad
        </h3>
        <div className="grid grid-cols-2 gap-x-10 gap-y-3">
          <Campo campo="contacto_contabilidad" label="Nombre" />
          <Campo campo="telefono_contabilidad" label="Teléfono" />
          <Campo campo="correo_contabilidad" label="Correo" tipo="email" />
        </div>
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
            Clase de Proveedor
          </h3>
          {claseEditable && <Badge tone="danger">Corregir</Badge>}
          {claseEditable && <TooltipObservacion texto={observacionDe(CAMPO_CLASE)} />}
        </div>
        {claseEditable ? (
          cargandoCatalogos ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {claseCatalogo.map((c) => (
                <button
                  key={c.id_clase_proveedor}
                  type="button"
                  onClick={() => toggleClase(c.id_clase_proveedor)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    clasesSeleccionadas.includes(c.id_clase_proveedor)
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-white text-brand-900 border-brand-900/20 hover:border-brand-700'
                  }`}
                >
                  {c.nombre_clase}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {ficha.seccion_2.clases.map((c) => (
              <Badge key={c.id_clase_proveedor} tone="info">
                {c.nombre_clase}
              </Badge>
            ))}
          </div>
        )}
      </section>

      <Divisor />

      <section className="space-y-1.5">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
            Categoría de Productos
          </h3>
          {categoriaEditable && <Badge tone="danger">Corregir</Badge>}
          {categoriaEditable && <TooltipObservacion texto={observacionDe(CAMPO_CATEGORIA)} />}
        </div>
        {categoriaEditable ? (
          cargandoCatalogos ? (
            <Spinner className="h-4 w-4" />
          ) : (
            <div className="flex flex-wrap gap-2">
              {categoriaCatalogo.map((c) => (
                <button
                  key={c.id_categoria_producto}
                  type="button"
                  onClick={() => toggleCategoria(c.id_categoria_producto)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                    categoriasSeleccionadas.includes(c.id_categoria_producto)
                      ? 'bg-brand-700 text-white border-brand-700'
                      : 'bg-white text-brand-900 border-brand-900/20 hover:border-brand-700'
                  }`}
                >
                  {c.nombre_categoria}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex flex-wrap gap-2">
            {ficha.seccion_3.categorias.map((c) => (
              <Badge key={c.id_categoria_producto} tone="info">
                {c.nombre_categoria}
              </Badge>
            ))}
          </div>
        )}
      </section>

      {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

      <div className="flex justify-end pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="submit" isLoading={enviando}>
          Guardar correcciones
        </Button>
      </div>
    </form>
  );
}