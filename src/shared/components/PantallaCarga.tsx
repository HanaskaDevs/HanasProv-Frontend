import Logo from './Logo';

/**
 * Pantalla de carga a pantalla completa (fondo de marca + logo + spinner).
 *
 * Vivía suelta dentro de ProtectedRoute, para el rato en que useAuth
 * todavía está resolviendo la sesión. Ahora también la usa el Suspense de
 * AppRoutes mientras baja el chunk de una página -> las dos esperas se ven
 * exactamente igual, en vez de que una muestre la marca y la otra un
 * spinner pelado sobre blanco.
 */
export default function PantallaCarga() {
  return (
    <div className="min-h-screen bg-brand-900 flex flex-col items-center justify-center gap-6">
      <Logo className="h-14" variant="light" />
      {/* Spinner inline (no el <Spinner/> compartido): ese usa colores
          oscuros fijos pensados para fondos claros -> aquí, sobre fondo
          brand-900, quedaba prácticamente invisible. */}
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
    </div>
  );
}
