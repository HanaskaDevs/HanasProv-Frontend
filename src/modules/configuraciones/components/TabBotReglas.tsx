import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as configuracionesApi from '../api/configuracionesApi';
import type { BotRegla } from '../types';
import Card from '../../../shared/components/Card';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

export default function TabBotReglas() {
  const queryClient = useQueryClient();
  const [tipoActivo, setTipoActivo] = useState<'Persona' | 'Respaldo'>('Persona');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [textoEdicion, setTextoEdicion] = useState('');
  const [palabraEdicion, setPalabraEdicion] = useState('');
  const [creando, setCreando] = useState(false);
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [nuevaPalabra, setNuevaPalabra] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['config-bot-reglas'],
    queryFn: configuracionesApi.listarReglasBot,
  });

  const crear = useMutation({
    mutationFn: () =>
      configuracionesApi.crearReglaBot({
        tipo: tipoActivo,
        contenido: nuevoContenido,
        palabra_clave: tipoActivo === 'Respaldo' ? nuevaPalabra : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-bot-reglas'] });
      setCreando(false);
      setNuevoContenido('');
      setNuevaPalabra('');
    },
  });

  const actualizar = useMutation({
    mutationFn: (regla: BotRegla) =>
      configuracionesApi.actualizarReglaBot(regla.Id_Bot_Regla, {
        contenido: textoEdicion,
        palabra_clave: regla.Tipo === 'Respaldo' ? palabraEdicion : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config-bot-reglas'] });
      setEditandoId(null);
    },
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => configuracionesApi.eliminarReglaBot(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['config-bot-reglas'] }),
  });

  function abrirEdicion(regla: BotRegla) {
    setEditandoId(regla.Id_Bot_Regla);
    setTextoEdicion(regla.Contenido);
    setPalabraEdicion(regla.Palabra_Clave ?? '');
  }

  const reglasFiltradas = (data ?? []).filter((r) => r.Tipo === tipoActivo);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-brand-900/60">
        Reglas de comportamiento (Persona) y respuestas automáticas cuando la IA no está disponible (Respaldo).
      </p>

      <div className="flex items-center gap-1 border-b border-brand-900/10">
        {(['Persona', 'Respaldo'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipoActivo(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tipoActivo === t
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
            }`}
          >
            {t === 'Persona' ? 'Personalidad y reglas' : 'Respuestas de respaldo'}
          </button>
        ))}
      </div>

      {creando ? (
        <Card>
          {tipoActivo === 'Respaldo' && (
            <div className="flex flex-col gap-1 mb-3">
              <label className="text-sm font-medium text-brand-900">
                Palabra clave (o "default" para la respuesta genérica)
              </label>
              <input
                value={nuevaPalabra}
                onChange={(e) => setNuevaPalabra(e.target.value)}
                className="rounded-md border border-brand-900/15 px-3 py-2 text-sm"
                placeholder="Ej. ficha, documento, producto..."
              />
            </div>
          )}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-brand-900">Contenido</label>
            <textarea
              value={nuevoContenido}
              onChange={(e) => setNuevoContenido(e.target.value)}
              rows={4}
              className="rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setCreando(false)}>
              Cancelar
            </Button>
            <Button onClick={() => crear.mutate()} isLoading={crear.isPending} disabled={!nuevoContenido.trim()}>
              Guardar
            </Button>
          </div>
        </Card>
      ) : (
        <Button onClick={() => setCreando(true)}>+ Nueva regla</Button>
      )}

      <div className="space-y-2">
        {reglasFiltradas.map((regla) => (
          <Card key={regla.Id_Bot_Regla}>
            {editandoId === regla.Id_Bot_Regla ? (
              <div className="space-y-2">
                {regla.Tipo === 'Respaldo' && (
                  <input
                    value={palabraEdicion}
                    onChange={(e) => setPalabraEdicion(e.target.value)}
                    className="rounded-md border border-brand-900/15 px-3 py-1.5 text-sm w-full"
                    placeholder="Palabra clave"
                  />
                )}
                <textarea
                  value={textoEdicion}
                  onChange={(e) => setTextoEdicion(e.target.value)}
                  rows={3}
                  className="rounded-md border border-brand-900/15 px-3 py-2 text-sm resize-none w-full"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" className="text-xs px-2 py-1" onClick={() => setEditandoId(null)}>
                    Cancelar
                  </Button>
                  <Button
                    className="text-xs px-2 py-1"
                    onClick={() => actualizar.mutate(regla)}
                    isLoading={actualizar.isPending}
                  >
                    Guardar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {regla.Palabra_Clave && (
                    <span className="text-xs font-mono bg-brand-900/5 px-2 py-0.5 rounded-full text-brand-900/60 mb-1.5 inline-block">
                      {regla.Palabra_Clave}
                    </span>
                  )}
                  <p className="text-sm text-brand-900/80">{regla.Contenido}</p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => abrirEdicion(regla)}
                    className="text-xs font-medium text-brand-700 hover:underline px-1.5"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminar.mutate(regla.Id_Bot_Regla)}
                    className="text-xs font-medium text-brand-wine hover:underline px-1.5"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )}
          </Card>
        ))}

        {reglasFiltradas.length === 0 && (
          <p className="text-sm text-brand-900/50 text-center py-6">No hay reglas de este tipo todavía.</p>
        )}
      </div>
    </div>
  );
}