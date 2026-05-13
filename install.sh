#!/usr/bin/env bash
# ============================================================
# SENDA — Script de instalación y despliegue desde cero
# Uso: ./install.sh
# Requisitos: Ubuntu 22.04/24.04 o Debian 12, acceso al repo
# ============================================================
set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── Banner ──────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        SENDA — Instalación completa      ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Verificar OS ─────────────────────────────────────────
info "Verificando sistema operativo..."
if ! grep -qiE "ubuntu|debian" /etc/os-release 2>/dev/null; then
  warn "Sistema no reconocido. Se recomienda Ubuntu 22.04/24.04 o Debian 12."
  read -rp "¿Continuar de todas formas? (s/N): " ans
  [[ "$ans" =~ ^[sS]$ ]] || error "Instalación cancelada."
fi

# ── 2. Instalar Docker ──────────────────────────────────────
if ! command -v docker &>/dev/null; then
  info "Docker no encontrado. Instalando..."
  curl -fsSL https://get.docker.com | sh
  usermod -aG docker "$USER"
  success "Docker instalado. Es posible que necesites cerrar sesión y volver a entrar."
else
  success "Docker ya instalado: $(docker --version)"
fi

if ! docker compose version &>/dev/null; then
  error "Docker Compose v2 no disponible. Asegúrate de tener Docker Engine >= 24."
fi

# ── 3. Red Docker ───────────────────────────────────────────
info "Verificando red Docker stamp-net..."
if ! docker network ls --format '{{.Name}}' | grep -q "^stamp-net$"; then
  docker network create stamp-net
  success "Red stamp-net creada."
else
  success "Red stamp-net ya existe."
fi

# ── 4. Generar secretos ─────────────────────────────────────
info "Generando secretos criptográficos..."

# Función para generar JWT HS256 sin dependencias externas
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

# ── 5. Recopilar información del usuario ────────────────────
echo ""
info "Configuración del sitio (Enter para usar el valor predeterminado)"

read -rp "  URL del sitio SENDA        [https://senda.rlp.lat]: "       SITE_URL_INPUT
read -rp "  URL de la API de Supabase  [https://sendasupabaseapi.rlp.lat]: " API_URL_INPUT
read -rp "  Token de Cloudflare Tunnel (requerido): " CF_TOKEN
read -rp "  SMTP usuario (correo): " SMTP_USER
read -rsp "  SMTP contraseña: " SMTP_PASS; echo ""
read -rp "  SMTP host [smtp.office365.com]: " SMTP_HOST_INPUT

SITE_URL="${SITE_URL_INPUT:-https://senda.rlp.lat}"
SUPABASE_PUBLIC_URL="${API_URL_INPUT:-https://sendasupabaseapi.rlp.lat}"
SMTP_HOST="${SMTP_HOST_INPUT:-smtp.office365.com}"

if [[ -z "$CF_TOKEN" ]]; then
  warn "No se proporcionó el token de Cloudflare Tunnel. El servicio de infra no podrá levantarse."
fi

# ── 6. Escribir supabase/.env ───────────────────────────────
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

SITE_URL=${SITE_URL}
API_EXTERNAL_URL=${SUPABASE_PUBLIC_URL}
SUPABASE_PUBLIC_URL=${SUPABASE_PUBLIC_URL}

JWT_EXPIRY=3600
JWT_JWKS=
ANON_KEY_ASYMMETRIC=
SERVICE_ROLE_KEY_ASYMMETRIC=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

SMTP_ADMIN_EMAIL=${SMTP_USER}
SMTP_HOST=${SMTP_HOST}
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
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

# ── 7. Actualizar kong.yml con las nuevas claves ────────────
info "Actualizando kong.yml con las nuevas JWT keys..."
KONG_FILE="${REPO_DIR}/supabase/volumes/api/kong.yml"
# Reemplazar las credenciales de los consumidores anon y service_role
python3 - <<PYEOF
import re

with open('${KONG_FILE}', 'r') as f:
    content = f.read()

# Reemplazar anon key
content = re.sub(
    r'(consumers:.*?- username: anon\s+keyauth_credentials:\s+- key: )[^\n]+',
    r'\g<1>${ANON_KEY}',
    content, flags=re.DOTALL
)
# Reemplazar service_role key
content = re.sub(
    r'(- username: service_role\s+keyauth_credentials:\s+- key: )[^\n]+',
    r'\g<1>${SERVICE_ROLE_KEY}',
    content, flags=re.DOTALL
)

with open('${KONG_FILE}', 'w') as f:
    f.write(content)
print("kong.yml actualizado")
PYEOF
success "kong.yml actualizado."

# ── 8. Escribir deploy/.env ─────────────────────────────────
info "Escribiendo deploy/.env..."
cat > "${REPO_DIR}/deploy/.env" <<ENV
# SENDA App — Generado por install.sh el $(date -u +"%Y-%m-%dT%H:%M:%SZ")
SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
SMTP_FROM=${SMTP_USER}
ENV
success "deploy/.env creado."

# ── 9. Escribir infra/.env y .htpasswd ─────────────────────
info "Escribiendo infra/.env..."
cat > "${REPO_DIR}/infra/.env" <<ENV
CF_TUNNEL_TOKEN=${CF_TOKEN}
ENV

# Generar .htpasswd_senda para el panel de Studio
if command -v htpasswd &>/dev/null; then
  htpasswd -nb admin "${DASHBOARD_PASSWORD}" > "${REPO_DIR}/infra/.htpasswd_senda"
  success "infra/.htpasswd_senda generado."
else
  # Generar formato htpasswd manualmente (apr1 md5)
  python3 -c "
import hashlib, base64, os, sys
pwd = '${DASHBOARD_PASSWORD}'.encode()
salt = os.urandom(8)
salt_b64 = base64.b64encode(salt).decode()[:8]
# SHA-1 básico (compatible con nginx)
import crypt
h = crypt.crypt('${DASHBOARD_PASSWORD}', '\$apr1\$' + salt_b64)
print('admin:' + h)
" > "${REPO_DIR}/infra/.htpasswd_senda" 2>/dev/null || \
  printf 'admin:%s\n' "$(openssl passwd -apr1 "${DASHBOARD_PASSWORD}")" > "${REPO_DIR}/infra/.htpasswd_senda"
  success "infra/.htpasswd_senda generado."
fi

# ── 10. Levantar stacks ─────────────────────────────────────
echo ""
info "Levantando stack de infraestructura (nginx + Cloudflare Tunnel)..."
docker compose -f "${REPO_DIR}/infra/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  --env-file "${REPO_DIR}/infra/.env" \
  -p infra up -d
success "Infra levantada."

echo ""
info "Levantando stack de Supabase (13 contenedores)..."
info "Esto puede tardar 2-5 minutos la primera vez (descarga de imágenes)..."
docker compose -f "${REPO_DIR}/supabase/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  --env-file "${REPO_DIR}/supabase/.env" \
  -p supabase up -d
success "Stack de Supabase iniciado."

# ── 11. Esperar a senda-db ──────────────────────────────────
info "Esperando a que senda-db esté healthy..."
TIMEOUT=120; ELAPSED=0
until docker inspect --format='{{.State.Health.Status}}' senda-db 2>/dev/null | grep -q "healthy"; do
  if (( ELAPSED >= TIMEOUT )); then
    error "senda-db no levantó en ${TIMEOUT}s. Revisa: docker logs senda-db"
  fi
  printf "."
  sleep 3; ELAPSED=$(( ELAPSED + 3 ))
done
echo ""
success "senda-db healthy."

# ── 12. Levantar app ────────────────────────────────────────
echo ""
info "Construyendo y levantando la app de SENDA (backend + frontend)..."
docker compose -f "${REPO_DIR}/deploy/docker-compose.yml" \
  --project-directory "${REPO_DIR}" \
  --env-file "${REPO_DIR}/deploy/.env" \
  -p senda up -d --build
success "App levantada."

# ── 13. Resumen final ───────────────────────────────────────
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              SENDA instalado exitosamente            ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  App:              ${CYAN}${SITE_URL}${NC}"
echo -e "  Supabase Studio:  ${CYAN}${SITE_URL/senda/sendasupabase}${NC}"
echo -e "  Supabase API:     ${CYAN}${SUPABASE_PUBLIC_URL}${NC}"
echo ""
echo -e "  ${YELLOW}Credenciales del panel de Supabase Studio:${NC}"
echo -e "    Usuario:    admin"
echo -e "    Contraseña: ${DASHBOARD_PASSWORD}"
echo ""
echo -e "  ${YELLOW}Los secretos completos están en:${NC}"
echo -e "    supabase/.env  (NO subir al repo)"
echo -e "    deploy/.env    (NO subir al repo)"
echo ""
echo -e "  Para ver el estado: ${CYAN}make status${NC}"
echo -e "  Para ver logs:      ${CYAN}make logs${NC}"
echo ""
