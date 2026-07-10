import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';
import ProgressSteps from '../components/ProgressSteps';
import InformacionProveedorForm from '../components/InformacionProveedorForm';
import Seccion2Form from '../components/Seccion2Form';
import Seccion3Form from '../components/Seccion3Form';
import { obtenerMiFicha } from '../api/fichaApi';
import type { FichaProveedor } from '../types';

function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return !!ficha.seccion_1.ruc && !!ficha.seccion_1.razon_social;
}

export default function MiFichaPage() {
  const [ficha, setFicha] = useState<FichaProveedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [pasoVisible, setPasoVisible] = useState(1);

  useEffect(() => {
    let cancelado = false;

    obtenerMiFicha()
      .then((data) => {
        if (cancelado) return;
        setFicha(data);
        const datosCompletos = esDatosGeneralesCompleta(data);
        const claseCompleta = data.seccion_2.clases.length > 0;
        // Si ya llenó Datos Generales, empieza en Clase (paso 3) directo;
        // Contactos (paso 2) queda disponible para revisar/editar, pero no
        // se fuerza a pasar por ahí de nuevo.
        setPasoVisible(!datosCompletos ? 1 : !claseCompleta ? 3 : 4);
      })
      .catch((error) => {
        if (cancelado) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          setErrorCarga(
            'Tu cuenta todavía no tiene una Ficha de Proveedor asociada. Contacta al administrador del sistema.'
          );
        } else if (axios.isAxiosError(error) && error.response?.status === 403) {
          setErrorCarga('No tienes acceso a esta sección.');
        } else {
          setErrorCarga('No se pudo cargar tu Ficha. Intenta de nuevo más tarde.');
        }
      })
      .finally(() => {
        if (!cancelado) setIsLoading(false);
      });

    // Con StrictMode, este efecto corre 2 veces al montar en desarrollo.
    // Esta bandera asegura que solo la invocación "vigente" (la que no fue
    // cancelada por un remount) actualice el estado -> sin esto, una
    // respuesta tardía de la primera llamada podía pisar la navegación
    // que el usuario ya había hecho mientras tanto (ej. "Siguiente").
    return () => {
      cancelado = true;
    };
  }, []);

  function handleGuardadoInformacion(fichaActualizada: FichaProveedor) {
    setFicha(fichaActualizada);
    setPasoVisible(3); // Datos Generales + Contactos completos -> sigue Clase de Proveedor
  }

  function handleGuardadoClase(fichaActualizada: FichaProveedor) {
    setFicha(fichaActualizada);
    setPasoVisible(4);
  }

  function handleGuardadoCategoria(fichaActualizada: FichaProveedor) {
    setFicha(fichaActualizada);
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (errorCarga || !ficha) {
    return (
      <Card className="max-w-md mx-auto">
        <p className="text-sm text-brand-wine">{errorCarga ?? 'No se pudo cargar la Ficha.'}</p>
      </Card>
    );
  }

  const datosGeneralesCompleta = esDatosGeneralesCompleta(ficha);
  const claseCompleta = ficha.seccion_2.clases.length > 0;
  const categoriaCompleta = ficha.seccion_3.categorias.length > 0;

  const pasosCompletados = [datosGeneralesCompleta, datosGeneralesCompleta, claseCompleta, categoriaCompleta];
  const porcentaje = Math.round((pasosCompletados.filter(Boolean).length / 4) * 100);
  const todoCompleto = pasosCompletados.every(Boolean);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Mi Ficha de Proveedor</h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Completa la información en cualquier momento — se guarda por sección.
        </p>
      </div>

      <Card>
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

        <div className="max-h-[60vh] overflow-y-auto pr-2 -mr-2">
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
      </Card>
    </div>
  );
}