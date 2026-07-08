import { Routes, Route } from 'react-router-dom';
import LoginPage from '../modules/auth/pages/LoginPage';
import ActivarCuentaPage from '../modules/auth/pages/ActivarCuentaPage';
import OlvidePasswordPage from '../modules/auth/pages/OlvidePasswordPage';
import DashboardHomePage from '../modules/auth/pages/DashboardHomePage';
import UsuariosInternosPage from '../modules/usuarios/pages/UsuariosInternosPage';
import UsuariosExternosPage from '../modules/usuarios/pages/UsuariosExternosPage';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/activar-cuenta" element={<ActivarCuentaPage />} />
      <Route path="/olvide-password" element={<OlvidePasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<DashboardHomePage />} />
        <Route path="/usuarios/internos" element={<UsuariosInternosPage />} />
        <Route path="/usuarios/externos" element={<UsuariosExternosPage />} />
        {/* /mi-ficha se construye en el siguiente paso */}
      </Route>
    </Routes>
  );
}
