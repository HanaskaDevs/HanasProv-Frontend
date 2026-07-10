import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Button from '../../../shared/components/Button';
import { listarRoles, type Rol } from '../../roles/api/rolesApi';
import { agregarEmpresaUsuario } from '../api/usuariosApi';
import { useAuth } from '../../auth/hooks/useAuth';

const schema = z.object({
  id_empresa: z.coerce.number().min(1, 'Selecciona una empresa'),
  id_rol: z.coerce.number().optional(),
});

type FormInput = z.input<typeof schema>;
type FormOutput = z.output<typeof schema>;

export default function ModalAgregarEmpresa({
  idUsuario,
  esInterno,
  onClose,
  onAgregado,
}: {
  idUsuario: number;
  esInterno: boolean;
  onClose: () => void;
  onAgregado: () => void;
}) {
  const { usuario } = useAuth();
  const [roles, setRoles] = useState<Rol[]>([]);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  
  const empresasDisponibles = esInterno
    ? usuario?.empresas.filter((e) => e.nombre_rol === 'Sistemas') ?? []
    : usuario?.empresas.filter((e) => e.nombre_rol === 'Sistemas' || e.nombre_rol === 'Admin') ?? [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormInput, unknown, FormOutput>({ resolver: zodResolver(schema) });
  useEffect(() => {
    if (esInterno) listarRoles().then(setRoles).catch(() => setRoles([]));
  }, [esInterno]);

  async function onSubmit(values: FormOutput) {
    setErrorGeneral(null);
    try {
      await agregarEmpresaUsuario(idUsuario, values.id_empresa, esInterno ? values.id_rol : undefined);
      onAgregado();
      onClose();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        const primerError = errores ? (Object.values(errores)[0] as string[])?.[0] : null;
        setErrorGeneral(primerError ?? 'No se pudo agregar la empresa.');
      } else if (axios.isAxiosError(error) && error.response?.status === 403) {
        setErrorGeneral('No tienes permiso para otorgar acceso en esa empresa.');
      } else {
        setErrorGeneral('Ocurrió un error. Intenta de nuevo.');
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-4">Agregar empresa</h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Empresa</label>
            <select
              {...register('id_empresa')}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900"
            >
              <option value="">Selecciona una empresa</option>
              {empresasDisponibles.map((e) => (
                <option key={e.id_empresa} value={e.id_empresa}>
                  {e.nombre_comercial ?? e.razon_social}
                </option>
              ))}
            </select>
            {errors.id_empresa && <span className="text-xs text-brand-wine">{errors.id_empresa.message}</span>}
          </div>

          {esInterno && (
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Rol en esa empresa</label>
              <select
                {...register('id_rol')}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm text-brand-900"
              >
                <option value="">Selecciona un rol</option>
                {roles.map((rol) => (
                  <option key={rol.id_rol} value={rol.id_rol}>
                    {rol.nombre_rol}
                  </option>
                ))}
              </select>
            </div>
          )}

          {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Agregar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}