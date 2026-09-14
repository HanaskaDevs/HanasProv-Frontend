import { type ReactNode } from 'react';
import CampoFicha from './CampoFicha';
import {
  PLACEHOLDER_TELEFONO,
  digitosTrasEditar,
  formatearTelefono,
} from '../utils/telefono';

/**
 * Campo de teléfono de la Ficha: se ve agrupado (095 899 1687) pero
 * entrega solo los dígitos.
 *
 * Es CONTROLADO a propósito (value/onChange en vez de register): para
 * mostrar el número formateado hay que reescribir lo que la persona
 * teclea en cada pulsación, y eso un input no controlado no lo permite.
 * Por eso en los formularios se usa con el <Controller> de
 * react-hook-form -> el estado del formulario guarda los dígitos pelados,
 * que es exactamente lo que se manda al backend.
 *
 * inputMode="numeric" (y no type="number"): en el celular abre el teclado
 * numérico igual, pero sin las flechitas de incremento ni el
 * comportamiento raro de los ceros a la izquierda, que en un teléfono son
 * significativos.
 */
export default function CampoFichaTelefono({
  label,
  value,
  onChange,
  error,
  resaltado,
  accesorio,
  disabled,
  id,
}: {
  label: string;
  /** Solo dígitos. */
  value: string;
  /** Devuelve solo dígitos. */
  onChange: (digitos: string) => void;
  error?: string;
  resaltado?: boolean;
  accesorio?: ReactNode;
  disabled?: boolean;
  /**
   * Se le pasa el NOMBRE del campo del formulario. CampoFicha lo usa como
   * id del <input>, y de ahí lo toma enfocarPrimerCampoConError para
   * encontrarlo en el DOM cuando hay que llevar al usuario hasta él.
   * Sin esto, los teléfonos quedaban sin id y eran los únicos campos a
   * los que la página no sabía desplazarse.
   */
  id?: string;
}) {
  const textoVisible = formatearTelefono(value ?? '');

  return (
    <CampoFicha
      id={id}
      label={label}
      inputMode="numeric"
      autoComplete="tel"
      placeholder={PLACEHOLDER_TELEFONO}
      value={textoVisible}
      onChange={(e) => onChange(digitosTrasEditar(e.target.value, textoVisible))}
      error={error}
      resaltado={resaltado}
      accesorio={accesorio}
      disabled={disabled}
    />
  );
}
