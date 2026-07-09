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
import ProductosPage from '../modules/fichaProductos/pages/ProductosPage';
import ProximamentePage from '../shared/pages/ProximamentePage';
import ProtectedRoute from './ProtectedRoute';
import RestablecerPasswordPage from '../modules/auth/pages/RestablecerPasswordPage';
import EmpresasPage from '../modules/empresas/pages/EmpresasPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activar-cuenta" element={<ActivarCuentaPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />
      <Route path="/restablecer-password" element={<RestablecerPasswordPage />} />
      <Route path="/empresas" element={<EmpresasPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/panel" element={<DashboardHomePage />} />

        <Route path="/mi-ficha" element={<MiFichaPage />} />
        <Route path="/documentos" element={<DocumentosPage />} />
        <Route path="/productos" element={<ProductosPage />} />

        <Route path="/usuarios/internos" element={<UsuariosInternosPage />} />
        <Route path="/usuarios/proveedores" element={<UsuariosExternosPage />} />
        <Route path="/proveedores" element={<ProximamentePage titulo="Proveedores" />} />

        <Route path="/calificacion" element={<ProximamentePage titulo="Calificación" />} />
        <Route path="/pedidos/abiertos" element={<ProximamentePage titulo="Pedidos Abiertos" />} />
        <Route path="/pedidos/cerrados" element={<ProximamentePage titulo="Pedidos Cerrados" />} />
        <Route path="/reclamos/abiertos" element={<ProximamentePage titulo="Reclamos Abiertos" />} />
        <Route path="/reclamos/cerrados" element={<ProximamentePage titulo="Reclamos Cerrados" />} />
        <Route path="/auditorias" element={<ProximamentePage titulo="Auditorías" />} />
        <Route path="/politicas" element={<ProximamentePage titulo="Políticas" />} />
        <Route path="/calendario" element={<ProximamentePage titulo="Calendario" />} />
        <Route path="/reportes" element={<ProximamentePage titulo="Reportes" />} />
      </Route>
    </Routes>
  );
}