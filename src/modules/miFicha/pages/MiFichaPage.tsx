import { useEffect, useState } from 'react';
import axios from 'axios';
import Card from '../../../shared/components/Card';
import Badge from '../../../shared/components/Badge';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import ModalFichaProveedor from '../components/ModalFichaProveedor';
import { obtenerMiFicha } from '../api/fichaApi';
import type { FichaProveedor } from '../types';

function esDatosGeneralesCompleta(ficha: FichaProveedor): boolean {
  return !!ficha.seccion_1.ruc && !!ficha.seccion_1.razon_social;
}

function calcularPorcentaje(ficha: FichaProveedor): number {
  const pasos = [
    esDatosGeneralesCompleta(ficha),
    esDatosGeneralesCompleta(ficha), // Contactos se guarda junto con Datos Generales
    ficha.seccion_2.clases.length > 0,
    ficha.seccion_3.categorias.length > 0,
  ];
  return Math.round((pasos.filter(Boolean).length / 4) * 100);
}

function badgeDeEstado(porcentaje: number) {
  if (porcentaje === 0) return { tone: 'neutral' as const, texto: 'Sin iniciar' };
  if (porcentaje === 100) return { tone: 'success' as const, texto: 'Completa' };
  return { tone: 'warning' as const, texto: 'En progreso' };
}

export default function MiFichaPage() {
  const [ficha, setFicha] = useState<FichaProveedor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);

  useEffect(() => {
    let cancelado = false;

    obtenerMiFicha()
      .then((data) => {
        if (!cancelado) setFicha(data);
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

    return () => {
      cancelado = true;
    };
  }, []);

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

  const porcentaje = calcularPorcentaje(ficha);
  const estado = badgeDeEstado(porcentaje);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Mi Ficha de Proveedor</h1>
        <p className="text-sm text-brand-900/60 mt-1">
          Información, clase y categoría de tu empresa como proveedor.
        </p>
      </div>

      <Card className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-brand-200/40 flex items-center justify-center text-brand-900 font-display font-semibold">
            {porcentaje}%
          </div>
          <div>
            <p className="font-medium text-brand-900">Ficha de Proveedor</p>
            <div className="mt-1">
              <Badge tone={estado.tone}>{estado.texto}</Badge>
            </div>
          </div>
        </div>

        <Button onClick={() => setModalAbierto(true)}>
          {porcentaje === 0 ? 'Completar ficha' : 'Ver ficha'}
        </Button>
      </Card>

      {modalAbierto && (
        <ModalFichaProveedor
          fichaInicial={ficha}
          onClose={() => setModalAbierto(false)}
          onFichaActualizada={setFicha}
        />
      )}
    </div>
  );
}