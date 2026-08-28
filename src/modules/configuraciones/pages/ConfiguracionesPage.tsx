import { useState } from 'react';
import RoleRoute from '../../../routes/RoleRoute';
import { useAuth } from '../../auth/hooks/useAuth';
import Card from '../../../shared/components/Card';
import TabHomeSlides from '../components/TabHomeSlides';
import TabLoginImagen from '../components/TabLoginImagen';
import TabBotReglas from '../components/TabBotReglas';
import TabGuiaPasos from '../components/TabGuiaPasos';
import TabPoliticas from '../components/TabPoliticas';
import TabDocumentos from '../components/TabDocumentos';
import TabModoTv from '../components/TabModoTv';
import TabSeguridad from '../components/TabSeguridad';

type Tab = 'home' | 'login' | 'bot' | 'guia' | 'politicas' | 'documentos' | 'modo-tv' | 'seguridad';

function ConfiguracionesPageContenido() {
  const { esSistemas } = useAuth();
  const [tab, setTab] = useState<Tab>('home');

  if (!esSistemas) {
    return (
      <Card>
        <p className="text-sm text-brand-900/60 text-center py-10">
          No tienes permisos para acceder a esta sección.
        </p>
      </Card>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'login', label: 'Login' },
    { id: 'bot', label: 'Bot' },
    { id: 'guia', label: 'Guía de inicio' },
    { id: 'politicas', label: 'Políticas' },
    { id: 'documentos', label: 'Documentos' },
    { id: 'modo-tv', label: 'Modo TV' },
    { id: 'seguridad', label: 'Seguridad' },
  ];

  return (
    <div className="max-w-6xl mx-auto w-full space-y-4">
      <div>
        <h1 className="font-display text-xl font-semibold text-brand-900 flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          Configuraciones
        </h1>
        <p className="text-brand-900/50 text-xs mt-0.5">
          Contenido editable del sitio y reglas de documentación de proveedores.
        </p>
      </div>

      <div className="flex items-center gap-1 border-b border-brand-900/10">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-brand-900/40 hover:text-brand-900/70'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'home' && <TabHomeSlides />}
      {tab === 'login' && <TabLoginImagen />}
      {tab === 'bot' && <TabBotReglas />}
      {tab === 'guia' && <TabGuiaPasos />}
      {tab === 'politicas' && <TabPoliticas />}
      {tab === 'documentos' && <TabDocumentos />}
      {tab === 'modo-tv' && <TabModoTv />}
      {tab === 'seguridad' && <TabSeguridad />}
    </div>
  );
}

/**
 * Solo Sistemas. El backend ya lo exige (esSistemasGlobal en cada endpoint),
 * pero sin esta guarda el resto de los roles llegaba a la pantalla por URL
 * directa y la veía dibujada, chocando después contra 403 en cada acción. El
 * caso concreto que lo destapó: la tarjeta "Empresas activas" del panel de
 * Inicio enlazaba a /empresas y también se le mostraba al Admin.
 */
export default function ConfiguracionesPage() {
  const { esSistemas } = useAuth();

  return (
    <RoleRoute allow={esSistemas}>
      <ConfiguracionesPageContenido />
    </RoleRoute>
  );
}
