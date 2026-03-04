import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const backendUrl = env.VITE_API_BASE_URL || 'http://localhost:4000';
    return {
      server: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          '/api/v1': {
            target: backendUrl,
            changeOrigin: true,
          },
          '/health': {
            target: backendUrl,
            changeOrigin: true,
          },
        },
      },
      plugins: [react(), tailwindcss()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
