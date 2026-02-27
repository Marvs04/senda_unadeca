import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface AppLoaderProps {
  state: 'loading' | 'error';
  message?: string;
}

/**
 * Full-screen loading spinner or error screen.
 * Rendered by App.tsx while initial data hooks are fetching or if any fails.
 */
const AppLoader: React.FC<AppLoaderProps> = ({ state, message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-zinc-50">
    {state === 'loading' ? (
      <>
        <div className="w-10 h-10 rounded-full border-4 border-zinc-200 border-t-zinc-800 animate-spin" />
        <p className="text-sm text-zinc-500 font-medium">Cargando datos...</p>
      </>
    ) : (
      <>
        <AlertTriangle className="w-10 h-10 text-rose-400" />
        <p className="text-sm text-zinc-700 font-semibold">Error al cargar la aplicación</p>
        {message && (
          <p className="text-xs text-zinc-400 max-w-xs text-center">{message}</p>
        )}
        <button
          onClick={() => window.location.reload()}
          className="mt-2 flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-900 underline underline-offset-2 transition-colors"
        >
          <RefreshCw className="w-3 h-3" />
          Reintentar
        </button>
      </>
    )}
  </div>
);

export default AppLoader;
