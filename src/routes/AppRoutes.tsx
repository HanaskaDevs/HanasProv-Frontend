import { Routes, Route } from 'react-router-dom';
import LandingPage from '../modules/landing/pages/LandingPage';
import LoginPage from '../modules/auth/pages/LoginPage';
import ActivarCuentaPage from '../modules/auth/pages/ActivarCuentaPage';
import OlvidePasswordPage from '../modules/auth/pages/OlvidePasswordPage';
import DashboardHomePage from '../modules/auth/pages/DashboardHomePage';
import UsuariosInternosPage from '../modules/usuarios/pages/UsuariosInternosPage';
import UsuariosExternosPage from '../modules/usuarios/pages/UsuariosExternosPage';
import MiFichaPage from '../modules/miFicha/pages/MiFichaPage';
import DocumentosPage from '../modules/documentacion/pages/DocumentosPage';
import CalificacionPage from '../modules/calificacion/pages/CalificacionPage';
import ProductosPage from '../modules/fichaProductos/pages/ProductosPage';
import ProximamentePage from '../shared/pages/ProximamentePage';
import ProtectedRoute from './ProtectedRoute';
import RestablecerPasswordPage from '../modules/auth/pages/RestablecerPasswordPage';
import EmpresasPage from '../modules/empresas/pages/EmpresasPage';
import PedidosPage from '../modules/pedidos/pages/PedidosPage';
import ProveedoresPage from '../modules/proveedores/pages/ProveedoresPage';
import DetalleProveedoresPage from '../modules/proveedores/pages/DetalleProveedoresPage';
import CatalogoProductosPage from '../modules/catalogoProductos/pages/CatalogoProductosPage';
import ReclamosAbiertosPage from '../modules/reclamos/pages/ReclamosAbiertosPage';
import ReclamosCerradosPage from '../modules/reclamos/pages/ReclamosCerradosPage';
import ConfiguracionesPage from '../modules/configuraciones/pages/ConfiguracionesPage';
import AuditoriasPage from '../modules/auditorias/pages/AuditoriasPage';
import PoliticasPage from '../modules/politicas/pages/PoliticasPage';
import CatalogosPage from '../modules/catalogos/pages/CatalogosPage';

export default function AppRoutes() {
  return (
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
        <Route path="/auditorias" element={<AuditoriasPage />} />
        <Route path="/politicas" element={<PoliticasPage />} />
        <Route path="/calendario" element={<ProximamentePage titulo="Calendario" />} />
        <Route path="/reportes" element={<ProximamentePage titulo="Reportes" />} />
        <Route path="/configuraciones" element={<ConfiguracionesPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
      </Route>
    </Routes>
  );
}