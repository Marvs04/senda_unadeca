import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

interface Props {
  children: React.ReactNode;
  /** Fallback personalizado — si no se provee, se usa la UI por defecto. */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  showDetails: boolean;
}

/**
 * ErrorBoundary global de SENDA.
 *
 * Captura cualquier error de render / ciclo de vida en el subárbol.
 * Muestra una pantalla de recuperación en lugar de una pantalla en blanco.
 *
 * Uso:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Para secciones específicas (p.ej. un tab que no debe tumbar el portal):
 *   <ErrorBoundary fallback={<p>Sección no disponible.</p>}>
 *     <TabContent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  // Declarar state como class field para que TypeScript resuelva correctamente
  // this.state, this.props y this.setState en todo el componente.
  state: State = { hasError: false, error: null, showDetails: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, showDetails: false };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Aquí se conectaría Sentry / Datadog cuando esté disponible:
    // Sentry.captureException(error, { extra: info });
    console.error('[SENDA] Error capturado por ErrorBoundary:', error, info);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, showDetails: false });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const { error, showDetails } = this.state;

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-8">
          <div className="bg-card border border-border-faint rounded-[2.5rem] shadow-sm p-12 w-full max-w-lg text-center">
            <div className="w-16 h-16 bg-rose-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
            </div>

            <h1 className="text-2xl font-black tracking-tight text-foreground mb-2">
              Algo salió mal
            </h1>
            <p className="text-sm text-muted leading-relaxed mb-8">
              Ocurrió un error inesperado. Puedes intentar recuperarte sin recargar
              la página, o recargarla si el problema persiste.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <button
                onClick={this.handleRetry}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-fg rounded-2xl text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Intentar de nuevo
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 border border-border text-muted rounded-2xl text-sm font-bold hover:bg-surface transition-colors"
              >
                Recargar página
              </button>
            </div>

            {/* Detalles técnicos — solo en desarrollo */}
            {import.meta.env.DEV && error && (
              <div className="text-left border border-border-faint rounded-2xl overflow-hidden">
                <button
                  onClick={this.toggleDetails}
                  className="w-full flex items-center justify-between px-5 py-3 bg-surface text-faint text-xs font-bold uppercase tracking-widest hover:bg-surface-hover transition-colors"
                >
                  Detalles del error
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  />
                </button>
                {showDetails && (
                  <pre className="p-5 text-[11px] text-rose-600 font-mono whitespace-pre-wrap break-all bg-card">
                    {error.name}: {error.message}
                    {error.stack ? `\n\n${error.stack}` : ''}
                  </pre>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
