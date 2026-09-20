console.log("Memulai koneksi Supabase KESIT...");

window.SUPABASE_URL =
  "https://qqhhmebquplfwqtismqb.supabase.co";

window.SUPABASE_ANON_KEY =
  "sb_publishable_tgjer5XABpwdpRO_s3D4cw_WpbslUix";

window.supabaseClient =
  window.supabase.createClient(
    window.SUPABASE_URL,
    window.SUPABASE_ANON_KEY
  );

console.log(
  "Supabase KESIT terhubung."
);