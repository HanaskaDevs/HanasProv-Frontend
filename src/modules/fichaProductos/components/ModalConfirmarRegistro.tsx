// src/modules/fichaProductos/components/ModalConfirmarRegistro.tsx
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as productosApi from '../api/productosApi';
import Button from '../../../shared/components/Button';
import Spinner from '../../../shared/components/Spinner';

/**
 * Antes recibía el resumen ya calculado sobre TODOS los productos
 * activos. Ahora recibe los IDs que el proveedor tildó en la lista, y
 * pide su propio resumen acotado a esos -> lo que se valida (completos/
 * incompletos) y lo que se termina registrando es exactamente la
 * selección, no todo el catálogo.
 */
export default function ModalConfirmarRegistro({
  idsSeleccionados,
  onClose,
  onRegistrado,
}: {
  idsSeleccionados: number[];
  onClose: () => void;
  onRegistrado: () => void;
}) {
  const queryClient = useQueryClient();

  const { data: resumen, isLoading } = useQuery({
    queryKey: ['resumen-registro-seleccion', idsSeleccionados],
    queryFn: () => productosApi.obtenerResumenRegistro(idsSeleccionados),
  });

  const registrar = useMutation({
    mutationFn: () => productosApi.registrarProductos(idsSeleccionados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mis-productos'] });
      queryClient.invalidateQueries({ queryKey: ['resumen-registro'] });
      window.dispatchEvent(new Event('hana:celebrar'));
      onRegistrado();
      onClose();
    },
  });

  const hayIncompletos = (resumen?.productos_incompletos.length ?? 0) > 0;

  return (
    <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[85vh] flex flex-col">
        {isLoading || !resumen ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : (
          <>
            <div className="p-6 pb-0 shrink-0">
              <h2 className="font-display text-lg font-semibold text-brand-900 mb-2">
                {hayIncompletos ? 'Faltan documentos obligatorios' : '¿Registrar los productos seleccionados?'}
              </h2>

              {hayIncompletos && (
                <p className="text-sm text-brand-900/70 mb-3">
                  De los productos que seleccionaste, estos no tienen todos los documentos obligatorios subidos:
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
                  Estás a punto de enviar <strong>{resumen.total_productos}</strong> producto(s) seleccionado(s) a
                  calificación. Una vez registrados, no podrás editarlos hasta que un administrador los califique.
                  El resto de tu catálogo (lo que no seleccionaste) sigue disponible para seguir editándolo.
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
          </>
        )}
      </div>
    </div>
  );
}