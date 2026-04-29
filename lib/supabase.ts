// Tujuan      : Singleton Supabase client untuk frontend (browser)
// Caller      : app/cart/page.tsx (QR flow), app/checkouts/page.tsx (session fetch)
// Dependensi  : @supabase/supabase-js
// Main Exports: supabase (SupabaseClient instance)
// Side Effects: Tidak ada — hanya inisialisasi client

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
