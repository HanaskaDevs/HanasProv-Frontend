// src/modules/miFicha/components/ModalEditarContactos.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Modal from '../../../shared/components/Modal';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { guardarContactos, type ContactosData } from '../api/fichaApi';
import type { FichaProveedor } from '../types';

const schema = z.object({
  representante_legal: z.string().min(1, 'Requerido').max(100),
  correo_representante: z.string().email('Correo inválido').max(200),
  telefono_representante: z.string().min(1, 'Requerido').max(10),

  contacto_venta: z.string().min(1, 'Requerido').max(100),
  correo_venta: z.string().email('Correo inválido').max(200),
  telefono_contacto_venta: z.string().min(1, 'Requerido').max(10),

  contacto_calidad: z.string().min(1, 'Requerido').max(100),
  correo_calidad: z.string().email('Correo inválido').max(200),
  telefono_contacto_calidad: z.string().min(1, 'Requerido').max(10),

  contacto_contabilidad: z.string().min(1, 'Requerido').max(100),
  correo_contabilidad: z.string().email('Correo inválido').max(200),
  telefono_contabilidad: z.string().min(1, 'Requerido').max(200),
});

type FormValues = z.infer<typeof schema>;

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-brand-900/70 uppercase tracking-wide">{titulo}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">{children}</div>
    </div>
  );
}

/**
 * Solo para un proveedor YA APROBADO -> el resto de la Ficha (Datos
 * Generales, Clase, Categoría) sigue bloqueado, esta pantalla puntual
 * es exclusivamente para estos 4 bloques de contacto. Al guardar, esos
 * 12 campos vuelven a quedar pendientes de revisión (el equipo lo nota
 * la próxima vez que entre a Calificación), pero el proveedor SIGUE
 * Aprobado -> no hace falta esperar nada para operar mientras tanto.
 */
export default function ModalEditarContactos({
  ficha,
  onClose,
  onGuardado,
}: {
  ficha: FichaProveedor;
  onClose: () => void;
  onGuardado: (ficha: FichaProveedor) => void;
}) {
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      representante_legal: ficha.seccion_1.representante_legal ?? '',
      correo_representante: ficha.seccion_1.correo_representante ?? '',
      telefono_representante: ficha.seccion_1.telefono_representante ?? '',
      contacto_venta: ficha.seccion_1.contacto_venta ?? '',
      correo_venta: ficha.seccion_1.correo_venta ?? '',
      telefono_contacto_venta: ficha.seccion_1.telefono_contacto_venta ?? '',
      contacto_calidad: ficha.seccion_1.contacto_calidad ?? '',
      correo_calidad: ficha.seccion_1.correo_calidad ?? '',
      telefono_contacto_calidad: ficha.seccion_1.telefono_contacto_calidad ?? '',
      contacto_contabilidad: ficha.seccion_1.contacto_contabilidad ?? '',
      correo_contabilidad: ficha.seccion_1.correo_contabilidad ?? '',
      telefono_contabilidad: ficha.seccion_1.telefono_contabilidad ?? '',
    },
  });

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      const fichaActualizada = await guardarContactos(values as ContactosData);
      onGuardado(fichaActualizada);
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data?.errors) {
        setErrorGeneral(Object.values(error.response.data.errors).flat().join(' '));
      } else {
        setErrorGeneral('No se pudieron guardar los cambios. Intente de nuevo.');
      }
    }
  }

  return (
    <Modal onClose={onClose} title="Editar contactos" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <p className="text-xs text-brand-900/55 -mt-1">
          Solo puede modificar sus datos de contacto. Para cambios en Datos Generales, Clase o Categoría,
          comuníquese con Hanaska.
        </p>

        <Bloque titulo="Representante Legal">
          <Input label="Nombre" error={errors.representante_legal?.message} {...register('representante_legal')} />
          <Input label="Correo" error={errors.correo_representante?.message} {...register('correo_representante')} />
          <Input label="Teléfono" error={errors.telefono_representante?.message} {...register('telefono_representante')} />
        </Bloque>

        <Bloque titulo="Contacto de Ventas">
          <Input label="Nombre" error={errors.contacto_venta?.message} {...register('contacto_venta')} />
          <Input label="Correo" error={errors.correo_venta?.message} {...register('correo_venta')} />
          <Input label="Teléfono" error={errors.telefono_contacto_venta?.message} {...register('telefono_contacto_venta')} />
        </Bloque>

        <Bloque titulo="Contacto de Calidad">
          <Input label="Nombre" error={errors.contacto_calidad?.message} {...register('contacto_calidad')} />
          <Input label="Correo" error={errors.correo_calidad?.message} {...register('correo_calidad')} />
          <Input label="Teléfono" error={errors.telefono_contacto_calidad?.message} {...register('telefono_contacto_calidad')} />
        </Bloque>

        <Bloque titulo="Contacto de Contabilidad">
          <Input label="Nombre" error={errors.contacto_contabilidad?.message} {...register('contacto_contabilidad')} />
          <Input label="Correo" error={errors.correo_contabilidad?.message} {...register('correo_contabilidad')} />
          <Input label="Teléfono" error={errors.telefono_contabilidad?.message} {...register('telefono_contabilidad')} />
        </Bloque>

        {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

        <div className="flex justify-end gap-2 pt-2 border-t border-brand-900/8">
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Guardar cambios
          </Button>
        </div>
      </form>
    </Modal>
  );
}