"""
SENDA — Diagramas Académicos para Documento de Grado
Versión mejorada: resolución 300 DPI, tipografía refinada, composición académica.
"""

import os
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Ellipse
import matplotlib.patheffects as pe
import numpy as np

matplotlib.rcParams['font.family'] = 'DejaVu Sans'
matplotlib.rcParams['figure.dpi'] = 300
matplotlib.rcParams['savefig.dpi'] = 300

OUTPUT_DIR = '/home/claude/imagenes'
os.makedirs(OUTPUT_DIR, exist_ok=True)

def save(fig, name):
    path = os.path.join(OUTPUT_DIR, name)
    fig.savefig(path, bbox_inches='tight', facecolor='white', dpi=300)
    print(f'✅  Guardado: {path}')
    plt.close(fig)

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 1 — MATRIZ FODA
# ─────────────────────────────────────────────────────────────────────────────
NAVY      = '#1A237E'
DARK_GRAY = '#37474F'
FOOTER    = '#9E9E9E'

fortalezas = [
    'F1. Arquitectura moderna (React 19, Node.js, PostgreSQL)',
    'F2. RBAC con 5 niveles de acceso diferenciados',
    'F3. Actualización en tiempo real vía WebSockets',
    'F4. Nómina automática + cuentas por cobrar integradas',
    'F5. Historial de auditoría completo por registro',
    'F6. Módulo de quiosco para marcación presencial',
]
debilidades = [
    'D1. Requiere conectividad a internet constante',
    'D2. Curva de aprendizaje para usuarios no digitalizados',
    'D3. Sin aplicación móvil nativa para quiosco',
    'D4. Configuración inicial de cuentas contables',
    '      requiere personal especializado',
]
oportunidades = [
    'O1. Extensión a otras instituciones educativas adventistas',
    'O2. Integración futura con nómina institucional existente',
    'O3. Adopción de app móvil para el módulo de quiosco',
    'O4. Analítica avanzada en reportes gerenciales',
    'O5. Exportación a estándares contables nacionales',
]
amenazas = [
    'A1. Cambios regulatorios en políticas de UNADECA',
    'A2. Resistencia al cambio del personal administrativo',
    'A3. Interrupciones del servicio en la nube (Supabase)',
    'A4. Vulnerabilidades de seguridad en dependencias',
    'A5. Pérdida de datos por falla de conectividad',
]

quads = [
    ('#1B5E20', '#E8F5E9', '#A5D6A7', fortalezas,    'FORTALEZAS',    'Origen interno · Aspecto positivo'),
    ('#B71C1C', '#FFEBEE', '#EF9A9A', debilidades,   'DEBILIDADES',   'Origen interno · Aspecto negativo'),
    ('#0D47A1', '#E3F2FD', '#90CAF9', oportunidades, 'OPORTUNIDADES', 'Origen externo · Aspecto positivo'),
    ('#E65100', '#FFF3E0', '#FFCC80', amenazas,       'AMENAZAS',      'Origen externo · Aspecto negativo'),
]

fig = plt.figure(figsize=(16, 12))
fig.patch.set_facecolor('#F5F5F5')

# Título superior
title_ax = fig.add_axes([0.0, 0.92, 1.0, 0.08])
title_ax.set_xlim(0, 1); title_ax.set_ylim(0, 1); title_ax.axis('off')
title_ax.add_patch(FancyBboxPatch((0, 0), 1, 1, boxstyle='square,pad=0', fc=NAVY, ec='none'))
title_ax.text(0.5, 0.65, 'ANÁLISIS FODA — SISTEMA SENDA',
    ha='center', va='center', fontsize=16, fontweight='bold', color='white')
title_ax.text(0.5, 0.20, 'Universidad Adventista de Centro América (UNADECA) · 2026',
    ha='center', va='center', fontsize=10, color='#B0BEC5')

# Etiquetas de ejes
label_ax = fig.add_axes([0.0, 0.04, 1.0, 0.88])
label_ax.set_xlim(0, 1); label_ax.set_ylim(0, 1); label_ax.axis('off')
for xc, txt in [(0.28, 'POSITIVO'), (0.74, 'NEGATIVO')]:
    label_ax.text(xc, 0.978, txt, ha='center', va='top',
        fontsize=11, fontweight='bold', color=DARK_GRAY, alpha=0.40)
for yc, txt in [(0.76, 'INTERNO'), (0.28, 'EXTERNO')]:
    label_ax.text(0.008, yc, txt, ha='left', va='center',
        fontsize=10, fontweight='bold', color=DARK_GRAY, alpha=0.40, rotation=90)

label_ax.plot([0.5, 0.5], [0.02, 0.98], color=DARK_GRAY, lw=2, alpha=0.25)
label_ax.plot([0.015, 0.99], [0.515, 0.515], color=DARK_GRAY, lw=2, alpha=0.25)

positions = [
    (0.02, 0.525, 0.475, 0.44),
    (0.515, 0.525, 0.475, 0.44),
    (0.02, 0.055, 0.475, 0.44),
    (0.515, 0.055, 0.475, 0.44),
]

for (lx, ly, lw_ax, lh_ax), (hc, bg, accent, items, title, subtitle) in zip(positions, quads):
    q_ax = fig.add_axes([lx, ly, lw_ax, lh_ax])
    q_ax.set_xlim(0, 1); q_ax.set_ylim(0, 1); q_ax.axis('off')
    q_ax.set_facecolor(bg)
    q_ax.add_patch(FancyBboxPatch((0.005, 0.005), 0.99, 0.99,
        boxstyle='round,pad=0.01', fc='none', ec=hc, lw=2.0))
    q_ax.add_patch(mpatches.Rectangle((0, 0.82), 1, 0.18, fc=hc, ec='none'))
    q_ax.add_patch(mpatches.Rectangle((0, 0), 0.025, 0.82, fc=accent, ec='none', alpha=0.6))
    q_ax.text(0.5, 0.915, title, ha='center', va='center',
        fontsize=10, fontweight='bold', color='white')
    q_ax.text(0.5, 0.845, subtitle, ha='center', va='center',
        fontsize=7.5, color='white', alpha=0.85)
    y_pos = 0.775
    for item in items:
        q_ax.add_patch(mpatches.Circle((0.048, y_pos + 0.007), 0.012,
            fc=hc, ec='none', alpha=0.8))
        q_ax.text(0.068, y_pos, item, ha='left', va='center',
            fontsize=8.0, color='#212121')
        y_pos -= 0.135

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')

save(fig, '1_foda.png')
print("Diagrama 1 (FODA) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 2 — ARQUITECTURA DEL SISTEMA (3 CAPAS)
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'

fig, ax = plt.subplots(figsize=(18, 12))
ax.set_xlim(0, 18); ax.set_ylim(0, 12); ax.axis('off')
ax.set_facecolor('#F5F5F5'); fig.patch.set_facecolor('#F5F5F5')

def layer_band(ax, y_bot, height, fc, ec, label, sublabel):
    ax.add_patch(FancyBboxPatch((0.35, y_bot), 17.3, height,
        boxstyle='round,pad=0.12', fc=fc, ec=ec, lw=2.0, zorder=1))
    ax.add_patch(mpatches.Rectangle((0.35, y_bot + height - 0.58), 17.3, 0.58,
        fc=ec, ec='none', zorder=2))
    ax.text(9.0, y_bot + height - 0.27, label,
        ha='center', va='center', fontsize=11, fontweight='bold', color='white', zorder=3)
    ax.text(9.0, y_bot + height - 0.51, sublabel,
        ha='center', va='center', fontsize=7.5, color='white', alpha=0.85, zorder=3)

def comp_box(ax, x, y, w, h, title, tech, fc, ec):
    ax.add_patch(FancyBboxPatch((x, y), w, h,
        boxstyle='round,pad=0.06', fc=fc, ec=ec, lw=1.8, zorder=4,
        path_effects=[pe.withSimplePatchShadow(offset=(2, -2),
            shadow_rgbFace='#90A4AE', alpha=0.4)]))
    ax.text(x + w/2, y + h*0.62, title,
        ha='center', va='center', fontsize=8.0, fontweight='bold', color='#212121', zorder=5)
    ax.add_patch(FancyBboxPatch((x + w*0.1, y + 0.06), w*0.8, 0.28,
        boxstyle='round,pad=0.03', fc=ec, ec='none', alpha=0.22, zorder=5))
    ax.text(x + w/2, y + 0.20, tech,
        ha='center', va='center', fontsize=6.5, color=ec, fontweight='bold', zorder=6)

def arrow_v(ax, x, y_top, y_bot, label_up, label_dn, color):
    ax.annotate('', xy=(x, y_bot + 0.05), xytext=(x, y_top - 0.05),
        arrowprops=dict(arrowstyle='->', color=color, lw=2.0))
    ax.annotate('', xy=(x, y_top - 0.05), xytext=(x, y_bot + 0.05),
        arrowprops=dict(arrowstyle='->', color=color, lw=2.0))
    ax.text(x + 0.22, (y_top + y_bot) / 2 + 0.12, label_up,
        ha='left', va='center', fontsize=7.5, color=color, fontweight='bold')
    ax.text(x + 0.22, (y_top + y_bot) / 2 - 0.22, label_dn,
        ha='left', va='center', fontsize=7.0, color=color, style='italic')

ax.add_patch(mpatches.Rectangle((0, 11.35), 18, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(9.0, 11.67, 'ARQUITECTURA DEL SISTEMA — SENDA',
    ha='center', va='center', fontsize=14, fontweight='bold', color='white', zorder=1)
ax.text(9.0, 11.40, 'Patrón de 3 capas: Presentación · Lógica de Negocio · Datos',
    ha='center', va='center', fontsize=8.5, color='#B0BEC5', zorder=1)

# Capa 1
layer_band(ax, 8.45, 2.65, '#E8EAF6', '#3949AB',
    'CAPA 1  —  PRESENTACIÓN  (SPA)',
    'React 19 · TypeScript · Vite · Tailwind CSS  |  Desplegada en Vercel / Netlify')

portals = [
    ('Portal\nEstudiante',     'React', '#C5CAE9', '#3949AB', 0.55),
    ('Portal\nJefe Dpto.',      'React', '#C5CAE9', '#3949AB', 3.25),
    ('Portal\nAdministrador',  'React', '#C5CAE9', '#3949AB', 5.95),
    ('Portal\nSuperAdmin',     'React', '#C5CAE9', '#3949AB', 8.65),
    ('Portal\nContabilidad',   'React', '#C5CAE9', '#3949AB', 11.35),
    ('Módulo\nQuiosco',        'React', '#B39DDB', '#512DA8', 14.05),
]
for title, tech, fc, ec, px in portals:
    comp_box(ax, px, 8.80, 2.5, 1.90, title, tech, fc, ec)

# Capa 2
layer_band(ax, 4.30, 3.80, '#F3E5F5', '#7B1FA2',
    'CAPA 2  —  LÓGICA DE NEGOCIO  (API REST)',
    'Node.js 20 LTS · Express 4 · ESM  |  Desplegada en Railway / Render')

features = [
    ('auth',        'JWT\nrequireAuth',    '#CE93D8', '#7B1FA2'),
    ('users',       'RBAC\n5 roles',       '#CE93D8', '#7B1FA2'),
    ('departments', 'CRUD\nDeptos.',       '#CE93D8', '#7B1FA2'),
    ('rates',       'Tarifa\nHora',        '#CE93D8', '#7B1FA2'),
    ('work_logs',   'Registro\nHoras',     '#F48FB1', '#880E4F'),
    ('kiosk',       'Sesión\nQuiosco',     '#F48FB1', '#880E4F'),
    ('reports',     'PDF / CSV\nNómina',   '#FFCC80', '#E65100'),
    ('accounting',  'Config.\nContable',   '#80DEEA', '#00838F'),
]
fw = 1.90; gap = 0.25; fx0 = 0.55
for i, (name, tech, fc, ec) in enumerate(features):
    comp_box(ax, fx0 + i*(fw+gap), 4.65, fw, 1.85, name, tech, fc, ec)

ax.add_patch(FancyBboxPatch((0.55, 6.70), 17.1, 0.38,
    boxstyle='round,pad=0.04', fc='#EDE7F6', ec='#7B1FA2', lw=1.0, alpha=0.7, zorder=3))
ax.text(9.0, 6.89,
    'Middleware: requireAuth  →  getRequesterProfile  →  Feature Router  →  Error Handler',
    ha='center', va='center', fontsize=8, color='#4A148C', style='italic', zorder=4)

# Capa 3
layer_band(ax, 0.50, 3.50, '#E8F5E9', '#2E7D32',
    'CAPA 3  —  DATOS  (Supabase Cloud)',
    'PostgreSQL 15 · Auth · Realtime · Row Level Security (RLS)  |  Supabase Cloud')

db_comps = [
    ('PostgreSQL\nTablas principales',
     'profiles · departments\nwork_logs · rates',                   '#A5D6A7', '#2E7D32', 0.55, 4.1),
    ('PostgreSQL\nTablas quiosco / contabilidad',
     'kiosk_state · kiosk_sessions\naccounting_config · receivables','#A5D6A7', '#2E7D32', 5.35, 4.1),
    ('Supabase\nAuth',
     'JWT · signIn\ngetUser · RLS ctx',                             '#80CBC4', '#00695C', 10.15, 3.3),
    ('Supabase\nRealtime',
     'WebSockets\nLISTEN / NOTIFY',                                 '#80CBC4', '#00695C', 13.30, 3.3),
    ('Row Level\nSecurity',
     'Políticas por rol\npor tabla',                                '#C8E6C9', '#388E3C', 16.00, 2.8),
]
for title, tech, fc, ec, px, pw in db_comps:
    comp_box(ax, px, 0.85, pw, 2.35, title, tech, fc, ec)

arrow_v(ax, 9.0, 8.45, 8.10, '  HTTPS + JWT Bearer', '  Token en localStorage', '#3949AB')
arrow_v(ax, 9.0, 4.30, 3.95, '  supabase-js (service role)', '  SQL / RLS bypass', '#2E7D32')

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 2. Diagrama de Arquitectura del Sistema — SENDA (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8, color='#212121')

save(fig, '2_arquitectura.png')
print("Diagrama 2 (Arquitectura) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 3 — CASOS DE USO
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'

fig, ax = plt.subplots(figsize=(24, 15))
ax.set_xlim(0, 24); ax.set_ylim(0, 15); ax.axis('off')
ax.set_facecolor('#FAFAFA'); fig.patch.set_facecolor('#FAFAFA')

ax.add_patch(mpatches.Rectangle((0, 14.35), 24, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(12.0, 14.67, 'DIAGRAMA DE CASOS DE USO — SISTEMA SENDA',
    ha='center', va='center', fontsize=14, fontweight='bold', color='white', zorder=1)
ax.text(12.0, 14.40, 'Documento de Trabajo de Graduación · UNADECA 2026',
    ha='center', va='center', fontsize=8.5, color='#B0BEC5', zorder=1)

ax.add_patch(FancyBboxPatch((3.6, 0.6), 19.8, 13.5,
    boxstyle='round,pad=0.15', fc='white', ec='#37474F', lw=2.5, ls='--', zorder=1))
ax.text(13.5, 14.0,
    '«sistema»  SENDA — Sistema Estratégico de Navegación y Desempeño Asistencial',
    ha='center', va='center', fontsize=9.5, style='italic',
    color='#263238', fontweight='bold', zorder=2)

group_bands = [
    (3.8,  0.7, 4.6,  13.1, '#F3F8FF', '#1565C0', 'BÁSICOS\n& QUIOSCO'),
    (8.6,  0.7, 4.6,  13.1, '#F5FFF5', '#2E7D32', 'APROBACIÓN'),
    (13.4, 0.7, 4.8,  13.1, '#FFF8F0', '#BF360C', 'ADMINISTRACIÓN'),
    (18.4, 0.7, 4.8,  13.1, '#FDF5FF', '#6A1B9A', 'CONTABILIDAD'),
]
for gx, gy, gw, gh, gfc, gec, glabel in group_bands:
    ax.add_patch(FancyBboxPatch((gx, gy), gw, gh,
        boxstyle='round,pad=0.08', fc=gfc, ec=gec, lw=1.2, alpha=0.6, zorder=1))
    ax.text(gx + gw/2, gy + gh - 0.22, glabel,
        ha='center', va='center', fontsize=8, fontweight='bold', color=gec,
        alpha=0.5, multialignment='center', zorder=2)

def draw_actor(ax, cx, cy, label, c='#1565C0'):
    ax.add_patch(mpatches.Circle((cx, cy + 0.78), 0.22,
        fc='#ECEFF1', ec=c, lw=2.0, zorder=5))
    ax.plot([cx, cx], [cy+0.55, cy+0.05], color=c, lw=2.0, zorder=5)
    ax.plot([cx-0.38, cx+0.38], [cy+0.35, cy+0.35], color=c, lw=2.0, zorder=5)
    ax.plot([cx, cx-0.30], [cy+0.05, cy-0.48], color=c, lw=2.0, zorder=5)
    ax.plot([cx, cx+0.30], [cy+0.05, cy-0.48], color=c, lw=2.0, zorder=5)
    bg_w, bg_h = max(len(label)*0.095, 1.0), 0.30
    ax.add_patch(FancyBboxPatch((cx - bg_w/2, cy - 0.85), bg_w, bg_h,
        boxstyle='round,pad=0.04', fc=c, ec='none', alpha=0.15, zorder=4))
    ax.text(cx, cy - 0.70, label, ha='center', va='center',
        fontsize=8.5, fontweight='bold', color=c, multialignment='center', zorder=6)

def draw_uc(ax, cx, cy, uid, label, bg='#FFFDE7', bc='#F57F17'):
    ax.add_patch(Ellipse((cx, cy), width=3.9, height=1.45,
        fc=bg, ec=bc, lw=1.8, zorder=3,
        path_effects=[pe.withSimplePatchShadow(offset=(2, -2),
            shadow_rgbFace='#B0BEC5', alpha=0.25)]))
    ax.text(cx, cy + 0.28, uid,
        ha='center', va='center', fontsize=7, fontweight='bold', color=bc, zorder=4)
    ax.text(cx, cy - 0.15, label,
        ha='center', va='center', fontsize=8, color='#212121',
        multialignment='center', zorder=4)

actors_cfg = [
    (1.8, 12.8, 'ESTUDIANTE',      '#0D47A1'),
    (1.8, 10.2, 'JEFE DE\nDEPTO.', '#1B5E20'),
    (1.8,  7.5, 'ADMINISTRADOR',   '#4A148C'),
    (1.8,  4.8, 'SUPER\nADMIN',    '#BF360C'),
    (1.8,  2.1, 'CONTA-\nBILIDAD', '#880E4F'),
]
for cx, cy, label, color in actors_cfg:
    draw_actor(ax, cx, cy, label, c=color)

uc_defs = [
    ('UC-01', 'Iniciar\nSesión',          6.0, 13.0, '#DCEEFB', '#0D47A1'),
    ('UC-02', 'Cerrar\nSesión',           6.0, 11.3, '#DCEEFB', '#0D47A1'),
    ('UC-03', 'Registrar Horas\n(Timer)', 6.0,  9.5, '#DCEEFB', '#0D47A1'),
    ('UC-04', 'Ver Historial\nde Horas',  6.0,  7.7, '#DCEEFB', '#0D47A1'),
    ('UC-05', 'Clock-In\nQuiosco',        6.0,  5.8, '#DCEEFB', '#0D47A1'),
    ('UC-06', 'Clock-Out\nQuiosco',       6.0,  3.9, '#DCEEFB', '#0D47A1'),
    ('UC-07', 'Aprobar\nRegistro',        10.8, 13.0, '#D6EFD6', '#2E7D32'),
    ('UC-08', 'Rechazar\nRegistro',       10.8, 11.2, '#D6EFD6', '#2E7D32'),
    ('UC-09', 'Aprobar\nMasivo',          10.8,  9.2, '#D6EFD6', '#2E7D32'),
    ('UC-10', 'Activar / Desactivar\nQuiosco', 10.8, 7.2, '#D6EFD6', '#2E7D32'),
    ('UC-11', 'Gestionar\nUsuarios',      15.6, 13.0, '#F8E8D6', '#BF360C'),
    ('UC-12', 'Gestionar\nDeptos.',       15.6, 11.2, '#F8E8D6', '#BF360C'),
    ('UC-13', 'Actualizar\nTarifa',       15.6,  9.2, '#F8E8D6', '#BF360C'),
    ('UC-17', 'Resetear\nContraseñas',    15.6,  7.2, '#F8E8D6', '#BF360C'),
    ('UC-14', 'Generar\nNómina',          20.6, 13.0, '#EDE0F5', '#6A1B9A'),
    ('UC-15', 'Cuentas\npor Cobrar',      20.6, 11.2, '#EDE0F5', '#6A1B9A'),
    ('UC-16', 'Exportar\nCSV / PDF',      20.6,  9.2, '#FFF3E0', '#E65100'),
]
uc_pos = {}
for uid, ulabel, cx, cy, bg, bc in uc_defs:
    draw_uc(ax, cx, cy, uid, ulabel, bg=bg, bc=bc)
    uc_pos[uid] = (cx, cy)

assoc = [
    (0, ['UC-01','UC-02','UC-03','UC-04','UC-05','UC-06','UC-16'], '#0D47A1'),
    (1, ['UC-01','UC-02','UC-07','UC-08','UC-09','UC-10','UC-16'], '#1B5E20'),
    (2, ['UC-01','UC-02','UC-11','UC-12','UC-13'],                 '#4A148C'),
    (3, ['UC-01','UC-11','UC-17'],                                 '#BF360C'),
    (4, ['UC-01','UC-02','UC-14','UC-15','UC-16'],                 '#880E4F'),
]
for i, ucs, color in assoc:
    ax_x = actors_cfg[i][0] + 0.40
    ax_y = actors_cfg[i][1] + 0.08
    for uid in ucs:
        ux, uy = uc_pos[uid]
        ax.plot([ax_x, ux - 1.96], [ax_y, uy],
            color=color, lw=0.9, alpha=0.35, zorder=2)

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 3. Diagrama de Casos de Uso — Sistema SENDA (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8)

save(fig, '3_casos_de_uso.png')
print("Diagrama 3 (Casos de Uso) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 4 — ESTADOS WORKLOG
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'

fig, ax = plt.subplots(figsize=(18, 9))
ax.set_xlim(0, 18); ax.set_ylim(0, 9); ax.axis('off')
ax.set_facecolor('#FAFAFA'); fig.patch.set_facecolor('#FAFAFA')

ax.add_patch(mpatches.Rectangle((0, 8.35), 18, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(9.0, 8.67, 'DIAGRAMA DE ESTADOS — CICLO DE VIDA DEL REGISTRO DE HORAS (WorkLog)',
    ha='center', va='center', fontsize=13, fontweight='bold', color='white', zorder=1)
ax.text(9.0, 8.40, 'Sistema SENDA · UNADECA 2026',
    ha='center', va='center', fontsize=8, color='#B0BEC5', zorder=1)

def state_box(ax, cx, cy, name, stereotype, desc, fc, ec):
    w, h = 3.6, 2.0
    ax.add_patch(FancyBboxPatch((cx - w/2, cy - h/2), w, h,
        boxstyle='round,pad=0.15', fc=fc, ec=ec, lw=2.5, zorder=3,
        path_effects=[pe.withSimplePatchShadow(offset=(3, -3),
            shadow_rgbFace='#90A4AE', alpha=0.35)]))
    ax.add_patch(mpatches.Rectangle((cx - w/2, cy + h/2 - 0.55), w, 0.55,
        fc=ec, ec='none', zorder=4))
    ax.text(cx, cy + h/2 - 0.27, name,
        ha='center', va='center', fontsize=11.5, fontweight='bold', color='white', zorder=5)
    ax.plot([cx - w/2, cx + w/2], [cy + h/2 - 0.55, cy + h/2 - 0.55],
        color=ec, lw=1.0, zorder=4)
    ax.text(cx, cy + 0.1, stereotype,
        ha='center', va='center', fontsize=7.5, color=ec, style='italic', zorder=5)
    ax.text(cx, cy - 0.38, desc,
        ha='center', va='center', fontsize=8, color='#424242',
        multialignment='center', zorder=5)
    return {'left': cx - w/2, 'right': cx + w/2, 'top': cy + h/2, 'bottom': cy - h/2,
            'cx': cx, 'cy': cy}

def transition(ax, x1, y1, x2, y2, label, guard, color, rad=0.0):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
        arrowprops=dict(arrowstyle='->', color=color, lw=2.0,
            connectionstyle=f'arc3,rad={rad}'))
    mx, my = (x1+x2)/2, (y1+y2)/2
    ax.text(mx, my + 0.22, label,
        ha='center', va='bottom', fontsize=8.5, fontweight='bold', color=color)
    if guard:
        ax.text(mx, my - 0.02, f'[{guard}]',
            ha='center', va='bottom', fontsize=7.5, color=color, style='italic')

# Pseudoestado inicial
ax.add_patch(mpatches.Circle((1.5, 4.5), 0.28, fc='#212121', ec='#212121', zorder=5))
ax.annotate('', xy=(2.7, 4.5), xytext=(1.80, 4.5),
    arrowprops=dict(arrowstyle='->', color='#212121', lw=2.0))
ax.text(2.10, 4.75, 'crear()', fontsize=7.5, color='#555', style='italic',
    ha='center', va='bottom')

S = {}
S['PENDING']   = state_box(ax,  4.5, 4.5, 'PENDING',   '«estado inicial»',
    'Registro creado.\nEsperando revisión\ndel Jefe de Depto.',
    '#FFF9C4', '#F57F17')
S['APPROVED']  = state_box(ax,  9.5, 6.5, 'APPROVED',  '«aprobado»',
    'Horas validadas.\nListo para ser\nprocesado en nómina.',
    '#C8E6C9', '#2E7D32')
S['REJECTED']  = state_box(ax,  9.5, 2.5, 'REJECTED',  '«rechazado»',
    'Registro no válido.\nEl estudiante puede\nreenviarlo corregido.',
    '#FFCDD2', '#C62828')
S['PROCESSED'] = state_box(ax, 14.7, 6.5, 'PROCESSED', '«procesado»',
    'Incluido en nómina.\nRegistro cerrado,\nno modificable.',
    '#BBDEFB', '#0D47A1')

transition(ax, 6.30, 5.20, 7.70, 6.10, 'aprobar()',  'role == DEPT_HEAD',    '#2E7D32', rad=-0.1)
transition(ax, 6.30, 3.80, 7.70, 2.90, 'rechazar()', 'role == DEPT_HEAD',    '#C62828', rad=0.1)
transition(ax, 11.30, 6.50, 12.90, 6.50, 'procesar()', 'role == ACCOUNTING', '#0D47A1', rad=0.0)

ax.annotate('', xy=(4.5, 3.50), xytext=(7.70, 2.10),
    arrowprops=dict(arrowstyle='->', color='#78909C', lw=1.8,
        connectionstyle='arc3,rad=0.35'))
ax.text(5.5, 2.0, 'reenviar()',
    ha='center', va='top', fontsize=8.5, fontweight='bold', color='#78909C')
ax.text(5.5, 1.72, '[estudiante corrige]',
    ha='center', va='top', fontsize=7.5, color='#78909C', style='italic')

# Pseudoestado final
ax.add_patch(mpatches.Circle((16.75, 6.50), 0.30, fc='#212121', ec='#212121', zorder=5))
ax.add_patch(mpatches.Circle((16.75, 6.50), 0.44, fc='none', ec='#212121', lw=2.2, zorder=4))
ax.annotate('', xy=(16.44, 6.50), xytext=(16.50, 6.50),
    arrowprops=dict(arrowstyle='->', color='#212121', lw=1.5))

# Leyenda
legend_x, legend_y = 0.4, 1.5
ax.add_patch(FancyBboxPatch((legend_x, legend_y), 3.2, 1.7,
    boxstyle='round,pad=0.08', fc='#ECEFF1', ec='#78909C', lw=1.2, alpha=0.8, zorder=3))
ax.text(legend_x + 1.6, legend_y + 1.50, 'Convenciones UML',
    ha='center', va='center', fontsize=8, fontweight='bold', color='#37474F')
legend_items = [
    ('● Pseudoestado inicial', '#212121'),
    ('⊙ Pseudoestado final',   '#212121'),
    ('[guard] condición',       '#546E7A'),
    ('evento()  disparador',    '#37474F'),
]
for j, (txt, col) in enumerate(legend_items):
    ax.text(legend_x + 0.15, legend_y + 1.22 - j*0.32, txt,
        ha='left', va='center', fontsize=7.5, color=col)

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 4. Diagrama de Estados — Ciclo de Vida del WorkLog (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8)

save(fig, '4_estados_worklog.png')
print("Diagrama 4 (Estados WorkLog) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 5 — ENTIDAD-RELACIÓN
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'
ROW_H  = 0.34

def er_entity(ax, x, y, title, pk, fields, hc, bg, w=4.6):
    n_rows  = 1 + len(fields)
    total_h = ROW_H * (n_rows + 1.2)
    bottom  = y - total_h
    ax.add_patch(FancyBboxPatch((x+0.10, bottom-0.10), w, total_h,
        boxstyle='round,pad=0.04', fc='#90A4AE', ec='none', alpha=0.25, zorder=1))
    ax.add_patch(FancyBboxPatch((x, bottom), w, total_h,
        boxstyle='round,pad=0.04', fc=bg, ec=hc, lw=2.2, zorder=2))
    hdr_h = ROW_H * 1.2
    ax.add_patch(mpatches.Rectangle((x, y - hdr_h), w, hdr_h,
        fc=hc, ec='none', zorder=3))
    ax.text(x + w/2, y - hdr_h/2, title,
        ha='center', va='center', fontsize=9, fontweight='bold', color='white', zorder=4)
    pk_y = y - hdr_h - ROW_H
    ax.plot([x + 0.08, x + w - 0.08], [pk_y + ROW_H, pk_y + ROW_H],
        color=hc, lw=0.5, alpha=0.5, zorder=3)
    ax.text(x + 0.15, pk_y + ROW_H*0.5, f'PK  {pk}',
        ha='left', va='center', fontsize=7, fontweight='bold', color='#4E342E', zorder=4)
    for i, (fname, ftype, is_fk) in enumerate(fields):
        ry = pk_y - (i + 1) * ROW_H
        ax.plot([x + 0.08, x + w - 0.08], [ry + ROW_H, ry + ROW_H],
            color=hc, lw=0.4, alpha=0.3, zorder=3)
        prefix = 'FK ' if is_fk else '   '
        ax.text(x + 0.12, ry + ROW_H*0.5, f'{prefix}{fname}',
            ha='left', va='center', fontsize=6.8, color='#212121', zorder=4)
        ax.text(x + w - 0.1, ry + ROW_H*0.5, ftype,
            ha='right', va='center', fontsize=6.3, color='#757575', style='italic', zorder=4)
    cx = x + w / 2
    return {'cx': cx, 'top': y, 'bottom': bottom,
            'left': x, 'right': x+w, 'mid_y': (y + bottom)/2}

fig, ax = plt.subplots(figsize=(24, 16))
ax.set_xlim(0, 24); ax.set_ylim(0, 16); ax.axis('off')
ax.set_facecolor('#F5F5F5'); fig.patch.set_facecolor('#F5F5F5')

ax.add_patch(mpatches.Rectangle((0, 15.35), 24, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(12.0, 15.67, 'DIAGRAMA ENTIDAD-RELACIÓN — BASE DE DATOS SENDA',
    ha='center', va='center', fontsize=14, fontweight='bold', color='white', zorder=1)
ax.text(12.0, 15.40, 'PostgreSQL 15 · Supabase Cloud · UNADECA 2026',
    ha='center', va='center', fontsize=8.5, color='#B0BEC5', zorder=1)

zones = [
    (0.2,  7.5, 11.2, 7.5, '#E8EAF6', '#3949AB', 'Identidad & Organización'),
    (11.6, 7.5, 12.0, 7.5, '#FFF8E1', '#F57F17', 'Registro Laboral & Tarifas'),
    (0.2,  0.3, 11.4, 7.0, '#FCE4EC', '#AD1457', 'Módulo Quiosco'),
    (11.8, 0.3, 11.8, 7.0, '#E8EAF6', '#283593', 'Módulo Contabilidad'),
]
for zx, zy, zw, zh, zfc, zec, zlbl in zones:
    ax.add_patch(FancyBboxPatch((zx, zy), zw, zh,
        boxstyle='round,pad=0.1', fc=zfc, ec=zec, lw=1.2, alpha=0.3, zorder=0))
    ax.text(zx + zw/2, zy + zh - 0.18, zlbl,
        ha='center', va='center', fontsize=8, color=zec,
        fontweight='bold', alpha=0.55, zorder=1)

E = {}
E['profiles'] = er_entity(ax, 0.35, 14.8, 'profiles', 'id : UUID',
    [('email','TEXT',False),('full_name','TEXT',False),('role','UserRole',False),
     ('department_id','UUID',True),('is_active','BOOL',False),
     ('hourly_rate_override','NUMERIC',False)],
    '#3949AB', '#E8EAF6', w=5.0)

E['departments'] = er_entity(ax, 5.7, 14.8, 'departments', 'id : UUID',
    [('name','TEXT',False),('kiosk_active','BOOL',False),
     ('kiosk_shift_start','TIME',False),('kiosk_shift_end','TIME',False)],
    '#2E7D32', '#E8F5E9', w=4.8)

E['work_logs'] = er_entity(ax, 11.0, 14.8, 'work_logs', 'id : UUID',
    [('student_id','UUID',True),('department_id','UUID',True),
     ('start_time','TIMESTAMPTZ',False),('end_time','TIMESTAMPTZ',False),
     ('hours_worked','NUMERIC',False),('status','WorkLogStatus',False),
     ('description','TEXT',False),('approved_by','UUID',True)],
    '#F57F17', '#FFF9C4', w=5.2)

E['rates'] = er_entity(ax, 16.7, 14.8, 'rates', 'id : UUID',
    [('hourly_rate','NUMERIC',False),('effective_date','DATE',False),
     ('created_by','UUID',True)],
    '#6A1B9A', '#F3E5F5', w=4.6)

E['kiosk_state'] = er_entity(ax, 0.35, 6.8, 'kiosk_state', 'id : UUID',
    [('department_id','UUID',True),('is_active','BOOL',False),
     ('activated_by','UUID',True),('session_label','TEXT',False)],
    '#AD1457', '#FCE4EC', w=4.8)

E['kiosk_sessions'] = er_entity(ax, 5.5, 6.8, 'kiosk_sessions', 'id : UUID',
    [('student_id','UUID',True),('department_id','UUID',True),
     ('clock_in','TIMESTAMPTZ',False),('clock_out','TIMESTAMPTZ',False),
     ('work_log_id','UUID',True)],
    '#AD1457', '#FCE4EC', w=5.0)

E['accounting_config'] = er_entity(ax, 11.0, 6.8, 'accounting_config', 'id : UUID',
    [('department_id','UUID',True),('cost_center','TEXT',False),
     ('account_debit','TEXT',False),('account_credit','TEXT',False),
     ('tithe_account','TEXT',False),('closing_day','INT',False)],
    '#283593', '#E8EAF6', w=5.2)

E['receivables'] = er_entity(ax, 16.7, 6.8, 'receivables', 'id : UUID',
    [('student_id','UUID',True),('amount','NUMERIC',False),
     ('reason','TEXT',False),('billing_cycle','TEXT',False),
     ('is_paid','BOOL',False)],
    '#283593', '#E8EAF6', w=4.6)

def er_rel(ax, e1, e2, verb, card1, card2, c, rad=0.0, from_s='bottom', to_s='top'):
    b1, b2 = E[e1], E[e2]
    pts  = {'bottom': (b1['cx'], b1['bottom']), 'top': (b1['cx'], b1['top']),
            'right':  (b1['right'], b1['mid_y']), 'left': (b1['left'], b1['mid_y'])}
    pts2 = {'bottom': (b2['cx'], b2['bottom']), 'top': (b2['cx'], b2['top']),
            'right':  (b2['right'], b2['mid_y']), 'left': (b2['left'], b2['mid_y'])}
    sx, sy = pts[from_s]; ex, ey = pts2[to_s]
    ax.annotate('', xy=(ex, ey), xytext=(sx, sy),
        arrowprops=dict(arrowstyle='->', color=c, lw=1.8,
            connectionstyle=f'arc3,rad={rad}'))
    mx, my = (sx+ex)/2, (sy+ey)/2
    ax.text(mx + 0.15, my + 0.12, verb, fontsize=6.8, color=c,
        style='italic', ha='left', va='bottom', zorder=5)
    ax.text(sx + 0.12, sy + 0.10, card1, fontsize=7.5, fontweight='bold', color=c, zorder=5)
    ax.text(ex + 0.12, ey + 0.10, card2, fontsize=7.5, fontweight='bold', color=c, zorder=5)

er_rel(ax, 'profiles',    'departments',  'pertenece a',    '0..N','1', '#3949AB', from_s='right', to_s='left')
er_rel(ax, 'work_logs',   'profiles',     'realizado por',  'N','1',    '#F57F17', from_s='left', to_s='right', rad=0.25)
er_rel(ax, 'work_logs',   'departments',  'en departamento','N','1',    '#2E7D32', from_s='left', to_s='right', rad=-0.15)
er_rel(ax, 'kiosk_state', 'departments',  'pertenece a',    '1','1',    '#AD1457', from_s='right', to_s='left', rad=0.2)
er_rel(ax, 'kiosk_sessions','kiosk_state','sesion activa',  'N','1',    '#AD1457', from_s='left', to_s='right', rad=0.15)
er_rel(ax, 'kiosk_sessions','work_logs',  'genera',         '1','0..1', '#546E7A', from_s='top', to_s='bottom', rad=0.2)
er_rel(ax, 'accounting_config','departments','configura',   '1','1',    '#283593', from_s='right', to_s='left', rad=0.0)
er_rel(ax, 'receivables', 'profiles',     'pertenece a',    'N','1',    '#283593', from_s='right', to_s='bottom', rad=-0.12)

leg_x, leg_y = 21.5, 3.5
ax.add_patch(FancyBboxPatch((leg_x, leg_y), 2.3, 2.2,
    boxstyle='round,pad=0.1', fc='white', ec='#78909C', lw=1.2, zorder=4))
ax.text(leg_x + 1.15, leg_y + 2.0, 'Leyenda',
    ha='center', fontsize=8, fontweight='bold', color='#37474F')
for j, (icon, desc) in enumerate([('PK','Clave Primaria'),('FK','Clave Foránea'),('1 : N','Cardinalidad')]):
    ax.text(leg_x + 0.15, leg_y + 1.65 - j*0.50, f'{icon}  {desc}',
        ha='left', va='center', fontsize=7.2, color='#424242', fontweight='bold')

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 5. Diagrama Entidad-Relación — Base de Datos SENDA (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8)

save(fig, '5_er_diagrama.png')
print("Diagrama 5 (ER) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 6 — SECUENCIA: FLUJO DE APROBACIÓN
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'

fig, ax = plt.subplots(figsize=(20, 13))
ax.set_xlim(0, 20); ax.set_ylim(0, 13); ax.axis('off')
ax.set_facecolor('#FAFAFA'); fig.patch.set_facecolor('#FAFAFA')

ax.add_patch(mpatches.Rectangle((0, 12.35), 20, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(10.0, 12.67, 'DIAGRAMA DE SECUENCIA — FLUJO DE REGISTRO Y APROBACIÓN DE HORAS',
    ha='center', va='center', fontsize=13, fontweight='bold', color='white', zorder=1)
ax.text(10.0, 12.40, 'Sistema SENDA · UNADECA 2026',
    ha='center', va='center', fontsize=8, color='#B0BEC5', zorder=1)

PARTICIPANTS = [
    (2.0,  'Estudiante',     'Actor\n(STUDENT)',          '#E3F2FD', '#1565C0'),
    (6.0,  'Frontend',       'React 19 SPA\n(Vite)',      '#EDE7F6', '#512DA8'),
    (10.0, 'API REST',       'Express 4\n(Node.js 20)',   '#FFF9C4', '#E65100'),
    (14.0, 'Supabase',       'PostgreSQL 15\n+ Realtime', '#E8F5E9', '#2E7D32'),
    (18.0, 'Jefe de Depto.', 'Actor\n(DEPT_HEAD)',        '#FCE4EC', '#AD1457'),
]

LIFELINE_Y_TOP    = 11.65
LIFELINE_Y_BOTTOM = 0.6
HEADER_H          = 1.15

for px, name, role, fc, ec in PARTICIPANTS:
    ax.add_patch(FancyBboxPatch((px - 1.3, LIFELINE_Y_TOP), 2.6, HEADER_H,
        boxstyle='round,pad=0.08', fc=fc, ec=ec, lw=2.0, zorder=3,
        path_effects=[pe.withSimplePatchShadow(offset=(2,-2),
            shadow_rgbFace='#B0BEC5', alpha=0.3)]))
    ax.text(px, LIFELINE_Y_TOP + HEADER_H*0.65, name,
        ha='center', va='center', fontsize=9.5, fontweight='bold', color='#212121', zorder=4)
    ax.text(px, LIFELINE_Y_TOP + HEADER_H*0.22, role,
        ha='center', va='center', fontsize=7.0, color='#555', style='italic',
        multialignment='center', zorder=4)
    ax.plot([px, px], [LIFELINE_Y_BOTTOM, LIFELINE_Y_TOP],
        '--', color='#BDBDBD', lw=1.3, zorder=1)

messages = [
    ( 2.0,  6.0, 11.0, '1.',  'iniciarTimer()',                        'solid',  '#1565C0', False),
    ( 6.0, 10.0, 10.3, '2.',  'POST /api/v1/work-logs  {start_time}',  'solid',  '#512DA8', False),
    (10.0, 14.0,  9.6, '3.',  'INSERT work_log  (status = PENDING)',    'solid',  '#E65100', False),
    (14.0, 10.0,  8.9, '4.',  '← 201 Created  {id, status: PENDING}',  'dashed', '#2E7D32', True),
    (10.0,  6.0,  8.2, '5.',  '← 201 Created  {id, status: PENDING}',  'dashed', '#512DA8', True),
    ( 6.0,  2.0,  7.5, '6.',  '← Confirmación + timer activo',         'dashed', '#1565C0', True),
    ( 2.0,  6.0,  6.7, '7.',  'detenerTimer()',                         'solid',  '#1565C0', False),
    ( 6.0, 10.0,  6.0, '8.',  'PATCH /work-logs/:id  {end_time}',       'solid',  '#512DA8', False),
    (10.0, 14.0,  5.3, '9.',  'UPDATE work_log  (hours_worked)',         'solid',  '#E65100', False),
    (14.0, 18.0,  4.6, '10.', 'Realtime NOTIFY → DEPT_HEAD (PENDING)',  'dashed', '#AD1457', True),
    (18.0, 10.0,  3.8, '11.', 'PATCH /work-logs/:id/approve',           'solid',  '#AD1457', False),
    (10.0, 14.0,  3.1, '12.', 'UPDATE work_log  (status = APPROVED)',    'solid',  '#E65100', False),
    (14.0,  6.0,  2.4, '13.', 'Realtime NOTIFY → Estudiante (APPROVED)','dashed', '#2E7D32', True),
]

for x1, x2, y, num, label, style, color, is_ret in messages:
    ls = '--' if style == 'dashed' else '-'
    direction = 1 if x2 > x1 else -1
    act_w = 0.25
    ax.add_patch(mpatches.Rectangle((x1 - act_w/2, y - 0.15), act_w, 0.30,
        fc=color, ec='none', alpha=0.4, zorder=2))
    ax.annotate('', xy=(x2 - direction*0.05, y),
                    xytext=(x1 + direction*0.05, y),
        arrowprops=dict(arrowstyle='->', color=color, lw=1.8,
            linestyle=ls, mutation_scale=12))
    mx = (x1 + x2) / 2
    ax.text(mx, y + 0.17, f'{num}  {label}',
        ha='center', va='bottom', fontsize=7.5, color=color, fontweight='bold')

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 6. Diagrama de Secuencia — Flujo de Aprobación de Horas (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8)

save(fig, '6_secuencia_aprobacion.png')
print("Diagrama 6 (Secuencia) generado.")

# ─────────────────────────────────────────────────────────────────────────────
# DIAGRAMA 7 — CLASES DEL DOMINIO
# ─────────────────────────────────────────────────────────────────────────────
NAVY   = '#1A237E'
FOOTER = '#9E9E9E'
_R     = 0.31

def uml_class(ax, x, y, name, stereotype, attrs, methods, hc, bg, w=4.8):
    stereo_h = 0.30 if stereotype else 0
    name_h   = 0.45
    sep      = 0.06
    attrs_h  = max(_R * len(attrs),   _R * 0.8)
    meths_h  = max(_R * len(methods), _R * 0.8) if methods else _R * 0.5
    total_h  = stereo_h + name_h + sep + attrs_h + sep + meths_h
    bottom   = y - total_h

    ax.add_patch(FancyBboxPatch((x+0.12, bottom-0.12), w, total_h,
        boxstyle='round,pad=0.04', fc='#90A4AE', ec='none', alpha=0.2, zorder=1))
    ax.add_patch(FancyBboxPatch((x, bottom), w, total_h,
        boxstyle='round,pad=0.04', fc=bg, ec=hc, lw=2.2, zorder=2))

    cur = y
    if stereotype:
        ax.add_patch(mpatches.Rectangle((x, cur - stereo_h), w, stereo_h,
            fc=hc, ec='none', alpha=0.55, zorder=3))
        ax.text(x + w/2, cur - stereo_h/2, f'\u00ab{stereotype}\u00bb',
            ha='center', va='center', fontsize=7.5, style='italic', color='white', zorder=4)
        cur -= stereo_h

    ax.add_patch(mpatches.Rectangle((x, cur - name_h), w, name_h,
        fc=hc, ec='none', zorder=3))
    ax.text(x + w/2, cur - name_h/2, name,
        ha='center', va='center', fontsize=9.5, fontweight='bold', color='white', zorder=4)
    cur -= name_h + sep

    ax.plot([x, x+w], [cur, cur], color=hc, lw=1.0, zorder=3)
    for attr in attrs:
        cur -= _R
        vis, rest = attr[0], attr[1:]
        ax.text(x + 0.12, cur + _R/2, vis, ha='left', va='center',
            fontsize=8, color=hc, fontweight='bold', zorder=4)
        ax.text(x + 0.30, cur + _R/2, rest, ha='left', va='center',
            fontsize=7, color='#212121', zorder=4)
    if not attrs:
        cur -= _R * 0.8
    cur -= sep

    ax.plot([x, x+w], [cur, cur], color=hc, lw=1.0, zorder=3)
    for meth in methods:
        cur -= _R
        vis, rest = meth[0], meth[1:]
        ax.text(x + 0.12, cur + _R/2, vis, ha='left', va='center',
            fontsize=8, color='#2E7D32', fontweight='bold', zorder=4)
        ax.text(x + 0.30, cur + _R/2, rest + '()',
            ha='left', va='center', fontsize=7, color='#212121', zorder=4)
    if not methods:
        cur -= _R * 0.5

    cx = x + w / 2
    return {'cx': cx, 'top': y, 'bottom': bottom,
            'left': x, 'right': x+w, 'mid_y': (y+bottom)/2}

fig, ax = plt.subplots(figsize=(24, 17))
ax.set_xlim(0, 24); ax.set_ylim(0, 17); ax.axis('off')
ax.set_facecolor('#F5F5F5'); fig.patch.set_facecolor('#F5F5F5')

ax.add_patch(mpatches.Rectangle((0, 16.35), 24, 0.65, fc=NAVY, ec='none', zorder=0))
ax.text(12.0, 16.67, 'DIAGRAMA DE CLASES DEL DOMINIO — SISTEMA SENDA',
    ha='center', va='center', fontsize=14, fontweight='bold', color='white', zorder=1)
ax.text(12.0, 16.40, 'Modelo orientado a objetos · TypeScript / Node.js · UNADECA 2026',
    ha='center', va='center', fontsize=8.5, color='#B0BEC5', zorder=1)

C = {}
C['UserRole'] = uml_class(ax, 0.2, 15.8, 'UserRole', 'enumeration',
    ['  SUPER_ADMIN', '  ADMIN', '  DEPT_HEAD', '  STUDENT', '  ACCOUNTING'],
    [], hc='#6A1B9A', bg='#F3E5F5', w=3.8)

C['WorkLogStatus'] = uml_class(ax, 4.3, 15.8, 'WorkLogStatus', 'enumeration',
    ['  PENDING', '  APPROVED', '  REJECTED', '  PROCESSED'],
    [], hc='#E65100', bg='#FFF3E0', w=3.8)

C['Profile'] = uml_class(ax, 8.5, 15.8, 'Profile', '',
    ['- id: string', '- email: string', '- fullName: string',
     '- role: UserRole', '- departmentId: string | null',
     '- isActive: boolean', '- hourlyRateOverride: number | null'],
    ['+ getDisplayRole', '+ canApprove', '+ isAdmin'],
    hc='#1565C0', bg='#E3F2FD', w=5.0)

C['Rate'] = uml_class(ax, 14.0, 15.8, 'Rate', '',
    ['- id: string', '- hourlyRate: number',
     '- effectiveDate: Date', '- createdBy: string'],
    [], hc='#6A1B9A', bg='#F3E5F5', w=4.0)

C['Department'] = uml_class(ax, 18.5, 15.8, 'Department', '',
    ['- id: string', '- name: string', '- kioskActive: boolean',
     '- kioskShiftStart: string', '- kioskShiftEnd: string'],
    ['+ isKioskOpen'],
    hc='#2E7D32', bg='#E8F5E9', w=4.5)

C['WorkLog'] = uml_class(ax, 0.2, 8.0, 'WorkLog', '',
    ['- id: string', '- studentId: string', '- departmentId: string',
     '- startTime: Date', '- endTime: Date | null',
     '- hoursWorked: number', '- status: WorkLogStatus',
     '- description: string', '- approvedBy: string | null'],
    ['+ calculateHours', '+ canBeApproved', '+ canBeProcessed'],
    hc='#E65100', bg='#FFF9C4', w=5.4)

C['KioskSession'] = uml_class(ax, 6.2, 8.0, 'KioskSession', '',
    ['- id: string', '- studentId: string', '- departmentId: string',
     '- clockIn: Date', '- clockOut: Date | null',
     '- workLogId: string | null', '- status: string'],
    ['+ getDuration', '+ isOpen'],
    hc='#AD1457', bg='#FCE4EC', w=5.2)

C['AccountingConfig'] = uml_class(ax, 12.3, 8.0, 'AccountingConfig', '',
    ['- id: string', '- departmentId: string', '- costCenter: string',
     '- accountDebit: string', '- accountCredit: string',
     '- titheAccount: string', '- closingDay: number'],
    [],
    hc='#283593', bg='#E8EAF6', w=5.4)

def uml_rel(ax, src, dst, label='', card_s='', card_d='', c='#546E7A',
            dashed=False, rad=0.0, from_s='auto', to_s='auto'):
    b1, b2 = C[src], C[dst]
    if from_s == 'auto':
        if abs(b1['mid_y'] - b2['mid_y']) < 2.5:
            from_s = 'right' if b1['cx'] < b2['cx'] else 'left'
            to_s   = 'left'  if b1['cx'] < b2['cx'] else 'right'
        else:
            from_s = 'bottom' if b1['mid_y'] > b2['mid_y'] else 'top'
            to_s   = 'top'    if b1['mid_y'] > b2['mid_y'] else 'bottom'
    pts  = {'bottom': (b1['cx'], b1['bottom']), 'top': (b1['cx'], b1['top']),
            'right': (b1['right'], b1['mid_y']), 'left': (b1['left'], b1['mid_y'])}
    pts2 = {'bottom': (b2['cx'], b2['bottom']), 'top': (b2['cx'], b2['top']),
            'right': (b2['right'], b2['mid_y']), 'left': (b2['left'], b2['mid_y'])}
    sx, sy = pts[from_s]; ex, ey = pts2[to_s]
    ax.annotate('', xy=(ex, ey), xytext=(sx, sy),
        arrowprops=dict(arrowstyle='->', color=c, lw=1.6,
            linestyle='--' if dashed else '-',
            connectionstyle=f'arc3,rad={rad}'))
    mx, my = (sx+ex)/2, (sy+ey)/2
    ax.text(mx + 0.15, my + 0.10, label,
        fontsize=7, color=c, style='italic', ha='left', va='bottom', zorder=5)
    if card_s:
        ax.text(sx + 0.12, sy + 0.08, card_s,
            fontsize=7.5, fontweight='bold', color=c, zorder=5)
    if card_d:
        ax.text(ex + 0.12, ey + 0.08, card_d,
            fontsize=7.5, fontweight='bold', color=c, zorder=5)

uml_rel(ax, 'Profile', 'UserRole', 'role', '0..N','1', c='#6A1B9A',
    dashed=True, from_s='left', to_s='right', rad=-0.15)
uml_rel(ax, 'Profile', 'Department', 'pertenece a', '0..N','1', c='#2E7D32',
    from_s='right', to_s='left')
uml_rel(ax, 'WorkLog', 'WorkLogStatus', 'status', '0..N','1', c='#E65100',
    dashed=True, from_s='right', to_s='left', rad=0.0)
uml_rel(ax, 'WorkLog', 'Profile', 'realizadoPor', 'N','1', c='#1565C0',
    rad=-0.18, from_s='top', to_s='bottom')
uml_rel(ax, 'WorkLog', 'Department', 'enDepto.', 'N','1', c='#2E7D32',
    rad=0.22, from_s='top', to_s='bottom')
uml_rel(ax, 'KioskSession', 'Profile', 'estudianteId', 'N','1', c='#AD1457',
    rad=0.12, from_s='top', to_s='bottom')
uml_rel(ax, 'KioskSession', 'WorkLog', 'genera', '1','0..1', c='#546E7A',
    dashed=True, from_s='left', to_s='right')
uml_rel(ax, 'AccountingConfig', 'Department', 'configura', '1','1', c='#283593',
    rad=-0.12, from_s='top', to_s='bottom')

leg_x, leg_y = 18.2, 1.2
ax.add_patch(FancyBboxPatch((leg_x, leg_y), 5.5, 3.2,
    boxstyle='round,pad=0.12', fc='white', ec='#78909C', lw=1.2, zorder=4))
ax.text(leg_x + 2.75, leg_y + 2.95, 'Convenciones UML',
    ha='center', fontsize=9, fontweight='bold', color='#37474F')
legend_items = [
    ('─────→', 'Asociación (solid)',       '#546E7A'),
    ('- - -→', 'Dependencia (dashed)',     '#546E7A'),
    ('«enum»', 'Enumeración',              '#E65100'),
    ('- visibilidad', '−  privado,  +  público', '#37474F'),
    ('multiplicidad', '1, N, 0..*, 1..*', '#37474F'),
]
for j, (sym, desc, col) in enumerate(legend_items):
    ax.text(leg_x + 0.2, leg_y + 2.55 - j*0.52, sym,
        ha='left', va='center', fontsize=7.5, color=col, fontweight='bold')
    ax.text(leg_x + 1.5, leg_y + 2.55 - j*0.52, desc,
        ha='left', va='center', fontsize=7.5, color='#424242')

fig.text(0.5, 0.005, 'Sistema SENDA — UNADECA 2026  |  Documento de Trabajo de Graduación',
    ha='center', fontsize=7.5, color=FOOTER, style='italic')
ax.set_title('Figura 7. Diagrama de Clases del Dominio — SENDA (UNADECA, 2026)',
    fontsize=13, fontweight='bold', pad=8)

save(fig, '7_clases_dominio.png')
print("Diagrama 7 (Clases) generado.")

print("\n✅ TODOS LOS DIAGRAMAS GENERADOS EN:", OUTPUT_DIR)
