# Requerimientos del Servidor — Sistema SENDA

> Documento generado el 2026-05-12.  
> Aplica exclusivamente al sistema **SENDA** trasladado a un servidor dedicado propio.

---

## 1. Resumen del sistema

SENDA es una aplicación web compuesta por:

| Capa | Tecnología | Contenedor |
|---|---|---|
| Frontend | React + Vite → servido con nginx | `senda-frontend` |
| Backend API | Node.js 22 + Express | `senda-backend` |
| Base de datos | PostgreSQL 15.8 | `senda-db` |
| Auth | GoTrue (Supabase Auth) | `senda-auth` |
| API Gateway | Kong 3.9.1 | `senda-kong` |
| Realtime | Supabase Realtime | `senda-realtime` |
| Storage | Supabase Storage API | `senda-storage` |
| Connection Pooler | Supavisor | `senda-pooler` |
| REST API | PostgREST | `senda-rest` |
| Studio (dashboard DB) | Supabase Studio | `senda-studio` |
| Logs / Analytics | Logflare | `senda-analytics` |
| Optimización imágenes | imgproxy | `senda-imgproxy` |
| Edge Functions | Supabase Edge Runtime (Deno) | `senda-edge-functions` |
| Vector (logs) | Vector | `senda-vector` |
| Proxy reverso | nginx | `nginx-proxy` |
| Túnel HTTPS | Cloudflare Tunnel | `cloudflared` |

Todo corre en contenedores Docker conectados por una red interna (`stamp-net`).  
El acceso externo se maneja exclusivamente vía **Cloudflare Tunnel** — no se abren puertos en el firewall del servidor.

---

## 2. Requerimientos de Hardware

### Mínimo absoluto (funcional, sin margen)
| Recurso | Mínimo |
|---|---|
| **CPU** | 4 vCores x86_64 |
| **RAM** | 6 GB |
| **Disco** | 40 GB SSD |
| **Ancho de banda** | 100 Mbps (salida) |

### Recomendado (producción estable)
| Recurso | Recomendado |
|---|---|
| **CPU** | 8 vCores x86_64 |
| **RAM** | 8–16 GB |
| **Disco** | 80 GB SSD NVMe |
| **Ancho de banda** | 200 Mbps (salida) |

> **¿Por qué tanta RAM?**  
> El servicio `senda-analytics` (Logflare) solo consume ~675 MB por sí solo.  
> `senda-studio` consume ~170 MB.  
> PostgreSQL + Kong + GoTrue + Realtime suman otros ~600–800 MB en estado estable.  
> Total estimado en reposo: **~2.5–3.5 GB**, con picos de hasta 5 GB bajo carga.

> **¿Por qué SSD?**  
> PostgreSQL y Logflare hacen I/O intensivo en disco.  
> Un HDD rotacional provocará timeouts y reinicios en cadena.

---

## 3. Requerimientos de Software (Sistema Operativo)

### OS soportado
- **Ubuntu 22.04 LTS** (recomendado) o **Ubuntu 24.04 LTS**
- Debian 12 (Bookworm) — compatible
- Rocky Linux 9 / AlmaLinux 9 — compatible

> **No se recomienda:** CentOS 7, Debian 10, Windows Server (WSL2 tiene limitaciones con Docker networking).

### Kernel y capacidades requeridas
| Requisito | Detalle |
|---|---|
| Kernel | >= 5.4 |
| `iptables` o `nftables` | Para Docker networking |
| `cgroups v2` | Requerido por contenedores modernos de Supabase |
| `overlay2` storage driver | Driver de Docker recomendado |
| `/proc/sys/net/ipv4/ip_forward = 1` | Docker lo activa automáticamente |

---

## 4. Software que debe estar instalado

### Obligatorio

| Software | Versión mínima | Notas |
|---|---|---|
| **Docker Engine** | >= 24.x | No Docker Desktop — solo Engine |
| **Docker Compose v2** | >= 2.20 | Como plugin (`docker compose`), no el binario legacy |
| **Git** | >= 2.x | Para clonar el repo y hacer pulls |
| **curl / wget** | cualquiera | Para healthchecks y scripts |

### Instalación rápida (Ubuntu)
```bash
# Docker Engine
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Docker Compose plugin (incluido con Docker Engine moderno)
docker compose version
```

### No es necesario instalar
- Node.js (corre dentro del contenedor)
- nginx (corre dentro del contenedor)
- PostgreSQL (corre dentro del contenedor)
- Python, Java, etc.

---

## 5. Permisos y restricciones del servidor

### Lo que DEBE estar permitido

| Capacidad | Por qué es necesaria | Riesgo de que esté bloqueada |
|---|---|---|
| **Ejecutar Docker** | Toda la aplicación es Docker | Algunos VPS baratos no lo permiten (OpenVZ) |
| **Crear redes Docker bridge** | Red interna `stamp-net` entre contenedores | Raro que esté bloqueado, pero posible en entornos restringidos |
| **Conexiones salientes puerto 587 (SMTP)** | Envío de correos vía smtp.office365.com | **MUY COMÚN que esté bloqueado** en servidores nuevos |
| **Conexiones salientes HTTPS (443)** | Cloudflare Tunnel, pull de imágenes Docker Hub | Casi siempre permitido |
| **Conexiones salientes puerto 7844** | Cloudflare Tunnel (protocolo QUIC/HTTP2) | A veces bloqueado en firewalls corporativos |
| **Privilegios de contenedor (cap_add)** | PostgreSQL y algunos servicios de Supabase los requieren | Puede requerir `--privileged` o caps específicos |

### Lo que NO es necesario (no pedir al proveedor)

| Capacidad | Por qué no se necesita |
|---|---|
| IP pública expuesta en puertos 80/443 | Cloudflare Tunnel maneja el HTTPS sin abrir puertos |
| Certificados SSL propios | Cloudflare los provee automáticamente |
| Panel de control web (cPanel, Plesk) | Todo se administra por SSH + Docker |
| Servidor de correo propio (Postfix/Exim) | Se usa relay externo (Office 365) |
| KVM anidado / virtualización nested | No hay VMs dentro del servidor |

### Verificar con el proveedor antes de comprar

1. **¿Permite ejecutar Docker Engine con redes bridge?**  
   → Los VPS con virtualización **OpenVZ o LXC** generalmente NO permiten Docker con networking completo. Buscar proveedores con **KVM** (Hetzner, DigitalOcean, Vultr, Linode, OVH).

2. **¿Está bloqueado el puerto 587 saliente (SMTP)?**  
   → Muchos proveedores bloquean puertos de correo por defecto para prevenir spam. Hay que solicitarlo explícitamente o usar una alternativa (Resend, SendGrid).

3. **¿Permite tráfico a `*.cloudflareaccess.com` y `*.cfargotunnel.com`?**  
   → Necesario para el Tunnel de Cloudflare.

4. **¿Tiene límite de tráfico saliente?**  
   → Logflare y Realtime generan tráfico constante. Un límite bajo de TB/mes puede generar costos.

---

## 6. Red y Dominios

### Arquitectura de red
```
Internet
    │
    ▼
Cloudflare (DNS + Proxy + Tunnel)
    │
    ▼
cloudflared (contenedor en el servidor)  ← no necesita IP pública expuesta
    │
    ▼
nginx-proxy (contenedor)  ← enruta por subdominio
    │
    ├── senda.rlp.lat            → senda-frontend:80
    ├── sendasupabase.rlp.lat    → senda-studio:3000  (protegido con HTTP Basic Auth)
    └── sendasupabaseapi.rlp.lat → senda-kong:8000
```

### Dominios necesarios (actualmente en uso)
| Subdominio | Apunta a |
|---|---|
| `senda.rlp.lat` | Frontend (React app) |
| `sendasupabaseapi.rlp.lat` | Kong (Supabase API gateway) |
| `sendasupabase.rlp.lat` | Studio (panel de administración DB) |

> Estos dominios deben estar configurados en Cloudflare apuntando al Tunnel.  
> Al cambiar de servidor se debe actualizar el token del Tunnel en el contenedor `cloudflared`.

---

## 7. Variables de Entorno y Secretos

El sistema requiere los siguientes secretos configurados antes de levantar:

### Supabase (`/senda/supabase/.env`)
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- `ANON_KEY` / `SERVICE_ROLE_KEY`
- `DASHBOARD_USERNAME` / `DASHBOARD_PASSWORD`
- `SECRET_KEY_BASE` / `VAULT_ENC_KEY`
- `LOGFLARE_API_KEY`
- `SMTP_USER` / `SMTP_PASS`

### App SENDA (`/senda/deploy/docker-compose.yml`)
- `SUPABASE_URL` (interno: `http://senda-kong:8000`)
- `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
- `CORS_ORIGIN` / `SITE_URL`

> Todos los secretos actuales están documentados en `/home/reyadmin/senda/supabase/.env`.

---

## 8. Puertos que deben estar abiertos

### En el firewall del servidor (UFW / iptables)

| Puerto | Protocolo | Dirección | Para qué |
|---|---|---|---|
| **22** | TCP | Entrante | SSH (administración) |
| *(ninguno más)* | — | Entrante | Cloudflare Tunnel maneja todo lo demás |

### Salientes (el servidor debe poder conectarse a)

| Destino | Puerto | Protocolo | Para qué |
|---|---|---|---|
| `smtp.office365.com` | **587** | TCP/TLS | Envío de correos del sistema |
| `*.cloudflare.com` | 443, 7844 | TCP/UDP | Cloudflare Tunnel |
| `registry-1.docker.io` | 443 | TCP | Pull de imágenes Docker Hub |
| `ghcr.io`, `quay.io` | 443 | TCP | Imágenes adicionales de Supabase |

---

## 9. Espacio en Disco — Detalle

| Componente | Uso estimado |
|---|---|
| Imágenes Docker (todas las de SENDA) | ~2–3 GB |
| Volumen de base de datos (`senda-db-data`) | ~100 MB inicial, crece con el tiempo |
| Volumen de storage (`senda-storage-data`) | Depende de archivos subidos |
| Logs de Logflare | ~500 MB/mes estimado |
| Repo del código fuente | ~200 MB |
| **Total mínimo recomendado** | **40 GB** (con margen para crecimiento) |

---

## 10. Checklist antes de migrar

```
[ ] El proveedor usa virtualización KVM (no OpenVZ/LXC)
[ ] RAM >= 8 GB disponibles
[ ] Disco >= 40 GB SSD
[ ] Puerto 587 saliente desbloqueado (o coordinado con proveedor)
[ ] Acceso SSH con usuario con permisos docker
[ ] Docker Engine + Compose v2 instalados
[ ] Token de Cloudflare Tunnel actualizado para el nuevo servidor
[ ] Backup de volumen senda-db-data exportado desde servidor actual
[ ] Backup de volumen senda-storage-data exportado desde servidor actual
[ ] Archivo /senda/supabase/.env copiado al nuevo servidor
[ ] Red Docker stamp-net creada: docker network create stamp-net
[ ] DNS de Cloudflare apuntando al nuevo Tunnel
```

---

## 11. Tipos de proveedor recomendados

| Proveedor | Tipo | Virtualización | Notas |
|---|---|---|---|
| **Hetzner Cloud** | VPS/Dedicado | KVM | Excelente relación precio/potencia, datacenter en Europa |
| **DigitalOcean** | VPS (Droplet) | KVM | Fácil de usar, buen soporte Docker |
| **Vultr** | VPS/Bare Metal | KVM | Opciones en Latinoamérica |
| **OVH / OVHcloud** | VPS/Dedicado | KVM | Datacenter en Miami (latencia baja para CR) |
| **Contabo** | VPS/Dedicado | KVM | Mucha RAM por precio, datacenter en USA |

> **Evitar:** proveedores con planes "Linux VPS" muy baratos sin especificar KVM — suelen ser OpenVZ y Docker no funciona correctamente.

