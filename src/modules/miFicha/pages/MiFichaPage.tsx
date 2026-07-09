import { useState } from 'react';
import ChecklistDocumentos from '../../documentacion/components/ChecklistDocumentos';
import ListaProductos from '../../fichaProductos/components/ListaProductos';

const TABS = [
  { id: 'documentos', label: 'Documentos' },
  { id: 'productos', label: 'Productos' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function MiFichaPage() {
  const [tabActiva, setTabActiva] = useState<TabId>('documentos');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-brand-900">Mi Ficha</h1>
        <p className="text-brand-900/60 text-sm mt-1">Documentación y productos de tu empresa.</p>
      </div>

      <div className="flex gap-1 border-b border-brand-900/10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTabActiva(tab.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tabActiva === tab.id
                ? 'border-brand-700 text-brand-900'
                : 'border-transparent text-brand-900/50 hover:text-brand-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabActiva === 'documentos' ? <ChecklistDocumentos /> : <ListaProductos />}
    </div>
  );
}