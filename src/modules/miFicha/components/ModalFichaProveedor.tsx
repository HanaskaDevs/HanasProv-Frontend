// src/modules/miFicha/components/ModalFichaProveedor.tsx
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import ProgressSteps from './ProgressSteps';
import InformacionProveedorForm from './InformacionProveedorForm';
import Seccion2Form from './Seccion2Form';
import Seccion3Form from './Seccion3Form';
import VistaFichaCompleta from './VistaFichaCompleta';
import FormularioCorreccionFicha from './FormularioCorreccionFicha';
import CamposFichaSoloLectura from './CamposFichaSoloLectura';
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

/**
 * 3 modos posibles, según el estado con el que se abre el modal:
 * 1. Wizard normal (pasos 1-4) -> primera vez llenando la ficha.
 * 2. Corrección (FormularioCorreccionFicha, ficha completa en una sola
 *    vista) -> el admin rechazó al menos un campo puntual. Se ve TODA la
 *    ficha, pero solo los campos rechazados son editables.
 * 3. Solo lectura (VistaFichaCompleta) -> completa y sin nada rechazado
 *    (aprobada o esperando revisión).
 */
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

  // Se calculan UNA sola vez, sobre el estado con el que se abrió el
  // modal -> el modo no cambia a mitad de sesión aunque, por ejemplo,
  // corrigiendo un campo la ficha "deje" de estar rechazada.
  const [fueRechazada] = useState(() => fichaInicial.estado_calificacion_general === 'Rechazado');
  const [soloLectura] = useState(() => esFichaCompleta(fichaInicial) && !fueRechazada);
  const [modoCorreccion] = useState(() => esFichaCompleta(fichaInicial) && fueRechazada);

  // Evita mostrar "¡ficha corregida!" antes de que el proveedor guarde
  // algo de verdad en esta sesión (los datos ya estaban completos desde
  // antes del rechazo, así que "completo" es cierto desde el vamos).
  const [yaGuardoAlgo, setYaGuardoAlgo] = useState(false);

  const datosCompletos = esDatosGeneralesCompleta(ficha);
  const claseCompleta = ficha.seccion_2.clases.length > 0;
  const [pasoVisible, setPasoVisible] = useState<number>(!datosCompletos ? 1 : !claseCompleta ? 3 : 4);

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
    setYaGuardoAlgo(true);
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

  function handleGuardadoCorreccion(fichaActualizada: FichaProveedor) {
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

        {soloLectura && (
          <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
            <VistaFichaCompleta ficha={ficha} />
          </div>
        )}

        {modoCorreccion && (
          <>
            <div className="shrink-0 px-6 pt-4">
              {!yaGuardoAlgo ? (
                <div className="mb-4 rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
                  <p className="text-sm text-amber-800">
                    <span className="font-semibold">El equipo rechazó algunos campos de tu ficha.</span> Por favor
                    verifica la información y corrígelo.
                  </p>
                </div>
              ) : (
                <div className="mb-4 rounded-md bg-brand-700/5 border border-brand-700/20 px-4 py-3">
                  <p className="text-sm text-brand-900">
                    <span className="font-semibold">Corrección guardada.</span> Los campos que ajustaste vuelven a
                    quedar en revisión del equipo — no hace falta que hagas nada más acá.
                  </p>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-4 min-h-0">
              {yaGuardoAlgo ? (
                <CamposFichaSoloLectura ficha={ficha} />
              ) : (
                <FormularioCorreccionFicha ficha={ficha} onGuardado={handleGuardadoCorreccion} />
              )}
            </div>
          </>
        )}

        {!soloLectura && !modoCorreccion && (
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