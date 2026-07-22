import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configuracionesApi from '../api/configuracionesApi';
import type { HomeSlide } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

interface FormularioSlide {
  eyebrow: string;
  titulo: string;
  descripcion: string;
  media: File | null;
}

const FORM_VACIO: FormularioSlide = { eyebrow: '', titulo: '', descripcion: '', media: null };

export default function TabHomeSlides() {
  const queryClient = useQueryClient();
  const [editando, setEditando] = useState<HomeSlide | null>(null);
  const [creando, setCreando] = useState(false);
  const [form, setForm] = useState<FormularioSlide>(FORM_VACIO);

  const { data, isLoading } = useQuery({
    queryKey: ['config-home-slides'],
    queryFn: configuracionesApi.listarSlides,
  });

  const crear = useMutation({
    mutationFn: () =>
      configuracionesApi.crearSlide({
        eyebrow: form.eyebrow,
        titulo: form.titulo,
        descripcion: form.descripcion,
        media: form.media ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-home-slides'] });
      setCreando(false);
      setForm(FORM_VACIO);
    },
  });

  const actualizar = useMutation({
    mutationFn: () =>
      configuracionesApi.actualizarSlide(editando!.Id_Home_Slide, {
        eyebrow: form.eyebrow,
        titulo: form.titulo,
        descripcion: form.descripcion,
        media: form.media ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-home-slides'] });
      setEditando(null);
      setForm(FORM_VACIO);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => configuracionesApi.eliminarSlide(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-home-slides'] }),
  });

  function abrirEdicion(slide: HomeSlide) {
    setEditando(slide);
    setForm({ eyebrow: slide.Eyebrow, titulo: slide.Titulo, descripcion: slide.Descripcion, media: null });
  }

  function abrirCreacion() {
    setCreando(true);
    setForm(FORM_VACIO);
  }

  function cancelar() {
    setEditando(null);
    setCreando(false);
    setForm(FORM_VACIO);
  }

  const mostrandoFormulario = creando || editando !== null;

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
        <p className="text-sm text-brand-900/60">Slides del carrusel en la página de inicio pública.</p>
        {!mostrandoFormulario && <Button onClick={abrirCreacion}>+ Nuevo slide</Button>}
      </div>

      {mostrandoFormulario && (
        <Card>
          <h3 className="font-medium text-brand-900 mb-3">{editando ? 'Editar slide' : 'Nuevo slide'}</h3>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Eyebrow (etiqueta pequeña)</label>
              <input
                value={form.eyebrow}
                onChange={(e) => setForm({ ...form, eyebrow: e.target.value })}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                placeholder="Ej. Postulación"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Título</label>
              <input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">Descripción</label>
              <textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                rows={3}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-brand-900">
                Imagen o video {editando?.Ruta_Media && '(opcional, deja vacío para mantener el actual)'}
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={(e) => setForm({ ...form, media: e.target.files?.[0] ?? null })}
                className="text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={cancelar}>
                Cancelar
              </Button>
              <Button
                onClick={() => (editando ? actualizar.mutate() : crear.mutate())}
                isLoading={crear.isPending || actualizar.isPending}
              >
                Guardar
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((slide) => (
          <Card key={slide.Id_Home_Slide}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="text-xs font-medium uppercase tracking-wide text-brand-700">{slide.Eyebrow}</span>
              <span className="text-xs text-brand-900/40">Orden: {slide.Orden}</span>
            </div>
            <p className="font-medium text-brand-900 mb-1">{slide.Titulo}</p>
            <p className="text-sm text-brand-900/60 mb-3">{slide.Descripcion}</p>

            {slide.Ruta_Media && (
              <div className="rounded-lg overflow-hidden bg-brand-900/5 mb-3 aspect-video">
                {slide.Tipo_Media === 'video' ? (
                  <video src={slide.Ruta_Media} muted loop autoPlay className="w-full h-full object-cover" />
                ) : (
                  <img src={slide.Ruta_Media} alt={slide.Titulo} className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="secondary" className="text-xs px-2.5 py-1.5" onClick={() => abrirEdicion(slide)}>
                Editar
              </Button>
              <Button
                variant="ghost"
                className="text-xs px-2.5 py-1.5 text-brand-wine"
                isLoading={eliminar.isPending}
                onClick={() => eliminar.mutate(slide.Id_Home_Slide)}
              >
                Eliminar
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}