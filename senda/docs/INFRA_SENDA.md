# Infraestructura SENDA — Guía de Configuración y Despliegue

> Rama: `v.3` — Actualizado: 2026-05-13

---

## Arquitectura General

```
Internet
    │
    ▼
Cloudflare (DNS + Proxy + Tunnel)
    │
    ▼
cloudflared  (contenedor, sin puertos expuestos)
    │
    ▼
nginx-proxy  (enruta por subdominio)
    │
    ├── senda.rlp.lat              → senda-frontend:80
    ├── sendasupabase.rlp.lat      → senda-studio:3000  [HTTP Basic Auth]
    └── sendasupabaseapi.rlp.lat   → senda-kong:8000
```

Toda la comunicación externa pasa por **Cloudflare Tunnel** — no se abren puertos en el firewall del servidor.

---

## Contenedores del Stack SENDA

### Aplicación

| Contenedor | Imagen | Puerto interno | Descripción |
|---|---|---|---|
| `senda-frontend` | `senda-frontend:latest` | 80 | React + Vite compilado → nginx |
| `senda-backend` | `senda-backend:latest` | 4000 | API Express + Node.js 22 |

**Build:** `deploy/docker-compose.yml` desde la raíz del repo.

### Supabase (instancia dedicada SENDA)

| Contenedor | Imagen | Descripción |
|---|---|---|
| `senda-db` | `supabase/postgres:15.8.1.085` | PostgreSQL 15 |
| `senda-kong` | `kong/kong:3.9.1` | API Gateway |
| `senda-auth` | `supabase/gotrue:v2.186.0` | Autenticación |
| `senda-rest` | `postgrest/postgrest:v14.5` | REST API |
| `senda-realtime` | `supabase/realtime:v2.76.5` | WebSockets |
| `senda-storage` | `supabase/storage-api:v1.11.13` | Storage de archivos |
| `senda-pooler` | `supabase/supavisor:2.7.4` | Connection pooler |
| `senda-meta` | `supabase/postgres-meta:v0.95.2` | Metadata API |
| `senda-studio` | `supabase/studio:2026.02.16-sha-26c615c` | Dashboard |
| `senda-analytics` | `supabase/logflare:1.31.2` | Logs / Analytics |
| `senda-edge-functions` | `supabase/edge-runtime:v1.70.3` | Edge Functions (Deno) |
| `senda-imgproxy` | `darthsim/imgproxy:v3.30.1` | Optimización de imágenes |
| `senda-vector` | `timberio/vector:0.53.0-alpine` | Agregación de logs |

**Red Docker:** `stamp-net` (external bridge, compartida con nginx y cloudflared).

---

## Archivos de Configuración Requeridos

> Estos archivos están excluidos del repositorio por `.gitignore` ya que contienen secretos o son generados en el servidor. Deben crearse manualmente al desplegar.

### 1. `/senda/supabase/.env`

Variables de entorno de la instancia Supabase SENDA. Ver `REQUERIMIENTOS_SERVIDOR.md` para la lista completa de variables.

### 2. `/senda/supabase/volumes/api/kong.yml`

Configuración declarativa de Kong (API Gateway). Debe contener:
- Los consumers `anon` y `service_role` con sus respectivas keys JWT de SENDA
- Las rutas a los contenedores `senda-auth`, `senda-rest`, `senda-realtime`, `senda-storage`, `senda-edge-functions`, `senda-analytics`, `senda-meta`

**Importante:** todos los `url:` deben apuntar a `http://senda-<servicio>:<puerto>`, **no** a los nombres de la instancia supabase principal (`supabase-auth`, etc.).

### 3. `/senda/supabase/volumes/vector/vector.yml`

Configuración de Vector para agregar logs de Docker y enviarlos a Logflare:
```yaml
sources:
  docker_host:
    type: docker_logs
    exclude_containers:
      - senda-vector

sinks:
  logflare:
    uri: http://senda-analytics:4000/api/logs?source_name=docker&api_key=${LOGFLARE_API_KEY}
```

### 4. `/senda/supabase/volumes/functions/main/index.ts`

Entrypoint mínimo para el Edge Runtime (Deno). Requerido aunque no haya edge functions desplegadas:
```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
serve(async (req: Request) => {
  const url = new URL(req.url)
  const functionName = url.pathname.split("/")[1]
  return new Response(
    JSON.stringify({ error: `Function ${functionName} not found` }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  )
})
```

### 5. `/pre/nginx/nginx.conf`

Proxy reverso nginx (fuera del repo senda, en `/home/reyadmin/pre/`).  
Cada instancia tiene su bloque `server {}`. El bloque de `sendasupabaseapi.rlp.lat` debe estar habilitado cuando `senda-kong` esté corriendo.

---

## Base de Datos — Estructura Clave

### Trigger de creación de usuario

Al crear un usuario en `auth.users`, se ejecuta automáticamente `handle_new_user()` que inserta en `public.profiles`.

**Los campos requeridos en `raw_user_meta_data` al crear un usuario:**

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `role` | `user_role` enum | **Sí** | `SUPER_ADMIN`, `ADMIN`, `DEPT_HEAD`, `STUDENT`, `ACCOUNTING` |
| `name` | `text` | No | Usa el prefijo del email como fallback |
| `carnet` | `text` | Para `STUDENT` | Obligatorio para rol STUDENT |
| `employee_number` | `text` | Para `DEPT_HEAD` | Obligatorio para rol DEPT_HEAD |
| `department_id` | `UUID` | No | ID del departamento |

> **No crear usuarios desde el Dashboard de Supabase Studio** sin pasar estos metadatos — el trigger falla y la creación se revierte.

### Reglas de negocio (CHECK constraint en `profiles`)

- `SUPER_ADMIN`, `ADMIN`, `ACCOUNTING`: carnet=NULL, employee_number=NULL  
- `DEPT_HEAD`: carnet=NULL, employee_number=NOT NULL  
- `STUDENT`: carnet=NOT NULL, employee_number=NULL

---

## Credenciales de Acceso al Dashboard

| Servicio | URL | Usuario |
|---|---|---|
| Supabase Studio SENDA | `https://sendasupabase.rlp.lat` | `admin` |
| API Gateway | `https://sendasupabaseapi.rlp.lat` | — (usa JWT) |
| App Frontend | `https://senda.rlp.lat` | — |

> Las contraseñas están documentadas en `/senda/supabase/.env` (no subido al repo).

---

## HTTP Basic Auth del Studio

El acceso a `sendasupabase.rlp.lat` está protegido por HTTP Basic Auth vía nginx.  
El archivo `.htpasswd_senda` se almacena **dentro del contenedor** `nginx-proxy` en `/etc/nginx/.htpasswd_senda`.

Al recrear el contenedor nginx se pierde y debe regenerarse:

```bash
docker exec nginx-proxy htpasswd -cb /etc/nginx/.htpasswd_senda admin <PASSWORD>
docker exec nginx-proxy nginx -s reload
```

---

## Incidente: Outage del 4 de mayo de 2026

**Causa raíz:** Los archivos de init de PostgreSQL (`roles.sql`, `jwt.sql`, `_supabase.sql`) y los archivos de configuración (`kong.yml`, `vector.yml`) fueron montados como directorios en lugar de archivos en Docker. Al intentar reiniciar, `runc` no pudo crear los mountpoints y todos los contenedores dependientes fallaron en cascada.

**Contenedores afectados:** `senda-db`, `senda-kong`, `senda-rest`, `senda-vector`, `senda-auth`, `senda-realtime`, `senda-pooler`, `senda-storage`, `senda-edge-functions`.

**Duración:** 4 de mayo al 13 de mayo de 2026 (8 días).

**Resolución:**
1. Recrear `senda-db` sin los mounts rotos (datos del volumen intactos)
2. Crear `volumes/api/kong.yml` como archivo correcto con rutas `senda-*`
3. Crear `volumes/vector/vector.yml` como archivo correcto
4. Asignar contraseña a `supabase_storage_admin` en PostgreSQL
5. Crear entrypoint Deno válido en `volumes/functions/main/index.ts`
6. Habilitar bloque nginx para `sendasupabaseapi.rlp.lat`

---

## Comandos Útiles

```bash
# Ver estado de todos los contenedores SENDA
docker ps --format "table {{.Names}}\t{{.Status}}" | grep senda

# Logs de un contenedor específico
docker logs senda-auth --tail 50 -f

# Conectarse a la base de datos
docker exec -e PGPASSWORD=<password> senda-db psql -U supabase_admin -d postgres

# Recargar nginx después de cambiar nginx.conf
docker exec nginx-proxy nginx -s reload

# Regenerar .htpasswd_senda si se recrea el contenedor nginx
docker exec nginx-proxy htpasswd -cb /etc/nginx/.htpasswd_senda admin <PASSWORD>
```
