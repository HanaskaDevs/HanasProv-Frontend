// src/shared/components/AroProgreso.tsx

/**
 * Anillo de progreso circular con el porcentaje en el centro. Antes
 * vivía solo dentro de ChecklistDocumentos (Documentación) -> se separó
 * acá para poder reusarlo tal cual en Mi Ficha y mantener la misma
 * identidad visual entre las pantallas de onboarding del proveedor.
 */
export default function AroProgreso({ porcentaje, rechazado = false }: { porcentaje: number; rechazado?: boolean }) {
  const radio = 18;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia * (1 - porcentaje / 100);
  // Un rechazo pesa más que el porcentaje -> aunque esté 100% completo,
  // si algo quedó por corregir el anillo se pinta ámbar (mismo color
  // que el badge "Rechazado"/"Por corregir") en vez de verde, para que
  // no parezca que ya quedó todo resuelto.
  const color = rechazado
    ? 'stroke-amber-500'
    : porcentaje >= 100
    ? 'stroke-emerald-500'
    : porcentaje >= 50
    ? 'stroke-brand-700'
    : 'stroke-brand-wine';

  return (
    <svg width="44" height="44" viewBox="0 0 44 44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={radio} fill="none" strokeWidth="4.5" className="stroke-brand-900/8" />
      <circle
        cx="22"
        cy="22"
        r={radio}
        fill="none"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={circunferencia}
        strokeDashoffset={offset}
        className={`transition-all duration-500 ${color}`}
      />
      <text
        x="22"
        y="22"
        textAnchor="middle"
        dominantBaseline="middle"
        className="rotate-90 fill-brand-900 text-[11px] font-bold"
        style={{ transformOrigin: '22px 22px' }}
      >
        {porcentaje}%
      </text>
    </svg>
  );
}