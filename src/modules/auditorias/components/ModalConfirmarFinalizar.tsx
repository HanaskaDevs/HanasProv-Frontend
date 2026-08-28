import Button from '../../../shared/components/Button';
import { useBackHandler } from '../../../shared/hooks/useBackHandler';

export default function ModalConfirmarFinalizar({
    isLoading,
    onConfirmar,
    onCancelar,
}: {
    isLoading: boolean;
    onConfirmar: () => void;
    onCancelar: () => void;
}) {
    // Este modal arma su propio overlay a mano (no usa el componente Modal
    // compartido, que ya trae esto solo) -> hay que registrarlo aparte.
    useBackHandler(onCancelar);

    return (
        <div className="fixed inset-0 bg-brand-900/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-sm p-6">
                <h2 className="font-display text-lg font-semibold text-brand-900 mb-1">
                    ¿Finalizar la auditoría?
                </h2>
                <p className="text-sm text-brand-900/60 mb-5">
                    Una vez finalizada, las respuestas quedan registradas y no se podrán modificar.
                </p>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={onCancelar} disabled={isLoading}>
                        Cancelar
                    </Button>
                    <Button onClick={onConfirmar} isLoading={isLoading}>
                        Sí, finalizar
                    </Button>
                </div>
            </div>
        </div>
    );
}