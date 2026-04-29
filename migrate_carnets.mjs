/**
 * Migra los carnets de estudiantes al formato YYQQNN
 * y actualiza el email de auth en Supabase.
 */
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Mapeo: carnet viejo → carnet nuevo (mismo orden del seed)
const CARNET_MAP = [
  // 2401 (2024-Q1)
  ['2024-001', '240101'], // Marvin Moncada
  ['2024-002', '240102'], // Reyshawn Lawrence
  ['2024-003', '240103'], // Alena Vanegas
  ['2024-004', '240104'], // Axel Hernández
  ['2024-005', '240105'], // Connie Ruiz
  ['2024-006', '240106'], // Nely Navarro
  ['2024-007', '240107'], // Alexander Mejía
  ['2024-008', '240108'], // Ester Torres
  ['2024-009', '240109'], // Edgar Miranda
  ['2024-010', '240110'], // Jexon Mejía
  ['2024-011', '240111'], // Jessica Medina
  ['2024-012', '240112'], // Juan Carlos
  // 2402 (2024-Q2)
  ['2024-013', '240201'], // Kemuel Mayorga
  ['2024-014', '240202'], // Katherine Sánchez
  ['2024-015', '240203'], // Katherine Perla
  ['2024-016', '240204'], // Liz Galindo
  ['2024-017', '240205'], // Milma Mann
  ['2024-018', '240206'], // Luiz Gómez
  ['2024-019', '240207'], // Odalin Henríquez
  ['2024-020', '240208'], // Alejandro Betancur
  ['2024-021', '240209'], // Josué Masís
  ['2024-022', '240210'], // Gle Mora
  ['2024-023', '240211'], // Will Macho
  ['2024-024', '240212'], // Víctor Escobar
  // 2403 (2024-Q3)
  ['2024-025', '240301'], // Fernando Moncada
  ['2024-026', '240302'], // Daniela López
  ['2024-027', '240303'], // Débora Braga
  // 2501 (2025-Q1)
  ['2024-028', '250101'], // Diego Herrera
  ['2024-029', '250102'], // Sofía Reyes
  ['2024-030', '250103'], // Pablo Cárdenas
  ['2024-031', '250104'], // Lucía Martínez
  ['2024-032', '250105'], // Rodrigo Fuentes
  ['2024-033', '250106'], // Valentina Chávez
  ['2024-034', '250107'], // Cristian Aguilar
  ['2024-035', '250108'], // Melissa Vargas
];

function buildAuthEmail(identifier) {
  return `${String(identifier).toLowerCase().trim().replace(/\s+/g, '-')}@senda.internal`;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Migración de carnets → formato YYQQNN');
  console.log('═══════════════════════════════════════════════════════\n');

  let ok = 0, fail = 0;

  for (const [oldCarnet, newCarnet] of CARNET_MAP) {
    // Buscar el perfil por carnet viejo
    const { data: profile, error: findErr } = await sb
      .from('profiles')
      .select('id, carnet, name')
      .eq('carnet', oldCarnet)
      .maybeSingle();

    if (findErr || !profile) {
      console.warn(`  ⚠️  No encontrado: ${oldCarnet} → ${newCarnet}`);
      fail++;
      continue;
    }

    // 1. Actualizar carnet en profiles
    const { error: profErr } = await sb
      .from('profiles')
      .update({ carnet: newCarnet })
      .eq('id', profile.id);

    if (profErr) {
      console.error(`  ❌  profiles [${profile.name}]: ${profErr.message}`);
      fail++;
      continue;
    }

    // 2. Actualizar email en auth.users
    const newEmail = buildAuthEmail(newCarnet);
    const { error: authErr } = await sb.auth.admin.updateUserById(profile.id, {
      email: newEmail,
    });

    if (authErr) {
      console.error(`  ❌  auth email [${profile.name}]: ${authErr.message}`);
      fail++;
      continue;
    }

    console.log(`  ✅  ${profile.name}: ${oldCarnet} → ${newCarnet}`);
    ok++;
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log(`  Completado: ${ok} OK, ${fail} fallidos`);
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(e => {
  console.error('❌  Error fatal:', e.message);
  process.exit(1);
});
