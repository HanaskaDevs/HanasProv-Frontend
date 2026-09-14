import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as fichaApi from '../../miFicha/api/fichaApi';
import ModalDatosBancarios from './ModalDatosBancarios';

const NOMBRE_TIPO_CUENTA: Record<string, string> = {
  AHO: 'Ahorros',
  CTE: 'Corriente',
};

function IconoBanco({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <line x1="3" y1="22" x2="21" y2="22" />
      <line x1="6" y1="18" x2="6" y2="11" />
      <line x1="10" y1="18" x2="10" y2="11" />
      <line x1="14" y1="18" x2="14" y2="11" />
      <line x1="18" y1="18" x2="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

function IconoCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * DATOS DE LA CUENTA BANCARIA, dentro del Certificado bancario.
 *
 * POR QUÉ ES UN PANEL Y NO EL ENLACE CHIQUITO QUE HABÍA (pedido del
 * usuario, 14-sep-2026): era un "Registre sus datos" de 11px perdido entre
 * la descarga de plantilla y las etiquetas de estado. Se pasaba por alto,
 * y el proveedor creía haber terminado su documentación con solo subir el
 * PDF.
 *
 * PERO OCUPA LO MÍNIMO POSIBLE: esta tarjeta convive con las de los otros
 * documentos en una cuadrícula de dos columnas, y un bloque alto rompe la
 * alineación de toda la fila. Por eso son dos líneas como mucho: título y
 * botón cuando falta, y una sola línea con los datos cuando ya está. El
 * párrafo que explicaba para qué sirve la cuenta se quitó (14-sep-2026):
 * el título ya lo dice y el modal lo explica al abrirlo.
 *
 * NO ES UN CAMPO MÁS DEL PDF: del certificado escaneado no se puede sacar
 * el número de cuenta, y esos tres datos son los que se registran en
 * Business Central como la cuenta donde se le paga al proveedor (ver
 * SincronizacionProveedorBcService). Por eso, mientras falten, el backend
 * no deja registrar la documentación (DocumentoProveedorService::registrar)
 * y el botón de registrar aparece deshabilitado.
 */
export default function PanelDatosBancarios({ soloLectura = false }: { soloLectura?: boolean }) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const { data: cuenta, isLoading } = useQuery({
    queryKey: ['mi-cuenta-bancaria'],
    queryFn: fichaApi.obtenerMiCuentaBancaria,
  });

  // Mientras no se sabe, no se dibuja nada: mostrar "te falta" y
  // corregirlo un instante después es peor que esperar.
  if (isLoading) {
    return null;
  }

  if (cuenta) {
    return (
      <>
        <div className="mt-1.5 flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5">
          <span className="shrink-0 text-emerald-600">
            <IconoCheck />
          </span>

          {/* Los tres datos en una línea, con el número de cuenta como lo
              importante: es el que el proveedor va a querer verificar de
              un vistazo. title= para poder leerlo completo si se corta. */}
          <p
            className="min-w-0 flex-1 truncate text-[11.5px] text-emerald-900"
            title={`${cuenta.nombre_banco ?? ''} · ${NOMBRE_TIPO_CUENTA[cuenta.tipo_cuenta] ?? cuenta.tipo_cuenta} · ${cuenta.nro_cuenta}`}
          >
            {cuenta.nombre_banco} · {NOMBRE_TIPO_CUENTA[cuenta.tipo_cuenta] ?? cuenta.tipo_cuenta} ·{' '}
            <strong className="font-semibold">{cuenta.nro_cuenta}</strong>
          </p>

          {!soloLectura && (
            <button
              type="button"
              onClick={() => setModalAbierto(true)}
              className="shrink-0 text-[11px] font-medium text-emerald-800/70 underline underline-offset-2 hover:text-emerald-900"
            >
              Modificar
            </button>
          )}
        </div>

        {modalAbierto && <ModalDatosBancarios onClose={() => setModalAbierto(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="mt-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-2">
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-amber-900">
          <span className="shrink-0 text-amber-700">
            <IconoBanco />
          </span>
          Complete la información de su cuenta
        </p>


        {!soloLectura && (
          <button
            type="button"
            onClick={() => setModalAbierto(true)}
            className="mt-1.5 w-full rounded-md bg-amber-700 px-2.5 py-1.5 text-[11.5px] font-semibold text-white transition-colors hover:bg-amber-800"
          >
            Completar información
          </button>
        )}
      </div>

      {modalAbierto && <ModalDatosBancarios onClose={() => setModalAbierto(false)} />}
    </>
  );
}
