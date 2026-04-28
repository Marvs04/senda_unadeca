import { useState, useEffect } from 'react';

/**
 * Retrasa la actualización de un valor hasta que el usuario deje de escribir.
 *
 * @param value   El valor a debouncear (normalmente el texto de un input).
 * @param delay   Tiempo de espera en ms — por defecto 300 ms.
 * @returns       El valor estabilizado, que solo cambia tras el delay.
 *
 * @example
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   // debouncedSearch solo cambia 300ms después de que el usuario deje de escribir.
 *   // Úsalo para filtrar listas o disparar queries, y muestra `search` en el input.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
