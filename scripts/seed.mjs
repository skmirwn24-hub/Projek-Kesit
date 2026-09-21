import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { createClient } from '@supabase/supabase-js';

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
const secretKey = process.env.NEXT_SUPABASE_SECRET || envConfig.NEXT_SUPABASE_SECRET;
const dbPassword = process.env.SUPABASE_DB_PASSWORD || envConfig.SUPABASE_DB_PASSWORD;

if (!supabaseUrl || !secretKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan NEXT_SUPABASE_SECRET wajib disetel di .env.local');
  process.exit(1);
}

const isForce = process.argv.includes('--force');
const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

console.log('========================================================');
console.log('KESIT Management - Database Seeding (Guarded & Idempotent)');
console.log('========================================================');
console.log(`Target Supabase URL : ${supabaseUrl}`);
console.log(`Project Ref         : ${projectRef}`);
console.log(`Mode                : ${isForce ? 'FORCE (Abaikan proteksi data ada)' : 'SAFE GUARD (Cek data sebelum seed)'}`);

async function run() {
  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Cek perlindungan data (Guard Check)
  console.log('\n[1/3] Memeriksa status data database...');
  const { count: siswaCount, error: countErr } = await supabase
    .from('siswa')
    .select('*', { count: 'exact', head: true });

  if (countErr) {
    console.error('❌ Gagal memeriksa tabel siswa:', countErr.message);
    process.exit(1);
  }

  if (siswaCount > 0 && !isForce) {
    console.log(`\n🛡️ PROTEKSI AKTIF:`);
    console.log(`   Database development saat ini sudah memiliki ${siswaCount} baris data siswa.`);
    console.log('   Untuk mencegah penimpaan atau polusi data riil, proses seeding dibatalkan secara aman.');
    console.log('\n   💡 Jika Anda benar-benar ingin menjalankan seeding, jalankan:');
    console.log('      npm run db:seed -- --force');
    console.log('========================================================\n');
    process.exit(0);
  }

  if (siswaCount > 0 && isForce) {
    console.log(`⚠️ PERINGATAN: Menjalankan seeding dengan --force. Query idempoten akan digunakan.`);
  } else {
    console.log(`✓ Database kosong. Melanjutkan proses seeding...`);
  }

  // 2. Eksekusi berkas seed.sql idempoten
  console.log('\n[2/3] Mengeksekusi berkas seed.sql idempoten...');
  if (!dbPassword) {
    console.error('❌ SUPABASE_DB_PASSWORD diperlukan untuk mengeksekusi seed SQL.');
    process.exit(1);
  }

  const poolerHosts = [
    'aws-0-ap-southeast-1.pooler.supabase.com',
    'aws-0-ap-southeast-2.pooler.supabase.com',
    'aws-0-us-east-1.pooler.supabase.com',
  ];

  let pgClient = null;
  for (const host of poolerHosts) {
    try {
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
      break;
    } catch (err) {
      // coba host berikutnya
    }
  }

  if (!pgClient) {
    console.error('❌ Gagal terhubung ke pooler database.');
    process.exit(1);
  }

  const seedFile = path.join(rootDir, 'supabase', 'seed.sql');
  const seedSql = fs.readFileSync(seedFile, 'utf8');
  await pgClient.query(seedSql);
  await pgClient.end();
  console.log('✓ Seeding data idempoten (pelatih, siswa, paket, pembayaran, penilaian, riwayat) berhasil diaplikasikan!');

  // 3. Verifikasi Jumlah Data
  console.log('\n[3/3] Verifikasi hasil seeding...');
  const tables = ['pelatih', 'siswa', 'paket_siswa', 'pembayaran_siswa', 'penilaian_pelatih', 'riwayat_perubahan_siswa'];
  for (const t of tables) {
    const { count } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`  - ${t.padEnd(25)}: ${count} baris data`);
  }

  console.log('\n========================================================');
  console.log('✓ SEEDING SELESAI SECARA IDEMPOTEN!');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
