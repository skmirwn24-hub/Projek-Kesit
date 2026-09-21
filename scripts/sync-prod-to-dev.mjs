import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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

const prodUrl = process.env.PROD_SUPABASE_URL || envConfig.PROD_SUPABASE_URL;
const prodSecret = process.env.PROD_SUPABASE_SECRET || envConfig.PROD_SUPABASE_SECRET;

const devUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || envConfig.NEXT_PUBLIC_SUPABASE_URL;
const devSecret = process.env.NEXT_SUPABASE_SECRET || envConfig.NEXT_SUPABASE_SECRET;

if (!prodUrl || !prodSecret) {
  console.error('❌ Error: PROD_SUPABASE_URL dan PROD_SUPABASE_SECRET wajib disetel di .env.local');
  process.exit(1);
}

if (!devUrl || !devSecret) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL dan NEXT_SUPABASE_SECRET wajib disetel di .env.local');
  process.exit(1);
}

console.log('========================================================');
console.log('KESIT Management - Sinkronisasi Data Production -> Dev');
console.log('========================================================');
console.log(`Source (Production) : ${prodUrl}`);
console.log(`Target (Development): ${devUrl}`);

async function run() {
  const prodSupabase = createClient(prodUrl, prodSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const devSupabase = createClient(devUrl, devSecret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Uji koneksi ke Production
  console.log('\n[1/5] Memeriksa data dari database Production...');
  const tables = [
    'pelatih',
    'siswa',
    'paket_siswa',
    'pembayaran_siswa',
    'penilaian_pelatih',
    'riwayat_perubahan_siswa',
    'user_profiles',
  ];

  const prodData = {};
  for (const table of tables) {
    const { data, error, count } = await prodSupabase
      .from(table)
      .select('*', { count: 'exact' });

    if (error) {
      console.error(`  ❌ Gagal membaca tabel ${table} dari Production:`, error.message);
      process.exit(1);
    }
    prodData[table] = data || [];
    console.log(`  ✓ Production [${table}]: ${prodData[table].length} baris data ditemukan.`);
  }

  // Cek Auth Users di Production
  const { data: prodAuth, error: authErr } = await prodSupabase.auth.admin.listUsers();
  if (authErr) {
    console.warn('  ⚠️ Tidak dapat membaca auth.users dari Production:', authErr.message);
  } else {
    console.log(`  ✓ Production [auth.users]: ${prodAuth?.users?.length || 0} akun pengguna ditemukan.`);
  }

  // 2. Bersihkan data di Development
  console.log('\n[2/5] Membersihkan data dummy di database Development...');
  // Urutan penghapusan: child tables first untuk menghindari foreign key constraint error
  const deleteOrder = [
    'riwayat_perubahan_siswa',
    'pembayaran_siswa',
    'paket_siswa',
    'penilaian_pelatih',
    'siswa',
    'pelatih',
  ];

  for (const table of deleteOrder) {
    const { error: delErr } = await devSupabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) {
      console.error(`  ❌ Gagal membersihkan tabel ${table} di Dev:`, delErr.message);
      process.exit(1);
    }
    console.log(`  ✓ Tabel ${table} di Development telah dibersihkan.`);
  }

  // 3. Masukkan data Production ke Development
  console.log('\n[3/5] Memasukkan data Production ke Development secara presisi...');
  // Urutan insert: parent tables first
  const insertOrder = [
    'pelatih',
    'siswa',
    'paket_siswa',
    'pembayaran_siswa',
    'penilaian_pelatih',
    'riwayat_perubahan_siswa',
  ];

  for (const table of insertOrder) {
    const rows = prodData[table];
    if (rows && rows.length > 0) {
      // Chunking jika data banyak (per 100 baris)
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        const { error: insErr } = await devSupabase.from(table).insert(chunk);
        if (insErr) {
          console.error(`  ❌ Gagal insert data ke ${table} di Dev:`, insErr.message);
          console.error('Data chunk:', JSON.stringify(chunk.slice(0, 1)));
          process.exit(1);
        }
      }
      console.log(`  ✓ Berhasil mereplikasi ${rows.length} baris ke tabel ${table}.`);
    } else {
      console.log(`  - Tabel ${table} kosong di Production (0 baris).`);
    }
  }

  // 4. Sinkronisasi User Profiles & Auth Pengujian
  console.log('\n[4/5] Memeriksa akun pengguna dan user_profiles...');
  // Pertahankan/sinkronkan user_profiles dari prod
  if (prodData['user_profiles'] && prodData['user_profiles'].length > 0) {
    console.log(`  Menyelaraskan ${prodData['user_profiles'].length} profil pengguna dari Production...`);
    for (const up of prodData['user_profiles']) {
      // Periksa apakah auth user id sudah ada di dev
      const { data: devUser } = await devSupabase.auth.admin.getUserById(up.id);
      if (!devUser?.user) {
        // Cari auth user di prodData
        const prodU = prodAuth?.users?.find((u) => u.id === up.id);
        const email = prodU?.email || `${up.username}@kesit.com`;
        
        // Buat user auth di dev dengan id yang sama persis
        const { error: createAuthErr } = await devSupabase.auth.admin.createUser({
          id: up.id,
          email,
          password: 'password123', // Default dev password untuk akun yang disinkronkan
          email_confirm: true,
          user_metadata: { nama_tampilan: up.nama_tampilan },
        });

        if (createAuthErr) {
          console.warn(`    ⚠️ Gagal membuat auth user ${email} (${up.id}):`, createAuthErr.message);
        } else {
          console.log(`    ✓ Dibuat auth user untuk dev: ${email} (Password: password123)`);
        }
      }

      // Upsert profile
      const { error: upErr } = await devSupabase.from('user_profiles').upsert(up);
      if (upErr) {
        console.warn(`    ⚠️ Gagal upsert user_profiles ${up.username}:`, upErr.message);
      }
    }
  }

  // Bersihkan user_profiles di dev yang bukan dari prod agar 100% plek ketiplek
  const prodUserIds = new Set(prodData['user_profiles'].map((u) => u.id));
  const { data: allDevProfiles } = await devSupabase.from('user_profiles').select('id, username');
  for (const p of allDevProfiles || []) {
    if (!prodUserIds.has(p.id)) {
      await devSupabase.from('user_profiles').delete().eq('id', p.id);
      try {
        await devSupabase.auth.admin.deleteUser(p.id);
      } catch (e) {}
      console.log(`    ✓ Menghapus user dev non-prod agar identik: ${p.username}`);
    }
  }

  // 5. Verifikasi Perbandingan Data (Plek Ketiplek)
  console.log('\n[5/5] Verifikasi konsistensi data (Production vs Development):');
  console.log('--------------------------------------------------------');
  console.log('Tabel                       Prod       Dev      Status');
  console.log('--------------------------------------------------------');

  let allMatch = true;
  for (const table of tables) {
    const prodCount = prodData[table].length;
    const { count: devCount, error: devCountErr } = await devSupabase
      .from(table)
      .select('*', { count: 'exact', head: true });

    const status = !devCountErr && devCount === prodCount ? '✓ COCOK' : '❌ BERBEDA';
    if (devCount !== prodCount) allMatch = false;

    console.log(
      `${table.padEnd(25)} : ${String(prodCount).padStart(5)} baris | ${String(devCount).padStart(5)} baris | ${status}`
    );
  }
  console.log('--------------------------------------------------------');

  if (allMatch) {
    console.log('\n🎉 SUKSES! Database Development sekarang 100% plek ketiplek dengan Production.');
  } else {
    console.log('\n⚠️ Ada perbedaan jumlah baris pada beberapa tabel. Silakan periksa log di atas.');
  }
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
