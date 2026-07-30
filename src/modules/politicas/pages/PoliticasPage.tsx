import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import * as politicasApi from '../api/politicasApi';
import Card from '../../../shared/components/Card';
import Spinner from '../../../shared/components/Spinner';

function IconoChevron({ abierto }: { abierto: boolean }) {
  return (
    <svg
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-transform duration-200 ${abierto ? 'rotate-90' : ''}`}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export default function PoliticasPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['politicas'],
    queryFn: politicasApi.listarPoliticas,
  });

  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());

  function alternarExpandido(id: number) {
    setExpandidos((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  }

  const politicas = (data ?? []).slice().sort((a, b) => a.Orden - b.Orden);

  return (
    <div className="max-w-6xl mx-auto w-full h-full flex flex-col space-y-3">
      <div className="shrink-0">
        <h1 className="font-display text-lg font-semibold text-brand-900 flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-700">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Políticas
        </h1>
        <p className="text-brand-900/55 text-xs mt-0.5">
          Políticas vigentes de Hanaska. Haz clic en un título para leerla. Solo visualización dentro de la plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spinner className="h-6 w-6" />
        </div>
      ) : politicas.length === 0 ? (
        <Card>
          <p className="text-sm text-brand-900/60 text-center py-10">
            Todavía no hay políticas publicadas.
          </p>
        </Card>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto print:hidden select-none">
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-brand-900/6">
              {politicas.map((politica) => {
                const abierto = expandidos.has(politica.Id_Politica);

                return (
                  <div key={politica.Id_Politica}>
                    <button
                      onClick={() => alternarExpandido(politica.Id_Politica)}
                      className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-brand-200/[0.06] transition-colors"
                    >
                      <span className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center text-brand-900/40">
                        <IconoChevron abierto={abierto} />
                      </span>
                      <span className="font-medium text-brand-900 text-sm">{politica.Titulo}</span>
                    </button>

                    <div
                      className="grid transition-all duration-300 ease-out"
                      style={{ gridTemplateRows: abierto ? '1fr' : '0fr' }}
                    >
                      <div className="overflow-hidden">
                        <div className="pl-16 pr-5 pb-5">
                          <p className="text-sm text-brand-900/70 whitespace-pre-line leading-relaxed">
                            {politica.Descripcion}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}