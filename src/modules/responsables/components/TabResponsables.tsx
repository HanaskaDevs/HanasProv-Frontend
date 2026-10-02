import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import * as responsablesApi from '../api/responsablesApi';
import type { Responsable } from '../types';
import ModalImportarAsignaciones from './ModalImportarAsignaciones';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

const FORM_VACIO = { nombre: '', correo: '', telefono: '' };

function mensajeDeError(error: unknown, porDefecto: string): string {
  if (isAxiosError(error)) {
    const datos = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    const primerError = datos?.errors ? Object.values(datos.errors)[0]?.[0] : undefined;
    return primerError ?? datos?.message ?? porDefecto;
  }
  return porDefecto;
}

/**
 * Responsables de proveedor: quién atiende a cada proveedor cuando tiene
 * una duda.
 *
 * Son dos cosas distintas en una pantalla, y ese es el orden en que se
 * usan: primero se cargan las PERSONAS (son cuatro, con nombre, correo y
 * teléfono) y después se importa el archivo con las ASIGNACIONES, que
 * referencia a cada persona por su correo. Al revés no funciona: la
 * importación rechaza los correos que no conoce en vez de inventar
 * responsables a partir de un correo mal tipeado.
 */
export default function TabResponsables() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [creando, setCreando] = useState(false);
  const [importando, setImportando] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const { data: responsables, isLoading } = useQuery({
    queryKey: ['responsables'],
    queryFn: responsablesApi.listarResponsables,
  });

  const { data: asignaciones } = useQuery({
    queryKey: ['responsables-asignaciones'],
    queryFn: responsablesApi.listarAsignaciones,
  });

  function cerrarFormulario() {
    setCreando(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
  }

  const guardar = useMutation({
    mutationFn: () =>
      editandoId !== null
        ? responsablesApi.actualizarResponsable(editandoId, { ...form, telefono: form.telefono || null })
        : responsablesApi.crearResponsable({ ...form, telefono: form.telefono || null }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsables'] });
      queryClient.invalidateQueries({ queryKey: ['responsables-asignaciones'] });
      cerrarFormulario();
    },
  });

  const cambiarActivo = useMutation({
    mutationFn: (responsable: Responsable) =>
      responsablesApi.actualizarResponsable(responsable.Id_Responsable, {
        nombre: responsable.Nombre,
        correo: responsable.Correo,
        telefono: responsable.Telefono,
        activo: !responsable.Activo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responsables'] });
      queryClient.invalidateQueries({ queryKey: ['responsables-asignaciones'] });
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => responsablesApi.eliminarResponsable(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['responsables'] }),
  });

  const quitarAsignacion = useMutation({
    mutationFn: (id: number) => responsablesApi.eliminarAsignacion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['responsables-asignaciones'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  const mostrandoFormulario = creando || editandoId !== null;
  const termino = busqueda.trim().toLowerCase();
  const asignacionesFiltradas = (asignaciones ?? []).filter(
    (a) =>
      termino === '' ||
      a.nro_proveedor_bc.toLowerCase().includes(termino) ||
      (a.nombre_en_bc ?? '').toLowerCase().includes(termino) ||
      (a.responsable.nombre ?? '').toLowerCase().includes(termino)
  );

  return (
    <div className="space-y-4">
      {/* ---------- Paso 1: las personas ---------- */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-medium text-brand-900">Responsables</h3>
            <p className="text-sm text-brand-900/60 mt-0.5">
              Las personas de Hanaska que atienden a los proveedores. Cargalas primero: el archivo
              de asignaciones las referencia por su correo.
            </p>
          </div>
          {!mostrandoFormulario && (
            <Button
              onClick={() => {
                setCreando(true);
                setForm(FORM_VACIO);
              }}
            >
              + Nuevo
            </Button>
          )}
        </div>

        {mostrandoFormulario && (
          <div className="rounded-md border border-brand-900/10 p-3 mb-4 space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-brand-900">Nombre</label>
                <input
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                  placeholder="Verónica Díaz"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-brand-900">Correo</label>
                <input
                  value={form.correo}
                  onChange={(e) => setForm({ ...form, correo: e.target.value })}
                  className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                  placeholder="vdiaz@hanaska.com"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-brand-900">Teléfono</label>
                <input
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                  placeholder="0997306002"
                />
              </div>
            </div>

            {guardar.isError && (
              <p className="text-sm text-brand-wine">
                {mensajeDeError(guardar.error, 'No se pudo guardar.')}
              </p>
            )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => guardar.mutate()}
                isLoading={guardar.isPending}
                disabled={!form.nombre.trim() || !form.correo.trim()}
              >
                Guardar
              </Button>
              <Button variant="ghost" onClick={cerrarFormulario}>
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {(responsables ?? []).length === 0 ? (
          <p className="text-sm text-brand-900/50 py-4 text-center">
            Todavía no hay responsables cargados.
          </p>
        ) : (
          <div className="divide-y divide-brand-900/8">
            {(responsables ?? []).map((r) => (
              <div key={r.Id_Responsable} className="py-2.5 flex items-center gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-brand-900">
                    {r.Nombre}
                    {!r.Activo && (
                      <span className="ml-2 text-xs font-normal text-brand-900/45">(inactivo)</span>
                    )}
                  </p>
                  <p className="text-xs text-brand-900/55">
                    {r.Correo}
                    {r.Telefono ? ` · ${r.Telefono}` : ''}
                  </p>
                </div>

                <span className="text-xs text-brand-900/50 shrink-0">
                  {r.asignaciones_count ?? 0} proveedor(es)
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => {
                      setEditandoId(r.Id_Responsable);
                      setCreando(false);
                      setForm({ nombre: r.Nombre, correo: r.Correo, telefono: r.Telefono ?? '' });
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs"
                    onClick={() => cambiarActivo.mutate(r)}
                  >
                    {r.Activo ? 'Desactivar' : 'Activar'}
                  </Button>
                  {(r.asignaciones_count ?? 0) === 0 && (
                    <Button
                      variant="ghost"
                      className="px-2 py-1 text-xs text-brand-wine"
                      onClick={() => eliminar.mutate(r.Id_Responsable)}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {eliminar.isError && (
          <p className="text-sm text-brand-wine mt-2">
            {mensajeDeError(eliminar.error, 'No se pudo eliminar.')}
          </p>
        )}
      </Card>

      {/* ---------- Paso 2: las asignaciones ---------- */}
      <Card>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-medium text-brand-900">
              Asignaciones{' '}
              <span className="font-normal text-brand-900/45 text-sm">
                ({asignaciones?.length ?? 0})
              </span>
            </h3>
            <p className="text-sm text-brand-900/60 mt-0.5">
              Qué proveedor atiende cada responsable. Se cargan desde tu archivo de Excel; las
              columnas se detectan solas.
            </p>
          </div>
          <Button onClick={() => setImportando(true)}>Importar archivo</Button>
        </div>

        {(asignaciones ?? []).length === 0 ? (
          <p className="text-sm text-brand-900/50 py-4 text-center">
            Sin asignaciones todavía. Importá tu archivo para cargarlas.
          </p>
        ) : (
          <>
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm mb-3"
              placeholder="Buscar por código, proveedor o responsable..."
            />

            <div className="max-h-96 overflow-y-auto divide-y divide-brand-900/8">
              {asignacionesFiltradas.map((a) => (
                <div key={a.id_responsable_proveedor} className="py-2 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-900 truncate">
                      <span className="font-medium">{a.nro_proveedor_bc}</span>
                      {a.nombre_en_bc && (
                        <span className="text-brand-900/55"> · {a.nombre_en_bc}</span>
                      )}
                    </p>
                    <p className="text-xs text-brand-900/55 truncate">
                      {a.responsable.nombre ?? '—'}
                      {!a.responsable.activo && ' (inactivo)'}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    className="px-2 py-1 text-xs text-brand-wine shrink-0"
                    onClick={() => quitarAsignacion.mutate(a.id_responsable_proveedor)}
                  >
                    Quitar
                  </Button>
                </div>
              ))}

              {asignacionesFiltradas.length === 0 && (
                <p className="text-sm text-brand-900/50 py-4 text-center">
                  Nada coincide con «{busqueda}».
                </p>
              )}
            </div>
          </>
        )}
      </Card>

      {importando && (
        <ModalImportarAsignaciones
          correosConocidos={(responsables ?? []).map((r) => r.Correo)}
          onCerrar={() => setImportando(false)}
        />
      )}
    </div>
  );
}
