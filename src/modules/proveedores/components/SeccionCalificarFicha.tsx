// src/modules/proveedores/components/SeccionCalificarFicha.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as proveedoresApi from '../api/proveedoresApi';
import ControlesCalificacion from './ControlesCalificacion';
import FilaCampoCalificable from './FilaCampoCalificable';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import Badge from '../../../shared/components/Badge';
import {
  CAMPO_CATEGORIA,
  CAMPO_CLASE,
  CAMPOS_SECCION1,
  ETIQUETAS_CAMPOS_FICHA,
} from '../../../shared/constants/camposFichaProveedor';
import type { FichaProveedor } from '../../miFicha/types';

const CALIFICACION_VACIA = { estado: null, observacion: null, fecha: null } as const;

function calificacionDe(ficha: FichaProveedor, campo: string) {
  return ficha.calificaciones_campos[campo] ?? CALIFICACION_VACIA;
}

function GrupoCampos({
  titulo,
  campos,
  idProveedor,
  ficha,
}: {
  titulo: string;
  campos: (typeof CAMPOS_SECCION1)[number][];
  idProveedor: number;
  ficha: FichaProveedor;
}) {
  return (
    <section>
      <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide mb-2">{titulo}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {campos.map((campo) => (
          <FilaCampoCalificable
            key={campo}
            idProveedor={idProveedor}
            campo={campo}
            label={ETIQUETAS_CAMPOS_FICHA[campo]}
            valor={ficha.seccion_1[campo]}
            calificacion={calificacionDe(ficha, campo)}
          />
        ))}
      </div>
    </section>
  );
}

function BadgeEstadoGeneral({ estado }: { estado: FichaProveedor['estado_calificacion_general'] }) {
  if (estado === 'Aprobado') return <Badge tone="success">Ficha aprobada</Badge>;
  if (estado === 'Rechazado') return <Badge tone="danger">Ficha rechazada</Badge>;
  return <Badge tone="neutral">En revisión</Badge>;
}

/**
 * Calificación CAMPO POR CAMPO: cada dato de la ficha tiene su propio
 * ✓/✗. Si el admin rechaza uno, el proveedor solo podrá corregir ESE
 * campo específico (los demás quedan bloqueados) -> por eso no hay un
 * botón único de "calificar toda la ficha" como antes.
 * Clase de Proveedor y Categoría de Productos son selección múltiple, no
 * tiene sentido calificar cada ítem marcado por separado -> se califican
 * como un bloque cada una.
 */
export default function SeccionCalificarFicha({ idProveedor }: { idProveedor: number }) {
  const queryClient = useQueryClient();

  const { data: ficha, isLoading } = useQuery({
    queryKey: ['calificacion-ficha', idProveedor],
    queryFn: () => proveedoresApi.obtenerFichaCalificacion(idProveedor),
  });

  const calificarClase = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarCampoFicha(idProveedor, CAMPO_CLASE, payload),
    onSuccess: (fichaActualizada) => {
      queryClient.setQueryData(['calificacion-ficha', idProveedor], fichaActualizada);
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
  });

  const calificarCategoria = useMutation({
    mutationFn: (payload: { aprobado: boolean; observacion?: string }) =>
      proveedoresApi.calificarCampoFicha(idProveedor, CAMPO_CATEGORIA, payload),
    onSuccess: (fichaActualizada) => {
      queryClient.setQueryData(['calificacion-ficha', idProveedor], fichaActualizada);
      queryClient.invalidateQueries({ queryKey: ['proveedores-lista'] });
    },
  });

  if (isLoading || !ficha) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const fichaIncompleta = Number(ficha.porcentaje_completado) < 100;

  if (fichaIncompleta) {
    return (
      <Card className="bg-brand-yellow/10 border-brand-yellow/30">
        <p className="text-sm text-brand-900">
          El proveedor todavía no completó su ficha ({ficha.porcentaje_completado}%). Todavía no hay nada que
          calificar.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="!py-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-brand-900/55">
          Marca ✓ o ✗ en cada campo. Lo que rechaces con observación es lo único que el proveedor podrá corregir.
        </p>
        <BadgeEstadoGeneral estado={ficha.estado_calificacion_general} />
      </Card>

      <GrupoCampos
        titulo="Datos generales"
        idProveedor={idProveedor}
        ficha={ficha}
        campos={['ruc', 'clase_contribuyente', 'razon_social', 'nombre_comercial', 'email', 'telefono', 'direccion', 'ciudad', 'pagina_web']}
      />

      <GrupoCampos
        titulo="Representante legal"
        idProveedor={idProveedor}
        ficha={ficha}
        campos={['representante_legal', 'correo_representante', 'telefono_representante']}
      />

      <GrupoCampos
        titulo="Contacto de ventas"
        idProveedor={idProveedor}
        ficha={ficha}
        campos={['contacto_venta', 'correo_venta', 'telefono_contacto_venta']}
      />

      <GrupoCampos
        titulo="Contacto de calidad"
        idProveedor={idProveedor}
        ficha={ficha}
        campos={['contacto_calidad', 'correo_calidad', 'telefono_contacto_calidad']}
      />

      <GrupoCampos
        titulo="Contacto de contabilidad"
        idProveedor={idProveedor}
        ficha={ficha}
        campos={['contacto_contabilidad', 'correo_contabilidad', 'telefono_contabilidad']}
      />

      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
            Clase de Proveedor
          </h3>
          <ControlesCalificacion
            estado={calificacionDe(ficha, CAMPO_CLASE).estado}
            observacion={calificacionDe(ficha, CAMPO_CLASE).observacion}
            fecha={calificacionDe(ficha, CAMPO_CLASE).fecha}
            calificando={calificarClase.isPending}
            onCalificar={(aprobado, observacion) => calificarClase.mutate({ aprobado, observacion })}
          />
        </div>
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

      <section>
        <div className="flex items-center justify-between gap-3 mb-2">
          <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide">
            Categoría de Productos
          </h3>
          <ControlesCalificacion
            estado={calificacionDe(ficha, CAMPO_CATEGORIA).estado}
            observacion={calificacionDe(ficha, CAMPO_CATEGORIA).observacion}
            fecha={calificacionDe(ficha, CAMPO_CATEGORIA).fecha}
            calificando={calificarCategoria.isPending}
            onCalificar={(aprobado, observacion) => calificarCategoria.mutate({ aprobado, observacion })}
          />
        </div>
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