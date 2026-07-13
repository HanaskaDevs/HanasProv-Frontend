interface ProgressStepsProps {
  pasoActual: number;
  pasosCompletados: boolean[];
  onIrAPaso: (paso: number) => void;
  porcentaje: number;
}

const ETIQUETAS = ['Datos Generales', 'Contactos', 'Clase de Proveedor', 'Categoría de Productos'];

export default function ProgressSteps({ pasoActual, pasosCompletados, onIrAPaso, porcentaje }: ProgressStepsProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-brand-900">Progreso de la Ficha</span>
        <span className="text-sm font-medium text-brand-700">{porcentaje}%</span>
      </div>

      <div className="h-2 w-full rounded-full bg-brand-200/50 mb-3 overflow-hidden">
        <div
          className="h-full rounded-full bg-brand-900 transition-all duration-300"
          style={{ width: `${porcentaje}%` }}
        />
      </div>

      <div className="flex items-center">
        {ETIQUETAS.map((etiqueta, index) => {
          const paso = index + 1;
          const completado = pasosCompletados[index];
          const esActual = paso === pasoActual;
          const clickeable = completado || esActual;

          return (
            <div key={paso} className="flex items-center flex-1 last:flex-none">
              <button
                type="button"
                disabled={!clickeable}
                onClick={() => clickeable && onIrAPaso(paso)}
                className="flex flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold
                    ${completado ? 'bg-brand-900 text-white' : esActual ? 'bg-brand-700 text-white' : 'bg-brand-200/50 text-brand-900/40'}`}
                >
                  {completado ? '✓' : paso}
                </span>
                <span
                  className={`text-xs text-center max-w-[90px] ${esActual ? 'text-brand-900 font-medium' : 'text-brand-900/50'}`}
                >
                  {etiqueta}
                </span>
              </button>
              {index < ETIQUETAS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${pasosCompletados[index] ? 'bg-brand-900' : 'bg-brand-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}