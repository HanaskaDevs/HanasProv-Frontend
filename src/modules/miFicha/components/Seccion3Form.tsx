import { useEffect, useState } from 'react';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import AceptacionPoliticas from './AceptacionPoliticas';
import { guardarSeccion3 } from '../api/fichaApi';
import { listarCategoriasProducto, type CategoriaProductoCatalogo } from '../api/catalogosApi';
import { mensajeDeError } from '../utils/mensajeDeError';
import { MENSAJE_POLITICAS_REQUERIDAS } from '../constants/politicas';
import type { CategoriaSeleccionada, FichaProveedor } from '../types';

export default function Seccion3Form({
  seleccionadas,
  onGuardado,
  requiereAceptarPoliticas = false,
}: {
  seleccionadas: CategoriaSeleccionada[];
  onGuardado: (ficha: FichaProveedor) => void;
  /**
   * true cuando este guardado deja la ficha completa (las otras secciones
   * ya lo están) y el proveedor todavía no aceptó las políticas -> se
   * muestra la casilla y el botón pasa a "Guardar y enviar a revisión".
   * Lo decide ModalFichaProveedor, que conoce el estado de toda la ficha.
   */
  requiereAceptarPoliticas?: boolean;
}) {
  const [catalogo, setCatalogo] = useState<CategoriaProductoCatalogo[]>([]);
  const [isLoadingCatalogo, setIsLoadingCatalogo] = useState(true);
  const [seleccionIds, setSeleccionIds] = useState<number[]>(
    seleccionadas.map((c) => c.id_categoria_producto)
  );
  const [aceptaPoliticas, setAceptaPoliticas] = useState(false);
  const [errorPoliticas, setErrorPoliticas] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listarCategoriasProducto()
      .then(setCatalogo)
      .finally(() => setIsLoadingCatalogo(false));
  }, []);

  function toggle(id: number) {
    setSeleccionIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function onSubmit() {
    setError(null);
    setErrorPoliticas(null);

    if (seleccionIds.length === 0) {
      setError('Selecciona al menos una categoría.');
      return;
    }

    // Sin la casilla no se envía: el backend lo rechazaría igual (422),
    // pero avisar acá evita el viaje y señala exactamente qué falta.
    if (requiereAceptarPoliticas && !aceptaPoliticas) {
      setErrorPoliticas(MENSAJE_POLITICAS_REQUERIDAS);
      return;
    }

    setIsSubmitting(true);
    try {
      const ficha = await guardarSeccion3(seleccionIds, requiereAceptarPoliticas ? aceptaPoliticas : undefined);
      onGuardado(ficha);
    } catch (e) {
      setError(mensajeDeError(e, 'No se pudo guardar. Intenta de nuevo.'));
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
        {catalogo.map((categoria) => (
          <label
            key={categoria.id_categoria_producto}
            className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors
              ${
                seleccionIds.includes(categoria.id_categoria_producto)
                  ? 'border-brand-900 bg-brand-200/30'
                  : 'border-brand-900/15 hover:border-brand-900/30'
              }`}
          >
            <input
              type="checkbox"
              checked={seleccionIds.includes(categoria.id_categoria_producto)}
              onChange={() => toggle(categoria.id_categoria_producto)}
              className="accent-brand-900"
            />
            {categoria.nombre_categoria}
          </label>
        ))}
      </div>

      {requiereAceptarPoliticas && (
        <AceptacionPoliticas
          aceptado={aceptaPoliticas}
          onChange={(v) => {
            setAceptaPoliticas(v);
            if (v) setErrorPoliticas(null);
          }}
          error={errorPoliticas}
        />
      )}

      {error && <p className="text-sm text-brand-wine">{error}</p>}

      <div className="flex justify-end">
        <Button onClick={onSubmit} isLoading={isSubmitting}>
          {requiereAceptarPoliticas ? 'Guardar y enviar a revisión' : 'Guardar'}
        </Button>
      </div>
    </div>
  );
}
