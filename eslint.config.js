// @ts-check
import js from '@eslint/js';
import ts from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default ts.config(
  // Archivos ignorados
  { ignores: ['dist/**', 'node_modules/**', 'vite.config.ts', 'vitest.config.ts', 'senda_unadeca/**'] },

  // JS recomendado
  js.configs.recommended,

  // TypeScript + React (sin type-checked para no necesitar tsconfig en el lint)
  ...ts.configs.recommended,

  // React Hooks
  {
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Patrón válido: setIsLoading(true) al inicio de un effect para acciones async.
      // Esta regla experimental produce demasiados falsos positivos en este codebase.
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // Reglas propias del proyecto
  {
    rules: {
      // Permite any explícito (necesario mientras los servicios usan mocks sin tipos completos)
      '@typescript-eslint/no-explicit-any': 'warn',

      // Prefiere const sobre let cuando la variable no se reasigna
      'prefer-const': 'error',

      // No dejar console.log en producción (warn para no bloquear el dev)
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],

      // Imports sin usar → error
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // No usar @ts-ignore (usar @ts-expect-error con motivo)
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-ignore': 'allow-with-description' },
      ],
    },
  },
);
