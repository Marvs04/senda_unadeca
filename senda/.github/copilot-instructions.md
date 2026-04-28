# Copilot Instructions — senda_unadeca

## Stack
- **Frontend**: React 19 + TypeScript + Vite, sin SSR
- **Backend**: Node.js ESM (`.mjs`), Express 4, sin TypeScript
- **DB / Auth**: Supabase (PostgreSQL + Auth + RLS)
- **Estilos**: Tailwind CSS

---

## Patrón de Real-Time

Toda tabla que necesita actualizarse en vivo usa `subscribeToTableChanges` de `frontend/lib/realtime.ts`.

### Regla de implementación

```ts
// 1. Suscríbete UNA vez al montar (useEffect con deps vacío [])
// 2. Usa un timer de 250ms para evitar flood de events
// 3. Guarda los parámetros actuales en un ref para que el callback
//    siempre use los filtros más recientes sin re-montar la suscripción

const paramsRef = useRef(params);
useEffect(() => { paramsRef.current = params; }); // actualiza sin bloquear el render

useEffect(() => {
  let refreshTimer: number | null = null;

  const scheduleBackgroundRefresh = () => {
    if (refreshTimer !== null) return;
    refreshTimer = window.setTimeout(() => {
      refreshTimer = null;
      fetchLatestData(paramsRef.current)
        .then(result => setData(result))
        .catch(err   => console.warn('[Realtime] refresh fallido', err));
    }, 250);
  };

  const unsubscribe = subscribeToTableChanges({
    table:    'nombre_tabla',
    onChange: scheduleBackgroundRefresh,
  });

  return () => {
    unsubscribe();
    if (refreshTimer !== null) window.clearTimeout(refreshTimer);
  };
}, []); // eslint-disable-line react-hooks/exhaustive-deps
```

### Hooks que ya usan este patrón

| Hook | Tabla escuchada |
|---|---|
| `useWorkLogs` | `work_logs` |
| `useAccountingReport` | `work_logs` |

### Importante
- El `useEffect` de suscripción y el de fetch por cambio de filtros son **separados**.
- El refresh de realtime **no** pone `isLoading = true` — la UI no debe bloquearse, solo actualizarse silenciosamente en segundo plano.
- Si `VITE_SUPABASE_URL` o `VITE_SUPABASE_ANON_KEY` no están definidas, `getRealtimeClient()` devuelve `null` y la suscripción se desactiva sin error.

---

## Arquitectura de módulos (backend)

Cada feature sigue la estructura:
```
features/<nombre>/
  <nombre>.schemas.mjs    ← constantes, regexes, helpers de dominio
  <nombre>.repository.mjs ← queries Supabase, solo I/O
  <nombre>.service.mjs    ← lógica de negocio + validación de permisos
  <nombre>.controller.mjs ← extrae params del req, llama service, res.json()
  <nombre>.routes.mjs     ← Router de Express, monta requireAuth donde aplica
```

## Reglas de permisos

| Rol | Puede ver | Puede escribir |
|---|---|---|
| `SUPER_ADMIN` | Todo | Todo |
| `ADMIN` | Todo | Usuarios (no SUPER_ADMIN), Departamentos, Tasa |
| `DEPT_HEAD` | Sus logs | Aprobar/rechazar logs de su depto |
| `STUDENT` | Sus logs | Crear logs propios |
| `ACCOUNTING` | Reporte de nómina | Marcar logs como PROCESSED |

## Convenciones de código

- Backend: archivos `.mjs`, ESM puro, sin TypeScript.
- Frontend: archivos `.ts` / `.tsx`, TypeScript estricto.
- Mappers en `shared/utils/mappers.mjs` convierten `snake_case` DB → `camelCase` API.
- `adminSupabase` (SERVICE_ROLE_KEY) solo en el backend, **nunca** en el frontend.
- Token JWT en `localStorage` bajo la clave `senda_token` (ver `TokenManager` en `api/apiClient.ts`).
