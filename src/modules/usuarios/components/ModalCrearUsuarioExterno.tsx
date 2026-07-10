import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import axios from 'axios';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { crearExterno } from '../api/usuariosApi';
import { useAuth } from '../../auth/hooks/useAuth';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  id_empresas: z.array(z.number()).min(1, 'Selecciona al menos una empresa'),
});

type FormValues = z.infer<typeof schema>;

export default function ModalCrearUsuarioExterno({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado: () => void;
}) {
  const { usuario } = useAuth();
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const empresasDisponibles =
    usuario?.empresas.filter((e) => e.nombre_rol === 'Sistemas' || e.nombre_rol === 'Admin') ?? [];

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { id_empresas: [] } });

  const idEmpresasSeleccionadas = watch('id_empresas');

  function alternarEmpresa(idEmpresa: number) {
    const actuales = idEmpresasSeleccionadas ?? [];
    const nuevas = actuales.includes(idEmpresa)
      ? actuales.filter((id) => id !== idEmpresa)
      : [...actuales, idEmpresa];
    setValue('id_empresas', nuevas, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    setErrorGeneral(null);
    try {
      await crearExterno(values.email, values.id_empresas);
      onCreado();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo crear el usuario.');
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorGeneral('No tienes permiso para crear proveedores en una de esas empresas.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">Nuevo usuario externo</h2>
        <p className="text-sm text-brand-900/60 mb-4">
          Se enviará un código de activación al correo del proveedor. Podrá completar
          su Ficha en cada empresa seleccionada una vez active su cuenta.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Correo del proveedor" type="email" {...register('email')} error={errors.email?.message} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Empresas con acceso</label>
            <div className="border border-brand-900/15 rounded-md divide-y divide-brand-900/8 max-h-40 overflow-y-auto">
              {empresasDisponibles.length === 0 && (
                <p className="text-xs text-brand-900/50 px-3 py-2">
                  No tienes rol Sistemas/Admin en ninguna empresa.
                </p>
              )}
              {empresasDisponibles.map((e) => (
                <label key={e.id_empresa} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={idEmpresasSeleccionadas?.includes(e.id_empresa) ?? false}
                    onChange={() => alternarEmpresa(e.id_empresa)}
                  />
                  {e.nombre_comercial ?? e.razon_social}
                </label>
              ))}
            </div>
            {errors.id_empresas && <span className="text-xs text-brand-wine">{errors.id_empresas.message}</span>}
          </div>

          {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Crear usuario
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}