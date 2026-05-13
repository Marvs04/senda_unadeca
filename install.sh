#!/usr/bin/env bash
# ================================================================
# SENDA — Script de instalación y despliegue desde cero
# ================================================================
#
# MODO AGENTE (no-interactivo) — pasar todo como variables de entorno:
#
#   export SENDA_SITE_URL="https://senda.ejemplo.com"
#   export SENDA_API_URL="https://sendasupabaseapi.ejemplo.com"
#   export SENDA_SMTP_USER="correo@dominio.com"
#   export SENDA_SMTP_PASS="contraseña"
#   export SENDA_SMTP_HOST="smtp.office365.com"   # opcional
#   ./install.sh
#
# MODO INTERACTIVO — correr sin variables y el script las pide:
#
#   ./install.sh
#
# Variables opcionales (tienen valores por defecto):
#   SENDA_SMTP_HOST      → smtp.office365.com
#
# Requisitos del servidor:
#   - Ubuntu 22.04/24.04 o Debian 12
#   - Acceso a internet (para descargar imágenes Docker)
#   - Puerto 80 abierto (nginx expone HTTP directamente)
#   - Puerto 587 saliente desbloqueado (SMTP)
#
# El sistema expone el puerto 80. El SSL y el enrutamiento DNS
# quedan a cargo de quien despliega (Cloudflare proxy, Traefik,
# Certbot, IP directa, etc.).
# ================================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Preflight: verificar conflictos antes de hacer nada ──────
preflight_check() {
  local issues=0

  # Contenedores que este instalador va a crear
  local containers=(
    nginx-proxy
    senda-db senda-kong senda-auth senda-rest senda-realtime
    senda-storage senda-imgproxy senda-meta senda-edge-functions
    senda-analytics senda-vector senda-pooler senda-studio
    senda-backend senda-frontend
  )

  local conflicting=()
  for c in "${containers[@]}"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${c}$"; then
      conflicting+=("$c")
    fi
  done

  if [[ ${#conflicting[@]} -gt 0 ]]; then
    warn "Contenedores existentes que entran en conflicto:"
    for c in "${conflicting[@]}"; do
      local status
      status=$(docker inspect --format='{{.State.Status}}' "$c" 2>/dev/null)
      echo -e "    ${YELLOW}•${NC} $c  (${status})"
    done
    echo ""
    if [[ "$INTERACTIVE" == "true" ]]; then
      read -rp "  ¿Detener y eliminar estos contenedores para continuar? (s/N): " ans
      if [[ "$ans" =~ ^[sS]$ ]]; then
        for c in "${conflicting[@]}"; do
          docker rm -f "$c" &>/dev/null && echo -e "    eliminado: $c"
        done
        success "Contenedores conflictivos eliminados."
      else
        error "Instalación cancelada. Elimina los contenedores manualmente y vuelve a correr."
      fi
    else
      warn "Modo no-interactivo: eliminando contenedores conflictivos automáticamente..."
      for c in "${conflicting[@]}"; do
        docker rm -f "$c" &>/dev/null && echo -e "    eliminado: $c"
      done
      success "Contenedores conflictivos eliminados."
    fi
    issues=1
  fi

  # Verificar puerto 80
  if ss -tlnp 2>/dev/null | grep -q ':80 ' || \
     ss -tlnp 2>/dev/null | grep -q ':80\b'; then
    local occupant
    occupant=$(ss -tlnp 2>/dev/null | grep ':80' | awk '{print $NF}' | head -1)
    warn "Puerto 80 en uso: ${occupant}"
    warn "Detén el proceso que usa el puerto 80 antes de continuar."
    warn "Puedes identificarlo con: sudo ss -tlnp | grep :80"
    if [[ "$INTERACTIVE" == "true" ]]; then
      read -rp "  ¿Continuar de todas formas? (s/N): " ans
      [[ "$ans" =~ ^[sS]$ ]] || error "Instalación cancelada."
    else
      error "Puerto 80 ocupado. Libéralo y vuelve a correr el instalador."
    fi
    issues=1
  fi

  [[ $issues -eq 0 ]] && success "Preflight OK — sin conflictos."
}

preflight_check

# ── Detectar modo ────────────────────────────────────────────
# No-interactivo si todas las variables requeridas ya están definidas
INTERACTIVE=true
if [[ -n "${SENDA_SITE_URL:-}" && -n "${SENDA_API_URL:-}" && \
      -n "${SENDA_SMTP_USER:-}" && -n "${SENDA_SMTP_PASS:-}" ]]; then
  INTERACTIVE=false
fi

# ── Banner ───────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        SENDA — Instalación completa      ║${NC}"
if [[ "$INTERACTIVE" == "false" ]]; then
echo -e "${CYAN}║           Modo: no-interactivo           ║${NC}"
fi
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar OS ──────────────────────────────────────────
info "Verificando sistema operativo..."
if ! grep -qiE "ubuntu|debian" /etc/os-release 2>/dev/null; then
  if [[ "$INTERACTIVE" == "true" ]]; then
    warn "Sistema no reconocido. Se recomienda Ubuntu 22.04/24.04 o Debian 12."
    read -rp "¿Continuar de todas formas? (s/N): " ans
    [[ "$ans" =~ ^[sS]$ ]] || error "Instalación cancelada."
  else
    warn "Sistema no reconocido — continuando en modo no-interactivo."
  fi
else
  success "OS verificado."
fi

# ── 2. Instalar Docker ───────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Docker no encontrado. Instalando..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$USER" 2>/dev/null || true
  success "Docker instalado."
else
  success "Docker ya instalado: $(docker --version)"
fi

if ! docker compose version &>/dev/null; then
  error "Docker Compose v2 no disponible. Asegúrate de tener Docker Engine >= 24."
fi

# ── 3. Red Docker ────────────────────────────────────────────
info "Verificando red Docker stamp-net..."
if ! docker network ls --format '{{.Name}}' | grep -q "^stamp-net$"; then
  docker network create stamp-net
  success "Red stamp-net creada."
else
  success "Red stamp-net ya existe."
fi

# ── 4. Generar secretos ──────────────────────────────────────
info "Generando secretos criptográficos..."

jwt_encode() {
  local payload="$1" secret="$2"
  local header_b64 payload_b64 sig
  header_b64=$(printf '%s' '{"alg":"HS256","typ":"JWT"}' | base64 -w0 | tr '+/' '-_' | tr -d '=')
  payload_b64=$(printf '%s' "$payload" | base64 -w0 | tr '+/' '-_' | tr -d '=')
  sig=$(printf '%s' "${header_b64}.${payload_b64}" \
        | openssl dgst -binary -sha256 -hmac "$secret" \
        | base64 -w0 | tr '+/' '-_' | tr -d '=')
  printf '%s' "${header_b64}.${payload_b64}.${sig}"
}

POSTGRES_PASSWORD=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9_-' | head -c 40)
JWT_SECRET=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9_-' | head -c 64)
SECRET_KEY_BASE=$(openssl rand -base64 64 | tr -dc 'A-Za-z0-9_-' | head -c 80)
VAULT_ENC_KEY=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9_-' | head -c 32)
DASHBOARD_PASSWORD=$(openssl rand -base64 16 | tr -dc 'A-Za-z0-9' | head -c 20)
LOGFLARE_PUBLIC_TOKEN=$(openssl rand -hex 40)
LOGFLARE_PRIVATE_TOKEN=$(openssl rand -hex 40)
PG_META_CRYPTO_KEY=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9_-' | head -c 32)
S3_KEY_ID=$(openssl rand -hex 16)
S3_KEY_SECRET=$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9_-' | head -c 40)

NOW=$(date +%s)
EXP=$(( NOW + 315360000 ))  # +10 años

ANON_KEY=$(jwt_encode "{\"role\":\"anon\",\"iss\":\"supabase\",\"iat\":${NOW},\"exp\":${EXP}}" "$JWT_SECRET")
SERVICE_ROLE_KEY=$(jwt_encode "{\"role\":\"service_role\",\"iss\":\"supabase\",\"iat\":${NOW},\"exp\":${EXP}}" "$JWT_SECRET")

success "Secretos generados."

# ── 5. Recopilar configuración ───────────────────────────────
echo ""
if [[ "$INTERACTIVE" == "true" ]]; then
  info "Configuración del sitio (Enter para usar el valor predeterminado)"
  read -rp "  URL del sitio SENDA        [https://senda.rlp.lat]: "       _SITE
  read -rp "  URL de la API de Supabase  [https://sendasupabaseapi.rlp.lat]: " _API
  read -rp "  SMTP usuario (correo): "                                     _SMTP_USER
  read -rsp "  SMTP contraseña: " _SMTP_PASS; echo ""
  read -rp "  SMTP host [smtp.office365.com]: "                            _SMTP_HOST

  SENDA_SITE_URL="${_SITE:-https://senda.rlp.lat}"
  SENDA_API_URL="${_API:-https://sendasupabaseapi.rlp.lat}"
  SENDA_SMTP_USER="${_SMTP_USER:-}"
  SENDA_SMTP_PASS="${_SMTP_PASS:-}"
  SENDA_SMTP_HOST="${_SMTP_HOST:-smtp.office365.com}"
else
  info "Usando configuración de variables de entorno."
  # Aplicar defaults para opcionales
  SENDA_SMTP_HOST="${SENDA_SMTP_HOST:-smtp.office365.com}"
fi

# Validar requeridos
[[ -z "${SENDA_SMTP_USER:-}" ]] && warn "SENDA_SMTP_USER vacío — el envío de correos fallará."
[[ -z "${SENDA_SMTP_PASS:-}" ]] && warn "SENDA_SMTP_PASS vacío — el envío de correos fallará."

info "  Site URL:  ${SENDA_SITE_URL}"
info "  API URL:   ${SENDA_API_URL}"
info "  SMTP host: ${SENDA_SMTP_HOST}"

# ── 6. Escribir supabase/.env ─────────────────────────────────
info "Escribiendo supabase/.env..."
cat > "${REPO_DIR}/supabase/.env" <<ENV
############################################################
# SENDA — Supabase — Generado por install.sh el $(date -u +"%Y-%m-%dT%H:%M:%SZ")
# NO subir este archivo al repositorio
############################################################

POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
JWT_SECRET=${JWT_SECRET}
ANON_KEY=${ANON_KEY}
SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=${DASHBOARD_PASSWORD}
SECRET_KEY_BASE=${SECRET_KEY_BASE}
VAULT_ENC_KEY=${VAULT_ENC_KEY}
LOGFLARE_PUBLIC_ACCESS_TOKEN=${LOGFLARE_PUBLIC_TOKEN}
LOGFLARE_PRIVATE_ACCESS_TOKEN=${LOGFLARE_PRIVATE_TOKEN}
PG_META_CRYPTO_KEY=${PG_META_CRYPTO_KEY}
S3_PROTOCOL_ACCESS_KEY_ID=${S3_KEY_ID}
S3_PROTOCOL_ACCESS_KEY_SECRET=${S3_KEY_SECRET}

POSTGRES_HOST=senda-db
POSTGRES_DB=postgres
POSTGRES_PORT=5432

SITE_URL=${SENDA_SITE_URL}
API_EXTERNAL_URL=${SENDA_API_URL}
SUPABASE_PUBLIC_URL=${SENDA_API_URL}

JWT_EXPIRY=3600
JWT_JWKS=
ANON_KEY_ASYMMETRIC=
SERVICE_ROLE_KEY_ASYMMETRIC=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

SMTP_ADMIN_EMAIL=${SENDA_SMTP_USER}
SMTP_HOST=${SENDA_SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SENDA_SMTP_USER}
SMTP_PASS=${SENDA_SMTP_PASS}
SMTP_SENDER_NAME=SENDA-Lab

ENABLE_EMAIL_SIGNUP=true
ENABLE_EMAIL_AUTOCONFIRM=false
DISABLE_SIGNUP=false
ENABLE_ANONYMOUS_USERS=false
ADDITIONAL_REDIRECT_URLS=

PGRST_DB_SCHEMAS=public,graphql_public
PGRST_DB_MAX_ROWS=1000
PGRST_DB_EXTRA_SEARCH_PATH=public

POOLER_TENANT_ID=senda
POOLER_DEFAULT_POOL_SIZE=20
POOLER_MAX_CLIENT_CONN=100
POOLER_DB_POOL_SIZE=5

GLOBAL_S3_BUCKET=senda-storage
STORAGE_TENANT_ID=senda
REGION=local
IMGPROXY_ENABLE_WEBP_DETECTION=true

FUNCTIONS_VERIFY_JWT=true

STUDIO_DEFAULT_ORGANIZATION=SENDA
STUDIO_DEFAULT_PROJECT=senda
OPENAI_API_KEY=
ENV
success "supabase/.env creado."

# ── 7. Actualizar kong.yml con las nuevas claves ──────────────
info "Actualizando kong.yml con las nuevas JWT keys..."
KONG_FILE="${REPO_DIR}/supabase/volumes/api/kong.yml"
python3 - <<PYEOF
import re
with open('${KONG_FILE}', 'r') as f:
    content = f.read()
content = re.sub(
    r'(consumers:.*?- username: anon\s+keyauth_credentials:\s+- key: )[^\n]+',
    r'\g<1>${ANON_KEY}', content, flags=re.DOTALL)
content = re.sub(
    r'(- username: service_role\s+keyauth_credentials:\s+- key: )[^\n]+',
    r'\g<1>${SERVICE_ROLE_KEY}', content, flags=re.DOTALL)
with open('${KONG_FILE}', 'w') as f:
    f.write(content)
print("kong.yml actualizado")
PYEOF
success "kong.yml actualizado."

# ── 8. Escribir deploy/.env ───────────────────────────────────
info "Escribiendo deploy/.env..."
cat > "${REPO_DIR}/deploy/.env" <<ENV
# SENDA App — Generado por install.sh el $(date -u +"%Y-%m-%dT%H:%M:%SZ")
SITE_URL=${SENDA_SITE_URL}
VITE_SUPABASE_URL=${SENDA_API_URL}
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
SMTP_HOST=${SENDA_SMTP_HOST}
SMTP_PORT=587
SMTP_SENDER_NAME=SENDA-Lab
SMTP_USER=${SENDA_SMTP_USER}
SMTP_PASS=${SENDA_SMTP_PASS}
SMTP_FROM=${SENDA_SMTP_USER}
ENV
success "deploy/.env creado."

# ── 9. Generar .htpasswd para el panel de Studio ─────────────
printf 'admin:%s\n' "$(openssl passwd -apr1 "${DASHBOARD_PASSWORD}")" \
  > "${REPO_DIR}/infra/.htpasswd_senda"
success "infra/.htpasswd_senda creado."

# ── 10. Levantar stacks ───────────────────────────────────────
echo ""
info "Levantando infraestructura (nginx en puerto 80)..."
docker compose -f "${REPO_DIR}/infra/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  -p infra up -d
success "Infra levantada."

echo ""
info "Levantando Supabase (13 contenedores — puede tardar 2-5 min en primer arranque)..."
docker compose -f "${REPO_DIR}/supabase/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  --env-file "${REPO_DIR}/supabase/.env" \
  -p supabase up -d
success "Stack de Supabase iniciado."

# ── 11. Esperar a senda-db ────────────────────────────────────
info "Esperando a que senda-db esté healthy..."
TIMEOUT=180; ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' senda-db 2>/dev/null | grep -q "healthy"; do
  if (( ELAPSED >= TIMEOUT )); then
    error "senda-db no respondió en ${TIMEOUT}s. Diagnóstico: docker logs senda-db"
  fi
  printf "."
  sleep 5; ELAPSED=$(( ELAPSED + 5 ))
done
echo ""
success "senda-db healthy."

# ── 12. Levantar app ──────────────────────────────────────────
echo ""
info "Construyendo y levantando la app (backend + frontend)..."
docker compose -f "${REPO_DIR}/deploy/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  --env-file "${REPO_DIR}/deploy/.env" \
  -p senda up -d --build
success "App levantada."

# ── 13. Resumen ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              SENDA instalado exitosamente            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App:             ${CYAN}${SENDA_SITE_URL}${NC}"
echo -e "  Supabase API:    ${CYAN}${SENDA_API_URL}${NC}"
echo ""
echo -e "  ${YELLOW}Panel Supabase Studio (admin DB):${NC}"
echo -e "    Usuario:    admin"
echo -e "    Contraseña: ${DASHBOARD_PASSWORD}"
echo ""
echo -e "  ${YELLOW}Secretos guardados en (NO subir al repo):${NC}"
echo -e "    supabase/.env"
echo -e "    deploy/.env"
echo -e "    infra/.env"
echo ""
echo -e "  Comandos útiles: ${CYAN}make status${NC}  |  ${CYAN}make logs${NC}  |  ${CYAN}make db-backup${NC}"
echo ""
