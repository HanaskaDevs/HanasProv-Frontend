import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import Input from '../../../shared/components/Input';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { listarRoles, type Rol } from '../../roles/api/rolesApi';
import { BODEGAS_PEDIDOS_INTERNOS } from '../../pedidosInternos/types';
import {
  obtenerDetalleInterno,
  obtenerDetalleExterno,
  actualizarEmailUsuario,
  actualizarRolUsuarioEmpresa,
  actualizarBodegasUsuarioEmpresa,
  quitarAccesoUsuarioEmpresa,
  type UsuarioDetalle,
} from '../api/usuariosApi';

const schema = z.object({ email: z.string().email('Correo inválido') });
type FormValues = z.infer<typeof schema>;

export default function ModalEditarUsuario({
  idUsuario,
  esInterno,
  onClose,
  onActualizado,
}: {
  idUsuario: number;
  esInterno: boolean;
  onClose: () => void;
  onActualizado: () => void;
}) {
  const [detalle, setDetalle] = useState<UsuarioDetalle | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [procesandoEmpresa, setProcesandoEmpresa] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function cargar() {
    setCargando(true);
    const data = esInterno ? await obtenerDetalleInterno(idUsuario) : await obtenerDetalleExterno(idUsuario);
    setDetalle(data);
    reset({ email: data.email });
    setCargando(false);
  }

  useEffect(() => {
    cargar();
    if (esInterno) listarRoles().then(setRoles).catch(() => setRoles([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idUsuario]);

  async function onSubmitEmail(values: FormValues) {
    setErrorGeneral(null);
    try {
      await actualizarEmailUsuario(idUsuario, values.email);
      await cargar();
      onActualizado();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        setErrorGeneral(errores ? (Object.values(errores)[0] as string[])?.[0] : 'No se pudo actualizar el correo.');
      } else {
        setErrorGeneral('No tienes permiso o algo falló al actualizar el correo.');
      }
    }
  }

  async function cambiarRol(idEmpresa: number, idRol: number) {
    setProcesandoEmpresa(idEmpresa);
    try {
      await actualizarRolUsuarioEmpresa(idUsuario, idEmpresa, idRol);
      await cargar();
      onActualizado();
    } finally {
      setProcesandoEmpresa(null);
    }
  }

  async function alternarBodega(idEmpresa: number, codigo: string, bodegasActuales: string[]) {
    const nuevasBodegas = bodegasActuales.includes(codigo)
      ? bodegasActuales.filter((b) => b !== codigo)
      : [...bodegasActuales, codigo];

    setProcesandoEmpresa(idEmpresa);
    try {
      await actualizarBodegasUsuarioEmpresa(idUsuario, idEmpresa, nuevasBodegas);
      await cargar();
      onActualizado();
    } finally {
      setProcesandoEmpresa(null);
    }
  }

  async function quitarEmpresa(idEmpresa: number) {
    setProcesandoEmpresa(idEmpresa);
    setErrorGeneral(null);
    try {
      await quitarAccesoUsuarioEmpresa(idUsuario, idEmpresa);
      await cargar();
      onActualizado();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 422) {
        const errores = error.response.data?.errors;
        setErrorGeneral(errores ? (Object.values(errores)[0] as string[])?.[0] : 'No se pudo quitar el acceso.');
      }
    } finally {
      setProcesandoEmpresa(null);
    }
  }

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <h2 className="font-display text-lg font-semibold text-brand-900 mb-4">Editar usuario</h2>

        {cargando || !detalle ? (
          <div className="flex justify-center py-8">
            <Spinner />
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleSubmit(onSubmitEmail)} className="space-y-3">
              <Input label="Correo" type="email" {...register('email')} error={errors.email?.message} />
              <div className="flex justify-end">
                <Button type="submit" isLoading={isSubmitting} className="text-xs px-3 py-1.5">
                  Guardar correo
                </Button>
              </div>
            </form>

            <div>
              <label className="text-sm font-medium text-brand-900 block mb-2">Empresas con acceso</label>
              <div className="border border-brand-900/15 rounded-md divide-y divide-brand-900/8">
                {detalle.empresas.map((e) => {
                  const nombreRolSeleccionado = esInterno
                    ? roles.find((r) => Number(r.id_rol) === Number(e.id_rol))?.nombre_rol
                    : e.nombre_rol;
                  const esCompras = nombreRolSeleccionado === 'Compras';

                  return (
                    <div key={e.id_empresa} className="px-3 py-2 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm text-brand-900">{e.nombre_comercial ?? e.razon_social}</span>

                        {esInterno ? (
                          <select
                            value={e.id_rol}
                            disabled={procesandoEmpresa === e.id_empresa}
                            onChange={(ev) => cambiarRol(e.id_empresa, Number(ev.target.value))}
                            className="rounded-md border border-brand-900/15 px-2 py-1 text-xs"
                          >
                            {roles.map((rol) => (
                              <option key={rol.id_rol} value={rol.id_rol}>
                                {rol.nombre_rol}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-brand-900/50">{e.nombre_rol}</span>
                        )}

                        <Button
                          variant="ghost"
                          className="text-xs px-2 py-1 text-brand-wine"
                          isLoading={procesandoEmpresa === e.id_empresa}
                          onClick={() => quitarEmpresa(e.id_empresa)}
                        >
                          Quitar
                        </Button>
                      </div>

                      {esCompras && (
                        <div className="flex items-center gap-3 pl-1">
                          <span className="text-xs text-brand-900/50">Bodegas:</span>
                          {BODEGAS_PEDIDOS_INTERNOS.map((codigo) => (
                            <label key={codigo} className="flex items-center gap-1.5 text-xs text-brand-900 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={e.bodegas_asignadas.includes(codigo)}
                                disabled={procesandoEmpresa === e.id_empresa}
                                onChange={() => alternarBodega(e.id_empresa, codigo, e.bodegas_asignadas)}
                                className="h-3.5 w-3.5 accent-brand-700 cursor-pointer"
                              />
                              {codigo}
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {errorGeneral && <p className="text-sm text-brand-wine">{errorGeneral}</p>}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="ghost" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}