import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configuracionesApi from '../api/configuracionesApi';
import type { GuiaPaso } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

const TARGETS = [
  { value: 'tour-mi-ficha', label: 'Mi Ficha' },
  { value: 'tour-documentacion', label: 'Documentación' },
  { value: 'tour-productos', label: 'Ficha Productos' },
] as const;

export default function TabGuiaPasos() {
  const queryClient = useQueryClient();
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState({ target_id: 'tour-mi-ficha', titulo: '', texto: '' });
  const [creando, setCreando] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['config-guia-pasos'],
    queryFn: configuracionesApi.listarPasosGuia,
  });

  const crear = useMutation({
    mutationFn: () => configuracionesApi.crearPasoGuia(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-guia-pasos'] });
      setCreando(false);
      setForm({ target_id: 'tour-mi-ficha', titulo: '', texto: '' });
    },
  });

  const actualizar = useMutation({
    mutationFn: () => configuracionesApi.actualizarPasoGuia(editandoId!, form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-guia-pasos'] });
      setEditandoId(null);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => configuracionesApi.eliminarPasoGuia(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-guia-pasos'] }),
  });

  function abrirEdicion(paso: GuiaPaso) {
    setEditandoId(paso.Id_Guia_Paso);
    setForm({ target_id: paso.Target_Id, titulo: paso.Titulo, texto: paso.Texto });
  }

  function abrirCreacion() {
    setCreando(true);
    setForm({ target_id: 'tour-mi-ficha', titulo: '', texto: '' });
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
          Pasos del tour guiado que ve un proveedor nuevo en su primer inicio de sesión.
        </p>
        {!mostrandoFormulario && <Button onClick={abrirCreacion}>+ Nuevo paso</Button>}
      </div>

      {mostrandoFormulario && (
        <Card>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Apunta a</label>
              <select
                value={form.target_id}
                onChange={(e) => setForm({ ...form, target_id: e.target.value })}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              >
                {TARGETS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                placeholder="Ej. Paso 1 · Ficha de Proveedor"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Texto explicativo</label>
              <textarea
                value={form.texto}
                onChange={(e) => setForm({ ...form, texto: e.target.value })}
                rows={3}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
              />
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
          .map((paso) => (
            <Card key={paso.Id_Guia_Paso}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-brand-900/5 px-2 py-0.5 rounded-full text-brand-900/60">
                      {TARGETS.find((t) => t.value === paso.Target_Id)?.label ?? paso.Target_Id}
                    </span>
                    <span className="text-xs text-brand-900/40">Orden {paso.Orden}</span>
                  </div>
                  <p className="font-medium text-brand-900 text-sm">{paso.Titulo}</p>
                  <p className="text-sm text-brand-900/60 mt-0.5">{paso.Texto}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEdicion(paso)}
                    className="text-xs font-medium text-brand-700 hover:underline px-1.5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar.mutate(paso.Id_Guia_Paso)}
                    className="text-xs font-medium text-brand-wine hover:underline px-1.5"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </Card>
          ))}
      </div>
    </div>
  );
}