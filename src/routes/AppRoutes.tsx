import { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { lazyPagina } from './lazyPagina';
import PantallaCarga from '../shared/components/PantallaCarga';
import { useAuth } from '../modules/auth/hooks/useAuth';

/**
 * Cada página se carga en su propio chunk, bajo demanda (lazy), en vez de
 * venir toda la app en un solo bundle. Antes eran 1.37 MB de JS que el
 * usuario tenía que bajar completos para ver el login, incluyendo cosas
 * que quizá nunca abre: `xlsx` (7 MB en node_modules, solo lo usa
 * Catálogo de Productos) y `leaflet` (3.9 MB, solo el mapa de Mi Ficha)
 * son los dos casos más caros, y ninguno de los dos lo necesita, por
 * ejemplo, un proveedor que solo entra a ver sus pedidos.
 *
 * Se usa lazyPagina() y no lazy() a secas: si el `dist` cambia con la
 * pestaña abierta, el chunk que pide esta versión ya no existe y la
 * pantalla queda en blanco con un 404. lazyPagina recarga una vez (ver
 * ese archivo).
 *
 * Landing y Login quedan a propósito FUERA del lazy: son la primera
 * pantalla que ve cualquiera, así que meterlas en un chunk aparte solo
 * agregaría una ida y vuelta más antes del primer render.
 *
 * El fallback de arriba (PantallaCarga) casi no se ve: cubre el salto
 * entre las públicas y el dashboard. Dentro del dashboard, la espera la
 * maneja el Suspense de ProtectedRoute, que conserva header y menú.
 */
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';

// --- Auth (públicas, fuera del flujo principal) ---
const ActivarCuentaPage = lazyPagina(() => import('../modules/auth/pages/ActivarCuentaPage'));
const OlvidePasswordPage = lazyPagina(() => import('../modules/auth/pages/OlvidePasswordPage'));
const RestablecerPasswordPage = lazyPagina(() => import('../modules/auth/pages/RestablecerPasswordPage'));

// --- Dashboard ---
const DashboardHomePage = lazyPagina(() => import('../modules/auth/pages/DashboardHomePage'));
const EmpresasPage = lazyPagina(() => import('../modules/empresas/pages/EmpresasPage'));
const MiFichaPage = lazyPagina(() => import('../modules/miFicha/pages/MiFichaPage'));
const DocumentosPage = lazyPagina(() => import('../modules/documentacion/pages/DocumentosPage'));
const ProductosPage = lazyPagina(() => import('../modules/fichaProductos/pages/ProductosPage'));
const UsuariosInternosPage = lazyPagina(() => import('../modules/usuarios/pages/UsuariosInternosPage'));
const UsuariosExternosPage = lazyPagina(() => import('../modules/usuarios/pages/UsuariosExternosPage'));
const ProveedoresPage = lazyPagina(() => import('../modules/proveedores/pages/ProveedoresPage'));
const DetalleProveedoresPage = lazyPagina(() => import('../modules/proveedores/pages/DetalleProveedoresPage'));
const CatalogoProductosPage = lazyPagina(() => import('../modules/catalogoProductos/pages/CatalogoProductosPage'));
const ProductosProveedorPage = lazyPagina(() => import('../modules/productosProveedor/pages/ProductosProveedorPage'));
const RevisionComprasPage = lazyPagina(() => import('../modules/revisionCompras/pages/RevisionComprasPage'));
const CalificacionPage = lazyPagina(() => import('../modules/calificacion/pages/CalificacionPage'));
const PedidosPage = lazyPagina(() => import('../modules/pedidos/pages/PedidosPage'));
const ReclamosAbiertosPage = lazyPagina(() => import('../modules/reclamos/pages/ReclamosAbiertosPage'));
const ReclamosCerradosPage = lazyPagina(() => import('../modules/reclamos/pages/ReclamosCerradosPage'));
const CambiosPrecioPage = lazyPagina(() => import('../modules/cambiosPrecio/pages/CambiosPrecioPage'));
const AuditoriasPage = lazyPagina(() => import('../modules/auditorias/pages/AuditoriasPage'));
const CalificacionRecepcionesPage = lazyPagina(() => import('../modules/auditorias/pages/CalificacionRecepcionesPage'));
const PoliticasPage = lazyPagina(() => import('../modules/politicas/pages/PoliticasPage'));
const ConfiguracionesPage = lazyPagina(() => import('../modules/configuraciones/pages/ConfiguracionesPage'));
const CatalogosPage = lazyPagina(() => import('../modules/catalogos/pages/CatalogosPage'));
const ReporteCalificacionProveedoresPage = lazyPagina(() => import('../modules/reportes/pages/ReporteCalificacionProveedoresPage'));
const ReporteCumplimientoEntregasPage = lazyPagina(() => import('../modules/reportes/pages/ReporteCumplimientoEntregasPage'));
const ReporteCaducidadDocumentosPage = lazyPagina(() => import('../modules/reportes/pages/ReporteCaducidadDocumentosPage'));
const PlanContingenciaNinoPage = lazyPagina(() => import('../modules/reportes/pages/PlanContingenciaNinoPage'));
const ReporteHistorialReclamosPage = lazyPagina(() => import('../modules/reportes/pages/ReporteHistorialReclamosPage'));
const ReporteHistorialProveedoresPage = lazyPagina(() => import('../modules/reportes/pages/ReporteHistorialProveedoresPage'));

// Páginas legales: PÚBLICAS a propósito (fuera de ProtectedRoute). Quien
// necesita ejercer un derecho sobre sus datos puede ser justamente alguien
// sin cuenta activa; exigir login sería negarle el derecho en la práctica.
const PoliticaProteccionDatosPage = lazyPagina(() => import('../modules/legal/pages/PoliticaProteccionDatosPage'));
const FormularioDerechosPage = lazyPagina(() => import('../modules/legal/pages/FormularioDerechosPage'));
const CalendarioHorariosPage = lazyPagina(() => import('../modules/horariosEntrega/pages/CalendarioHorariosPage'));
const ModoTvHorariosPage = lazyPagina(() => import('../modules/horariosEntrega/pages/ModoTvHorariosPage'));
const SeguimientoHoyPage = lazyPagina(() => import('../modules/horariosEntrega/pages/SeguimientoHoyPage'));
const AprobacionesArriboPage = lazyPagina(() => import('../modules/horariosEntrega/pages/AprobacionesArriboPage'));

/**
 * "/" es la landing pública (marketing, para un proveedor que todavía no
 * tiene cuenta) -> pero si quien abre la app YA tiene sesión válida
 * (token en localStorage y usuario cargado), no tiene sentido mostrarle
 * la landing: se manda directo al panel. Sin esto, cada vez que se cierra
 * y reabre la app nativa (Android carga "/" en cada arranque en frío) se
 * veía la landing de nuevo aunque la sesión siguiera activa -> el usuario
 * tenía que darse cuenta de que podía tocar el logo (que sí revisa la
 * sesión) para "recuperarla", cuando en realidad nunca se había perdido.
 *
 * isLoading (mientras useAuth todavía está confirmando el token contra el
 * backend) muestra PantallaCarga en vez de decidir en falso: si se
 * mostrara la landing de entrada y un instante después se reemplazara por
 * el panel, se vería un parpadeo.
 */
function RutaRaiz() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PantallaCarga />;
  }

  if (isAuthenticated) {
    return <Navigate to="/panel" replace />;
  }

  return <LandingPage />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PantallaCarga />}>
      <Routes>
        <Route path="/" element={<RutaRaiz />} />
        <Route path="/politica-de-proteccion-de-datos" element={<PoliticaProteccionDatosPage />} />
        <Route path="/formulario-atencion-de-derechos" element={<FormularioDerechosPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activar-cuenta" element={<ActivarCuentaPage />} />
        <Route path="/olvide-password" element={<OlvidePasswordPage />} />
        <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />

        {/* Modo TV del calendario: pantalla completa a propósito, fuera de
            ProtectedRoute (que fuerza DashboardLayout con header y menú).
            Valida sesión y rol a mano, ver el propio componente. */}
        <Route path="/calendario/modo-tv" element={<ModoTvHorariosPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/panel" element={<DashboardHomePage />} />
          <Route path="/empresas" element={<EmpresasPage />} />
          <Route path="/mi-ficha" element={<MiFichaPage />} />
          <Route path="/documentos" element={<DocumentosPage />} />
          <Route path="/productos" element={<ProductosPage />} />

          <Route path="/usuarios/internos" element={<UsuariosInternosPage />} />
          <Route path="/usuarios/proveedores" element={<UsuariosExternosPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/proveedores/detalle" element={<DetalleProveedoresPage />} />
          <Route path="/catalogo-productos" element={<CatalogoProductosPage />} />
          <Route path="/productos-proveedor" element={<ProductosProveedorPage />} />
          <Route path="/productos-revision" element={<RevisionComprasPage />} />

          <Route path="/calificacion" element={<CalificacionPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/reclamos/abiertos" element={<ReclamosAbiertosPage />} />
          <Route path="/reclamos/cerrados" element={<ReclamosCerradosPage />} />
          <Route path="/cambios-precio" element={<CambiosPrecioPage />} />
          <Route path="/auditorias" element={<AuditoriasPage />} />
          <Route path="/auditorias/recepciones" element={<CalificacionRecepcionesPage />} />
          <Route path="/politicas" element={<PoliticasPage />} />
          <Route path="/calendario" element={<CalendarioHorariosPage />} />
          <Route path="/calendario/seguimiento" element={<SeguimientoHoyPage />} />
          <Route path="/calendario/aprobaciones" element={<AprobacionesArriboPage />} />
          <Route path="/reportes" element={<Navigate to="/reportes/calificacion-proveedores" replace />} />
          <Route path="/reportes/calificacion-proveedores" element={<ReporteCalificacionProveedoresPage />} />
          <Route path="/reportes/cumplimiento-entregas" element={<ReporteCumplimientoEntregasPage />} />
          <Route path="/reportes/caducidad-documentos" element={<ReporteCaducidadDocumentosPage />} />
          <Route path="/reportes/plan-contingencia-nino" element={<PlanContingenciaNinoPage />} />
          <Route path="/reportes/historial-reclamos" element={<ReporteHistorialReclamosPage />} />
          <Route path="/reportes/historial-proveedores" element={<ReporteHistorialProveedoresPage />} />
          <Route path="/configuraciones" element={<ConfiguracionesPage />} />
          <Route path="/catalogos" element={<CatalogosPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
