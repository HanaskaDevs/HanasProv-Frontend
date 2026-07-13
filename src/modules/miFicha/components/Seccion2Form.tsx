import { useEffect, useState } from 'react';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { guardarSeccion2 } from '../api/fichaApi';
import { listarClasesProveedor, type ClaseProveedorCatalogo } from '../api/catalogosApi';
import type { ClaseSeleccionada, FichaProveedor } from '../types';

export default function Seccion2Form({
  seleccionadas,
  onGuardado,
}: {
  seleccionadas: ClaseSeleccionada[];
  onGuardado: (ficha: FichaProveedor) => void;
}) {
  const [catalogo, setCatalogo] = useState<ClaseProveedorCatalogo[]>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);
  const [seleccionIds, setSeleccionIds] = useState<number[]>(seleccionadas.map((c) => c.id_clase_proveedor));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listarClasesProveedor()
      .then(setCatalogo)
      .finally(() => setIsLoadingCatalogo(false));
  }, []);

  function toggle(id: number) {
    setSeleccionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit() {
    setError(null);
    if (seleccionIds.length === 0) {
      setError('Selecciona al menos una clase.');
      return;
    }
    setIsSubmitting(true);
    try {
      const ficha = await guardarSeccion2(seleccionIds);
      onGuardado(ficha);
    } catch {
      setError('No se pudo guardar. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoadingCatalogo) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-brand-900/60">Selecciona todas las que apliquen.</p>

      <div className="grid grid-cols-2 gap-2">
        {catalogo.map((clase) => (
          <label
            key={clase.id_clase_proveedor}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors
              ${
                seleccionIds.includes(clase.id_clase_proveedor)
                  ? 'border-brand-900 bg-brand-200/30'
                  : 'border-brand-900/15 hover:border-brand-900/30'
              }`}
          >
            <input
              type="checkbox"
              checked={seleccionIds.includes(clase.id_clase_proveedor)}
              onChange={() => toggle(clase.id_clase_proveedor)}
              className="accent-brand-900"
            />
            {clase.nombre_clase}
          </label>
        ))}
      </div>

      {error && <p className="text-sm text-brand-wine">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={onSubmit} isLoading={isSubmitting}>
          Guardar y continuar
        </Button>
      </div>
    </div>
  );
}