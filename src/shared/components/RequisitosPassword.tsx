import { REQUISITOS_PASSWORD } from '../utils/reglasPassword';

/**
 * Lista de requisitos que se marca sola mientras la persona escribe.
 *
 * Se muestra SIEMPRE, no solo cuando hay error: el objetivo es que sepa qué
 * se le pide ANTES de equivocarse, como en cualquier sitio que pide crear
 * una contraseña.
 *
 * `variante="oscura"` es para las pantallas de sesión (activar, restablecer),
 * que van sobre una foto de fondo y necesitan texto claro.
 */
export default function RequisitosPassword({
  valor,
  variante = 'clara',
}: {
  valor: string;
  variante?: 'clara' | 'oscura';
}) {
  const esOscura = variante === 'oscura';

  return (
    <ul className="space-y-1 mt-1" aria-label="Requisitos de la contraseña">
      {REQUISITOS_PASSWORD.map((requisito) => {
        const cumplido = requisito.cumple(valor);

        return (
          <li
            key={requisito.etiqueta}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              cumplido
                ? esOscura ? 'text-emerald-300' : 'text-emerald-700'
                : esOscura ? 'text-white/55' : 'text-brand-900/45'
            }`}
            style={esOscura ? { textShadow: '0 1px 6px rgba(0,0,0,0.6)' } : undefined}
          >
            {/* aria-hidden: el estado ya se anuncia con el texto de abajo,
                el icono duplicaría el mensaje en un lector de pantalla. */}
            <span aria-hidden="true" className="shrink-0">
              {cumplido ? (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" />
                </svg>
              )}
            </span>
            <span>{requisito.etiqueta}</span>
            <span className="sr-only">{cumplido ? '(cumplido)' : '(pendiente)'}</span>
          </li>
        );
      })}
    </ul>
  );
}
