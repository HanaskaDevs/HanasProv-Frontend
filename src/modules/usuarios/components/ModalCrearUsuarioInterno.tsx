import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import { listarRoles, type Rol } from '../../roles/api/rolesApi';
import { crearInterno } from '../api/usuariosApi';
import * as empresasApi from '../../empresas/api/empresasApi';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  id_rol: z.coerce.number().min(1, 'Selecciona un rol'),
  id_empresas: z.array(z.number()).min(1, 'Selecciona al menos una empresa'),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function ModalCrearUsuarioInterno({
  onClose,
  onCreado,
}: {
  onClose: () => void;
  onCreado: () => void;
}) {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
 const [empresasDisponibles, setEmpresasDisponibles] = useState<{ id_empresa: number; razon_social: string; nombre_comercial: string | null }[]>([]);
  ([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({
    resolver: zodResolver(schema),
    defaultValues: { id_empresas: [] },
  });

  const idEmpresasSeleccionadas = watch('id_empresas');

  useEffect(() => {
    listarRoles()
      .then((data) => setRoles(data.filter((r) => r.nombre_rol !== 'Proveedor')))
      .catch(() => setRoles([]));

    empresasApi
      .listarEmpresas()
      .then(setEmpresasDisponibles)
      .catch(() => setEmpresasDisponibles([]));
  }, []);

  function alternarEmpresa(idEmpresa: number) {
    const actuales = idEmpresasSeleccionadas ?? [];
    const nuevas = actuales.includes(idEmpresa)
      ? actuales.filter((id) => id !== idEmpresa)
      : [...actuales, idEmpresa];
    setValue('id_empresas', nuevas, { shouldValidate: true });
  }

  async function onSubmit(values: FormOutput) {
    setErrorGeneral(null);
    try {
      await crearInterno(values.email, values.id_rol, values.id_empresas);
      onCreado();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo crear el usuario.');
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorGeneral('No tienes permiso para crear usuarios internos.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">Nuevo usuario interno</h2>
        <p className="text-sm text-brand-900/60 mb-4">
          Se enviará un código de activación al correo indicado.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Rol</label>
            <select
              {...register('id_rol')}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900
                focus:outline-none focus:ring-2 focus:ring-brand-700"
            >
              <option value="">Selecciona un rol</option>
              {roles.map((rol) => (
                <option key={rol.id_rol} value={rol.id_rol}>
                  {rol.nombre_rol}
                </option>
              ))}
            </select>
            {errors.id_rol && <span className="text-xs text-brand-wine">{errors.id_rol.message}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Empresas con acceso</label>
            <div className="border border-brand-900/15 rounded-md divide-y divide-brand-900/8 max-h-40 overflow-y-auto">
              {empresasDisponibles.length === 0 && (
                <p className="text-xs text-brand-900/50 px-3 py-2">No hay empresas registradas todavía.</p>
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