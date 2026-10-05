import { useState } from 'react';
import { isAxiosError } from 'axios';
import { generarEnlaceActivacion, type EnlaceActivacion } from '../api/usuariosApi';
import { copiarAlPortapapeles } from '../../../shared/utils/copiarAlPortapapeles';
import Button from '../../../shared/components/Button';

function textoParaElProveedor(enlace: EnlaceActivacion): string {
  return [
    'Hola, le escribimos de Hanaska.',
    '',
    'Este es su enlace para activar su cuenta en el Portal de Proveedores:',
    enlace.url,
    '',
    `Al abrirlo, el correo y el código ya vienen cargados: solo tiene que crear su contraseña. El enlace vale por ${enlace.vigencia}.`,
  ].join('\n');
}

/**
 * "Copiar enlace de activación": para mandárselo al proveedor por otro
 * canal cuando el correo automático no le llega.
 *
 * DOS PASOS A PROPÓSITO, no se genera al abrir. Generar el enlace deja sin
 * efecto el código que se le había mandado por correo: si se generara
 * solo con abrir el modal, alguien que entró a mirar le anularía el código
 * al proveedor sin saberlo.
 *
 * Además de copiar, ofrece abrir WhatsApp y Outlook con el mensaje ya
 * escrito. El objetivo es que llegue de persona a persona, que es lo que
 * pasa los filtros que frenan al correo automático; cuantos menos pasos,
 * menos se pierde en el camino.
 */
export default function ModalEnlaceActivacion({ correo, idUsuario, onCerrar }: {
  correo: string;
  idUsuario: number;
  onCerrar: () => void;
}) {
  const [enlace, setEnlace] = useState<EnlaceActivacion | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState<'enlace' | 'mensaje' | null>(null);

  async function generar() {
    setGenerando(true);
    setError(null);
    try {
      setEnlace(await generarEnlaceActivacion(idUsuario));
    } catch (e) {
      const datos = isAxiosError(e)
        ? (e.response?.data as { message?: string } | undefined)
        : undefined;
      setError(datos?.message ?? 'No se pudo generar el enlace.');
    } finally {
      setGenerando(false);
    }
  }

  async function copiar(que: 'enlace' | 'mensaje') {
    if (!enlace) return;

    const ok = await copiarAlPortapapeles(que === 'enlace' ? enlace.url : textoParaElProveedor(enlace));

    if (ok) {
      setCopiado(que);
      window.setTimeout(() => setCopiado(null), 2500);
    } else {
      setError('El navegador no dejó copiar. Selecciona el enlace y cópialo a mano.');
    }
  }

  const mensaje = enlace ? textoParaElProveedor(enlace) : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-brand-900/8 px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-display text-base font-semibold text-brand-900">Enlace de activación</h2>
            <p className="truncate text-sm text-brand-900/55">{correo}</p>
          </div>
          <button
            onClick={onCerrar}
            className="px-1 text-xl leading-none text-brand-900/40 hover:text-brand-900"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5">
          {!enlace ? (
            <>
              <p className="text-sm leading-relaxed text-brand-900/75">
                Genera un enlace para mandárselo al proveedor <strong>directamente</strong>, por
                WhatsApp o desde tu propio correo. Al abrirlo, el correo y el código ya vienen
                cargados: solo tiene que crear su contraseña.
              </p>

              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900">
                <p className="font-medium">Antes de generarlo</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-4">
                  <li>El código que se le mandó por correo deja de servir: solo vale este enlace.</li>
                  <li>
                    El enlace da acceso a la cuenta. Mándaselo solo a la persona del proveedor, y
                    no lo publiques en grupos.
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <label htmlFor="enlace-activacion" className="text-sm font-medium text-brand-900">
                Enlace
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  id="enlace-activacion"
                  readOnly
                  value={enlace.url}
                  onFocus={(e) => e.currentTarget.select()}
                  className="min-w-0 flex-1 rounded-md border border-brand-900/15 bg-brand-900/[0.02] px-3 py-2 font-mono text-xs text-brand-900/80"
                />
                <Button onClick={() => copiar('enlace')} className="shrink-0">
                  {copiado === 'enlace' ? '¡Copiado!' : 'Copiar'}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-brand-900/50">
                Vale por {enlace.vigencia}. Si vence, genera uno nuevo desde acá.
              </p>

              <p className="mb-2 mt-5 text-sm font-medium text-brand-900">O mándalo ya escrito</p>
              <div className="grid gap-2 sm:grid-cols-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-100"
                >
                  WhatsApp
                </a>
                <a
                  href={`mailto:${encodeURIComponent(enlace.correo)}?subject=${encodeURIComponent(
                    'Activación de su cuenta en el Portal de Proveedores de Hanaska'
                  )}&body=${encodeURIComponent(mensaje)}`}
                  className="flex items-center justify-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-medium text-sky-800 transition-colors hover:bg-sky-100"
                >
                  Outlook / correo
                </a>
                <button
                  onClick={() => copiar('mensaje')}
                  className="flex items-center justify-center gap-2 rounded-md border border-brand-900/12 px-3 py-2 text-sm font-medium text-brand-900 transition-colors hover:bg-brand-900/[0.04]"
                >
                  {copiado === 'mensaje' ? '¡Copiado!' : 'Copiar mensaje'}
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-brand-900/50">
                WhatsApp abre el mensaje listo para elegir el contacto. "Outlook / correo" lo deja
                escrito en tu correo, dirigido al proveedor: al salir desde tu buzón, no lo frenan los
                filtros que a veces paran al correo automático.
              </p>
            </>
          )}

          {error && <p className="mt-3 text-sm text-brand-wine">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-brand-900/8 bg-brand-900/[0.02] px-6 py-3">
          {!enlace ? (
            <>
              <Button variant="ghost" onClick={onCerrar} disabled={generando}>
                Cancelar
              </Button>
              <Button onClick={generar} isLoading={generando}>
                Generar enlace
              </Button>
            </>
          ) : (
            <Button onClick={onCerrar}>Listo</Button>
          )}
        </div>
      </div>
    </div>
  );
}
