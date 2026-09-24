import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Baca .env.local
const envLocalPath = path.join(rootDir, '.env.local');
const envConfig = {};
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim();
        envConfig[k] = v;
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
let dbPassword = process.env.SUPABASE_DB_PASSWORD || envConfig.SUPABASE_DB_PASSWORD;
let filterArg = null;

for (let i = 2; i < process.argv.length; i++) {
  const arg = process.argv[i].trim();
  if (arg === '005+006' || arg === '005,006' || arg.startsWith('00') || arg.startsWith('--')) {
    filterArg = arg;
  } else if (!dbPassword) {
    dbPassword = arg;
  }
}

if (!supabaseUrl) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL wajib disetel di .env.local');
  process.exit(1);
}

if (!dbPassword) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD wajib disetel di .env.local atau diberikan via argumen:');
  console.error('   npm run db:migrate -- <DB_PASSWORD>');
  process.exit(1);
}

const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('========================================================');
console.log('KESIT Management - Database Schema Migration');
console.log('========================================================');
console.log(`Target Supabase URL : ${supabaseUrl}`);
console.log(`Project Ref         : ${projectRef}`);
if (filterArg) {
  console.log(`Filter Mode         : ${filterArg}`);
}

async function run() {
  const poolerHosts = [
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ap-southeast-2.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
  ];

  let pgClient = null;
  let connectedHost = null;

  for (const host of poolerHosts) {
    try {
      console.log(`Mencoba koneksi ke pooler: ${host}:6543 ...`);
      const client = new pg.Client({
        host,
        port: 6543,
        database: 'postgres',
        user: `postgres.${projectRef}`,
        password: dbPassword,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
      });
      await client.connect();
      pgClient = client;
      connectedHost = host;
      console.log(`✓ Terhubung ke ${host}!`);
      break;
    } catch (err) {
      console.log(`Gagal konek ke ${host}:`, err.message);
    }
  }

  if (!pgClient) {
    console.error('\n❌ Tidak dapat terhubung ke PostgreSQL Pooler dengan password yang diberikan.');
    process.exit(1);
  }

  try {
    const isOnly005006 = filterArg === '005+006' || filterArg === '005,006';
    const isOnly007 = filterArg === '007' || filterArg === '007_security' || filterArg === '007_security_hardening';
    const isOnly008 = filterArg === '008' || filterArg === '008_allow_all_coaches_read_absensi';

    const steps = [];

    if (isOnly008) {
      steps.push({
        name: 'Migrasi 008: Allow All Coaches Read Absensi (008_allow_all_coaches_read_absensi.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '008_allow_all_coaches_read_absensi.sql'),
      });
    } else if (isOnly007) {
      steps.push({
        name: 'Migrasi 007: Security Hardening (007_security_hardening.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '007_security_hardening.sql'),
      });
    } else if (isOnly005006) {
      steps.push({
        name: 'Migrasi 005: Full Absensi & Pendaftaran Setup (005_full_absensi_setup.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '005_full_absensi_setup.sql'),
      });
      steps.push({
        name: 'Migrasi 006: Repair Absensi Setup (006_absensi_repair.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '006_absensi_repair.sql'),
      });
    } else {
      steps.push({
        name: 'DDL Skema Dasar (dev_full_setup.sql)',
        path: path.join(rootDir, 'supabase', 'dev_full_setup.sql'),
      });
      steps.push({
        name: 'Migrasi 002: Optimasi Performa (002_optimize_performance.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '002_optimize_performance.sql'),
      });
      steps.push({
        name: 'Migrasi 005: Full Absensi & Pendaftaran Setup (005_full_absensi_setup.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '005_full_absensi_setup.sql'),
      });
      steps.push({
        name: 'Migrasi 006: Repair Absensi Setup (006_absensi_repair.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '006_absensi_repair.sql'),
      });
      steps.push({
        name: 'Migrasi 007: Security Hardening (007_security_hardening.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '007_security_hardening.sql'),
      });
      steps.push({
        name: 'Migrasi 008: Allow All Coaches Read Absensi (008_allow_all_coaches_read_absensi.sql)',
        path: path.join(rootDir, 'supabase', 'migrations', '008_allow_all_coaches_read_absensi.sql'),
      });
    }

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      if (fs.existsSync(step.path)) {
        console.log(`\n[${i + 1}/${steps.length}] Menjalankan: ${step.name}`);
        const sql = fs.readFileSync(step.path, 'utf8');
        await pgClient.query(sql);
        console.log(`✓ Selesai: ${step.name}`);
      } else {
        console.log(`\n⚠️ File tidak ditemukan: ${step.path}`);
      }
    }

    await pgClient.end();
    console.log('\n========================================================');
    console.log('✓ MIGRASI SELESAI! Seluruh script SQL berhasil dieksekusi.');
    console.log('========================================================\n');
  } catch (err) {
    console.error('\n❌ Gagal saat eksekusi migrasi SQL:', err.message);
    await pgClient.end();
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
