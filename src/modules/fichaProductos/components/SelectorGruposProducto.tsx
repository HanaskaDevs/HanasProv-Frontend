import { useQuery } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';

/**
 * Multi-select de "Grupo de producto" (EK, CD, PH, IM...).
 *
 * Se dibuja como una fila de PASTILLAS y no como un <select multiple>
 * porque son pocas opciones, cortas, y el <select multiple> nativo obliga
 * a saber que hay que dejar apretado Ctrl para elegir varias -> justo lo
 * que un proveedor no tiene por qué saber. Acá cada grupo se toca y se
 * enciende, y se ve de un vistazo cuáles quedaron elegidos.
 *
 * El campo es OPCIONAL: no elegir ninguno es una respuesta válida y no
 * bloquea el formulario.
 *
 * La lista viene del backend (catálogo administrable desde Catálogos), así
 * que si Sistemas agrega un quinto grupo aparece acá sin tocar el frontend.
 */
export default function SelectorGruposProducto({
  seleccionados,
  onCambiar,
  deshabilitado = false,
}: {
  seleccionados: number[];
  onCambiar: (ids: number[]) => void;
  deshabilitado?: boolean;
}) {
  const { data: grupos = [], isLoading } = useQuery({
    queryKey: ['grupos-producto'],
    queryFn: productosApi.listarGruposProducto,
    // El catálogo cambia con muy poca frecuencia y lo consultan todas las
    // filas del formulario -> no tiene sentido volver a pedirlo en cada
    // apertura del modal.
    staleTime: 5 * 60 * 1000,
  });

  function alternar(id: number) {
    onCambiar(seleccionados.includes(id) ? seleccionados.filter((x) => x !== id) : [...seleccionados, id]);
  }

  if (isLoading) {
    return <p className="text-xs text-brand-900/40">Cargando grupos...</p>;
  }

  if (grupos.length === 0) {
    return null;
  }

  const todosElegidos = seleccionados.length === grupos.length;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="text-sm font-medium text-brand-900">
          Grupo de producto <span className="text-brand-900/40 font-normal">(opcional)</span>
        </label>

        {!deshabilitado && (
          <button
            type="button"
            onClick={() => onCambiar(todosElegidos ? [] : grupos.map((g) => g.id_grupo_producto))}
            className="text-[12px] font-medium text-brand-700 hover:text-brand-900 transition-colors"
          >
            {todosElegidos ? 'Quitar todos' : 'Seleccionar todos'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {grupos.map((grupo) => {
          const elegido = seleccionados.includes(grupo.id_grupo_producto);

          return (
            <button
              key={grupo.id_grupo_producto}
              type="button"
              disabled={deshabilitado}
              onClick={() => alternar(grupo.id_grupo_producto)}
              // aria-pressed y no un checkbox escondido: para un lector de
              // pantalla esto ES un botón de dos estados, y así lo anuncia
              // como "activado/desactivado" sin inventar un control raro.
              aria-pressed={elegido}
              // El título lleva el nombre largo: mientras el catálogo tenga
              // el código como nombre no aporta, pero en cuanto alguien
              // complete "EK = ..." desde Catálogos, se explica solo.
              title={grupo.nombre !== grupo.codigo ? grupo.nombre : undefined}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                elegido
                  ? 'bg-brand-700 border-brand-700 text-white'
                  : 'bg-white border-brand-900/15 text-brand-900/60 hover:border-brand-700/40 hover:text-brand-900'
              }`}
            >
              {grupo.codigo}
            </button>
          );
        })}
      </div>
    </div>
  );
}
