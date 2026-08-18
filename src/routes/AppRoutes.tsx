import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PantallaCarga from '../shared/components/PantallaCarga';

/**
 * Cada página se carga en su propio chunk, bajo demanda (lazy), en vez de
 * venir toda la app en un solo bundle. Antes eran 1.37 MB de JS que el
 * usuario tenía que bajar completos para ver el login, incluyendo cosas
 * que quizá nunca abre: `xlsx` (7 MB en node_modules, solo lo usa
 * Catálogo de Productos) y `leaflet` (3.9 MB, solo el mapa de Mi Ficha)
 * son los dos casos más caros, y ninguno de los dos lo necesita, por
 * ejemplo, un proveedor que solo entra a ver sus pedidos.
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
const ActivarCuentaPage = lazy(() => import('../modules/auth/pages/ActivarCuentaPage'));
const OlvidePasswordPage = lazy(() => import('../modules/auth/pages/OlvidePasswordPage'));
const RestablecerPasswordPage = lazy(() => import('../modules/auth/pages/RestablecerPasswordPage'));

// --- Dashboard ---
const DashboardHomePage = lazy(() => import('../modules/auth/pages/DashboardHomePage'));
const EmpresasPage = lazy(() => import('../modules/empresas/pages/EmpresasPage'));
const MiFichaPage = lazy(() => import('../modules/miFicha/pages/MiFichaPage'));
const DocumentosPage = lazy(() => import('../modules/documentacion/pages/DocumentosPage'));
const ProductosPage = lazy(() => import('../modules/fichaProductos/pages/ProductosPage'));
const UsuariosInternosPage = lazy(() => import('../modules/usuarios/pages/UsuariosInternosPage'));
const UsuariosExternosPage = lazy(() => import('../modules/usuarios/pages/UsuariosExternosPage'));
const ProveedoresPage = lazy(() => import('../modules/proveedores/pages/ProveedoresPage'));
const DetalleProveedoresPage = lazy(() => import('../modules/proveedores/pages/DetalleProveedoresPage'));
const CatalogoProductosPage = lazy(() => import('../modules/catalogoProductos/pages/CatalogoProductosPage'));
const CalificacionPage = lazy(() => import('../modules/calificacion/pages/CalificacionPage'));
const PedidosPage = lazy(() => import('../modules/pedidos/pages/PedidosPage'));
const ReclamosAbiertosPage = lazy(() => import('../modules/reclamos/pages/ReclamosAbiertosPage'));
const ReclamosCerradosPage = lazy(() => import('../modules/reclamos/pages/ReclamosCerradosPage'));
const CambiosPrecioPage = lazy(() => import('../modules/cambiosPrecio/pages/CambiosPrecioPage'));
const AuditoriasPage = lazy(() => import('../modules/auditorias/pages/AuditoriasPage'));
const CalificacionRecepcionesPage = lazy(() => import('../modules/auditorias/pages/CalificacionRecepcionesPage'));
const PoliticasPage = lazy(() => import('../modules/politicas/pages/PoliticasPage'));
const ConfiguracionesPage = lazy(() => import('../modules/configuraciones/pages/ConfiguracionesPage'));
const CatalogosPage = lazy(() => import('../modules/catalogos/pages/CatalogosPage'));
const ProximamentePage = lazy(() => import('../shared/pages/ProximamentePage'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PantallaCarga />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/activar-cuenta" element={<ActivarCuentaPage />} />
        <Route path="/olvide-password" element={<OlvidePasswordPage />} />
        <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />


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

          <Route path="/calificacion" element={<CalificacionPage />} />
          <Route path="/pedidos" element={<PedidosPage />} />
          <Route path="/reclamos/abiertos" element={<ReclamosAbiertosPage />} />
          <Route path="/reclamos/cerrados" element={<ReclamosCerradosPage />} />
          <Route path="/cambios-precio" element={<CambiosPrecioPage />} />
          <Route path="/auditorias" element={<AuditoriasPage />} />
          <Route path="/auditorias/recepciones" element={<CalificacionRecepcionesPage />} />
          <Route path="/politicas" element={<PoliticasPage />} />
          <Route path="/calendario" element={<ProximamentePage titulo="Calendario" />} />
          <Route path="/reportes" element={<ProximamentePage titulo="Reportes" />} />
          <Route path="/configuraciones" element={<ConfiguracionesPage />} />
          <Route path="/catalogos" element={<CatalogosPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
