/**
 * Content seed script — Server-Side Access Control (task 3.1).
 *
 * Loads the aggregated plan content (content-source/contents.js) and upserts it
 * into the Supabase `content_sections` table as two role-tagged variants:
 *
 *   - OWNER rows    (min_role='owner')    : an exact, unredacted copy of every
 *     content section (built with buildOwnerVariant).
 *   - EMPLOYEE rows (min_role='employee') : exactly the 5 Employee_Content
 *     sections — unchanged copies of `channels`, `onboarding`, `principles`,
 *     `scripts`, and `instituteOutreach`. No `roadmap`/`months`, no
 *     `dailyRoutine`, no `brandPlaybook`, no other owner-only section.
 *
 * Rows are upserted on conflict (key, min_role) with a SERVICE-ROLE Supabase
 * client that bypasses RLS. This script is for LOCAL / CI use only: the
 * service-role key and URL are read from process.env (SUPABASE_SERVICE_ROLE_KEY,
 * SUPABASE_URL) — never from a VITE_ var, never committed, never bundled.
 *
 * Design references:
 *   - Requirements 4.1, 4.3, 6.1, 6.2, 7.1, 7.2, 8.4, 11.4
 *   - design.md "Seed migration data flow" + Data Models "row inventory"
 *
 * Usage:
 *   node scripts/seed-content.mjs            # connect + upsert (needs env vars)
 *   node scripts/seed-content.mjs --dry-run  # build + print the row plan only
 */

import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');

const TABLE = 'content_sections';
const CONFLICT_TARGET = 'key,min_role';

// Pure build-metadata keys that are NOT content sections; skipped entirely.
const SKIP_KEYS = new Set(['builtAt', 'version']);

// The Employee_Content sections (Req 6.1). Employees receive ONLY these six
// content rows — all unchanged copies. No money-redacted rows remain
// (roadmap/months are no longer served to employees at all), and no owner-only
// section (brandPlaybook, vision, meta, pricing, streams, dailyRoutine, etc.)
// is ever included. Owner rows are unaffected (every key, via buildOwnerVariant).
//
// NOTE: `scripts` (proposal templates) may contain pricing — this is accepted
// per the owner's explicit request to give employees the Scripts section; it is
// intentionally NOT money-redacted.
//
// NOTE: `lawnsOutreach` is included per the owner's explicit request so the
// Head@Ready2UP (employee) login can work the venue pipeline. Like
// instituteOutreach it carries lead lists and pricing tiers and is served
// unredacted — both are outreach surfaces the team is expected to act on.
const EMPLOYEE_REDACTED_KEYS = [];
const EMPLOYEE_COPY_KEYS = [
  'channels',
  'onboarding',
  'principles',
  'scripts',
  'instituteOutreach',
  'lawnsOutreach',
];

/**
 * Build the owner + employee row plans from the aggregated `contents` object.
 * PURE — depends only on its inputs (contents + the two redaction builders).
 *
 * @param {Record<string, unknown>} contents
 * @param {(section:any)=>any} buildOwnerVariant
 * @param {(section:any, key:string)=>any} redactMoney
 * @returns {{ ownerRows: Array, employeeRows: Array }}
 */
export function buildRowPlan(contents, buildOwnerVariant, redactMoney) {
  const ownerRows = [];
  for (const [key, value] of Object.entries(contents)) {
    if (SKIP_KEYS.has(key)) continue; // skip pure build-metadata (builtAt/version)
    if (value === undefined) continue;
    ownerRows.push({ key, min_role: 'owner', data: buildOwnerVariant(value) });
  }

  const employeeRows = [];
  for (const key of EMPLOYEE_REDACTED_KEYS) {
    if (!(key in contents)) continue;
    employeeRows.push({ key, min_role: 'employee', data: redactMoney(contents[key], key) });
  }
  for (const key of EMPLOYEE_COPY_KEYS) {
    if (!(key in contents)) continue;
    employeeRows.push({ key, min_role: 'employee', data: buildOwnerVariant(contents[key]) });
  }

  return { ownerRows, employeeRows };
}

/** Approximate stored byte size of a row's JSON payload. */
function byteSize(data) {
  return Buffer.byteLength(JSON.stringify(data), 'utf8');
}

/** Print a human-readable summary of the row plan. */
function printPlan({ ownerRows, employeeRows }, { dryRun }) {
  const banner = dryRun ? '📝 DRY RUN — row plan (no connection):' : '📦 Row plan:';
  console.log(`\n${banner}`);

  console.log(`\n  OWNER rows (min_role='owner'): ${ownerRows.length}`);
  for (const r of ownerRows) {
    console.log(`    • ${r.key.padEnd(18)} owner     ${byteSize(r.data).toLocaleString()} bytes`);
  }
  console.log(`\n  EMPLOYEE rows (min_role='employee'): ${employeeRows.length}`);
  for (const r of employeeRows) {
    console.log(`    • ${r.key.padEnd(18)} employee  ${byteSize(r.data).toLocaleString()} bytes`);
  }

  console.log(
    `\n  Owner keys:    ${ownerRows.map((r) => r.key).join(', ')}`
  );
  console.log(
    `  Employee keys: ${employeeRows.map((r) => r.key).join(', ')}\n`
  );
}

/** Load the aggregated `contents` and the redaction builders via dynamic import. */
async function loadInputs() {
  const contentsUrl = pathToFileURL(resolve(ROOT, 'content-source/contents.js')).href;
  const redactUrl = pathToFileURL(resolve(ROOT, 'src/lib/redact.js')).href;
  const { contents } = await import(contentsUrl);
  const { redactMoney, buildOwnerVariant } = await import(redactUrl);
  return { contents, redactMoney, buildOwnerVariant };
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');

  const { contents, redactMoney, buildOwnerVariant } = await loadInputs();
  const plan = buildRowPlan(contents, buildOwnerVariant, redactMoney);
  const { ownerRows, employeeRows } = plan;

  printPlan(plan, { dryRun });

  if (dryRun) {
    console.log('✅ Dry run complete — no Supabase connection attempted.');
    return;
  }

  // Read service-role credentials from the environment. These are LOCAL/CI-only
  // secrets: never a VITE_ var, never committed, never bundled (Req 11.4).
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error(
      '\n❌ Missing required environment variables.\n\n' +
        '   This script upserts content with the Supabase SERVICE-ROLE key,\n' +
        '   which bypasses RLS and must only run locally or in CI.\n\n' +
        '   Set BOTH of the following before running (do NOT use VITE_ vars,\n' +
        '   do NOT commit these values anywhere):\n\n' +
        '     SUPABASE_URL=<your project url, e.g. https://xxxx.supabase.co>\n' +
        '     SUPABASE_SERVICE_ROLE_KEY=<your service-role key>\n\n' +
        '   Example (PowerShell):\n' +
        '     $env:SUPABASE_URL="https://xxxx.supabase.co"\n' +
        '     $env:SUPABASE_SERVICE_ROLE_KEY="<key>"\n' +
        '     node scripts/seed-content.mjs\n\n' +
        '   To validate the row plan WITHOUT credentials, run:\n' +
        '     node scripts/seed-content.mjs --dry-run\n'
    );
    process.exit(1);
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Clean up STALE employee rows first. Upsert only inserts/updates; it never
  // deletes, so employee sections we've since removed (e.g. roadmap/months)
  // would otherwise linger and remain visible. We delete every current
  // employee-tier row whose key is NOT in the intended employee set, so the
  // employee content ends up EXACTLY matching the plan. Owner rows are never
  // touched. (If the intended set is empty, delete all employee rows.)
  const employeeKeys = employeeRows.map((r) => r.key);
  let del = supabase.from(TABLE).delete().eq('min_role', 'employee');
  if (employeeKeys.length > 0) {
    del = del.not('key', 'in', `(${employeeKeys.map((k) => `"${k}"`).join(',')})`);
  }
  const { error: delError } = await del;
  if (delError) {
    console.error(`\n❌ Cleanup of stale employee rows failed: ${delError.message}\n`);
    process.exit(1);
  }

  const allRows = [...ownerRows, ...employeeRows].map((r) => ({
    ...r,
    updated_at: new Date().toISOString(),
  }));

  console.log(`⏫ Upserting ${allRows.length} row(s) into ${TABLE} on conflict (${CONFLICT_TARGET})...`);
  const { error } = await supabase
    .from(TABLE)
    .upsert(allRows, { onConflict: CONFLICT_TARGET });

  if (error) {
    console.error(`\n❌ Upsert failed: ${error.message}\n`);
    process.exit(1);
  }

  console.log(
    `\n✅ Seed complete: ${ownerRows.length} owner row(s) + ${employeeRows.length} employee row(s) upserted (stale employee rows cleaned up).\n`
  );
}

// Only run when invoked directly (mirrors scripts/scan-bundle.mjs), so tests can
// import buildRowPlan without executing the seed.
const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
if (isMain) {
  main().catch((err) => {
    console.error('\n❌ Seed script error:', err && err.message ? err.message : err);
    process.exit(1);
  });
}
