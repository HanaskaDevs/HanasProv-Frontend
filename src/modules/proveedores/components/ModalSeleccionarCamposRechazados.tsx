import { useState } from 'react';
import Button from '../../../shared/components/Button';
import Badge from '../../../shared/components/Badge';
import {
  CAMPO_CATEGORIA,
  CAMPO_CLASE,
  CAMPOS_SECCION1,
  ETIQUETAS_CAMPOS_FICHA,
} from '../../../shared/constants/camposFichaProveedor';
import type { CampoRechazado } from '../api/proveedoresApi';
import type { FichaProveedor } from '../../miFicha/types';

const GRUPOS: { titulo: string; campos: (typeof CAMPOS_SECCION1)[number][] }[] = [
  {
    titulo: 'Datos generales',
    campos: ['ruc', 'clase_contribuyente', 'razon_social', 'nombre_comercial', 'email', 'telefono', 'direccion', 'ciudad', 'pagina_web'],
  },
  { titulo: 'Representante legal', campos: ['representante_legal', 'correo_representante', 'telefono_representante'] },
  { titulo: 'Contacto de ventas', campos: ['contacto_venta', 'correo_venta', 'telefono_contacto_venta'] },
  { titulo: 'Contacto de calidad', campos: ['contacto_calidad', 'correo_calidad', 'telefono_contacto_calidad'] },
  { titulo: 'Contacto de contabilidad', campos: ['contacto_contabilidad', 'correo_contabilidad', 'telefono_contabilidad'] },
];

function IconoCheck({ className = '' }: { className?: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/** Checkbox propio (no el nativo) para controlar el estilo del "marcado" -> caja vino cuando está seleccionado, en vez del check azul del navegador. */
function Casilla({ marcado }: { marcado: boolean }) {
  return (
    <span
      className={`h-4 w-4 rounded flex items-center justify-center shrink-0 border transition-colors ${
        marcado ? 'bg-brand-wine border-brand-wine text-white' : 'border-brand-900/25 bg-white'
      }`}
    >
      {marcado && <IconoCheck />}
    </span>
  );
}

function FilaCampoSeleccionable({
  label,
  valor,
  seleccionado,
  observacion,
  onToggle,
  onObservacion,
}: {
  label: string;
  valor: React.ReactNode;
  seleccionado: boolean;
  observacion: string;
  onToggle: () => void;
  onObservacion: (texto: string) => void;
}) {
  return (
    <div className={`rounded-lg border p-2.5 transition-colors ${seleccionado ? 'border-brand-wine/30 bg-brand-wine/[0.03]' : 'border-brand-900/10 bg-white'}`}>
      <button type="button" onClick={onToggle} className="w-full flex items-start gap-2.5 text-left">
        <span className="mt-0.5">
          <Casilla marcado={seleccionado} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10.5px] text-brand-900/50">{label}</p>
          <div className="text-sm font-medium text-brand-900 truncate">{valor}</div>
        </div>
      </button>

      {seleccionado && (
        <textarea
          value={observacion}
          onChange={(e) => onObservacion(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          placeholder="¿Qué está mal en este campo? (obligatorio)"
          rows={2}
          className="mt-2 w-full rounded-md border border-brand-wine/25 px-2 py-1.5 text-xs text-brand-900
            focus:outline-none focus:ring-1 focus:ring-brand-wine"
        />
      )}
    </div>
  );
}

/**
 * Al hacer clic en "Rechazar" en SeccionCalificarFicha, se abre esto: el
 * admin marca qué campos tienen información inválida (con su
 * observación cada uno) y al final "Registrar calificación" manda todo
 * junto en un solo POST -> ver calificarFichaGeneral en el backend. Los
 * campos que NO se marcan quedan Aprobados automáticamente (el admin los
 * revisó y no los señaló).
 */
export default function ModalSeleccionarCamposRechazados({
  ficha,
  onConfirmar,
  onClose,
  enviando,
  error,
}: {
  ficha: FichaProveedor;
  onConfirmar: (camposRechazados: CampoRechazado[]) => void;
  onClose: () => void;
  enviando: boolean;
  error: string | null;
}) {
  const [seleccionados, setSeleccionados] = useState<Record<string, string>>({});

  function toggle(campo: string) {
    setSeleccionados((prev) => {
      if (campo in prev) {
        const copia = { ...prev };
        delete copia[campo];
        return copia;
      }
      return { ...prev, [campo]: '' };
    });
  }

  function actualizarObservacion(campo: string, texto: string) {
    setSeleccionados((prev) => ({ ...prev, [campo]: texto }));
  }

  const camposSeleccionados = Object.keys(seleccionados);
  const todasConObservacion = camposSeleccionados.every((c) => seleccionados[c].trim().length > 0);
  const puedeRegistrar = camposSeleccionados.length > 0 && todasConObservacion;

  function handleRegistrar() {
    onConfirmar(camposSeleccionados.map((campo) => ({ campo, observacion: seleccionados[campo].trim() })));
  }

  return (
    <div className="fixed inset-0 bg-brand-900/60 flex items-center justify-center p-4 z-[80]" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 px-6 py-4 border-b border-brand-900/8">
          <h2 className="font-display text-base font-semibold text-brand-900">Rechazar Ficha de Proveedor</h2>
          <p className="text-xs text-brand-900/55 mt-0.5">
            Marca los campos con información inválida y explica qué corregir en cada uno. El resto queda aprobado
            automáticamente.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {GRUPOS.map((grupo) => (
            <section key={grupo.titulo}>
              <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide mb-2">
                {grupo.titulo}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {grupo.campos.map((campo) => (
                  <FilaCampoSeleccionable
                    key={campo}
                    label={ETIQUETAS_CAMPOS_FICHA[campo]}
                    valor={ficha.seccion_1[campo] || <span className="italic text-brand-900/30 font-normal">Vacío</span>}
                    seleccionado={campo in seleccionados}
                    observacion={seleccionados[campo] ?? ''}
                    onToggle={() => toggle(campo)}
                    onObservacion={(texto) => actualizarObservacion(campo, texto)}
                  />
                ))}
              </div>
            </section>
          ))}

          <section>
            <h3 className="font-display text-xs font-bold text-brand-900 uppercase tracking-wide mb-2">
              Selección múltiple
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <FilaCampoSeleccionable
                label={ETIQUETAS_CAMPOS_FICHA[CAMPO_CLASE]}
                valor={
                  <div className="flex flex-wrap gap-1">
                    {ficha.seccion_2.clases.length === 0 ? (
                      <span className="italic text-brand-900/30 font-normal text-sm">Sin seleccionar</span>
                    ) : (
                      ficha.seccion_2.clases.map((c) => (
                        <Badge key={c.id_clase_proveedor} tone="info">
                          {c.nombre_clase}
                        </Badge>
                      ))
                    )}
                  </div>
                }
                seleccionado={CAMPO_CLASE in seleccionados}
                observacion={seleccionados[CAMPO_CLASE] ?? ''}
                onToggle={() => toggle(CAMPO_CLASE)}
                onObservacion={(texto) => actualizarObservacion(CAMPO_CLASE, texto)}
              />
              <FilaCampoSeleccionable
                label={ETIQUETAS_CAMPOS_FICHA[CAMPO_CATEGORIA]}
                valor={
                  <div className="flex flex-wrap gap-1">
                    {ficha.seccion_3.categorias.length === 0 ? (
                      <span className="italic text-brand-900/30 font-normal text-sm">Sin seleccionar</span>
                    ) : (
                      ficha.seccion_3.categorias.map((c) => (
                        <Badge key={c.id_categoria_producto} tone="info">
                          {c.nombre_categoria}
                        </Badge>
                      ))
                    )}
                  </div>
                }
                seleccionado={CAMPO_CATEGORIA in seleccionados}
                observacion={seleccionados[CAMPO_CATEGORIA] ?? ''}
                onToggle={() => toggle(CAMPO_CATEGORIA)}
                onObservacion={(texto) => actualizarObservacion(CAMPO_CATEGORIA, texto)}
              />
            </div>
          </section>
        </div>

        <div className="shrink-0 px-6 py-3 border-t border-brand-900/8 flex items-center justify-between gap-3">
          <p className="text-xs text-brand-900/50">
            {camposSeleccionados.length === 0
              ? 'Todavía no marcaste ningún campo.'
              : `${camposSeleccionados.length} campo(s) marcado(s).`}
            {error && <span className="text-brand-wine block">{error}</span>}
          </p>
          <div className="flex gap-2 shrink-0">
            <Button variant="ghost" onClick={onClose} disabled={enviando}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleRegistrar} disabled={!puedeRegistrar} isLoading={enviando}>
              Registrar calificación
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}