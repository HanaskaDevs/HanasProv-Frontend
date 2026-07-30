import { useState, type ChangeEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configuracionesApi from '../api/configuracionesApi';
import type { Politica } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

export default function TabPoliticas() {
  const queryClient = useQueryClient();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ titulo: '', descripcion: '' });
  const [creando, setCreando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['config-politicas'],
    queryFn: configuracionesApi.listarPoliticas,
  });

  const crear = useMutation({
    mutationFn: () => configuracionesApi.crearPolitica(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-politicas'] });
      setCreando(false);
      setForm({ titulo: '', descripcion: '' });
    },
  });

  const actualizar = useMutation({
    mutationFn: () => configuracionesApi.actualizarPolitica(editandoId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-politicas'] });
      setEditandoId(null);
    },
  });

  const alternarActivo = useMutation({
    mutationFn: (politica: Politica) =>
      configuracionesApi.actualizarPolitica(politica.Id_Politica, { activo: !politica.Activo }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-politicas'] }),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => configuracionesApi.eliminarPolitica(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-politicas'] }),
  });

  const extraerPdf = useMutation({
    mutationFn: (pdf: File) => configuracionesApi.extraerTextoPdfPolitica(pdf),
    onSuccess: (res) => setForm((f) => ({ ...f, descripcion: res.texto })),
  });

  function seleccionarPdf(e: ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (archivo) extraerPdf.mutate(archivo);
    e.target.value = '';
  }

  function abrirEdicion(politica: Politica) {
    setEditandoId(politica.Id_Politica);
    setForm({ titulo: politica.Titulo, descripcion: politica.Descripcion });
  }

  function abrirCreacion() {
    setCreando(true);
    setForm({ titulo: '', descripcion: '' });
  }

  function cancelar() {
    setEditandoId(null);
    setCreando(false);
  }

  const mostrandoFormulario = creando || editandoId !== null;

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-900/60">
          Políticas visibles en la sección "Políticas" para proveedores y usuarios internos. Solo se muestran las
          activas.
        </p>
        {!mostrandoFormulario && <Button onClick={abrirCreacion}>+ Nueva política</Button>}
      </div>

      {mostrandoFormulario && (
        <Card>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                placeholder="Ej. Política de Confidencialidad"
              />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-brand-900">Descripción</label>
                <label className="text-xs font-medium text-brand-700 hover:underline cursor-pointer shrink-0">
                  {extraerPdf.isPending ? 'Leyendo PDF...' : '📄 Cargar desde PDF'}
                  <input type="file" accept="application/pdf" onChange={seleccionarPdf} className="hidden" disabled={extraerPdf.isPending} />
                </label>
              </div>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={6}
                className="w-full rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
                placeholder="Escribe el texto, o carga un PDF y su contenido aparecerá aquí para que lo revises."
              />
              <p className="text-xs text-brand-900/40">
                El PDF solo se usa para leer su texto; nunca se guarda como archivo. Revisa y edita el resultado antes
                de guardar.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={cancelar}>
                Cancelar
              </Button>
              <Button
                onClick={() => (editandoId ? actualizar.mutate() : crear.mutate())}
                isLoading={crear.isPending || actualizar.isPending}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-2">
        {(data ?? [])
          .sort((a, b) => a.Orden - b.Orden)
          .map((politica) => (
            <Card key={politica.Id_Politica}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        politica.Activo ? 'bg-emerald-50 text-emerald-800' : 'bg-brand-900/8 text-brand-900/40'
                      }`}
                    >
                      {politica.Activo ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="text-xs text-brand-900/40">Orden {politica.Orden}</span>
                  </div>
                  <p className="font-medium text-brand-900 text-sm">{politica.Titulo}</p>
                  <p className="text-sm text-brand-900/60 mt-0.5 whitespace-pre-line">{politica.Descripcion}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => alternarActivo.mutate(politica)}
                    className="text-xs font-medium text-brand-700 hover:underline px-1.5"
                  >
                    {politica.Activo ? 'Desactivar' : 'Activar'}
                  </button>
                  <button
                    onClick={() => abrirEdicion(politica)}
                    className="text-xs font-medium text-brand-700 hover:underline px-1.5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar.mutate(politica.Id_Politica)}
                    className="text-xs font-medium text-brand-wine hover:underline px-1.5"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}

        {(data ?? []).length === 0 && (
          <Card>
            <p className="text-sm text-brand-900/60 text-center py-10">
              Todavía no hay políticas cargadas. Presiona "+ Nueva política" para crear la primera.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}