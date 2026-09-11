import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Modal from '../../../shared/components/Modal';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';
import { listarBancos } from '../../miFicha/api/catalogosApi';
import * as fichaApi from '../../miFicha/api/fichaApi';
import type { TipoCuentaBancaria } from '../../miFicha/types';

const TIPOS_CUENTA: { valor: TipoCuentaBancaria; etiqueta: string }[] = [
  { valor: 'AHO', etiqueta: 'Ahorros' },
  { valor: 'CTE', etiqueta: 'Corriente' },
];

/**
 * Datos de la cuenta donde se le paga al proveedor. Acompaña al PDF del
 * certificado bancario: el PDF es el respaldo, pero los pagos se
 * configuran con ESTOS datos estructurados, que son los que se postean
 * a la Ficha de Bancos de Business Central.
 *
 * El proveedor elige el banco por NOMBRE; el código de sucursal que
 * necesita BC no se muestra ni se envía desde acá -> el backend lo
 * resuelve del catálogo con el id_banco, así un cliente manipulado no
 * puede inventar un código que BC no reconozca.
 */
export default function ModalDatosBancarios({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [idBanco, setIdBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState('');
  const [nroCuenta, setNroCuenta] = useState('');
  const [error, setError] = useState<string | null>(null);

  const { data: bancos, isLoading: cargandoBancos } = useQuery({
    queryKey: ['catalogo-bancos'],
    queryFn: listarBancos,
    staleTime: 60 * 60 * 1000,
  });

  const { data: cuenta, isLoading: cargandoCuenta } = useQuery({
    queryKey: ['mi-cuenta-bancaria'],
    queryFn: fichaApi.obtenerMiCuentaBancaria,
  });

  // Precarga lo ya registrado para que el modal sirva también para
  // CORREGIR, no solo para crear de cero.
  useEffect(() => {
    if (cuenta) {
      setIdBanco(String(cuenta.id_banco));
      setTipoCuenta(cuenta.tipo_cuenta);
      setNroCuenta(cuenta.nro_cuenta);
    }
  }, [cuenta]);

  const guardar = useMutation({
    mutationFn: () =>
      fichaApi.guardarMiCuentaBancaria({
        id_banco: Number(idBanco),
        tipo_cuenta: tipoCuenta as TipoCuentaBancaria,
        nro_cuenta: nroCuenta.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mi-cuenta-bancaria'] });
      onClose();
    },
    onError: (e: unknown) => {
      const respuesta = (e as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } })?.response?.data;
      // El backend valida nro_cuenta con un mensaje propio ("solo
      // dígitos, sin guiones ni espacios") -> se prefiere ese antes que
      // el genérico, es el que le dice al proveedor qué corregir.
      const primerCampo = respuesta?.errors ? Object.values(respuesta.errors)[0]?.[0] : undefined;
      setError(primerCampo ?? respuesta?.message ?? 'No se pudo guardar. Intenta de nuevo.');
    },
  });

  function onGuardar() {
    setError(null);

    if (!idBanco || !tipoCuenta || !nroCuenta.trim()) {
      setError('Completa los tres campos.');
      return;
    }

    guardar.mutate();
  }

  const cargando = cargandoBancos || cargandoCuenta;

  return (
    <Modal onClose={onClose} title="Datos de su cuenta bancaria" maxWidth="max-w-md">
      {cargando ? (
        <div className="flex justify-center py-10">
          <Spinner className="h-5 w-5" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="banco" className="block text-[12.5px] text-brand-900/60">
              Nombre del banco
            </label>
            <select
              id="banco"
              value={idBanco}
              onChange={(e) => setIdBanco(e.target.value)}
              className="w-full min-h-11 rounded-md border border-brand-900/20 bg-white px-3 text-sm text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
            >
              <option value="">Seleccione su banco…</option>
              {(bancos ?? []).map((b) => (
                <option key={b.id_banco} value={b.id_banco}>
                  {b.nombre_banco}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="tipo_cuenta" className="block text-[12.5px] text-brand-900/60">
              Tipo de cuenta
            </label>
            <select
              id="tipo_cuenta"
              value={tipoCuenta}
              onChange={(e) => setTipoCuenta(e.target.value)}
              className="w-full min-h-11 rounded-md border border-brand-900/20 bg-white px-3 text-sm text-brand-900 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
            >
              <option value="">Seleccione…</option>
              {TIPOS_CUENTA.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="nro_cuenta" className="block text-[12.5px] text-brand-900/60">
              Nro. de cuenta
            </label>
            <input
              id="nro_cuenta"
              // inputMode numeric: en celular abre el teclado numérico
              // directo. No se usa type="number" a propósito -> ese
              // recorta ceros a la izquierda, y muchas cuentas empiezan
              // con 0.
              inputMode="numeric"
              value={nroCuenta}
              onChange={(e) => setNroCuenta(e.target.value.replace(/\D/g, ''))}
              placeholder="Solo números"
              className="w-full min-h-11 rounded-md border border-brand-900/20 bg-white px-3 text-sm text-brand-900 placeholder:text-brand-900/30 focus:outline-none focus:ring-1 focus:ring-brand-700 focus:border-brand-700"
            />
          </div>

          <div className="rounded-md bg-brand-200/30 border border-brand-900/10 px-3 py-2.5">
            <p className="text-[12px] leading-snug text-brand-900/70">
              A esta cuenta se realizarán los pagos. Verifique que los datos coincidan exactamente con
              su certificado bancario.
            </p>
          </div>

          {error && <p className="text-xs text-brand-wine">{error}</p>}

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2">
            <Button
              variant="ghost"
              className="min-h-11 w-full sm:w-auto order-2 sm:order-1"
              onClick={onClose}
              disabled={guardar.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="min-h-11 w-full sm:w-auto order-1 sm:order-2"
              isLoading={guardar.isPending}
              onClick={onGuardar}
            >
              Guardar datos
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
