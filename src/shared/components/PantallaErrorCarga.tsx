import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Red de seguridad para que el portal NUNCA quede en blanco (13-nov-2026).
 *
 * Sin esto, cualquier error al dibujar una pantalla -el caso típico: la
 * pestaña quedó abierta durante un despliegue y pide una página que ya no
 * existe en el servidor- desmonta toda la aplicación y deja la pantalla
 * en blanco, sin ninguna pista de que basta con recargar.
 *
 * lazyPagina ya recarga sola una vez en ese caso; esto cubre lo que quede:
 * muestra un aviso en palabras simples y un botón para recargar. El texto
 * no nombra nada técnico (los usuarios no lo son).
 */
interface Props {
  children: ReactNode;
}

interface Estado {
  hayError: boolean;
}

export default class PantallaErrorCarga extends Component<Props, Estado> {
  state: Estado = { hayError: false };

  static getDerivedStateFromError(): Estado {
    return { hayError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Queda en la consola para quien tenga que revisarlo.
    console.error('Error al mostrar la pantalla:', error, info.componentStack);
  }

  render() {
    if (!this.state.hayError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-brand-900">El portal se actualizó</h1>
          <p className="text-brand-900/70">
            Hay una versión nueva del portal o la página no terminó de cargar. Toca el botón para
            continuar; no se pierde nada de lo que ya estaba guardado.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center rounded-lg bg-brand-900 px-5 py-2.5 text-white font-medium hover:bg-brand-700"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
