import { useState } from 'react';
import ProgressSteps from './ProgressSteps';
import InformacionProveedorForm from './InformacionProveedorForm';
import Seccion2Form from './Seccion2Form';
import Seccion3Form from './Seccion3Form';
import VistaFichaCompleta from './VistaFichaCompleta';
import type { FichaProveedor } from '../types';

function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return !!ficha.seccion_1.ruc && !!ficha.seccion_1.razon_social;
}

function esFichaCompleta(ficha: FichaProveedor): boolean {
  return (
    esDatosGeneralesCompleta(ficha) &&
    ficha.seccion_2.clases.length > 0 &&
    ficha.seccion_3.categorias.length > 0
  );
}

export default function ModalFichaProveedor({
  fichaInicial,
  onClose,
  onFichaActualizada,
}: {
  fichaInicial: FichaProveedor;
  onClose: () => void;
  onFichaActualizada: (ficha: FichaProveedor) => void;
}) {
  const [ficha, setFicha] = useState(fichaInicial);

  // Se calcula UNA sola vez, sobre el estado con el que se abrió el modal:
  // si ya estaba completa, queda en modo solo-lectura durante toda la
  // sesión del modal (aunque técnicamente nada cambiaría el resultado,
  // ya que en modo lectura no hay forma de editar nada).
  const [soloLectura] = useState(() => esFichaCompleta(fichaInicial));

  const datosCompletos = esDatosGeneralesCompleta(ficha);
  const claseCompleta = ficha.seccion_2.clases.length > 0;
  const [pasoVisible, setPasoVisible] = useState<number>(
    !datosCompletos ? 1 : !claseCompleta ? 3 : 4
  );

  const datosGeneralesCompleta = esDatosGeneralesCompleta(ficha);
  const clase = ficha.seccion_2.clases.length > 0;
  const categoria = ficha.seccion_3.categorias.length > 0;

  const pasosCompletados = [datosGeneralesCompleta, datosGeneralesCompleta, clase, categoria];
  const porcentaje = Math.round((pasosCompletados.filter(Boolean).length / 4) * 100);
  const todoCompleto = pasosCompletados.every(Boolean);

  function actualizar(fichaActualizada: FichaProveedor) {
    setFicha(fichaActualizada);
    onFichaActualizada(fichaActualizada);
  }

  function handleGuardadoInformacion(fichaActualizada: FichaProveedor) {
    actualizar(fichaActualizada);
    setPasoVisible(3);
  }

  function handleGuardadoClase(fichaActualizada: FichaProveedor) {
    actualizar(fichaActualizada);
    setPasoVisible(4);
  }

  function handleGuardadoCategoria(fichaActualizada: FichaProveedor) {
    actualizar(fichaActualizada);
  }

  return (
    <div className="fixed inset-0 bg-brand-900/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl h-[90vh] flex flex-col">
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-brand-900/8">
          <h2 className="font-display text-lg font-semibold text-brand-900">Ficha de Proveedor</h2>
          <button
            onClick={onClose}
            className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {soloLectura ? (
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <VistaFichaCompleta ficha={ficha} />
          </div>
        ) : (
          <>
            <div className="shrink-0 px-6 pt-4">
              <ProgressSteps
                pasoActual={pasoVisible}
                pasosCompletados={pasosCompletados}
                onIrAPaso={setPasoVisible}
                porcentaje={porcentaje}
              />

              {todoCompleto && (
                <div className="mb-6 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
                  Has completado las 4 secciones. Tu ficha será revisada por el equipo correspondiente.
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
              {(pasoVisible === 1 || pasoVisible === 2) && (
                <InformacionProveedorForm
                  subPaso={pasoVisible as 1 | 2}
                  datosIniciales={ficha.seccion_1}
                  onIrAPaso={setPasoVisible}
                  onGuardado={handleGuardadoInformacion}
                />
              )}
              {pasoVisible === 3 && (
                <Seccion2Form seleccionadas={ficha.seccion_2.clases} onGuardado={handleGuardadoClase} />
              )}
              {pasoVisible === 4 && (
                <Seccion3Form seleccionadas={ficha.seccion_3.categorias} onGuardado={handleGuardadoCategoria} />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}