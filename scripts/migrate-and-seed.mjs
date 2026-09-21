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

if (!supabaseUrl || !secretKey) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan NEXT_SUPABASE_SECRET wajib disetel di .env.local');
  process.exit(1);
}

const projectRef = supabaseUrl.replace('https://', '').split('.')[0];

// Ambil password dari argumen CLI atau environment variable
const dbPassword = process.argv[2] || process.env.SUPABASE_DB_PASSWORD || envConfig.SUPABASE_DB_PASSWORD;

console.log('========================================================');
console.log('KESIT Management - Development Database Migration & Seed');
console.log('========================================================');
console.log(`Target Supabase URL : ${supabaseUrl}`);
console.log(`Project Ref         : ${projectRef}`);
console.log(`Secret Key          : ${secretKey.slice(0, 10)}...${secretKey.slice(-4)}`);

async function run() {
  const supabase = createClient(supabaseUrl, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Jika ada DB Password, jalankan migrasi DDL via PostgreSQL pooler
  if (dbPassword) {
    console.log('\n[1/3] Menjalankan migrasi SQL skema & seed data via Postgres Pooler...');
    
    // Pooler connections
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
      const sqlFile = path.join(rootDir, 'supabase', 'dev_full_setup.sql');
      console.log(`Membaca berkas SQL: ${sqlFile}`);
      const sqlContent = fs.readFileSync(sqlFile, 'utf8');

      console.log('Mengeksekusi berkas SQL (ini memerlukan beberapa detik)...');
      await pgClient.query(sqlContent);
      console.log('✓ Skema tabel & seed data berhasil diaplikasikan ke database!');
      await pgClient.end();
    } catch (sqlErr) {
      console.error('❌ Gagal mengeksekusi SQL:', sqlErr.message);
      await pgClient.end();
      process.exit(1);
    }
  } else {
    console.log('\n[1/3] Memeriksa ketersediaan tabel di database dev...');
    const { data: testData, error: testErr } = await supabase.from('pelatih').select('id').limit(1);

    if (testErr && testErr.code === 'PGRST205') {
      console.log('\n⚠️ Tabel database belum dibuat di project development ini!');
      console.log('Untuk mengeksekusi skema tabel langsung dari terminal, jalankan:');
      console.log(`  node scripts/migrate-and-seed.mjs <DATABASE_PASSWORD>`);
      console.log('\nAtau masukkan "SUPABASE_DB_PASSWORD=..." ke dalam .env.local.');
      console.log('Atau copy isi supabase/dev_full_setup.sql ke Supabase Dashboard SQL Editor:');
      console.log(`  https://supabase.com/dashboard/project/${projectRef}/sql/new`);
      process.exit(0);
    } else {
      console.log('✓ Tabel database sudah tersedia di public schema.');
    }
  }

  // 2. Buat akun Auth Pengujian (Admin, Owner, Pelatih)
  console.log('\n[2/3] Mempersiapkan akun login pengujian di Supabase Auth...');
  const testUsers = [
    {
      email: 'admin@kesit.com',
      password: 'password123',
      username: 'admin',
      nama_tampilan: 'Admin KESIT Dev',
      role: 'Admin',
    },
    {
      email: 'owner@kesit.com',
      password: 'password123',
      username: 'owner',
      nama_tampilan: 'Owner KESIT Dev',
      role: 'Owner',
    },
    {
      email: 'budi@kesit.com',
      password: 'password123',
      username: 'budi',
      nama_tampilan: 'Budi Santoso (Pelatih)',
      role: 'Pelatih',
      pelatih_id: '11111111-1111-1111-1111-111111111111',
    },
  ];

  for (const u of testUsers) {
    try {
      // Cek apakah user auth sudah ada
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      let userObj = existingUsers?.users?.find((x) => x.email === u.email);

      if (!userObj) {
        const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
          email: u.email,
          password: u.password,
          email_confirm: true,
          user_metadata: { nama_tampilan: u.nama_tampilan },
        });

        if (createErr) {
          console.log(`  - Gagal membuat auth user ${u.email}:`, createErr.message);
          continue;
        }
        userObj = createdUser.user;
        console.log(`  ✓ Auth user dibuat: ${u.email} (Password: ${u.password})`);
      } else {
        console.log(`  ✓ Auth user sudah ada: ${u.email}`);
      }

      // Upsert ke user_profiles
      if (userObj) {
        const { error: profileErr } = await supabase
          .from('user_profiles')
          .upsert({
            id: userObj.id,
            username: u.username,
            nama_tampilan: u.nama_tampilan,
            role: u.role,
            status_akun: 'Aktif',
            aktivasi_selesai: true,
            pelatih_id: u.pelatih_id || null,
          });

        if (profileErr) {
          console.log(`    ⚠️ Gagal update profile untuk ${u.email}:`, profileErr.message);
        } else {
          console.log(`    ✓ Profile user_profiles terdaftar: ${u.role} (${u.username})`);
        }
      }
    } catch (err) {
      console.log(`  - Error saat memproses user ${u.email}:`, err.message);
    }
  }

  // 3. Verifikasi jumlah data
  console.log('\n[3/3] Verifikasi data database development...');
  const tables = ['pelatih', 'siswa', 'paket_siswa', 'pembayaran_siswa', 'penilaian_pelatih', 'riwayat_perubahan_siswa'];
  for (const t of tables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`  - ${t}: Error (${error.message})`);
    } else {
      console.log(`  - ${t}: ${count} baris data terverifikasi`);
    }
  }

  console.log('\n========================================================');
  console.log('✓ SELESAI! Environment development siap digunakan.');
  console.log('Akun Pengujian:');
  console.log('  1. Admin   : admin@kesit.com   / password123');
  console.log('  2. Owner   : owner@kesit.com   / password123');
  console.log('  3. Pelatih : budi@kesit.com    / password123');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
