import { useState } from 'react';
import Modal from '../../../shared/components/Modal';
import InformacionProveedorForm from '../../miFicha/components/InformacionProveedorForm';
import Seccion2Form from '../../miFicha/components/Seccion2Form';
import Seccion3Form from '../../miFicha/components/Seccion3Form';
import type { FichaProveedor } from '../../miFicha/types';
import * as proveedoresApi from '../api/proveedoresApi';

type Paso = 1 | 2 | 3 | 4;

const PASOS: [Paso, string][] = [
  [1, 'Datos generales'],
  [2, 'Contactos'],
  [3, 'Clase de proveedor'],
  [4, 'Categoría de productos'],
];

/**
 * Edición interna de la ficha de un proveedor (16-oct-2026): Compras, y
 * quienes califican la ficha, la corrigen mientras la revisan para después
 * aprobarla o rechazarla.
 *
 * Usa los MISMOS formularios que llena el proveedor (validaciones,
 * catálogos, mapa), pero guardando por /proveedores/{id}/ficha/... y sin la
 * casilla de políticas: esa aceptación es del proveedor y nadie la firma
 * por él. Cada sección se guarda por separado, como en el wizard: Datos
 * generales y Contactos van juntos (son una sola sección en el backend).
 *
 * Si un campo estaba Rechazado, al guardarlo vuelve a "Sin calificar" y se
 * puede aprobar. Solo se abre si el proveedor no está aprobado
 * (editable_por_interno).
 */
export default function ModalEditarFichaProveedor({
  fichaInicial,
  onGuardado,
  onClose,
}: {
  fichaInicial: FichaProveedor;
  /** Cada guardado devuelve la ficha completa: el padre la reemplaza. */
  onGuardado: (ficha: FichaProveedor) => void;
  onClose: () => void;
}) {
  const [ficha, setFicha] = useState(fichaInicial);
  const [paso, setPaso] = useState<Paso>(1);
  const [guardadoRecien, setGuardadoRecien] = useState<string | null>(null);
  const idProveedor = ficha.id_proveedor;

  function alGuardar(actualizada: FichaProveedor, siguiente: Paso | null, seccion: string) {
    setFicha(actualizada);
    onGuardado(actualizada);
    setGuardadoRecien(seccion);

    if (siguiente === null) {
      onClose();
      return;
    }

    setPaso(siguiente);
  }

  return (
    <Modal onClose={onClose} title="Editar ficha del proveedor" maxWidth="max-w-4xl" expandible>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-1 border-b border-brand-900/8" role="tablist">
          {PASOS.map(([valor, etiqueta]) => (
            <button
              key={valor}
              role="tab"
              aria-selected={paso === valor}
              onClick={() => setPaso(valor)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                paso === valor
                  ? 'border-brand-700 text-brand-700'
                  : 'border-transparent text-brand-900/50 hover:text-brand-900'
              }`}
            >
              {etiqueta}
            </button>
          ))}
        </div>

        <p className="text-xs text-brand-900/55">
          Los cambios se guardan sección por sección. Datos generales y Contactos se guardan juntos al terminar
          Contactos. Si corriges un campo que estaba rechazado, vuelve a quedar sin calificar para que lo apruebes.
        </p>

        {guardadoRecien && <p className="text-xs font-medium text-emerald-700">{guardadoRecien}: cambios guardados.</p>}

        {(paso === 1 || paso === 2) && (
          <InformacionProveedorForm
            key={`seccion-1-${ficha.seccion_1.ruc}`}
            subPaso={paso}
            datosIniciales={ficha.seccion_1}
            onIrAPaso={(n) => setPaso(n as Paso)}
            onGuardado={(actualizada) => alGuardar(actualizada, 3, 'Datos generales y contactos')}
            guardar={(payload) => proveedoresApi.editarFichaSeccion1(idProveedor, payload)}
          />
        )}

        {paso === 3 && (
          <Seccion2Form
            seleccionadas={ficha.seccion_2.clases}
            onGuardado={(actualizada) => alGuardar(actualizada, 4, 'Clase de proveedor')}
            guardar={(ids) => proveedoresApi.editarFichaSeccion2(idProveedor, ids)}
          />
        )}

        {paso === 4 && (
          <Seccion3Form
            seleccionadas={ficha.seccion_3.categorias}
            onGuardado={(actualizada) => alGuardar(actualizada, null, 'Categoría de productos')}
            guardar={(ids) => proveedoresApi.editarFichaSeccion3(idProveedor, ids)}
            textoBoton="Guardar y terminar"
          />
        )}
      </div>
    </Modal>
  );
}
