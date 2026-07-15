import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressSteps from './ProgressSteps';
import InformacionProveedorForm from './InformacionProveedorForm';
import Seccion2Form from './Seccion2Form';
import Seccion3Form from './Seccion3Form';
import VistaFichaCompleta from './VistaFichaCompleta';
import type { FichaProveedor } from '../types';

function IconoExpandir() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

function IconoContraer() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}

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
  const [expandido, setExpandido] = useState(false);

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

  // Al cambiar de paso (ej. "Siguiente" en Datos Generales -> Contactos),
  // el contenedor con scroll conserva la posición anterior por defecto
  // -> el nuevo paso aparecía scrolleado hacia abajo. Lo llevamos al
  // inicio cada vez que cambia pasoVisible.
  const contenidoRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    contenidoRef.current?.scrollTo({ top: 0 });
  }, [pasoVisible]);

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
    <div
      className={`fixed inset-0 bg-brand-900/50 flex items-center justify-center z-50 ${
        expandido ? 'p-2' : 'p-4'
      }`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl flex flex-col transition-[max-width,height] duration-150 ${
          expandido ? 'w-full h-full max-w-none' : 'w-full max-w-6xl h-[90vh]'
        }`}
      >
        <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-brand-900/8">
          <h2 className="font-display text-lg font-semibold text-brand-900">Ficha de Proveedor</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setExpandido((v) => !v)}
              className="text-brand-900/40 hover:text-brand-900 p-1.5 rounded hover:bg-brand-900/5"
              aria-label={expandido ? 'Contraer' : 'Expandir'}
              title={expandido ? 'Contraer' : 'Expandir'}
            >
              {expandido ? <IconoContraer /> : <IconoExpandir />}
            </button>
            <button
              onClick={onClose}
              className="text-brand-900/40 hover:text-brand-900 text-xl leading-none px-2"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
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
                <div className="mb-6 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3">
                  <p className="text-sm text-emerald-800">
                    <span className="font-semibold">¡Completaste las 4 secciones de tu Ficha!</span> Ese es el
                    primer paso, pero todavía no terminaste.
                  </p>
                  <p className="text-sm text-emerald-800 mt-1">
                    Ahora sigue cargar tu <span className="font-semibold">documentación</span> — sin eso tu
                    proceso como proveedor no queda completo.
                  </p>
                  <Link
                    to="/documentos"
                    className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-800"
                  >
                    Ir a Documentación
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </Link>
                </div>
              )}
            </div>

            <div ref={contenidoRef} className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
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