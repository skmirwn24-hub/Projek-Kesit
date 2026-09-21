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
const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD || envConfig.SUPABASE_DB_PASSWORD;

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
console.log('KESIT Management - Database Schema Migration (DDL Only)');
console.log('========================================================');
console.log(`Target Supabase URL : ${supabaseUrl}`);
console.log(`Project Ref         : ${projectRef}`);

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
    // 1. Jalankan skema dasar (dev_full_setup.sql - DDL murni)
    const baseSqlFile = path.join(rootDir, 'supabase', 'dev_full_setup.sql');
    console.log(`\n[1/2] Menjalankan DDL Skema Dasar: ${baseSqlFile}`);
    const baseSql = fs.readFileSync(baseSqlFile, 'utf8');
    await pgClient.query(baseSql);
    console.log('✓ Skema tabel, fungsi, dan RLS policies berhasil diterapkan!');

    // 2. Jalankan migrasi optimasi performa (002_optimize_performance.sql)
    const optSqlFile = path.join(rootDir, 'supabase', 'migrations', '002_optimize_performance.sql');
    if (fs.existsSync(optSqlFile)) {
      console.log(`\n[2/2] Menjalankan Migrasi Optimasi: ${optSqlFile}`);
      const optSql = fs.readFileSync(optSqlFile, 'utf8');
      await pgClient.query(optSql);
      console.log('✓ Indeks performa dan fungsi agregasi dashboard berhasil diterapkan!');
    }

    await pgClient.end();
    console.log('\n========================================================');
    console.log('✓ MIGRASI SELESAI! Struktur database DDL terpasang sempurna.');
    console.log('  Catatan: Skrip migrasi ini TIDAK memasukkan data dummy.');
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
