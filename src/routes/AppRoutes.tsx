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
import PedidosPage from '../modules/pedidos/pages/PedidosPage';
import ProveedoresPage from '../modules/proveedores/pages/ProveedoresPage';
import ReclamosAbiertosPage from '../modules/reclamos/pages/ReclamosAbiertosPage';
import ReclamosCerradosPage from '../modules/reclamos/pages/ReclamosCerradosPage';

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

        <Route path="/calificacion" element={<ProximamentePage titulo="Calificación" />} />
        <Route path="/pedidos" element={<PedidosPage />} />
        <Route path="/reclamos/abiertos" element={<ReclamosAbiertosPage />} />
        <Route path="/reclamos/cerrados" element={<ReclamosCerradosPage />} />
        <Route path="/auditorias" element={<ProximamentePage titulo="Auditorías" />} />
        <Route path="/politicas" element={<ProximamentePage titulo="Políticas" />} />
        <Route path="/calendario" element={<ProximamentePage titulo="Calendario" />} />
        <Route path="/reportes" element={<ProximamentePage titulo="Reportes" />} />
      </Route>
    </Routes>
  );
}