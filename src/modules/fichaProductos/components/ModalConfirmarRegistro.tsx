import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import Button from '../../../shared/components/Button';
import type { ResumenRegistro } from '../types';

export default function ModalConfirmarRegistro({
  resumen,
  onClose,
}: {
  resumen: ResumenRegistro;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const registrar = useMutation({
    mutationFn: productosApi.registrarProductos,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      onClose();
    },
  });

  const hayIncompletos = resumen.productos_incompletos.length > 0;

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="p-6 pb-0 shrink-0">
          <h2 className="font-display text-lg font-semibold text-brand-900 mb-2">
            {hayIncompletos ? 'Faltan documentos obligatorios' : '¿Registrar productos?'}
          </h2>

          {hayIncompletos && (
            <p className="text-sm text-brand-900/70 mb-3">
              Los siguientes productos no tienen todos los documentos obligatorios subidos:
            </p>
          )}
        </div>

        {hayIncompletos ? (
          <>
            <div className="px-6 flex-1 overflow-y-auto min-h-0">
              <ul className="text-sm text-brand-wine list-disc list-inside space-y-1 pb-4">
                {resumen.productos_incompletos.map((nombre) => (
                  <li key={nombre}>{nombre}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end p-6 pt-3 border-t border-brand-900/8 shrink-0">
              <Button variant="ghost" onClick={onClose}>
                Entendido
              </Button>
            </div>
          </>
        ) : (
          <div className="p-6 pt-0">
            <p className="text-sm text-brand-900/70 mb-4">
              Estás a punto de enviar <strong>{resumen.total_productos}</strong> producto(s) a calificación. Una
              vez registrados, no podrás editarlos ni agregar productos nuevos hasta que un administrador los
              califique.
            </p>

            {registrar.isError && (
              <p className="text-xs text-brand-wine mb-3">
                No se pudo completar el registro. Intenta de nuevo.
              </p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={onClose} disabled={registrar.isPending}>
                Cancelar
              </Button>
              <Button onClick={() => registrar.mutate()} isLoading={registrar.isPending}>
                Sí, registrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}