import { type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../modules/auth/hooks/useAuth';
import Logo from '../components/Logo';

interface NavItem {
  to: string;
  label: string;
  show: boolean;
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { usuario, empresaActiva, esSistemas, esAdmin, esProveedor, logout } = useAuth();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { to: '/', label: 'Panel principal', show: true },
    { to: '/mi-ficha', label: 'Mi Ficha', show: esProveedor },
    { to: '/usuarios/internos', label: 'Usuarios internos', show: esSistemas },
    { to: '/usuarios/externos', label: 'Usuarios externos', show: esSistemas || esAdmin },
  ];

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex bg-brand-200/20">
      <aside className="w-64 shrink-0 bg-brand-900 text-white flex flex-col">
        <div className="p-6">
          <Logo className="h-14" variant="light" />
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems
            .filter((item) => item.show)
            .map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
        </nav>

        <div className="p-4 border-t border-white/10 text-sm">
          <p className="font-medium text-white">{usuario?.nombre_completo}</p>
          <p className="text-white/50 text-xs mb-3">{empresaActiva?.razon_social ?? 'Sin empresa activa'}</p>
          <button onClick={handleLogout} className="text-white/70 hover:text-white text-xs underline">
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
